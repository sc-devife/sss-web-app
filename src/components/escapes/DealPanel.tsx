"use client";

import { formatMoney, getOrgCurrency } from "@/lib/currency";
import { formatRate, type ResolvedExchangeRate } from "@/lib/exchange-rates";
import type { SupportedCurrency } from "@/lib/currencies";
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

const emptyForm = { label: "", dueDate: "", amountBase: "" };

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
  const [acceptedQuote, setAcceptedQuote] = useState<Quote | null>(null);
  const [currencies, setCurrencies] = useState<SupportedCurrency[]>([]);
  const [payCurrencies, setPayCurrencies] = useState<Record<string, string>>({});
  const [payRates, setPayRates] = useState<Record<string, string>>({});
  const [rateHints, setRateHints] = useState<Record<string, ResolvedExchangeRate>>({});
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
      .then((res) => {
        setQuoteTotal(res.data.totalBase);
        setAcceptedQuote(res.data);
      })
      .catch(() => setQuoteTotal(null));
  }, [deal.acceptedQuoteUid]);

  useEffect(() => {
    clientApi.get<SupportedCurrency[]>("/currencies").then((res) => setCurrencies(res.data)).catch(() => {});
  }, []);

  // Payments default to the vendor's base currency, or to the currency the
  // accepted quote was issued in (the usual case when a traveller pays in theirs).
  const baseCode = getOrgCurrency();
  const quoteForeignCode =
    acceptedQuote?.currencyCode && acceptedQuote.currencyCode !== baseCode && acceptedQuote.fxRateSnapshot != null
      ? acceptedQuote.currencyCode
      : null;
  function currencyFor(uid: string): string {
    return payCurrencies[uid] ?? quoteForeignCode ?? baseCode;
  }

  // Today's rate for each foreign currency in use (vendor's manual rate, else market),
  // shown as the default the user can overwrite.
  useEffect(() => {
    const needed = new Set<string>();
    if (quoteForeignCode) needed.add(quoteForeignCode);
    Object.values(payCurrencies).forEach((c) => {
      if (c && c !== baseCode) needed.add(c);
    });
    needed.forEach((code) => {
      if (rateHints[code]) return;
      clientApi
        .get<ResolvedExchangeRate>(`/exchange-rates?from=${baseCode}&to=${code}`)
        .then((res) => setRateHints((h) => ({ ...h, [code]: res.data })))
        .catch(() => {});
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payCurrencies, quoteForeignCode, baseCode]);

  // What a payment of `amount` in `currency` credits to the milestone and its FX gain/loss —
  // mirrors the server's rule so the user sees the outcome before recording.
  function paymentPreview(uid: string): { applied: number; fxDifference: number; rate: number } | null {
    const currency = currencyFor(uid);
    const amount = Number(payAmounts[uid]);
    if (!amount || amount <= 0) return null;
    if (currency === baseCode) return { applied: amount, fxDifference: 0, rate: 1 };
    const typed = Number(payRates[uid]);
    const rate = typed > 0 ? typed : rateHints[currency]?.rate;
    if (!rate) return null;
    const baseValue = amount / rate;
    const sameAsQuote = acceptedQuote?.currencyCode === currency && acceptedQuote.fxRateSnapshot;
    const applied = sameAsQuote ? amount / (acceptedQuote!.fxRateSnapshot as number) : baseValue;
    return { applied, fxDifference: baseValue - applied, rate };
  }

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
          amountBase: Number(form.amountBase),
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
      const currency = currencyFor(uid);
      const typedRate = Number(payRates[uid]);
      await dispatch(
        recordPayment({
          uid,
          dealUid: deal.uid,
          amount,
          paymentMethod,
          paymentReference,
          ...(currency !== baseCode ? { currencyCode: currency, ...(typedRate > 0 ? { exchangeRate: typedRate } : {}) } : {}),
        }),
      );
      setPayCurrencies((p) => Object.fromEntries(Object.entries(p).filter(([key]) => key !== uid)));
      setPayRates((p) => ({ ...p, [uid]: "" }));
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

  const milestonesTotal = milestones.reduce((sum, m) => sum + m.amountBase, 0);
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
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
            />
          </div>
          {cancelError && <p className="text-sm text-danger">{cancelError}</p>}
          <div className="flex w-full gap-3 border-t pt-5">
            <Button
              type="button"
              disabled={cancellingDeal}
              onClick={() => { setShowCancelForm(false); setCancelReason(""); setCancelError(undefined); }}
              className="w-full"
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
              className="w-full"
            >
              Cancel Deal
            </Button>
          </div>
        </div>
      </Modal>

      {milestonesMismatch && (
        <div className="rounded border border-warning/40 bg-warning/10 p-2 text-xs text-warning">
          Payment milestones total {formatMoney(milestonesTotal)}, which doesn&apos;t match the accepted quote&apos;s total of {formatMoney(quoteTotal!)}.
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
                        due {formatDisplayDate(m.dueDate)} · {formatMoney(m.amountPaidBase)} / {formatMoney(m.amountBase)}
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
                  {m.payments && m.payments.length > 0 && (
                    <div className="flex flex-col gap-0.5 border-t border-border pt-2 text-xs text-muted-foreground">
                      {m.payments.map((p) => (
                        <span key={p.uid}>
                          {formatMoney(p.receivedAmount, p.receivedCurrency)} received
                          {p.receivedCurrency !== baseCode && ` (1 ${baseCode} = ${formatRate(p.fxRate)} ${p.receivedCurrency})`}
                          {" → "}credited {formatMoney(p.appliedAmountBase)}
                          {p.fxDifferenceBase !== 0 && p.receivedCurrency !== baseCode && (
                            <span className={p.fxDifferenceBase > 0 ? "text-success" : "text-danger"}>
                              {" · FX "}{p.fxDifferenceBase > 0 ? "gain " : "loss "}{formatMoney(Math.abs(p.fxDifferenceBase))}
                            </span>
                          )}
                          {p.paymentReference && ` · Ref: ${p.paymentReference}`}
                          <span className={p.verifiedAt ? "text-success" : "text-warning"}>{p.verifiedAt ? " · verified" : " · awaiting verification"}</span>
                        </span>
                      ))}
                    </div>
                  )}
                  {m.status !== "paid" && m.status !== "unverified" && (
                    <div className="flex flex-col gap-2 border-t border-border pt-2 sm:flex-row sm:flex-wrap sm:items-end">
                      <TextInput
                        label={`Amount (${currencyFor(m.uid)})`}
                        type="number"
                        min={0}
                        step="any"
                        placeholder="Amount"
                        value={payAmounts[m.uid] ?? ""}
                        onChange={(e) => setPayAmounts((p) => ({ ...p, [m.uid]: e.target.value }))}
                        className="w-28"
                        disabled={isCancelled}
                        required
                      />
                      <Select
                        label="Currency"
                        options={[
                          { value: baseCode, label: `${baseCode} — vendor currency` },
                          ...currencies.filter((c) => c.code !== baseCode).map((c) => ({ value: c.code, label: `${c.code} — ${c.name}` })),
                        ]}
                        value={currencyFor(m.uid)}
                        onChange={(e) => {
                          const code = e.target.value;
                          setPayCurrencies((p) => ({ ...p, [m.uid]: code }));
                          setPayRates((p) => ({ ...p, [m.uid]: "" }));
                        }}
                        disabled={isCancelled}
                        className="w-44"
                      />
                      {currencyFor(m.uid) !== baseCode && (
                        <TextInput
                          label={`Rate: 1 ${baseCode} = ? ${currencyFor(m.uid)}`}
                          type="number"
                          min={0}
                          step="any"
                          placeholder={rateHints[currencyFor(m.uid)] ? formatRate(rateHints[currencyFor(m.uid)].rate) : "Rate"}
                          value={payRates[m.uid] ?? ""}
                          onChange={(e) => setPayRates((p) => ({ ...p, [m.uid]: e.target.value }))}
                          className="w-36"
                          disabled={isCancelled}
                        />
                      )}
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
                      {(() => {
                        const preview = paymentPreview(m.uid);
                        if (!preview || currencyFor(m.uid) === baseCode) return null;
                        return (
                          <p className="w-full text-xs text-muted-foreground">
                            Credits <span className="font-medium text-foreground">{formatMoney(preview.applied)}</span> to this milestone
                            {Math.abs(preview.fxDifference) >= 0.005 && (
                              <span className={preview.fxDifference > 0 ? "text-success" : "text-danger"}>
                                {" · FX "}{preview.fxDifference > 0 ? "gain " : "loss "}{formatMoney(Math.abs(preview.fxDifference))}
                              </span>
                            )}
                          </p>
                        );
                      })()}
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
            step="any"
            value={form.amountBase}
            onChange={(e) => setForm((f) => ({ ...f, amountBase: e.target.value }))}
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
