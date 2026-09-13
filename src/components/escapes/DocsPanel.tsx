"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { MdContentCopy } from "react-icons/md";
import { FaFilePdf } from "react-icons/fa6";
import { IoMailOutline } from "react-icons/io5";
import { Button } from "@/components/ui/Button";
import { DatePicker } from "@/components/ui/DatePicker";
import { Skeleton } from "@/components/ui/Skeleton";
import { Caption, Body } from "@/components/ui/Typography";
import { copyHtmlToClipboard } from "@/lib/clipboard";
import { todayIsoDate, formatDisplayDate } from "@/lib/date";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { holdEscape, fetchEscapeById, fetchEscapeAuditLog } from "@/features/escapes/escapesThunks";
import { selectCurrentEscape } from "@/features/escapes/escapesSelectors";

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

// Gates the rest of the Docs tab: the checkboxes/preview/Copy/PDF/Word block
// only ever renders once the Escape is actually on Hold — "No" (the default)
// and the pending "Yes, pick a date" step both show nothing else.
//
// "Hold" is a real Escape status (EscapeStatus.HOLD on the backend),
// deliberately excluded from the forward-only advance() ladder and set only
// through the dedicated /hold endpoint — the same idempotent call both sets
// it the first time and updates holdDate on every later save, so there's no
// separate "already on Hold" write path to keep in sync.
function HoldPrompt({ escapeUid, onHoldChange }: { escapeUid: string; onHoldChange: (onHold: boolean) => void }) {
  const dispatch = useAppDispatch();
  const escape = useAppSelector(selectCurrentEscape);
  const isOnHold = escape?.uid === escapeUid && escape?.status === "Hold";

  // No is the default: the date field only opens once Yes is clicked.
  const [asking, setAsking] = useState(false);
  const [holdDate, setHoldDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    onHoldChange(isOnHold);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnHold]);

  useEffect(() => {
    if (!escape || escape.uid !== escapeUid) return;
    setHoldDate(escape.holdDate ?? "");
  }, [escape, escapeUid]);

  if (!escape || escape.uid !== escapeUid) return null;

  async function handleSave() {
    if (!holdDate) return;
    setSaving(true);
    setError(undefined);
    try {
      // Only once this — and the refetch below — both resolve does the UI
      // move past the "saving" state, so success is never shown ahead of
      // the API actually completing.
      await dispatch(holdEscape({ escapeUid, holdDate })).unwrap();
      await dispatch(fetchEscapeById(escapeUid));
      // History is otherwise only fetched on mount — without this the new
      // Hold entry wouldn't show up there until the page reloaded, same
      // staleness bug EscapeSummaryCard's own handleAdvance avoids.
      dispatch(fetchEscapeAuditLog(escapeUid));
      setAsking(false);
    } catch (err) {
      setError(typeof err === "string" ? err : "Failed to save the hold date");
    } finally {
      setSaving(false);
    }
  }

  // Already on Hold — no Yes/No question, ever. Date field is pre-filled
  // and editable; saving a changed date reuses the exact same holdEscape
  // call (idempotent server-side).
  if (isOnHold) {
    const dateChanged = holdDate !== (escape.holdDate ?? "");
    return (
      <div className="flex flex-col gap-2 rounded border border-warning/40 bg-warning/10 p-3">
        <Body className="text-sm font-medium text-foreground">
          Escape is on Hold till {formatDisplayDate(escape.holdDate) ?? "—"}
        </Body>
        <div className="flex flex-wrap items-end gap-2">
          <DatePicker
            label="Change Hold Date"
            value={holdDate}
            onChange={setHoldDate}
            min={todayIsoDate()}
            className="w-60 h-9"
          />
          <Button
            type="button"
            size="sm"
            disabled={!holdDate || saving || !dateChanged}
            loading={saving}
            loadingText="Saving…"
            onClick={handleSave}
            aria-label="Confirm hold date"
          >
            Save
          </Button>
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  }

  // Not on Hold, Yes clicked — Hold Date field + Save, still no
  // checkmark/preview/buttons (those only appear once Hold is confirmed).
  if (asking) {
    return (
      <div className="flex flex-col gap-2 rounded border border-warning/40 bg-warning/10 p-3">
        <Body className="text-sm font-medium text-foreground">Select the Hold Date</Body>
        <div className="flex flex-wrap items-end gap-2">
          <DatePicker
            label="Hold Date"
            value={holdDate}
            onChange={setHoldDate}
            min={todayIsoDate()}
            required
            className="w-60 h-9"
          />
          <Button type="button" size="sm" disabled={!holdDate || saving} loading={saving} loadingText="Saving…" onClick={handleSave}>
            Save
          </Button>
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  }

  // Default state — No, not yet answered.
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-warning/40 bg-warning/10 p-3">
      <Body className="text-sm font-medium text-foreground">Do you want to make this Escape as Hold?</Body>
      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={() => setAsking(true)}>Yes</Button>
        <Button type="button" size="sm" variant="secondary" onClick={() => setAsking(false)}>No</Button>
      </div>
    </div>
  );
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
// panel are GETs). The whole block only renders once the Escape is on Hold
// — see HoldPrompt above.
export function DocsPanel({ escapeUid }: { escapeUid: string }) {
  const escape = useAppSelector(selectCurrentEscape);
  const [isOnHold, setIsOnHold] = useState(false);
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
  const [downloading, setDownloading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // Only meaningful once this matches the currently-loaded Escape in Redux
  // (the same guard HoldPrompt uses) — never the lead or any other
  // traveller, per the Send Email spec.
  const primaryTraveller =
    escape?.uid === escapeUid && escape.primaryTravellerUid
      ? escape.travellers.find((t) => t.uid === escape.primaryTravellerUid) ?? null
      : null;

  const query = sectionsQuery(sections);

  useEffect(() => {
    // Nothing to preview until the Escape is actually on Hold — skip the
    // fetch entirely rather than requesting a document nothing will show.
    if (!isOnHold) {
      setStatus("loading");
      setHtml(null);
      return;
    }

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
  }, [escapeUid, query, attempt, isOnHold]);

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

  async function handleDownloadPdf() {
    setDownloading(true);
    try {
      await downloadFile(`/api/escapes/${escapeUid}/docs-preview/pdf?${query}`, "escape-document.pdf");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to download the PDF");
    } finally {
      setDownloading(false);
    }
  }

  async function handleSendEmail() {
    if (!primaryTraveller?.email) {
      toast.error("The primary traveller does not have a valid email address.");
      return;
    }
    setSendingEmail(true);
    try {
      const res = await fetch(`/api/escapes/${escapeUid}/docs-preview/send-email?${query}`, { method: "POST" });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.message ?? "Failed to send the email");
      const name = [primaryTraveller.firstName, primaryTraveller.lastName].filter(Boolean).join(" ");
      toast.success(`Email sent successfully to ${name}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send the email");
    } finally {
      setSendingEmail(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <HoldPrompt escapeUid={escapeUid} onHoldChange={setIsOnHold} />

      {isOnHold && (
        <>
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

          <div className="flex items-center justify-between gap-3 pb-2">
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
                disabled={status !== "success" || downloading}
                loading={downloading}
                loadingText="Generating…"
                onClick={handleDownloadPdf}
              >
                <FaFilePdf size={12} />
                PDF
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={status !== "success" || sendingEmail}
                loading={sendingEmail}
                loadingText="Sending…"
                onClick={handleSendEmail}
              >
                <IoMailOutline size={13} />
                Send Email
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
