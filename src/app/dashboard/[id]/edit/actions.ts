"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { opportunities } from "@/lib/db/schema";
import { opportunitySchema, type OpportunityFormValues } from "@/app/dashboard/new/schema";

async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return userId;
}

export async function updateOpportunity(id: string, values: OpportunityFormValues) {
  await requireUserId();

  const parsed = opportunitySchema.safeParse(values);
  if (!parsed.success) {
    throw new Error("Invalid form data");
  }

  const data = parsed.data;

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
    .where(eq(opportunities.id, id));

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
