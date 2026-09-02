"use client";

import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/Spinner";

type Status = "loading" | "success" | "error";

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

  function handleDownload() {
    setDownloadError(undefined);
    const win = iframeRef.current?.contentWindow;
    if (!win) {
      setDownloadError("Quotation hasn't finished loading yet — try again in a moment.");
      return;
    }
    win.focus();
    win.print();
  }

  function handleRetry() {
    setAttempt((a) => a + 1);
  }

  return (
    <Modal open={open} onClose={onClose} title={title} className="w-[85vw] max-w-4xl">
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
          <Button type="button" disabled={status !== "success"} onClick={handleDownload}>
            Download
          </Button>
        </div>
      </div>
    </Modal>
  );
}
