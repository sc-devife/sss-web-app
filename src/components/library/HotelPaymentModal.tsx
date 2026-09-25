"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Select } from "@/components/ui/Select";
import { DatePicker } from "@/components/ui/DatePicker";
import { Modal } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { todayIsoDate } from "@/lib/date";
import { required, requiredSelection, positiveNumber, runValidators } from "@/lib/validators";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/payment-methods";
import { getOrgCurrency } from "@/lib/currency";
import { SupplierCurrencyFields } from "@/components/library/SupplierCurrencyFields";
import type { HotelPayment } from "@/lib/hotels";

const emptyForm = {
  escapeUid: "",
  transactionId: "",
  paymentMethod: "",
  amount: "",
  currencyCode: "",
  exchangeRate: "",
  paidBy: "",
  paymentDate: todayIsoDate(),
  notes: "",
};

type FormState = typeof emptyForm;

function validate(v: FormState): Record<string, string> {
  const errors: Record<string, string> = {};
  const escapeErr = requiredSelection(v.escapeUid, "Please select an escape");
  if (escapeErr) errors.escapeUid = escapeErr;
  const methodErr = requiredSelection(v.paymentMethod, "Please select a payment method");
  if (methodErr) errors.paymentMethod = methodErr;
  const amountErr = runValidators(v.amount, [required("Amount is required"), positiveNumber("Enter a valid amount")]);
  if (amountErr) errors.amount = amountErr;
  const dateErr = required("Payment date is required")(v.paymentDate);
  if (dateErr) errors.paymentDate = dateErr;
  return errors;
}

// The "Add New Payment" popup on the Hotel Detail page's Payments tab —
// records a payout the agency makes OUT to this hotel for one of its actual
// bookings (see HotelDetailPanel's Bookings tab / HotelBookingDTO), not a
// customer-facing PaymentMilestone.
export function HotelPaymentModal({
  open,
  hotelUid,
  escapeOptions,
  onClose,
  onSaved,
}: {
  open: boolean;
  hotelUid: string;
  escapeOptions: { escapeUid: string; tripCode: string | null; leadName: string | null }[];
  onClose: () => void;
  onSaved: (payment: HotelPayment) => void;
}) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();

  useEffect(() => {
    if (!open) return;
    setForm(emptyForm);
    setErrors({});
    setFormError(undefined);
  }, [open]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((p) => ({ ...p, [key]: "" }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const nextErrors = validate(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setFormError(undefined);
    setSaving(true);
    try {
      const res = await clientApi.post<HotelPayment>(`/library/hotels/${hotelUid}/payments`, {
        escapeUid: form.escapeUid,
        transactionId: form.transactionId || null,
        paymentMethod: form.paymentMethod,
        amount: Number(form.amount),
        ...(form.currencyCode ? { currencyCode: form.currencyCode, ...(Number(form.exchangeRate) > 0 ? { exchangeRate: Number(form.exchangeRate) } : {}) } : {}),
        paidBy: form.paidBy || null,
        paymentDate: form.paymentDate,
        notes: form.notes || null,
      });
      onSaved(res.data);
      onClose();
    } catch (err) {
      setFormError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to save payment"));
    } finally {
      setSaving(false);
    }
  }

  const canSubmit =
    form.escapeUid.trim() !== "" && form.paymentMethod.trim() !== "" && form.amount.trim() !== "" && form.paymentDate.trim() !== "";

  return (
    <Modal
      open={open}
      onClose={() => {
        if (saving) return;
        onClose();
      }}
      title="Add New Payment"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <fieldset disabled={saving} className="contents">
          <Select
            label="Escape ID"
            options={escapeOptions.map((o) => ({
              value: o.escapeUid,
              label: [o.tripCode, o.leadName].filter(Boolean).join(" — ") || o.escapeUid,
            }))}
            value={form.escapeUid}
            onChange={(e) => update("escapeUid", e.target.value)}
            error={errors.escapeUid}
            placeholder="Select an escape"
            searchable
            required
          />

          <TextInput
            label="Transaction ID"
            placeholder="e.g. UPI ref, bank UTR"
            value={form.transactionId}
            onChange={(e) => update("transactionId", e.target.value)}
          />

          <SupplierCurrencyFields
            currencyCode={form.currencyCode}
            exchangeRate={form.exchangeRate}
            amount={form.amount}
            onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Payment Method"
              options={PAYMENT_METHOD_OPTIONS}
              value={form.paymentMethod}
              onChange={(e) => update("paymentMethod", e.target.value)}
              error={errors.paymentMethod}
              placeholder="Select method"
              required
            />
            <TextInput
              label={`Amount (${form.currencyCode || getOrgCurrency()})`}
              type="number"
              min={0}
              step="any"
              value={form.amount}
              onChange={(e) => update("amount", e.target.value)}
              error={errors.amount}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <TextInput
              label="Paid By"
              placeholder="e.g. Accounts team, Rohan Mehta"
              value={form.paidBy}
              onChange={(e) => update("paidBy", e.target.value)}
            />
            <DatePicker
              label="Payment Date"
              value={form.paymentDate}
              onChange={(v) => update("paymentDate", v)}
              error={errors.paymentDate}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Notes / Remarks</label>
            <textarea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              rows={3}
              className="w-full rounded border border-border bg-background p-3 text-sm text-foreground outline-none focus:border-primary"
            />
          </div>
        </fieldset>

        {formError && (
          <Alert tone="danger" autoClose={false}>
            {formError}
          </Alert>
        )}

        <div className="flex gap-3 w-full border-t pt-5">
          <Button type="button" variant="ghost" disabled={saving} onClick={onClose} className="w-full">
            Cancel
          </Button>
          <Button type="submit" disabled={saving || !canSubmit} loading={saving} loadingText="Saving…" className="w-full">
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}
