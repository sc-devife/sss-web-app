"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";

interface CancellationEmailPreview {
  toEmail: string | null;
  subject: string;
  bodyHtml: string;
}

// A "Send Cancellation Email" popup for a Dropped Hotel/Activity/Transport
// booking — the cancellation counterpart of HotelBookingEmailModal/
// ActivityBookingEmailModal, generalized into one component since the
// preview/send shape (toEmail/subject/bodyHtml, subject-only editable,
// server-regenerated body) is identical across all three vendor types; only
// the preview/send URLs differ per caller. See
// Hotel/Activity/TransportCancellationEmailService on the backend.
export function CancellationEmailModal({
  open,
  previewUrl,
  sendUrl,
  onClose,
  onSent,
}: {
  open: boolean;
  previewUrl: string;
  sendUrl: string;
  onClose: () => void;
  onSent: () => void;
}) {
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [toEmail, setToEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [loadError, setLoadError] = useState<string | undefined>();
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | undefined>();

  useEffect(() => {
    if (!open) return;
    setLoadingPreview(true);
    setLoadError(undefined);
    setSendError(undefined);
    setToEmail("");
    setSubject("");
    setBodyHtml("");
    clientApi
      .get<CancellationEmailPreview>(previewUrl)
      .then((res) => {
        setToEmail(res.data.toEmail ?? "");
        setSubject(res.data.subject);
        setBodyHtml(res.data.bodyHtml);
      })
      .catch((err) => setLoadError(extractErrorMessage(err, "Failed to load the cancellation email preview")))
      .finally(() => setLoadingPreview(false));
  }, [open, previewUrl]);

  async function handleSend() {
    setSending(true);
    setSendError(undefined);
    try {
      await clientApi.post(sendUrl, { subject });
      onSent();
    } catch (err) {
      setSendError(extractErrorMessage(err, "Failed to send cancellation email"));
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        if (sending) return;
        onClose();
      }}
      title="Send Cancellation Email"
      className="max-w-2xl"
    >
      <div className="flex flex-col gap-4">
        {loadingPreview ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-72 w-full" />
          </div>
        ) : loadError ? (
          <Alert tone="danger" autoClose={false}>
            {loadError}
          </Alert>
        ) : (
          <>
            <TextInput label="To" value={toEmail} readOnly disabled />
            <TextInput label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Body</label>
              <iframe
                srcDoc={bodyHtml}
                title="Cancellation email preview"
                className="h-80 w-full rounded border border-border"
                sandbox="allow-same-origin"
              />
            </div>
          </>
        )}

        {sendError && (
          <Alert tone="danger" autoClose={false}>
            {sendError}
          </Alert>
        )}

        <div className="flex w-full gap-3 border-t pt-5">
          <Button type="button" variant="ghost" disabled={sending} onClick={onClose} className="w-full">
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleSend}
            disabled={sending || loadingPreview || !!loadError || !subject.trim()}
            loading={sending}
            loadingText="Sending…"
            className="w-full"
          >
            Send Email
          </Button>
        </div>
      </div>
    </Modal>
  );
}
