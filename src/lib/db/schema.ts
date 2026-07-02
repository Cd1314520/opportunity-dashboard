import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const opportunities = pgTable("opportunities", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  user_id: text("user_id").notNull(),
  type: text("type").notNull(),
  name: text("name").notNull(),
  organization: text("organization").notNull(),
  url: text("url").unique(),
  contact_email: text("contact_email"),
  status: text("status").notNull().default("Not contacted"),
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
