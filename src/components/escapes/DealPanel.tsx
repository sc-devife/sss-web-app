"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { DatePicker } from "@/components/ui/DatePicker";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { QuotationPreviewModal } from "@/components/quotation/QuotationPreviewModal";
import { Body, Caption } from "@/components/ui/Typography";
import { PiWarningCircleFill } from "react-icons/pi";
import { Spinner } from "@/components/ui/Spinner";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Deal } from "@/lib/deals";
import type { Quote } from "@/lib/quotes";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { formatDisplayDate, formatDisplayDateTime } from "@/lib/date";
import { formatAuditActor } from "@/lib/audit";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchMilestonesForDeal, createPaymentMilestone, recordPayment, verifyPaymentMilestone, deletePaymentMilestone } from "@/features/paymentMilestones/paymentMilestonesThunks";
import { selectPaymentMilestones, selectPaymentMilestonesStatus, selectPaymentMilestonesError } from "@/features/paymentMilestones/paymentMilestonesSelectors";
import { cancelDeal } from "@/features/deals/dealsThunks";
import { fetchEscapeById, fetchEscapeAuditLog } from "@/features/escapes/escapesThunks";

const emptyForm = { label: "", dueDate: "", amountInr: "" };

// No existing payment-method taxonomy anywhere in the app (checked) — this
// is a new, deliberately small fixed list rather than free text, so
// reporting/filtering on it later isn't stuck parsing inconsistent spelling.
const PAYMENT_METHOD_OPTIONS = [
  { value: "upi", label: "UPI" },
  { value: "neft", label: "NEFT" },
  { value: "rtgs", label: "RTGS" },
  { value: "imps", label: "IMPS" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "card", label: "Card" },
  { value: "cash", label: "Cash" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
];

export function DealPanel({ deal }: { deal: Deal }) {
  const dispatch = useAppDispatch();
  const milestones = useAppSelector(selectPaymentMilestones);
  const status = useAppSelector(selectPaymentMilestonesStatus);
  const error = useAppSelector(selectPaymentMilestonesError);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [payAmounts, setPayAmounts] = useState<Record<string, string>>({});
  const [payMethods, setPayMethods] = useState<Record<string, string>>({});
  const [payReferences, setPayReferences] = useState<Record<string, string>>({});
  // Tracked per-action (rather than one shared "busy" flag) so a spinner can
  // show on the SPECIFIC button whose action is in flight — e.g. verifying
  // one milestone no longer makes every other milestone's buttons look like
  // they're loading too, just disabled.
  const [verifyingUid, setVerifyingUid] = useState<string | null>(null);
  const [deletingUid, setDeletingUid] = useState<string | null>(null);
  const [recordingUid, setRecordingUid] = useState<string | null>(null);
  const [savingMilestone, setSavingMilestone] = useState(false);
  const [cancellingDeal, setCancellingDeal] = useState(false);
  const anyBusy =
    verifyingUid !== null || deletingUid !== null || recordingUid !== null || savingMilestone || cancellingDeal;
  const [formError, setFormError] = useState<string | undefined>();

  const [quoteTotal, setQuoteTotal] = useState<number | null>(null);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState<string | undefined>();
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);

  const isCancelled = deal.status === "cancelled";

  useEffect(() => {
    dispatch(fetchMilestonesForDeal(deal.uid));
  }, [dispatch, deal.uid]);

  useEffect(() => {
    clientApi
      .get<Quote>(`/quotes/${deal.acceptedQuoteUid}`)
      .then((res) => setQuoteTotal(res.data.totalInr))
      .catch(() => setQuoteTotal(null));
  }, [deal.acceptedQuoteUid]);

  function refresh() {
    dispatch(fetchMilestonesForDeal(deal.uid));
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setSavingMilestone(true);
    setFormError(undefined);
    try {
      await dispatch(
        createPaymentMilestone({
          dealUid: deal.uid,
          label: form.label,
          dueDate: form.dueDate,
          amountInr: Number(form.amountInr),
        }),
      ).unwrap();
      refresh();
      setForm(emptyForm);
      setShowForm(false);
    } catch (err) {
      setFormError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to add milestone"));
    } finally {
      setSavingMilestone(false);
    }
  }

  function canRecordPayment(uid: string): boolean {
    const amount = Number(payAmounts[uid]);
    return !!amount && amount > 0 && !!payMethods[uid] && !!payReferences[uid]?.trim();
  }

  async function handleRecordPayment(uid: string) {
    if (!canRecordPayment(uid)) return;
    const amount = Number(payAmounts[uid]);
    const paymentMethod = payMethods[uid];
    const paymentReference = payReferences[uid].trim();
    setRecordingUid(uid);
    try {
      await dispatch(recordPayment({ uid, dealUid: deal.uid, amount, paymentMethod, paymentReference }));
      setPayAmounts((p) => ({ ...p, [uid]: "" }));
      setPayMethods((p) => ({ ...p, [uid]: "" }));
      setPayReferences((p) => ({ ...p, [uid]: "" }));
      refresh();
      // The PAYMENT_RECORDED audit entry now carries the method/reference
      // just captured — refresh History too, or it'd only show up on reload.
      dispatch(fetchEscapeAuditLog(deal.escapeUid));
    } finally {
      setRecordingUid(null);
    }
  }

  async function handleVerify(uid: string) {
    setVerifyingUid(uid);
    try {
      await dispatch(verifyPaymentMilestone(uid));
      refresh();
      // Verifying a milestone can advance the escape's own payment stage
      // (Partially Paid / Fully Paid) server-side — refetch it and its
      // audit log too, or the status badge and History tab would only show
      // the change after a manual reload.
      dispatch(fetchEscapeById(deal.escapeUid));
      dispatch(fetchEscapeAuditLog(deal.escapeUid));
    } finally {
      setVerifyingUid(null);
    }
  }

  async function handleDelete(uid: string) {
    setDeletingUid(uid);
    try {
      await dispatch(deletePaymentMilestone({ uid, dealUid: deal.uid }));
      refresh();
    } finally {
      setDeletingUid(null);
    }
  }

  async function handleCancelDeal() {
    if (!cancelReason.trim()) {
      setCancelError("A cancellation reason is required");
      return;
    }
    setCancellingDeal(true);
    setCancelError(undefined);
    try {
      await dispatch(cancelDeal({ uid: deal.uid, reason: cancelReason.trim() })).unwrap();
      setShowCancelForm(false);
      setCancelReason("");
    } catch (err) {
      setCancelError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to cancel deal"));
    } finally {
      setCancellingDeal(false);
    }
  }

  const milestonesTotal = milestones.reduce((sum, m) => sum + m.amountInr, 0);
  const milestonesMismatch =
    quoteTotal != null && milestones.length > 0 && Math.abs(milestonesTotal - quoteTotal) > 0.01;

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Caption>Deal &amp; payment milestones</Caption>
        <div className="flex items-center gap-3">
          <Button size="sm" variant="secondary" onClick={() => setShowInvoicePreview(true)}>
            Preview Invoice
          </Button>
          {!isCancelled && (
            <button type="button" onClick={() => setShowCancelForm(true)} disabled={anyBusy} className="text-sm text-danger hover:underline">
              Cancel deal
            </button>
          )}
          <Badge tone={isCancelled ? "danger" : "success"}>{deal.status}</Badge>
        </div>
      </div>

      <Modal
        open={showCancelForm}
        onClose={() => {
          if (cancellingDeal) return;
          setShowCancelForm(false);
          setCancelReason("");
          setCancelError(undefined);
        }}
        title="Cancel this deal?"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-danger/10 text-danger">
            <PiWarningCircleFill size={28} aria-hidden="true" />
          </div>
          <Body>
            Are you sure you want to cancel this deal?
          </Body>
          <div className="w-full text-left">
            <label htmlFor="deal-cancel-reason" className="text-sm font-medium text-foreground">
              Reason for cancelling this deal
            </label>
            <textarea
              id="deal-cancel-reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={2}
              disabled={cancellingDeal}
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            />
          </div>
          {cancelError && <p className="text-sm text-danger">{cancelError}</p>}
          <div className="flex w-full justify-end gap-2">
            <Button
              type="button"
              disabled={cancellingDeal}
              onClick={() => { setShowCancelForm(false); setCancelReason(""); setCancelError(undefined); }}
            >
              Keep Deal
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={cancellingDeal}
              loading={cancellingDeal}
              loadingText="Cancelling…"
              onClick={handleCancelDeal}
            >
              Cancel Deal
            </Button>
          </div>
        </div>
      </Modal>

      {milestonesMismatch && (
        <div className="rounded border border-warning/40 bg-warning/10 p-2 text-xs text-warning">
          Payment milestones total ₹{milestonesTotal.toFixed(2)} INR, which doesn&apos;t match the accepted quote&apos;s total of ₹{quoteTotal!.toFixed(2)} INR.
        </div>
      )}

      {(status === "idle" || status === "loading") && milestones.length === 0 ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 rounded border border-border px-3 py-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-3 w-52" />
            </div>
          ))}
        </div>
      ) : status === "failed" ? (
        <Body className="text-danger">{error}</Body>
      ) : (
        <>
          {milestones.length === 0 && !showForm && (
            <Body muted>No payment milestones yet.</Body>
          )}

          {milestones.length > 0 && (
            <div className="flex flex-col gap-2">
              {milestones.map((m) => (
                <div
                  key={m.uid}
                  className="flex flex-col gap-2 rounded border border-border px-3 py-2 text-sm"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span>
                      <Badge
                        tone={
                          m.status === "paid"
                            ? "success"
                            : m.status === "overdue"
                              ? "danger"
                              : m.status === "partially_paid" || m.status === "unverified"
                                ? "warning"
                                : "neutral"
                        }
                      >
                        {m.status}
                      </Badge>{" "}
                      <span className="font-medium text-foreground">{m.label}</span>{" "}
                      <span className="text-muted-foreground">
                        due {formatDisplayDate(m.dueDate)} · ₹{m.amountPaidInr.toFixed(2)} / ₹{m.amountInr.toFixed(2)} INR
                      </span>
                      {m.markedPaidAt && (
                        <span className="block text-xs text-muted-foreground">
                          Paid by {formatAuditActor(m.markedPaidByName)} on {formatDisplayDateTime(m.markedPaidAt)}
                          {m.paymentMethod && ` · ${PAYMENT_METHOD_OPTIONS.find((o) => o.value === m.paymentMethod)?.label ?? m.paymentMethod}`}
                          {m.paymentReference && ` · Ref: ${m.paymentReference}`}
                        </span>
                      )}
                    </span>
                    {m.status === "unverified" && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          disabled={anyBusy || isCancelled}
                          loading={verifyingUid === m.uid}
                          loadingText="Verifying…"
                          onClick={() => handleVerify(m.uid)}
                        >
                          Verify payment
                        </Button>
                        <button
                          type="button"
                          onClick={() => handleDelete(m.uid)}
                          disabled={anyBusy}
                          className="inline-flex items-center gap-1.5 text-danger hover:underline disabled:no-underline"
                        >
                          {deletingUid === m.uid && <Spinner size="sm" tone="danger" />}
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                  {m.status !== "paid" && m.status !== "unverified" && (
                    <div className="flex flex-col gap-2 border-t border-border pt-2 sm:flex-row sm:flex-wrap sm:items-end">
                      <TextInput
                        label="Amount (INR)"
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="Amount"
                        value={payAmounts[m.uid] ?? ""}
                        onChange={(e) => setPayAmounts((p) => ({ ...p, [m.uid]: e.target.value }))}
                        className="w-28"
                        disabled={isCancelled}
                        required
                      />
                      <Select
                        label="Payment method"
                        options={PAYMENT_METHOD_OPTIONS}
                        value={payMethods[m.uid] ?? ""}
                        onChange={(e) => setPayMethods((p) => ({ ...p, [m.uid]: e.target.value }))}
                        placeholder="Select method"
                        disabled={isCancelled}
                        className="w-40"
                        required
                      />
                      <TextInput
                        label="Payment ID / UTR Number"
                        placeholder="e.g. UPI ref, bank UTR"
                        value={payReferences[m.uid] ?? ""}
                        onChange={(e) => setPayReferences((p) => ({ ...p, [m.uid]: e.target.value }))}
                        className="w-48"
                        disabled={isCancelled}
                        required
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          disabled={anyBusy || isCancelled || !canRecordPayment(m.uid)}
                          loading={recordingUid === m.uid}
                          loadingText="Recording…"
                          onClick={() => handleRecordPayment(m.uid)}
                        >
                          Record payment
                        </Button>
                        <button
                          type="button"
                          onClick={() => handleDelete(m.uid)}
                          disabled={anyBusy}
                          className="inline-flex items-center gap-1.5 text-danger hover:underline disabled:no-underline"
                        >
                          {deletingUid === m.uid && <Spinner size="sm" tone="danger" />}
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {!isCancelled && (
        <div className="flex items-center border-t border-border pt-3">
          <Button size="sm" variant="secondary" onClick={() => setShowForm((s) => !s)}>
            {showForm ? "Cancel" : "Add milestone"}
          </Button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleAdd} className="grid grid-cols-1 gap-3 rounded border border-border p-3 sm:grid-cols-3">
          <TextInput label="Label" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} required />
          <DatePicker label="Due date" value={form.dueDate} onChange={(v) => setForm((f) => ({ ...f, dueDate: v }))} required />
          <TextInput
            label="Amount (INR)"
            type="number"
            min={0}
            step="0.01"
            value={form.amountInr}
            onChange={(e) => setForm((f) => ({ ...f, amountInr: e.target.value }))}
            required
          />
          {formError && <p className="col-span-full text-sm text-danger">{formError}</p>}
          <Button
            type="submit"
            size="sm"
            disabled={anyBusy}
            loading={savingMilestone}
            loadingText="Saving…"
            className="col-span-full sm:col-span-1"
          >
            Save milestone
          </Button>
        </form>
      )}

      {showInvoicePreview && (
        <QuotationPreviewModal
          open
          onClose={() => setShowInvoicePreview(false)}
          title="Invoice Preview"
          src={`/api/escapes/${deal.escapeUid}/invoice-preview`}
          documentLabel="invoice"
          canSendEmail
        />
      )}
    </Card>
  );
}
