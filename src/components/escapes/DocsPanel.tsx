"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { MdContentCopy } from "react-icons/md";
import { FaFilePdf, FaFileWord } from "react-icons/fa6";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Caption } from "@/components/ui/Typography";
import { copyHtmlToClipboard } from "@/lib/clipboard";

type Status = "loading" | "success" | "error";

interface Sections {
  transports: boolean;
  bankAccount: boolean;
  itinerary: boolean;
  inclusionsExclusions: boolean;
  termsAndConditions: boolean;
}

const SECTION_OPTIONS: { key: keyof Sections; label: string }[] = [
  { key: "transports", label: "Transports" },
  { key: "bankAccount", label: "Bank Account" },
  { key: "itinerary", label: "Itinerary" },
  { key: "inclusionsExclusions", label: "Inclusions & Exclusions" },
  { key: "termsAndConditions", label: "Terms & Conditions" },
];

function sectionsQuery(sections: Sections): string {
  return new URLSearchParams({
    transports: String(sections.transports),
    bankAccount: String(sections.bankAccount),
    itinerary: String(sections.itinerary),
    inclusionsExclusions: String(sections.inclusionsExclusions),
    termsAndConditions: String(sections.termsAndConditions),
  }).toString();
}

// Same RFC 5987-aware filename extraction QuotationPreviewModal uses — the
// backend names the file (it's the only place that knows the trip code),
// so it's read off the response rather than guessed here.
function filenameFromContentDisposition(header: string | null, fallback: string): string {
  if (!header) return fallback;
  const extended = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (extended) {
    try {
      return decodeURIComponent(extended[1].trim());
    } catch {
      // fall through to the plain filename below
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(header);
  return plain ? plain[1] : fallback;
}

async function downloadFile(url: string, fallbackFilename: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to generate the document (${res.status})`);
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filenameFromContentDisposition(res.headers.get("content-disposition"), fallbackFilename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

// A flexible, checkbox-driven document — distinct from the Quote tab's
// org-customizable Quotation. Purely a read-generate-download flow: toggling
// a checkbox only changes what's rendered into the output, never any
// underlying Escape/Itinerary/Quote data (all three endpoints behind this
// panel are GETs).
export function DocsPanel({ escapeUid }: { escapeUid: string }) {
  const [sections, setSections] = useState<Sections>({
    transports: true,
    bankAccount: true,
    itinerary: true,
    inclusionsExclusions: true,
    termsAndConditions: true,
  });
  const [status, setStatus] = useState<Status>("loading");
  const [html, setHtml] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | undefined>();
  const [copying, setCopying] = useState(false);
  const [downloading, setDownloading] = useState<"pdf" | "word" | null>(null);
  const [attempt, setAttempt] = useState(0);

  const query = sectionsQuery(sections);

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    setFetchError(undefined);

    (async () => {
      try {
        const res = await fetch(`/api/escapes/${escapeUid}/docs-preview?${query}`, { signal: controller.signal });
        if (!res.ok) throw new Error(`Failed to load the document preview (${res.status})`);
        const text = await res.text();
        setHtml(text);
        setStatus("success");
      } catch (err) {
        if (controller.signal.aborted) return;
        setFetchError(err instanceof Error ? err.message : "Failed to load the document preview");
        setStatus("error");
      }
    })();

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [escapeUid, query, attempt]);

  function toggleSection(key: keyof Sections) {
    setSections((s) => ({ ...s, [key]: !s[key] }));
  }

  async function handleCopy() {
    if (!html) return;
    setCopying(true);
    try {
      await copyHtmlToClipboard(html);
      toast.success("Document copied successfully.");
    } catch {
      toast.error("Failed to copy the document.");
    } finally {
      setCopying(false);
    }
  }

  async function handleDownload(format: "pdf" | "word") {
    setDownloading(format);
    try {
      const extension = format === "pdf" ? "pdf" : "docx";
      await downloadFile(`/api/escapes/${escapeUid}/docs-preview/${format}?${query}`, `escape-document.${extension}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to download the ${format.toUpperCase()}`);
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded border border-border bg-muted/30 p-2">
        {SECTION_OPTIONS.map((opt) => (
          <label key={opt.key} className="flex items-center gap-1.5 text-xs text-foreground">
            <input
              type="checkbox"
              checked={sections[opt.key]}
              onChange={() => toggleSection(opt.key)}
              className="h-2.5 w-2.5 rounded border-border accent-primary"
            />
            {opt.label}
          </label>
        ))}
      </div>

      <div className="h-[55vh] min-h-[360px] w-full overflow-hidden rounded border border-border bg-white">
        {status === "loading" && (
          <div className="flex h-full flex-col gap-6 overflow-hidden p-10">
            <div className="flex items-start justify-between">
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-8 w-28" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
            <Skeleton className="h-32 w-full" />
          </div>
        )}
        {status === "error" && (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-sm text-danger">{fetchError}</p>
            <Button type="button" size="sm" variant="secondary" onClick={() => setAttempt((a) => a + 1)}>
              Retry
            </Button>
          </div>
        )}
        {status === "success" && html != null && (
          <iframe srcDoc={html} title="Escape document preview" className="h-full w-full" sandbox="allow-same-origin" />
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <Caption className="text-muted-foreground">Only the checked sections above are included in the document.</Caption>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            disabled={status !== "success" || copying}
            loading={copying}
            loadingText="Copying…"
            onClick={handleCopy}
          >
            <MdContentCopy size={12} />
            Copy
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={status !== "success" || downloading !== null}
            loading={downloading === "pdf"}
            loadingText="Generating…"
            onClick={() => handleDownload("pdf")}
          >
            <FaFilePdf size={12} />
            PDF
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={status !== "success" || downloading !== null}
            loading={downloading === "word"}
            loadingText="Generating…"
            onClick={() => handleDownload("word")}
          >
            <FaFileWord size={12} />
            Word
          </Button>
        </div>
      </div>
    </div>
  );
}
