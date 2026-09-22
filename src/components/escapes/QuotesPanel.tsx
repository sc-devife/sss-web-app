"use client";

import { useEffect, useMemo, useState } from "react";
import { PiCheckBold, PiXBold } from "react-icons/pi";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { DatePicker } from "@/components/ui/DatePicker";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { QuotationPreviewModal } from "@/components/quotation/QuotationPreviewModal";
import { Body, Caption } from "@/components/ui/Typography";
import { Spinner } from "@/components/ui/Spinner";
import { Skeleton } from "@/components/ui/Skeleton";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { formatDisplayDateTime } from "@/lib/date";
import { formatAuditActor } from "@/lib/audit";
import { formatInr } from "@/lib/currency";
import type { Quote, QuoteLineItem, QuoteLineItemsResult } from "@/lib/quotes";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchQuotesForItinerary,
  fetchCurrencies,
  reviseQuote,
  deleteQuote,
  setQuoteTemplate,
  markQuoteSent,
  markQuoteRejected,
  computeQuote,
  updateQuoteValidUntil,
} from "@/features/quotes/quotesThunks";
import { selectQuotesForItinerary, selectQuotesStatus, selectCurrencies } from "@/features/quotes/quotesSelectors";
import { fetchTaxProfiles } from "@/features/taxProfiles/taxProfilesThunks";
import { selectTaxProfiles } from "@/features/taxProfiles/taxProfilesSelectors";
import { fetchQuoteTemplates } from "@/features/quoteTemplates/quoteTemplatesThunks";
import { selectQuoteTemplates } from "@/features/quoteTemplates/quoteTemplatesSelectors";
import { acceptQuote } from "@/features/deals/dealsThunks";
import { selectCurrentEscape } from "@/features/escapes/escapesSelectors";

const ITEM_TYPE_LABEL: Record<string, string> = {
  hotel: "Hotel",
  activity: "Activity",
  transport: "Transport",
};

const STATUS_TONE: Record<string, "success" | "danger" | "warning" | "neutral"> = {
  accepted: "success",
  rejected: "danger",
  sent: "warning",
};

type DiscountDraft = { discountType: string; discountValue: string };

function toDraft(li: { discountType: string; discountValue: number | null }): DiscountDraft {
  return { discountType: li.discountType, discountValue: li.discountValue != null ? String(li.discountValue) : "" };
}

const emptyPricingForm = {
  taxProfileUid: "",
  taxRateOverride: "",
  tcsRatePercent: "",
  discountType: "none",
  discountValue: "",
  displayCurrencyCode: "",
  fxRateSnapshot: "",
};

function pricingFormFrom(q: Quote): typeof emptyPricingForm {
  return {
    taxProfileUid: q.taxProfileId ?? "",
    taxRateOverride: q.taxRatePercentOverride != null ? String(q.taxRatePercentOverride) : "",
    tcsRatePercent: q.tcsRatePercent != null ? String(q.tcsRatePercent) : "",
    discountType: q.discountType ?? "none",
    discountValue: q.discountValue != null ? String(q.discountValue) : "",
    displayCurrencyCode: q.currencyCode ?? "",
    fxRateSnapshot: q.fxRateSnapshot != null ? String(q.fxRateSnapshot) : "",
  };
}

// One itinerary item's row: base price (the itinerary-planning estimate,
// read-only here) + this quote's own discount for it. Discount edits are
// local until Save/Cancel — no request per keystroke — then persisted
// immediately (not gated behind the page's "Save pricing" button), since
// each item's discount is independent of the quote's overall settings.
function LineItemRow({
  item,
  onSave,
}: {
  item: QuoteLineItem;
  onSave: (lineItemUid: string, draft: DiscountDraft) => Promise<void>;
}) {
  const [draft, setDraft] = useState<DiscountDraft>(() => toDraft(item));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    setDraft(toDraft(item));
  }, [item]);

  const dirty = draft.discountType !== item.discountType || draft.discountValue !== (item.discountValue != null ? String(item.discountValue) : "");

  async function handleSave() {
    setSaving(true);
    setError(undefined);
    try {
      await onSave(item.uid, draft);
    } catch (err) {
      setError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to save discount"));
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setDraft(toDraft(item));
    setError(undefined);
  }

  return (
    <div className="grid grid-cols-12 items-center gap-2 border-b border-border px-3 py-2 text-sm last:border-0">
      <div className="col-span-5 min-w-0">
        <span className="block truncate font-medium text-foreground">{item.label}</span>
        <span className="text-xs text-muted-foreground">
          {ITEM_TYPE_LABEL[item.itemType] ?? item.itemType}
          {item.cancellation && <span className="text-danger"> · cancellation charge</span>}
        </span>
      </div>
      <div className="col-span-2 text-right text-foreground">{formatInr(item.baseAmountInr)}</div>
      <div className="col-span-3 flex items-center gap-1">
        <select
          value={draft.discountType}
          disabled={saving}
          onChange={(e) => setDraft((d) => ({ ...d, discountType: e.target.value }))}
          className="h-8 rounded border border-border bg-background px-1.5 text-xs text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <option value="none">No discount</option>
          <option value="percent">% off</option>
          <option value="flat">₹ off</option>
        </select>
        {draft.discountType !== "none" && (
          <input
            type="number"
            min={0}
            step="0.01"
            value={draft.discountValue}
            disabled={saving}
            onChange={(e) => setDraft((d) => ({ ...d, discountValue: e.target.value }))}
            placeholder={draft.discountType === "percent" ? "%" : "₹"}
            className="h-8 w-20 rounded border border-border bg-background px-2 text-xs text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
          />
        )}
        {dirty && !saving && (
          <>
            <button type="button" onClick={handleSave} aria-label="Save discount" title="Save" className="rounded p-1 text-success hover:bg-success/10">
              <PiCheckBold size={14} />
            </button>
            <button type="button" onClick={handleCancel} aria-label="Discard discount change" title="Discard" className="rounded p-1 text-muted-foreground hover:bg-muted">
              <PiXBold size={14} />
            </button>
          </>
        )}
        {saving && <Spinner size="sm" />}
      </div>
      <div className="col-span-2 text-right font-medium text-foreground">{formatInr(item.finalAmountInr)}</div>
      {error && <div className="col-span-12 text-xs text-danger">{error}</div>}
    </div>
  );
}

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
  const currentEscape = useAppSelector(selectCurrentEscape);

  // Quotes are already newest-version-first from the backend? Not
  // guaranteed — sort defensively so "latest" always means the highest
  // version number, matching how Revise/supersede works.
  const orderedQuotes = useMemo(() => [...quotes].sort((a, b) => b.version - a.version), [quotes]);

  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | undefined>();

  // The selected quote's own live data — starts as whatever's in the quotes
  // list, then gets replaced by the fresher copy every line-item/pricing
  // response carries, so the totals on screen are always the ones that
  // produced the row values currently shown (never a stale Redux copy).
  const [liveQuote, setLiveQuote] = useState<Quote | null>(null);
  const [lineItems, setLineItems] = useState<QuoteLineItem[]>([]);
  const [lineItemsLoading, setLineItemsLoading] = useState(false);
  const [lineItemsError, setLineItemsError] = useState<string | undefined>();
  const [pricingWarnings, setPricingWarnings] = useState<string[]>([]);

  const [pricingForm, setPricingForm] = useState(emptyPricingForm);
  const [savingPricing, setSavingPricing] = useState(false);

  const [templateChoice, setTemplateChoice] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    dispatch(fetchQuotesForItinerary(itineraryUid));
    dispatch(fetchTaxProfiles());
    dispatch(fetchCurrencies());
    dispatch(fetchQuoteTemplates());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itineraryUid]);

  // Defaults to (and snaps back to, if the current selection disappears —
  // deleted, or this is the first load) the most recent version.
  useEffect(() => {
    if (orderedQuotes.length === 0) {
      setSelectedUid(null);
      return;
    }
    if (!selectedUid || !orderedQuotes.some((q) => q.uid === selectedUid)) {
      setSelectedUid(orderedQuotes[0].uid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderedQuotes]);

  const selectedFromList = orderedQuotes.find((q) => q.uid === selectedUid) ?? null;
  const quote = liveQuote && liveQuote.uid === selectedUid ? liveQuote : selectedFromList;

  async function loadLineItems(uid: string) {
    setLineItemsLoading(true);
    setLineItemsError(undefined);
    try {
      const res = await clientApi.get<QuoteLineItemsResult>(`/quotes/${uid}/line-items`);
      setLiveQuote(res.data.quote);
      setLineItems(res.data.lineItems);
      setPricingWarnings(res.data.pricingWarnings ?? []);
      setPricingForm(pricingFormFrom(res.data.quote));
      setTemplateChoice(res.data.quote.templateId ?? "");
    } catch (err) {
      setLineItemsError(extractErrorMessage(err, "Failed to load quote items"));
    } finally {
      setLineItemsLoading(false);
    }
  }

  useEffect(() => {
    if (selectedUid) loadLineItems(selectedUid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUid]);

  const activeTaxProfiles = taxProfiles.filter((t) => t.status === "active");

  function refreshList() {
    dispatch(fetchQuotesForItinerary(itineraryUid));
  }

  async function handleSaveLineItemDiscount(lineItemUid: string, draft: DiscountDraft) {
    if (!quote) return;
    const res = await clientApi.put<QuoteLineItemsResult>(`/quotes/${quote.uid}/line-items/${lineItemUid}`, {
      discountType: draft.discountType,
      discountValue: draft.discountValue ? Number(draft.discountValue) : null,
    });
    setLiveQuote(res.data.quote);
    setLineItems(res.data.lineItems);
    refreshList();
  }

  async function handleSavePricing() {
    if (!quote) return;
    setBusy(true);
    setSavingPricing(true);
    setActionError(undefined);
    try {
      await dispatch(
        computeQuote({
          uid: quote.uid,
          itineraryUid,
          taxProfileUid: pricingForm.taxProfileUid || null,
          taxRatePercentOverride: pricingForm.taxProfileUid && pricingForm.taxRateOverride ? Number(pricingForm.taxRateOverride) : null,
          tcsRatePercent: pricingForm.tcsRatePercent ? Number(pricingForm.tcsRatePercent) : null,
          discountType: pricingForm.discountType,
          discountValue: pricingForm.discountValue ? Number(pricingForm.discountValue) : null,
          displayCurrencyCode: pricingForm.displayCurrencyCode || null,
          fxRateSnapshot: pricingForm.fxRateSnapshot ? Number(pricingForm.fxRateSnapshot) : null,
        }),
      ).unwrap();
      await loadLineItems(quote.uid);
      refreshList();
    } catch (err) {
      setActionError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to save pricing"));
    } finally {
      setBusy(false);
      setSavingPricing(false);
    }
  }

  async function handleValidUntilChange(v: string) {
    if (!quote) return;
    setLiveQuote({ ...quote, validUntil: v || null });
    await dispatch(updateQuoteValidUntil({ uid: quote.uid, itineraryUid, validUntil: v || null }));
    refreshList();
  }

  async function handleTemplateChange(templateId: string) {
    if (!quote) return;
    setTemplateChoice(templateId);
    await dispatch(setQuoteTemplate({ uid: quote.uid, itineraryUid, templateId: templateId || null }));
    refreshList();
  }

  async function handleRevise() {
    if (!quote) return;
    setBusy(true);
    setActionError(undefined);
    try {
      const revision = await dispatch(reviseQuote({ uid: quote.uid, itineraryUid })).unwrap();
      setSelectedUid(revision.uid);
      refreshList();
    } catch (err) {
      setActionError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to revise quote"));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!quote) return;
    setBusy(true);
    setActionError(undefined);
    try {
      await dispatch(deleteQuote({ uid: quote.uid, itineraryUid })).unwrap();
      setSelectedUid(null);
      refreshList();
    } catch (err) {
      setActionError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to delete quote"));
    } finally {
      setBusy(false);
    }
  }

  async function handleAccept() {
    if (!quote) return;
    setBusy(true);
    setActionError(undefined);
    try {
      await dispatch(acceptQuote({ quoteUid: quote.uid, escapeUid })).unwrap();
      onDealChanged?.();
      refreshList();
    } catch (err) {
      setActionError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to accept quote"));
    } finally {
      setBusy(false);
    }
  }

  async function handleMarkSent() {
    if (!quote) return;
    setBusy(true);
    setActionError(undefined);
    try {
      await dispatch(markQuoteSent({ uid: quote.uid, itineraryUid })).unwrap();
      refreshList();
    } catch (err) {
      setActionError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to mark quote as sent"));
    } finally {
      setBusy(false);
    }
  }

  async function handleMarkRejected() {
    if (!quote) return;
    setBusy(true);
    setActionError(undefined);
    try {
      await dispatch(markQuoteRejected({ uid: quote.uid, itineraryUid })).unwrap();
      refreshList();
    } catch (err) {
      setActionError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to mark quote as rejected"));
    } finally {
      setBusy(false);
    }
  }

  if ((quotesStatus === "idle" || quotesStatus === "loading") && quotes.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (quotes.length === 0) {
    return <Body muted className="py-8 text-center">No quote yet — use the + button above to start building one.</Body>;
  }

  if (!quote) return null;

  const paxCount = currentEscape?.travellers?.length ?? 0;
  let groupedDay: number | null = null;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
      {/* Header: which quote, its status, and every status-change action —
          all together at the top so building the quote below and acting on
          it never compete for space. */}
      <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/20 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {orderedQuotes.length > 1 ? (
              <select
                value={quote.uid}
                onChange={(e) => setSelectedUid(e.target.value)}
                aria-label="Quote version"
                className="h-8 rounded border border-border bg-background px-2 text-sm font-medium text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {orderedQuotes.map((q) => (
                  <option key={q.uid} value={q.uid}>
                    v{q.version} · {q.status}
                  </option>
                ))}
              </select>
            ) : (
              <Badge tone={STATUS_TONE[quote.status] ?? "neutral"}>v{quote.version} · {quote.status}</Badge>
            )}
            <Caption className="text-xs">
              Created {formatDisplayDateTime(quote.createdAt)} by {formatAuditActor(quote.createdByName)}
            </Caption>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {quote.status === "draft" && (
              <Button size="sm" variant="secondary" disabled={busy} onClick={handleMarkSent}>Mark as sent</Button>
            )}
            {(quote.status === "draft" || quote.status === "sent") && (
              <Button size="sm" variant="secondary" disabled={busy} onClick={handleMarkRejected}>Mark as rejected</Button>
            )}
            {quote.status !== "accepted" && quote.status !== "rejected" && (
              <Button size="sm" disabled={busy} onClick={handleAccept}>Accept quote</Button>
            )}
            <Button size="sm" variant="secondary" disabled={busy} onClick={handleRevise}>Revise</Button>
            <Button size="sm" variant="ghost" disabled={busy} onClick={handleDelete} className="text-danger">Delete</Button>
          </div>
        </div>
        <div className="max-w-xs">
          <DatePicker label="Valid until" value={quote.validUntil ?? ""} onChange={handleValidUntilChange} />
        </div>
        {actionError && <p className="text-sm text-danger">{actionError}</p>}
      </div>

      {/* The itinerary, day-wise, priced — each row an itinerary item with
          its own discount. This is what "building the quote" actually is:
          the same items from the Itinerary tab, now priced and discountable. */}
      <div className="rounded-lg border border-border">
        <div className="grid grid-cols-12 gap-2 border-b border-border bg-muted/40 px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <div className="col-span-5">Item</div>
          <div className="col-span-2 text-right">Base price</div>
          <div className="col-span-3">Discount</div>
          <div className="col-span-2 text-right">Price</div>
        </div>
        {lineItemsLoading && lineItems.length === 0 && (
          <div className="flex flex-col gap-2 p-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        )}
        {lineItemsError && <p className="p-3 text-sm text-danger">{lineItemsError}</p>}
        {!lineItemsLoading && !lineItemsError && lineItems.length === 0 && (
          <Body muted className="p-4 text-center">
            Nothing to price yet — add hotels, activities or transport on the Itinerary tab.
          </Body>
        )}
        {lineItems.map((item) => {
          const showDayHeader = item.dayNumber !== groupedDay;
          groupedDay = item.dayNumber;
          return (
            <div key={item.uid}>
              {showDayHeader && (
                <div className="border-b border-border bg-muted/20 px-3 py-1">
                  <Caption className="text-[11px]">Day {item.dayNumber}</Caption>
                </div>
              )}
              <LineItemRow item={item} onSave={handleSaveLineItemDiscount} />
            </div>
          );
        })}
      </div>

      {pricingWarnings.length > 0 && (
        <div className="rounded border border-warning/40 bg-warning/10 p-2 text-xs text-warning">
          {pricingWarnings.map((w, i) => <div key={i}>{w}</div>)}
        </div>
      )}

      {/* Overall pricing: tax (type + auto-filled, overridable rate), TCS,
          one overall discount on top of every item's own, and an optional
          display currency. Applies on top of the item table's subtotal
          above. */}
      <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
        <Caption>Pricing settings</Caption>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            label="Tax type"
            options={activeTaxProfiles.map((t) => ({ value: t.uid, label: t.displayName }))}
            value={pricingForm.taxProfileUid}
            onChange={(e) => {
              const uid = e.target.value;
              const profile = activeTaxProfiles.find((t) => t.uid === uid);
              setPricingForm((f) => ({ ...f, taxProfileUid: uid, taxRateOverride: profile ? String(profile.ratePercent) : "" }));
            }}
            placeholder="No tax"
          />
          <TextInput
            label="Tax rate (%)"
            type="number"
            min={0}
            step="0.001"
            value={pricingForm.taxRateOverride}
            disabled={!pricingForm.taxProfileUid}
            onChange={(e) => setPricingForm((f) => ({ ...f, taxRateOverride: e.target.value }))}
            placeholder="Select a tax type first"
          />
          <TextInput
            label="TCS rate (%)"
            type="number"
            min={0}
            step="0.01"
            value={pricingForm.tcsRatePercent}
            onChange={(e) => setPricingForm((f) => ({ ...f, tcsRatePercent: e.target.value }))}
            placeholder="No TCS"
          />
          <Select
            label="Overall discount type"
            options={[
              { value: "none", label: "None" },
              { value: "percent", label: "Percent" },
              { value: "flat", label: "Flat" },
            ]}
            value={pricingForm.discountType}
            onChange={(e) => setPricingForm((f) => ({ ...f, discountType: e.target.value }))}
          />
          {pricingForm.discountType !== "none" && (
            <TextInput
              label="Overall discount value"
              type="number"
              min={0}
              step="0.01"
              value={pricingForm.discountValue}
              onChange={(e) => setPricingForm((f) => ({ ...f, discountValue: e.target.value }))}
            />
          )}
          <Select
            label="Display currency"
            options={currencies.map((c) => ({ value: c.code, label: `${c.code} — ${c.name}` }))}
            value={pricingForm.displayCurrencyCode}
            onChange={(e) => setPricingForm((f) => ({ ...f, displayCurrencyCode: e.target.value }))}
            placeholder="INR only"
          />
          {pricingForm.displayCurrencyCode && pricingForm.displayCurrencyCode !== "INR" && (
            <TextInput
              label={`1 INR = ? ${pricingForm.displayCurrencyCode}`}
              type="number"
              min={0}
              step="0.0001"
              value={pricingForm.fxRateSnapshot}
              onChange={(e) => setPricingForm((f) => ({ ...f, fxRateSnapshot: e.target.value }))}
            />
          )}
        </div>
        <Button size="sm" className="self-start" disabled={busy} loading={savingPricing} loadingText="Saving…" onClick={handleSavePricing}>
          Save pricing
        </Button>
      </div>

      {/* Totals — everything above rolled up. */}
      <div className="ml-auto flex w-full max-w-xs flex-col gap-1 rounded-lg border border-border p-3 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatInr(quote.subtotalInr)}</span></div>
        {quote.taxAmountInr != null && quote.taxAmountInr > 0 && (
          <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{formatInr(quote.taxAmountInr)}</span></div>
        )}
        {quote.tcsAmountInr != null && quote.tcsAmountInr > 0 && (
          <div className="flex justify-between"><span className="text-muted-foreground">TCS</span><span>{formatInr(quote.tcsAmountInr)}</span></div>
        )}
        {quote.discountType !== "none" && (
          <div className="flex justify-between"><span className="text-muted-foreground">Overall discount</span><span>−{quote.discountValue ?? 0}{quote.discountType === "percent" ? "%" : ""}</span></div>
        )}
        <div className="flex justify-between border-t border-border pt-1 text-base font-semibold"><span>Total</span><span>{formatInr(quote.totalInr)}</span></div>
        {paxCount > 0 && quote.totalInr != null && (
          <div className="flex justify-between text-xs text-muted-foreground"><span>Per traveller ({paxCount})</span><span>{formatInr(quote.totalInr / paxCount)}</span></div>
        )}
      </div>

      {/* Template + generate — this is a live document: change the
          template and click Generate again for a fresh PDF, as many times
          as needed. */}
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-lg border border-border p-3">
        <div className="max-w-xs flex-1">
          <Select
            label="Template"
            options={templates.map((t) => ({ value: t.id, label: t.name }))}
            value={templateChoice}
            onChange={(e) => handleTemplateChange(e.target.value)}
            placeholder="Org default"
          />
        </div>
        <Button variant="secondary" onClick={() => setShowPreview(true)}>Generate</Button>
      </div>

      {showPreview && (
        <QuotationPreviewModal
          open
          onClose={() => setShowPreview(false)}
          title="Quotation preview"
          src={`/api/escapes/${escapeUid}/quotation-preview${templateChoice ? `?templateUid=${templateChoice}` : ""}`}
          canSendEmail
        />
      )}
    </div>
  );
}
