"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { opportunities } from "@/lib/db/schema";

async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return userId;
}

export async function deleteOpportunity(id: string) {
  await requireUserId();

  await db.delete(opportunities).where(eq(opportunities.id, id));

  revalidatePath("/dashboard");
}
