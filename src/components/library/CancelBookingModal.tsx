"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Alert } from "@/components/ui/Alert";

// Collects the Drop reason/charge for a Booked Hotel/Activity booking before
// cancelling it — the first step of the vendor-page "Send Cancellation
// Email" action (Booked -> Drop, then straight into CancellationEmailModal).
// Mirrors the exact same reason-required Drop rule already enforced
// elsewhere (ItineraryItemHelper.update/saveHotelDetail) — this modal only
// collects the values, onConfirm does the actual drop.
export function CancelBookingModal({
  open,
  itemLabel,
  onClose,
  onConfirm,
}: {
  open: boolean;
  itemLabel: string;
  onClose: () => void;
  onConfirm: (reason: string, cancellationCharge: number | undefined) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [charge, setCharge] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  function handleClose() {
    if (submitting) return;
    setReason("");
    setCharge("");
    setError(undefined);
    onClose();
  }

  async function handleSubmit() {
    if (!reason.trim()) {
      setError("A cancellation reason is required");
      return;
    }
    setSubmitting(true);
    setError(undefined);
    try {
      await onConfirm(reason.trim(), charge ? Number(charge) : undefined);
      setReason("");
      setCharge("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel booking");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Cancel Booking">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          This will mark <span className="font-medium text-foreground">{itemLabel}</span> as Dropped, then let you
          review and send a cancellation email to the supplier.
        </p>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="cancel-booking-reason">
            Cancellation Reason <span className="text-danger">*</span>
          </label>
          <textarea
            id="cancel-booking-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            required
            disabled={submitting}
            placeholder="Why this booking is being cancelled"
            className="rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
          />
        </div>

        <TextInput
          label="Cancellation Charge (INR)"
          type="number"
          min={0}
          step="any"
          placeholder="Charged for the cancellation, if any"
          value={charge}
          onChange={(e) => setCharge(e.target.value)}
          disabled={submitting}
        />

        {error && (
          <Alert tone="danger" autoClose={false}>
            {error}
          </Alert>
        )}

        <div className="flex w-full gap-3 border-t pt-5">
          <Button type="button" variant="ghost" disabled={submitting} onClick={handleClose} className="w-full">
            Keep Booking
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleSubmit}
            disabled={submitting}
            loading={submitting}
            loadingText="Cancelling…"
            className="w-full"
          >
            Cancel Booking
          </Button>
        </div>
      </div>
    </Modal>
  );
}
