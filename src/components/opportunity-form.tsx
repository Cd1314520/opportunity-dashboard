"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";

import {
  opportunitySchema,
  type OpportunityFormValues,
  type ScrapeData,
} from "@/app/dashboard/new/schema";
import { UrlScraper } from "@/app/dashboard/new/url-scraper";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FreetextCombobox } from "@/components/ui/freetext-combobox";

const DEFAULT_TYPE_SUGGESTIONS = [
  "Research",
  "Internship",
  "Job",
  "Grant",
  "Conference",
];
const DEFAULT_STATUS_SUGGESTIONS = [
  "Not contacted",
  "Contacted",
  "Meeting scheduled",
  "Rejected",
  "Accepted",
];

interface OpportunityFormProps {
  initialData?: Partial<OpportunityFormValues>;
  action: (values: OpportunityFormValues) => Promise<{ error: string } | void>;
  submitLabel?: string;
  showScraper?: boolean;
  typeSuggestions?: string[];
  statusSuggestions?: string[];
}

export function OpportunityForm({
  initialData,
  action,
  submitLabel = "Save opportunity",
  showScraper = false,
  typeSuggestions = DEFAULT_TYPE_SUGGESTIONS,
  statusSuggestions = DEFAULT_STATUS_SUGGESTIONS,
}: OpportunityFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<OpportunityFormValues>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: {
      name: initialData?.name ?? "",
      organization: initialData?.organization ?? "",
      type: initialData?.type ?? "",
      status: initialData?.status ?? "Not contacted",
      url: initialData?.url ?? "",
      contact_email: initialData?.contact_email ?? "",
      notes: initialData?.notes ?? "",
      follow_up_at: initialData?.follow_up_at ?? "",
    },
  });

  function handleFill(data: ScrapeData) {
    if (data.name) form.setValue("name", data.name, { shouldValidate: true });
    if (data.organization)
      form.setValue("organization", data.organization, {
        shouldValidate: true,
      });
    if (data.type)
      form.setValue("type", data.type, { shouldValidate: true });
    if (data.url) form.setValue("url", data.url, { shouldValidate: true });
    if (data.research_areas.length > 0) {
      const existing = form.getValues("notes");
      const areas = `Research areas: ${data.research_areas.join(", ")}`;
      form.setValue("notes", existing ? `${existing}\n${areas}` : areas);
    }
  }

  function onSubmit(values: OpportunityFormValues) {
    startTransition(async () => {
      const result = await action(values);
      if (result?.error) {
        form.setError("root", { message: result.error });
      }
    });
  }

  return (
    <div className="flex flex-col gap-8">
      {showScraper && <UrlScraper onFill={handleFill} />}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-6"
        >
          {form.formState.errors.root?.message && (
            <p className="text-sm font-medium text-destructive">
              {form.formState.errors.root.message}
            </p>
          )}

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Name <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Dr. Jane Smith" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="organization"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Organization <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Stanford University" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Type <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <FreetextCombobox
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      suggestions={typeSuggestions}
                      placeholder="e.g. Research, Internship…"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <FreetextCombobox
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      suggestions={statusSuggestions}
                      placeholder="e.g. Not contacted…"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL</FormLabel>
                <FormControl>
                  <Input
                    type="url"
                    placeholder="https://example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contact_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="follow_up_at"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Follow up on</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea
                    rows={4}
                    placeholder="Anything worth remembering…"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
            <Button asChild variant="ghost" type="button">
              <Link href="/dashboard">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : submitLabel}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
