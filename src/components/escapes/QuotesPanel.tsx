"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Body, Caption } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchQuotesForItinerary,
  fetchCurrencies,
  createQuote,
  reviseQuote,
  deleteQuote,
  setQuoteTemplate,
  computeQuote,
} from "@/features/quotes/quotesThunks";
import { selectQuotesForItinerary, selectQuotesStatus, selectCurrencies } from "@/features/quotes/quotesSelectors";
import { fetchTaxProfiles } from "@/features/taxProfiles/taxProfilesThunks";
import { selectTaxProfiles } from "@/features/taxProfiles/taxProfilesSelectors";
import { fetchQuoteTemplates } from "@/features/quoteTemplates/quoteTemplatesThunks";
import { selectQuoteTemplates } from "@/features/quoteTemplates/quoteTemplatesSelectors";
import { acceptQuote } from "@/features/deals/dealsThunks";
import { selectDeal } from "@/features/deals/dealsSelectors";

const emptyForm = { validUntil: "" };

const emptyComputeForm = {
  taxProfileUid: "",
  discountType: "none",
  discountValue: "",
  displayCurrencyCode: "",
  fxRateSnapshot: "",
};

export function QuotesPanel({
  itineraryUid,
  escapeUid,
  onDealChanged,
}: {
  itineraryUid: string;
  escapeUid: string;
  onDealChanged?: () => void;
}) {
  const dispatch = useAppDispatch();
  const quotes = useAppSelector((s) => selectQuotesForItinerary(s, itineraryUid));
  const quotesStatus = useAppSelector((s) => selectQuotesStatus(s, itineraryUid));
  const currencies = useAppSelector(selectCurrencies);
  const taxProfiles = useAppSelector(selectTaxProfiles);
  const templates = useAppSelector(selectQuoteTemplates);
  const deal = useAppSelector(selectDeal);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const [computingUid, setComputingUid] = useState<string | null>(null);
  const [computeForm, setComputeForm] = useState(emptyComputeForm);
  const [computeWarnings, setComputeWarnings] = useState<string[] | null>(null);

  useEffect(() => {
    dispatch(fetchQuotesForItinerary(itineraryUid));
    dispatch(fetchTaxProfiles());
    dispatch(fetchCurrencies());
    dispatch(fetchQuoteTemplates());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itineraryUid]);

  const activeTaxProfiles = taxProfiles.filter((t) => t.status === "active");

  function refresh() {
    dispatch(fetchQuotesForItinerary(itineraryUid));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      await dispatch(createQuote({ itineraryUid, validUntil: form.validUntil || null })).unwrap();
      refresh();
      setForm(emptyForm);
      setShowForm(false);
    } catch (err) {
      setError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to create quote"));
    } finally {
      setBusy(false);
    }
  }

  async function handleRevise(uid: string) {
    setBusy(true);
    try {
      await dispatch(reviseQuote({ uid, itineraryUid }));
      refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(uid: string) {
    setBusy(true);
    try {
      await dispatch(deleteQuote({ uid, itineraryUid }));
      refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleAccept(uid: string) {
    setBusy(true);
    setError(undefined);
    try {
      await dispatch(acceptQuote({ quoteUid: uid, escapeUid })).unwrap();
      onDealChanged?.();
      refresh();
    } catch (err) {
      setError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to accept quote"));
    } finally {
      setBusy(false);
    }
  }

  async function handleSetTemplate(uid: string, templateId: string) {
    setBusy(true);
    try {
      await dispatch(setQuoteTemplate({ uid, itineraryUid, templateId: templateId || null }));
      refresh();
    } finally {
      setBusy(false);
    }
  }

  function openCompute(uid: string) {
    setComputingUid(uid);
    setComputeForm(emptyComputeForm);
    setComputeWarnings(null);
  }

  // Guarded the same way every button in this panel already is — busy
  // covers create/revise/delete/accept/setTemplate/compute uniformly, so a
  // request in flight (for this quote or another) blocks dismissal too.
  function closeCompute() {
    if (busy) return;
    setComputingUid(null);
  }

  async function handleCompute(uid: string) {
    setBusy(true);
    setError(undefined);
    try {
      const result = await dispatch(
        computeQuote({
          uid,
          itineraryUid,
          taxProfileUid: computeForm.taxProfileUid || null,
          discountType: computeForm.discountType,
          discountValue: computeForm.discountValue ? Number(computeForm.discountValue) : null,
          displayCurrencyCode: computeForm.displayCurrencyCode || null,
          fxRateSnapshot: computeForm.fxRateSnapshot ? Number(computeForm.fxRateSnapshot) : null,
        }),
      ).unwrap();
      setComputeWarnings(result.pricingWarnings ?? []);
      refresh();
    } catch (err) {
      setError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to compute pricing"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-3">
      <div className="flex items-center justify-between">
        <Caption>Quotes</Caption>
        <Button size="sm" variant="secondary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : "Add quote"}
        </Button>
      </div>

      {quotesStatus === "loading" && quotes.length === 0 && <LoadingState />}
      {quotesStatus !== "loading" && quotes.length === 0 && !showForm && <Body muted>No quotes yet.</Body>}

      {quotes.length > 0 && (
        <div className="flex flex-col gap-2">
          {quotes.map((q) => (
            <div key={q.uid} className="flex flex-col gap-2 rounded border border-border px-3 py-2 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  <Badge tone={q.status === "accepted" ? "success" : q.status === "superseded" ? "neutral" : "neutral"}>
                    v{q.version} · {q.status}
                  </Badge>{" "}
                  {q.totalUsd != null ? `$${q.totalUsd.toFixed(2)} USD` : "Not priced yet"}
                  {q.validUntil && <span className="text-muted-foreground"> · valid until {q.validUntil}</span>}
                </span>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => openCompute(q.uid)} disabled={busy} className="text-primary hover:underline">Compute pricing</button>
                  <a href={`/quotes/${q.uid}/preview`} target="_blank" rel="noreferrer" className="text-primary hover:underline">Preview</a>
                  {!deal && !["accepted", "superseded", "rejected"].includes(q.status) && (
                    <button type="button" onClick={() => handleAccept(q.uid)} disabled={busy} className="text-success hover:underline">Accept quote</button>
                  )}
                  <button type="button" onClick={() => handleRevise(q.uid)} disabled={busy} className="text-primary hover:underline">Revise</button>
                  <button type="button" onClick={() => handleDelete(q.uid)} disabled={busy} className="text-danger hover:underline">Delete</button>
                </div>
              </div>

              <Select
                label="Template (overrides the org default for this quote)"
                options={templates.map((t) => ({ value: t.id, label: t.name }))}
                value={q.templateId ?? ""}
                onChange={(e) => handleSetTemplate(q.uid, e.target.value)}
                placeholder="Org default"
                className="max-w-xs"
              />

              <Modal open={computingUid === q.uid} onClose={closeCompute} title="Compute Pricing" className="max-w-lg">
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Select
                      label="Tax profile"
                      options={activeTaxProfiles.map((t) => ({ value: t.uid, label: `${t.displayName} (${t.ratePercent}%)` }))}
                      value={computeForm.taxProfileUid}
                      onChange={(e) => setComputeForm((f) => ({ ...f, taxProfileUid: e.target.value }))}
                      placeholder="No tax"
                    />
                    <Select
                      label="Discount type"
                      options={[
                        { value: "none", label: "None" },
                        { value: "percent", label: "Percent" },
                        { value: "flat", label: "Flat" },
                      ]}
                      value={computeForm.discountType}
                      onChange={(e) => setComputeForm((f) => ({ ...f, discountType: e.target.value }))}
                    />
                    <TextInput
                      label="Discount value"
                      type="number"
                      min={0}
                      step="0.01"
                      value={computeForm.discountValue}
                      onChange={(e) => setComputeForm((f) => ({ ...f, discountValue: e.target.value }))}
                    />
                    <Select
                      label="Display currency"
                      options={currencies.map((c) => ({ value: c.code, label: `${c.code} — ${c.name}` }))}
                      value={computeForm.displayCurrencyCode}
                      onChange={(e) => setComputeForm((f) => ({ ...f, displayCurrencyCode: e.target.value }))}
                      placeholder="USD only"
                    />
                    {computeForm.displayCurrencyCode && computeForm.displayCurrencyCode !== "USD" && (
                      <TextInput
                        label={`1 USD = ? ${computeForm.displayCurrencyCode}`}
                        type="number"
                        min={0}
                        step="0.0001"
                        value={computeForm.fxRateSnapshot}
                        onChange={(e) => setComputeForm((f) => ({ ...f, fxRateSnapshot: e.target.value }))}
                      />
                    )}
                  </div>
                  <Caption>Pricing sums Activity/Transport items with a base price set. Hotels aren&apos;t priced yet — see below for excluded items.</Caption>
                  {computeWarnings && computeWarnings.length > 0 && (
                    <div className="rounded border border-warning/40 bg-warning/10 p-2 text-xs text-warning">
                      {computeWarnings.map((w, i) => <div key={i}>{w}</div>)}
                    </div>
                  )}
                  <div className="flex justify-end gap-2 border-t border-border pt-4">
                    <Button size="sm" variant="ghost" disabled={busy} onClick={closeCompute}>Close</Button>
                    <Button size="sm" disabled={busy} onClick={() => handleCompute(q.uid)}>{busy ? "Computing…" : "Compute"}</Button>
                  </div>
                </div>
              </Modal>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      {showForm && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded border border-border p-3">
          <TextInput label="Valid until" type="date" value={form.validUntil} onChange={(e) => setForm({ validUntil: e.target.value })} />
          <Button type="submit" size="sm" disabled={busy}>{busy ? "Saving…" : "Save quote"}</Button>
        </form>
      )}
    </div>
  );
}
