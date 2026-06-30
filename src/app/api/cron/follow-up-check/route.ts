import { NextRequest } from "next/server";
import { and, isNotNull, lte } from "drizzle-orm";

import { db } from "@/lib/db";
import { opportunities } from "@/lib/db/schema";

const TERMINAL = /accept|reject/i;

export async function GET(req: NextRequest) {
  if (
    req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  const endOfToday = new Date();
  endOfToday.setUTCHours(23, 59, 59, 999);

  const rows = await db
    .select()
    .from(opportunities)
    .where(
      and(
        isNotNull(opportunities.follow_up_at),
        lte(opportunities.follow_up_at, endOfToday)
      )
    );

  const due = rows.filter((r) => !TERMINAL.test(r.status));

  console.log(
    `[follow-up-check] ${due.length} due`,
    due.map(({ id, name, follow_up_at }) => ({ id, name, follow_up_at }))
  );

  return Response.json({ count: due.length });
}
