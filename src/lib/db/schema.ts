import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const opportunityTypeEnum = pgEnum("opportunity_type", [
  "professor",
  "internship",
  "scholarship",
  "job",
]);

export const opportunityStatusEnum = pgEnum("opportunity_status", [
  "not_contacted",
  "contacted",
  "in_progress",
  "interested",
  "rejected",
  "accepted",
]);

export const opportunities = pgTable("opportunities", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  type: opportunityTypeEnum("type").notNull(),
  name: text("name").notNull(),
  organization: text("organization").notNull(),
  url: text("url"),
  contact_email: text("contact_email"),
  status: opportunityStatusEnum("status").notNull().default("not_contacted"),
  notes: text("notes"),
  last_contacted_at: timestamp("last_contacted_at", { withTimezone: true }),
  follow_up_at: timestamp("follow_up_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .$defaultFn(() => new Date()),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type Opportunity = typeof opportunities.$inferSelect;
export type NewOpportunity = typeof opportunities.$inferInsert;
