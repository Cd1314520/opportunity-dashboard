import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";

import { db, getFormSuggestions } from "@/lib/db";
import { opportunities } from "@/lib/db/schema";
import { OpportunityForm } from "@/components/opportunity-form";
import { updateOpportunity } from "./actions";
import type { OpportunityFormValues } from "@/app/dashboard/new/schema";

interface EditOpportunityPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditOpportunityPage({
  params,
}: EditOpportunityPageProps) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const { id } = await params;

  const [[opportunity], { typeSuggestions, statusSuggestions }] =
    await Promise.all([
      db
        .select()
        .from(opportunities)
        .where(and(eq(opportunities.id, id), eq(opportunities.user_id, userId)))
        .limit(1),
      getFormSuggestions(userId),
    ]);

  if (!opportunity) {
    redirect("/dashboard");
  }

  const initialData: OpportunityFormValues = {
    name: opportunity.name,
    organization: opportunity.organization,
    type: opportunity.type,
    status: opportunity.status,
    url: opportunity.url ?? "",
    contact_email: opportunity.contact_email ?? "",
    notes: opportunity.notes ?? "",
    follow_up_at: opportunity.follow_up_at?.toISOString().slice(0, 10) ?? "",
  };

  const boundAction = updateOpportunity.bind(null, id);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col p-8">
      <header className="border-b border-border pb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Edit opportunity
        </h1>
      </header>

      <main className="mt-8">
        <OpportunityForm
          initialData={initialData}
          action={boundAction}
          submitLabel="Save changes"
          showScraper
          typeSuggestions={typeSuggestions}
          statusSuggestions={statusSuggestions}
        />
      </main>
    </div>
  );
}
