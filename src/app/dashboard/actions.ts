"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { opportunities } from "@/lib/db/schema";

async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return userId;
}

export async function deleteOpportunity(id: string) {
  const userId = await requireUserId();

  await db
    .delete(opportunities)
    .where(and(eq(opportunities.id, id), eq(opportunities.user_id, userId)));

  revalidatePath("/dashboard");
}
