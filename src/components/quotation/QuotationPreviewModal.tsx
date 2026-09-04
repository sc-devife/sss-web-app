"use client";

import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/Spinner";

type Status = "loading" | "success" | "error";

// The backend names the file after the quote's own name (e.g. "Bali &
// Lakshadweep Family Package.pdf") — it's the only place that knows which
// quote was actually rendered (the accepted one, or the latest), so the
// filename is read off the response rather than guessed here from props.
// The RFC 5987 `filename*=UTF-8''...` directive (percent-encoded, exact
// Unicode) is checked first — it's what carries names with characters like
// "&" correctly; the plain `filename="..."` is only a same-line fallback
// (an RFC 2047 encoded-word for older clients, not directly readable).
function filenameFromContentDisposition(header: string | null): string | null {
  if (!header) return null;
  const extended = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (extended) {
    try {
      return decodeURIComponent(extended[1].trim());
    } catch {
      // fall through to the plain filename below
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(header);
  return plain ? plain[1] : null;
}

// Displays raw rendered HTML the backend returns (Settings sample preview OR
// a real Escape's quotation preview) — this frontend never fetches the
// Cloudinary template or combines it with data itself, it only renders what
// the backend already rendered.
//
// The HTML is fetched here (rather than just pointing the iframe's `src` at
// the endpoint) so the modal can show a real loading/error state instead of
// a blank iframe while the backend renders — `srcDoc` swaps in the content
// only once it's actually ready.
export function QuotationPreviewModal({
  open,
  onClose,
  title,
  src,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  src: string;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [html, setHtml] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | undefined>();
  const [downloadError, setDownloadError] = useState<string | undefined>();
  const [downloading, setDownloading] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setStatus("loading");
    setHtml(null);
    setFetchError(undefined);
    setDownloadError(undefined);

    (async () => {
      try {
        const res = await fetch(src, { signal: controller.signal });
        if (!res.ok) throw new Error(`Failed to load quotation (${res.status})`);
        const text = await res.text();
        setHtml(text);
        setStatus("success");
      } catch (err) {
        // Aborted because the modal closed or a retry superseded this
        // request — not a real failure, and the component may already be
        // unmounted, so don't touch state.
        if (controller.signal.aborted) return;
        setFetchError(err instanceof Error ? err.message : "Failed to load the quotation preview");
        setStatus("error");
      }
    })();

    // Cancels the in-flight request when the modal closes/unmounts or a
    // retry starts a new one, so a slow first response can never land after
    // a later request and show stale content.
    return () => controller.abort();
  }, [open, src, attempt]);

  // Downloads the server-generated, watermarked PDF — the SAME endpoint's
  // "/pdf" sibling (e.g. ".../quotation-preview" -> ".../quotation-preview/pdf"),
  // rather than relying on the browser's own print-to-PDF (which varies by
  // browser and can't carry a watermark). Insert "/pdf" before any query
  // string so an optional `?templateUid=` still works.
  async function handleDownload() {
    setDownloadError(undefined);
    setDownloading(true);
    try {
      const [path, query] = src.split("?");
      const pdfUrl = `${path}/pdf${query ? `?${query}` : ""}`;
      const res = await fetch(pdfUrl);
      if (!res.ok) throw new Error(`Failed to generate PDF (${res.status})`);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filenameFromContentDisposition(res.headers.get("content-disposition")) || "document.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : "Failed to download the quotation PDF");
    } finally {
      setDownloading(false);
    }
  }

  function handleRetry() {
    setAttempt((a) => a + 1);
  }

  return (
    <Modal open={open} onClose={onClose} title={title} className="w-[80vw] !max-w-[1400px]">
      <div className="flex flex-col gap-3">
        <div className="h-[60vh] w-full overflow-hidden rounded border border-border bg-white">
          {status === "loading" && (
            <div className="flex h-full items-center justify-center">
              <LoadingState label="Preparing your quotation preview…" />
            </div>
          )}
          {status === "error" && (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
              <p className="text-sm text-danger">{fetchError}</p>
              <Button type="button" size="sm" variant="secondary" onClick={handleRetry}>
                Retry
              </Button>
            </div>
          )}
          {status === "success" && html != null && (
            <iframe
              ref={iframeRef}
              srcDoc={html}
              title={title}
              className="h-full w-full"
              sandbox="allow-same-origin allow-modals"
            />
          )}
        </div>
        {downloadError && <p className="text-sm text-danger">{downloadError}</p>}
        <div className="flex justify-end gap-2 border-t border-border pt-3">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            type="button"
            disabled={status !== "success" || downloading}
            loading={downloading}
            loadingText="Generating PDF…"
            onClick={handleDownload}
          >
            Download
          </Button>
        </div>
      </div>
    </Modal>
  );
}
