"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { tavily } from "@tavily/core";

const openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY! });
import Firecrawl from "@mendable/firecrawl-js";

async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return userId;
}

import { db } from "@/lib/db";
import { opportunities } from "@/lib/db/schema";
import {
  opportunitySchema,
  type OpportunityFormValues,
  type ScrapeAndDraftResult,
} from "./schema";

export async function createOpportunity(values: OpportunityFormValues) {
  await requireUserId();

  const parsed = opportunitySchema.safeParse(values);
  if (!parsed.success) {
    throw new Error("Invalid form data");
  }

  const data = parsed.data;

  const followUpAt = data.follow_up_at ? new Date(data.follow_up_at) : null;

  await db
    .insert(opportunities)
    .values({
      name: data.name,
      organization: data.organization,
      type: data.type,
      status: data.status,
      url: data.url || null,
      contact_email: data.contact_email || null,
      notes: data.notes || null,
      follow_up_at: followUpAt,
    })
    .onConflictDoUpdate({
      target: opportunities.url,
      // ponytail: status intentionally omitted — re-scraping an existing URL
      // must not reset the user's pipeline progress back to the form default
      set: {
        name: data.name,
        organization: data.organization,
        type: data.type,
        contact_email: data.contact_email || null,
        notes: data.notes || null,
        follow_up_at: followUpAt,
        updated_at: new Date(),
      },
    });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

function buildPrompt(content: string, extraInstructions = "") {
  return `You are an expert outreach assistant helping a student track academic and career opportunities and draft a highly personalized, concise, professional cold email.
${extraInstructions}

Scraped context (Markdown/Text):
---
${content}
---

Do two things from this single context:
1. Extract structured fields (name, organization, type, research_areas) for the student's tracker.
2. Draft the outreach email per the guidelines in draft_email's description, and surface the single concrete hook you anchored on in specific_reference.

Never invent papers, projects, or affiliations not present in the context. If a field is uncertain, leave it null/empty.`;
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
      specific_reference: object.specific_reference,
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
  specific_reference: z
    .string()
    .describe(
      "The single concrete detail from the context that the email anchors on — e.g., a paper title, project name, technology, or course. One short phrase quoted from or directly derived from the context. Empty string if nothing concrete was available."
    ),
  draft_email: z
    .string()
    .describe(
      `Highly personalized, concise outreach email in English, under 150 words. Short paragraphs.
- Specific reference: anchor on the concrete detail in specific_reference (a paper, project, or technology from the context). No generic compliments.
- Value proposition: briefly connect their work to why the student is reaching out. Collaborative, respectful, low-pressure tone.
- Clear CTA: end with one simple direct question (e.g., "Are you open to a brief 10-minute chat next week?").
- Complete sentences, professional tone, no placeholders, no invented facts.`
    ),
});

export async function scrapeAndDraft(
  url: string
): Promise<ScrapeAndDraftResult> {
  await requireUserId();

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
    const result = await runDraftGeneration(
      buildPrompt(`URL: ${url}\n\nPage content:\n---\n${markdown}\n---`)
    );

    if (result.ok) {
      const [row] = await db
        .select({ id: opportunities.id })
        .from(opportunities)
        .where(eq(opportunities.url, url))
        .limit(1);
      return { ...result, data: { ...result.data, url }, existing: Boolean(row) };
    }
    return result;
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
  await requireUserId();

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
  await requireUserId();

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
