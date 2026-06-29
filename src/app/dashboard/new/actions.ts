"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { tavily } from "@tavily/core";

const openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY! });
import Firecrawl from "@mendable/firecrawl-js";

import { db } from "@/lib/db";
import { opportunities } from "@/lib/db/schema";
import {
  opportunitySchema,
  type OpportunityFormValues,
  type ScrapeAndDraftResult,
} from "./schema";

export async function createOpportunity(values: OpportunityFormValues) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const parsed = opportunitySchema.safeParse(values);
  if (!parsed.success) {
    throw new Error("Invalid form data");
  }

  const data = parsed.data;

  await db.insert(opportunities).values({
    name: data.name,
    organization: data.organization,
    type: data.type,
    status: data.status,
    url: data.url || null,
    contact_email: data.contact_email || null,
    notes: data.notes || null,
  });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

function buildPrompt(content: string, extraInstructions = "") {
  return `You are helping a student track academic and career opportunities.
Analyze the following content and extract structured information.
${extraInstructions}

${content}

Fill in the fields based on what you find. For draft_email, write a complete, personalized outreach message that references specific details from the content.`;
}

async function runDraftGeneration(prompt: string): Promise<ScrapeAndDraftResult> {
  const { object } = await generateObject({
    model: openrouter("deepseek/deepseek-chat-v3"),
    maxRetries: 1,
    schema: draftSchema,
    prompt,
  });
  return {
    ok: true,
    data: {
      name: object.name,
      organization: object.organization,
      type: object.type,
      research_areas: object.research_areas,
      draft_email: object.draft_email,
    },
  };
}

const draftSchema = z.object({
  name: z
    .string()
    .nullable()
    .describe("Full name of the person, position title, or opportunity name"),
  organization: z
    .string()
    .nullable()
    .describe("University, company, or institution name"),
  type: z
    .enum(["Research", "Internship", "Job", "Grant", "Conference"])
    .nullable()
    .describe(
      'Classify as "Research" (professor/faculty), "Internship" (student program), "Grant" (scholarship/fellowship), "Job" (full-time role), or "Conference". Null if unclear.'
    ),
  research_areas: z
    .array(z.string())
    .describe("Research topics, technical skills, or focus areas mentioned"),
  draft_email: z
    .string()
    .describe(
      "Personalized outreach email with exactly 3 short paragraphs: (1) who you are and why you're reaching out to them specifically, (2) why their work/research is relevant to you with specific references, (3) a polite call to action. Complete sentences, professional tone, no placeholders."
    ),
});

export async function scrapeAndDraft(
  url: string
): Promise<ScrapeAndDraftResult> {
  const { userId } = await auth();
  if (!userId) {
    return { ok: false, error: "Not authenticated" };
  }

  try {
    const firecrawl = new Firecrawl(process.env.FIRECRAWL_API_KEY!);
    const scraped = await firecrawl.scrape(url, { formats: ["markdown"] });

    if (!scraped.markdown) {
      return {
        ok: false,
        error:
          "Failed to scrape this URL. Make sure it is publicly accessible.",
      };
    }

    const markdown = scraped.markdown.slice(0, 12000);
    return await runDraftGeneration(
      buildPrompt(`URL: ${url}\n\nPage content:\n---\n${markdown}\n---`)
    );
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Something went wrong",
    };
  }
}

export async function pasteAndDraft(
  content: string
): Promise<ScrapeAndDraftResult> {
  const { userId } = await auth();
  if (!userId) {
    return { ok: false, error: "Not authenticated" };
  }

  if (!content.trim()) {
    return { ok: false, error: "Please paste some content first." };
  }

  try {
    return await runDraftGeneration(buildPrompt(content.slice(0, 12000)));
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Something went wrong",
    };
  }
}

export async function searchAndDraft(
  name: string,
  organization: string
): Promise<ScrapeAndDraftResult> {
  const { userId } = await auth();
  if (!userId) {
    return { ok: false, error: "Not authenticated" };
  }

  if (!name.trim()) {
    return { ok: false, error: "Please enter a name." };
  }

  try {
    const client = tavily({ apiKey: process.env.TAVILY_API_KEY! });
    const query = organization.trim()
      ? `"${name.trim()}" "${organization.trim()}"`
      : `"${name.trim()}"`;

    const response = await client.search(query, {
      search_depth: "basic",
      max_results: 5,
    });

    const snippets = response.results
      .slice(0, 5)
      .map(
        (r: { title: string; url: string; content: string }) =>
          `[${r.title}](${r.url})\n${r.content}`
      )
      .join("\n\n---\n\n");

    if (!snippets) {
      return {
        ok: false,
        error: "No search results found. Try a different name or organization.",
      };
    }

    const extraInstructions =
      "Base extraction only on the search results provided. If a field is uncertain, leave it blank rather than guessing. Do not invent credentials, papers, or affiliations.";

    return await runDraftGeneration(
      buildPrompt(
        `Search query: ${query}\n\nSearch results:\n---\n${snippets.slice(0, 12000)}\n---`,
        extraInstructions
      )
    );
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Something went wrong",
    };
  }
}
