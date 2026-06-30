"use client";

import { useState, useTransition } from "react";
import { scrapeAndDraft, pasteAndDraft, searchAndDraft } from "./actions";
import type { ScrapeData } from "./schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UrlScraperProps {
  onFill: (data: ScrapeData) => void;
}

type Mode = "url" | "paste" | "name";

export function UrlScraper({ onFill }: UrlScraperProps) {
  const [mode, setMode] = useState<Mode>("url");
  const [url, setUrl] = useState("");
  const [pastedContent, setPastedContent] = useState("");
  const [personName, setPersonName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [draftEmail, setDraftEmail] = useState<string | null>(null);
  const [specificReference, setSpecificReference] = useState<string | null>(null);
  const [existing, setExisting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setDraftEmail(null);
    setSpecificReference(null);
    setExisting(false);
  }

  function handleGenerate() {
    setError(null);
    setDraftEmail(null);
    setSpecificReference(null);
    setExisting(false);

    startTransition(async () => {
      let result;
      if (mode === "url") {
        result = await scrapeAndDraft(url.trim());
      } else if (mode === "paste") {
        result = await pasteAndDraft(pastedContent);
      } else {
        result = await searchAndDraft(personName.trim(), orgName.trim());
      }

      if (!result.ok) {
        setError(result.error);
        return;
      }

      onFill(result.data);
      if (result.data.draft_email) {
        setDraftEmail(result.data.draft_email);
      }
      if (result.data.specific_reference) {
        setSpecificReference(result.data.specific_reference);
      }
      setExisting(result.existing ?? false);
    });
  }

  async function handleCopy() {
    if (!draftEmail) return;
    await navigator.clipboard.writeText(draftEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const canSubmit =
    !isPending &&
    (mode === "url"
      ? url.trim().length > 0
      : mode === "paste"
      ? pastedContent.trim().length > 0
      : personName.trim().length > 0);

  const modeDescription = {
    url: "Enter a public URL to scrape automatically.",
    paste: "Paste any profile or page text (works with LinkedIn, PDFs, etc.).",
    name: "Search by name and organization to auto-fill.",
  }[mode];

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-muted/30 p-5">
      {/* Header + mode toggle */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Auto-fill from profile</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {modeDescription}
          </p>
        </div>
        <div className="flex shrink-0 rounded-md border border-border bg-background text-xs">
          {(["url", "paste", "name"] as Mode[]).map((m, i) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={cn(
                "px-3 py-1.5 transition-colors",
                i === 0 && "rounded-l-md",
                i === 2 && "rounded-r-md",
                mode === m
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {m === "url" ? "From URL" : m === "paste" ? "Paste text" : "From name"}
            </button>
          ))}
        </div>
      </div>

      {/* Input area */}
      {mode === "url" && (
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="https://example.edu/~professor"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && canSubmit && handleGenerate()}
            disabled={isPending}
            className="flex-1"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={handleGenerate}
            disabled={!canSubmit}
          >
            {isPending ? <Spinner /> : "Fetch"}
          </Button>
        </div>
      )}

      {mode === "paste" && (
        <div className="flex flex-col gap-2">
          <textarea
            placeholder={
              "Paste LinkedIn profile, bio page, or any text here…\n\n" +
              "Tip: on LinkedIn, press Ctrl+A on the profile page then Ctrl+C to copy everything."
            }
            value={pastedContent}
            onChange={(e) => setPastedContent(e.target.value)}
            disabled={isPending}
            rows={6}
            className="w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50"
          />
          <div className="flex justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={handleGenerate}
              disabled={!canSubmit}
            >
              {isPending ? <Spinner /> : "Generate"}
            </Button>
          </div>
        </div>
      )}

      {mode === "name" && (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Input
              placeholder="Name (e.g. Dr. Jane Smith)"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              disabled={isPending}
            />
            <Input
              placeholder="Organization (e.g. MIT)"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              disabled={isPending}
              onKeyDown={(e) => e.key === "Enter" && canSubmit && handleGenerate()}
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={handleGenerate}
              disabled={!canSubmit}
            >
              {isPending ? <Spinner /> : "Fetch"}
            </Button>
          </div>
        </div>
      )}

      {/* Already-tracked notice */}
      {existing && (
        <p className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
          This URL is already tracked. Saving will update the existing entry
          instead of creating a duplicate.
        </p>
      )}

      {/* Error */}
      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
          {mode === "url" && (
            <button
              type="button"
              className="ml-2 underline underline-offset-2"
              onClick={() => switchMode("paste")}
            >
              Try pasting instead?
            </button>
          )}
        </p>
      )}

      {/* Draft email — read-only with copy button */}
      {draftEmail && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Draft email
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-7 px-2 text-xs"
            >
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
          {specificReference && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Anchored on:</span> {specificReference}
            </p>
          )}
          <textarea
            readOnly
            value={draftEmail}
            rows={8}
            className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm leading-relaxed text-foreground focus:outline-none"
          />
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <span className="flex items-center gap-2">
      <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      Working…
    </span>
  );
}
