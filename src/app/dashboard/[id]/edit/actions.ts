"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { opportunities } from "@/lib/db/schema";
import { opportunitySchema, type OpportunityFormValues } from "@/app/dashboard/new/schema";

async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return userId;
}

// Pull Postgres error fields off the thrown error; drizzle may nest the
// original driver error under `.cause`.
function pgError(e: unknown): { code?: string; constraint?: string } {
  const err = e as { code?: string; constraint?: string; cause?: unknown };
  if (err?.code) return { code: err.code, constraint: err.constraint };
  const cause = err?.cause as
    | { code?: string; constraint?: string }
    | undefined;
  return { code: cause?.code, constraint: cause?.constraint };
}

export async function updateOpportunity(
  id: string,
  values: OpportunityFormValues
): Promise<{ error: string } | void> {
  const userId = await requireUserId();

  const parsed = opportunitySchema.safeParse(values);
  if (!parsed.success) {
    throw new Error("Invalid form data");
  }

  const data = parsed.data;

  try {
    await db
      .update(opportunities)
      .set({
        name: data.name,
        organization: data.organization,
        type: data.type,
        status: data.status,
        url: data.url || null,
        contact_email: data.contact_email || null,
        notes: data.notes || null,
        follow_up_at: data.follow_up_at ? new Date(data.follow_up_at) : null,
        updated_at: new Date(),
      })
      .where(and(eq(opportunities.id, id), eq(opportunities.user_id, userId)));
  } catch (e) {
    const { code, constraint } = pgError(e);
    if (code === "23505" && constraint === "opportunities_user_id_url_unique") {
      return { error: "You already have an opportunity saved with this URL." };
    }
    throw e; // anything else is unexpected — don't swallow it
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
