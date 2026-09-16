"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import type { HotelBookingEmailPreview } from "@/lib/hotels";

// The "Send Hotel Booking Email" popup on the Hotel Detail page's Bookings
// tab — a BOOKING REQUEST sent to the hotel/supplier itself (Hotel.email),
// not the traveller/lead (that's a separate, existing confirmation flow).
// The caller gates opening this at all on `hotel.email` already being set
// (see HotelDetailPanel's onSendBookingEmail), so this component can assume
// a recipient exists; it still shows the address for the user's confirmation.
export function HotelBookingEmailModal({
  open,
  hotelUid,
  itineraryItemUid,
  hotelEmail,
  onClose,
  onSent,
}: {
  open: boolean;
  hotelUid: string;
  itineraryItemUid: string | null;
  hotelEmail: string;
  onClose: () => void;
  onSent: () => void;
}) {
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [loadError, setLoadError] = useState<string | undefined>();
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | undefined>();

  useEffect(() => {
    if (!open || !itineraryItemUid) return;
    setLoadingPreview(true);
    setLoadError(undefined);
    setSendError(undefined);
    setSubject("");
    setBodyHtml("");
    clientApi
      .get<HotelBookingEmailPreview>(`/library/hotels/${hotelUid}/bookings/${itineraryItemUid}/booking-email-preview`)
      .then((res) => {
        setSubject(res.data.subject);
        setBodyHtml(res.data.bodyHtml);
      })
      .catch((err) => setLoadError(extractErrorMessage(err, "Failed to load the booking email preview")))
      .finally(() => setLoadingPreview(false));
  }, [open, hotelUid, itineraryItemUid]);

  async function handleSend() {
    if (!itineraryItemUid) return;
    setSending(true);
    setSendError(undefined);
    try {
      await clientApi.post(`/library/hotels/${hotelUid}/bookings/${itineraryItemUid}/send-email`, { subject });
      onSent();
    } catch (err) {
      setSendError(extractErrorMessage(err, "Failed to send booking email"));
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
      title="Send Hotel Booking Email"
      className="max-w-2xl"
    >
      <div className="flex flex-col gap-4">
        <TextInput label="To" value={hotelEmail} readOnly disabled />

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
            <TextInput label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Body</label>
              <iframe
                srcDoc={bodyHtml}
                title="Hotel booking email preview"
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
