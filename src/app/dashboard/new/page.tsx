import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { Button } from "@/components/ui/button";
import { OpportunityForm } from "@/components/opportunity-form";
import { getFormSuggestions } from "@/lib/db";
import { createOpportunity } from "./actions";

export default async function NewOpportunityPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const { typeSuggestions, statusSuggestions } = await getFormSuggestions();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col p-8">
      <header className="flex items-center justify-between border-b border-border pb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Add opportunity
        </h1>
        <Button asChild variant="outline">
          <Link href="/dashboard">Cancel</Link>
        </Button>
      </header>

      <main className="mt-8">
        <OpportunityForm
          action={createOpportunity}
          showScraper
          typeSuggestions={typeSuggestions}
          statusSuggestions={statusSuggestions}
        />
      </main>
    </div>
  );
}
