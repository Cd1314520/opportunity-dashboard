import { z } from "zod";

export const opportunitySchema = z.object({
  name: z.string().min(1, "Name is required"),
  organization: z.string().min(1, "Organization is required"),
  type: z.string().min(1, "Type is required"),
  status: z.string().min(1, "Status is required"),
  url: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  contact_email: z
    .string()
    .email("Must be a valid email")
    .or(z.literal(""))
    .optional(),
  notes: z.string().optional(),
  follow_up_at: z.string().optional(),
});

export type OpportunityFormValues = z.infer<typeof opportunitySchema>;

export type ScrapeData = {
  name: string | null;
  organization: string | null;
  type: string | null;
  research_areas: string[];
  specific_reference: string;
  draft_email: string;
  url?: string;
};

export type ScrapeAndDraftResult =
  | { ok: true; data: ScrapeData; existing?: boolean }
  | { ok: false; error: string };
