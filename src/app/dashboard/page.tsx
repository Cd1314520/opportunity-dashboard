import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { opportunities } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RowActions } from "@/components/row-actions";
import type React from "react";

function getStatusVariant(
  status: string
): React.ComponentProps<typeof Badge>["variant"] {
  const s = status.toLowerCase();
  if (s.includes("reject")) return "destructive";
  if (s.includes("accept")) return "success";
  if (s.includes("interest")) return "default";
  if (
    s.includes("contact") ||
    s.includes("progress") ||
    s.includes("schedule") ||
    s.includes("meeting")
  ) {
    return s.includes("not") ? "outline" : "secondary";
  }
  return "outline";
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

function isTerminalStatus(status: string) {
  const s = status.toLowerCase();
  return s.includes("accept") || s.includes("reject");
}

function isFollowUpDue(followUpAt: Date | null, status: string) {
  if (!followUpAt || isTerminalStatus(status)) return false;
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  return followUpAt.getTime() <= endOfToday.getTime();
}

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const rows = await db
    .select()
    .from(opportunities)
    .where(eq(opportunities.user_id, userId))
    .orderBy(desc(opportunities.created_at));

  return (
    <div className="flex flex-1 flex-col p-8">
      <header className="flex items-center justify-between border-b border-border pb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Opportunities</h1>
        <Button asChild>
          <Link href="/dashboard/new">Add opportunity</Link>
        </Button>
      </header>

      <main className="mt-8">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border py-16 text-center">
            <p className="text-muted-foreground">No opportunities yet.</p>
            <Button asChild variant="outline">
              <Link href="/dashboard/new">Add your first opportunity</Link>
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Follow up</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.type}</TableCell>
                    <TableCell>{row.organization}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(row.status)}>
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {row.contact_email ? (
                        <a
                          href={`mailto:${row.contact_email}`}
                          className="text-muted-foreground underline-offset-4 hover:underline"
                        >
                          {row.contact_email}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.url ? (
                        <a
                          href={row.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground underline-offset-4 hover:underline"
                        >
                          Link
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.follow_up_at ? (
                        isFollowUpDue(row.follow_up_at, row.status) ? (
                          <Badge variant="destructive">
                            Due {dateFormatter.format(row.follow_up_at)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">
                            {dateFormatter.format(row.follow_up_at)}
                          </span>
                        )
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {dateFormatter.format(row.created_at)}
                    </TableCell>
                    <TableCell>
                      <RowActions id={row.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </div>
  );
}
