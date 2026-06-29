import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import * as schema from "./db/schema";
import { opportunities } from "./db/schema";

const sqlClient = neon(process.env.DATABASE_URL!);

export const db = drizzle(sqlClient, { schema });

export async function getFormSuggestions() {
  const [typeRows, statusRows] = await Promise.all([
    db
      .selectDistinct({ val: opportunities.type })
      .from(opportunities)
      .where(sql`${opportunities.type} is not null and ${opportunities.type} != ''`),
    db
      .selectDistinct({ val: opportunities.status })
      .from(opportunities)
      .where(
        sql`${opportunities.status} is not null and ${opportunities.status} != ''`
      ),
  ]);
  return {
    typeSuggestions: typeRows.map((r) => r.val).filter(Boolean) as string[],
    statusSuggestions: statusRows.map((r) => r.val).filter(Boolean) as string[],
  };
}
