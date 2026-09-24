"use client";

import { cn } from "@/lib/cn";
import type { ReactNode } from "react";
import { IoSendOutline, IoCloseCircleOutline, IoCheckmarkCircleOutline, IoSearchOutline, IoCheckmark, IoDocumentTextOutline } from "react-icons/io5";
import { LuLayoutTemplate } from "react-icons/lu";
import { Modal } from "@/components/ui/Modal";
import { FaRegTrashCan } from "react-icons/fa6";
import { useEffect, useRef, useMemo, useState } from "react";
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
  deleteQuote,
  setQuoteTemplate,
  markQuoteSent,
  markQuoteRejected,
  computeQuote,
  updateQuoteValidUntil,
} from "@/features/quotes/quotesThunks";
import { selectQuotesForItinerary, selectQuotesStatus } from "@/features/quotes/quotesSelectors";
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
  // The % / ₹ unit is remembered separately so it can be chosen before a
  // number is typed; the draft only carries it while the field is non-empty.
  const [unit, setUnit] = useState<"percent" | "flat">(item.discountType === "flat" ? "flat" : "percent");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Set on every user edit, cleared when a save is sent: a refresh of `item`
  // (after our own save) must not clobber something typed since.
  const editedRef = useRef(false);

  useEffect(() => {
    if (editedRef.current) return;
    setDraft(toDraft(item));
    setUnit(item.discountType === "flat" ? "flat" : "percent");
  }, [item]);

  const dirty = draft.discountType !== item.discountType || draft.discountValue !== (item.discountValue != null ? String(item.discountValue) : "");

  // Saves itself shortly after the last edit — no confirm button.
  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(handleSave, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  async function handleSave() {
    editedRef.current = false;
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

  return (
    <div className="grid grid-cols-12 items-center gap-x-6 border-b border-border px-4 py-3 text-sm last:border-0">
      <div className="col-span-5 min-w-0">
        <span className="block truncate text-base font-medium text-foreground">{item.label}</span>
        <span className="text-xs text-muted-foreground">
          {ITEM_TYPE_LABEL[item.itemType] ?? item.itemType}
          {item.cancellation && <span className="text-danger"> · cancellation charge</span>}
        </span>
      </div>
      <div className="col-span-2 text-right text-foreground">{formatInr(item.baseAmountInr)}</div>
      <div className="col-span-3 flex items-center justify-center gap-1">
        {/* Number field with both units shown at its end; the active one is
            filled. An empty field means no discount. */}
        <div className="flex h-9 w-28 items-center rounded-full border border-border bg-card pl-3 pr-1 shadow-sm transition-colors hover:border-primary/40 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <input
            type="number"
            min={0}
            step="0.01"
            value={draft.discountValue}
            onChange={(e) => {
              const value = e.target.value;
              editedRef.current = true;
              setDraft({ discountValue: value, discountType: value === "" ? "none" : unit });
            }}
            placeholder="0"
            aria-label="Discount"
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-60"
          />
          <div className="flex shrink-0 items-center gap-0.5">
            {([["percent", "%"], ["flat", "₹"]] as const).map(([type, symbol]) => (
              <button
                key={type}
                type="button"
                disabled={saving}
                aria-pressed={unit === type}
                title={type === "percent" ? "Percent" : "Rupees"}
                onClick={() => {
                  setUnit(type);
                  editedRef.current = true;
                  setDraft((d) => (d.discountValue === "" ? d : { ...d, discountType: type }));
                }}
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-colors disabled:opacity-60",
                  unit === type ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70",
                )}
              >
                {symbol}
              </button>
            ))}
          </div>
        </div>
        {saving && <Spinner size="sm" />}
      </div>
      <div className="col-span-2 text-right font-medium text-foreground">{formatInr(item.finalAmountInr)}</div>
      {error && <div className="col-span-12 text-xs text-danger">{error}</div>}
    </div>
  );
}

// Round icon-only action for the header row; the label is its tooltip and
// accessible name.
function HeaderIconButton({
  label,
  tone = "neutral",
  disabled,
  onClick,
  children,
}: {
  label: string;
  tone?: "neutral" | "primary" | "danger";
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        tone === "primary" && "border-primary bg-primary text-primary-foreground hover:opacity-90",
        tone === "danger" && "border-border text-danger hover:bg-danger/10",
        tone === "neutral" && "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function QuotesPanel({
  itineraryUid,
  escapeUid,
  onDealChanged,
  selectedQuoteUid = null,
  onSelectQuote,
}: {
  itineraryUid: string;
  escapeUid: string;
  onDealChanged?: () => void;
  /** Which quote is being worked on — shared with the right rail's Quotes list. */
  selectedQuoteUid?: string | null;
  onSelectQuote?: (uid: string | null) => void;
}) {
  const dispatch = useAppDispatch();
  const quotes = useAppSelector((s) => selectQuotesForItinerary(s, itineraryUid));
  const quotesStatus = useAppSelector((s) => selectQuotesStatus(s, itineraryUid));
  const taxProfiles = useAppSelector(selectTaxProfiles);
  const templates = useAppSelector(selectQuoteTemplates);
  const currentEscape = useAppSelector(selectCurrentEscape);

  // Quotes are already newest-version-first from the backend? Not
  // guaranteed — sort defensively so "latest" always means the highest
  // version number, matching how Revise/supersede works.
  const orderedQuotes = useMemo(() => [...quotes].sort((a, b) => b.version - a.version), [quotes]);

  const [localSelectedUid, setLocalSelectedUid] = useState<string | null>(null);
  const selectedUid = onSelectQuote ? selectedQuoteUid : localSelectedUid;
  const setSelectedUid = onSelectQuote ?? setLocalSelectedUid;
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
  const [discountUnit, setDiscountUnit] = useState<"percent" | "flat">("percent");
  const [savingPricing, setSavingPricing] = useState(false);

  const [templateChoice, setTemplateChoice] = useState("");
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [confirmStaleSend, setConfirmStaleSend] = useState(false);
  const [templateSearch, setTemplateSearch] = useState("");
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
      const form = pricingFormFrom(res.data.quote);
      lastSavedPricing.current = JSON.stringify(form);
      setPricingForm(form);
      setDiscountUnit(res.data.quote.discountType === "flat" ? "flat" : "percent");
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

  // Tax / currency / overall discount save themselves shortly after the last
  // edit (no button). `lastSavedPricing` is the snapshot the server already
  // has; the form is never reloaded from the response so typing isn't clobbered.
  const lastSavedPricing = useRef("");

  async function savePricing(form: typeof emptyPricingForm) {
    if (!quote) return;
    setSavingPricing(true);
    setActionError(undefined);
    try {
      await dispatch(
        computeQuote({
          uid: quote.uid,
          itineraryUid,
          taxProfileUid: form.taxProfileUid || null,
          taxRatePercentOverride: form.taxProfileUid && form.taxRateOverride ? Number(form.taxRateOverride) : null,
          tcsRatePercent: form.tcsRatePercent ? Number(form.tcsRatePercent) : null,
          discountType: form.discountType,
          discountValue: form.discountValue ? Number(form.discountValue) : null,
          displayCurrencyCode: form.displayCurrencyCode || null,
          fxRateSnapshot: form.fxRateSnapshot ? Number(form.fxRateSnapshot) : null,
        }),
      ).unwrap();
      lastSavedPricing.current = JSON.stringify(form);
      const res = await clientApi.get<QuoteLineItemsResult>(`/quotes/${quote.uid}/line-items`);
      setLiveQuote(res.data.quote);
      setLineItems(res.data.lineItems);
      setPricingWarnings(res.data.pricingWarnings ?? []);
      refreshList();
    } catch (err) {
      setActionError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to save pricing"));
    } finally {
      setSavingPricing(false);
    }
  }

  useEffect(() => {
    if (!quote || lastSavedPricing.current === "" || JSON.stringify(pricingForm) === lastSavedPricing.current) return;
    const t = setTimeout(() => savePricing(pricingForm), 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pricingForm]);

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

  // Generating opens the preview and records "generated now" on the quote, so
  // Send unlocks and later edits can be flagged as not yet in the generated copy.
  async function handleGenerate() {
    if (!quote) return;
    setShowPreview(true);
    try {
      const res = await clientApi.post<QuoteLineItemsResult>(`/quotes/${quote.uid}/mark-generated`);
      setLiveQuote(res.data.quote);
      setLineItems(res.data.lineItems);
      refreshList();
    } catch (err) {
      setActionError(extractErrorMessage(err, "Failed to record generation"));
    }
  }

  // Sending a stale copy is allowed but never silent.
  function handleSendClick() {
    if (quote?.changedSinceGenerated) setConfirmStaleSend(true);
    else handleMarkSent();
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
      <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
        <div className="flex flex-nowrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex min-w-0 flex-col">
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Quote</span>
              <span className="truncate text-sm font-semibold text-foreground">{quote.name ?? "Untitled quote"}</span>
            </div>
            <Badge tone={STATUS_TONE[quote.status] ?? "neutral"} className="shrink-0">{quote.status}</Badge>
          </div>
          <div className="w-48 shrink-0">
            <DatePicker
              value={quote.validUntil ?? ""}
              onChange={handleValidUntilChange}
              placeholder="Set valid until"
              prefix="Valid until"
              showIcon
              className="h-8 rounded-full bg-card px-3 text-sm shadow-sm hover:border-primary/40"
            />
          </div>
        </div>
        <div className="flex flex-nowrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              disabled={busy}
              title="Change template"
              onClick={() => {
                setTemplateSearch("");
                setShowTemplatePicker(true);
              }}
              className="flex h-8 w-48 shrink-0 items-center gap-2 rounded-full border border-border bg-card px-3 text-left text-sm text-foreground shadow-sm transition-colors hover:border-primary/40 disabled:opacity-60"
            >
              <LuLayoutTemplate className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="truncate">{templates.find((t) => t.id === templateChoice)?.name ?? "Org default"}</span>
            </button>
            <HeaderIconButton label="Generate quotation" disabled={busy} onClick={handleGenerate}>
              <IoDocumentTextOutline size={16} />
            </HeaderIconButton>
            {quote.status === "draft" && (
              <HeaderIconButton
                label={quote.generatedAt ? "Mark as sent" : "Generate the quote before sending"}
                disabled={busy || !quote.generatedAt}
                onClick={handleSendClick}
              >
                <IoSendOutline size={16} />
              </HeaderIconButton>
            )}
            {(quote.status === "draft" || quote.status === "sent") && (
              <HeaderIconButton label="Mark as rejected" disabled={busy} onClick={handleMarkRejected}><IoCloseCircleOutline size={18} /></HeaderIconButton>
            )}
            {quote.status !== "accepted" && quote.status !== "rejected" && (
              <HeaderIconButton label="Accept quote" tone="primary" disabled={busy} onClick={handleAccept}><IoCheckmarkCircleOutline size={18} /></HeaderIconButton>
            )}
            <HeaderIconButton label="Delete" tone="danger" disabled={busy} onClick={handleDelete}><FaRegTrashCan size={14} /></HeaderIconButton>
            {quote.generatedAt && quote.changedSinceGenerated && (
              <Badge tone="warning" className="shrink-0">Changed since generated</Badge>
            )}
          </div>
          <Caption className="shrink-0 self-end whitespace-nowrap text-[10px] leading-none">
            Created {formatDisplayDateTime(quote.createdAt)} by {formatAuditActor(quote.createdByName)}
          </Caption>
        </div>
        {actionError && <p className="text-sm text-danger">{actionError}</p>}
      </div>

      {/* The itinerary, day-wise, priced — each row an itinerary item with
          its own discount. This is what "building the quote" actually is:
          the same items from the Itinerary tab, now priced and discountable. */}
      <div className="rounded-lg border border-border bg-card">
        <div className="grid grid-cols-12 gap-x-6 border-b border-border px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <div className="col-span-5">Item</div>
          <div className="col-span-2 text-right">Base price</div>
          <div className="col-span-3 text-center">Discount</div>
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
                <div className="border-b border-border px-3 py-1">
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

      {/* Totals — everything above rolled up. */}
      <div className="grid w-full grid-cols-1 gap-6 rounded-lg border border-border bg-card p-4 text-sm font-semibold md:grid-cols-2 md:gap-0">
        {/* Left: tax. Pick a library tax type; its rate fills in and can be overridden. */}
        <div className="flex flex-col gap-3 md:pr-6">
          <Caption>Tax details</Caption>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Tax type</span>
          <div className="w-56 [&_label]:sr-only">
            <Select
              label="Tax type"
              className="bg-card font-semibold shadow-sm"
              options={activeTaxProfiles.map((t) => ({ value: t.uid, label: t.displayName }))}
              value={pricingForm.taxProfileUid}
              onChange={(e) => {
                const uid = e.target.value;
                const profile = activeTaxProfiles.find((t) => t.uid === uid);
                setPricingForm((f) => ({ ...f, taxProfileUid: uid, taxRateOverride: profile ? String(profile.ratePercent) : "" }));
              }}
              placeholder="No tax"
            />
          </div>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Tax rate (%)</span>
          <div className="w-56 [&_label]:sr-only">
            <TextInput
              label="Tax rate (%)"
              className="bg-card font-semibold shadow-sm disabled:bg-muted/50"
              type="number"
              min={0}
              step="0.001"
              value={pricingForm.taxRateOverride}
              disabled={!pricingForm.taxProfileUid}
              onChange={(e) => setPricingForm((f) => ({ ...f, taxRateOverride: e.target.value }))}
              placeholder="Select a tax type first"
            />
          </div>
        </div>
        </div>

        {/* Right: the running totals, separated from tax by a vertical line. */}
        <div className="flex flex-col gap-2 border-border md:border-l md:pl-6">
          <Caption>Summary</Caption>
        <div className="flex justify-between"><span className="text-muted-foreground">Subtotal{savingPricing && <Spinner size="sm" />}</span><span>{formatInr(quote.subtotalInr)}</span></div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Overall discount</span>
          <div className="flex h-9 w-28 items-center rounded-full border border-border bg-card pl-3 pr-1 shadow-sm transition-colors hover:border-primary/40 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            <input
              type="number"
              min={0}
              step="0.01"
              value={pricingForm.discountValue}
              onChange={(e) => {
                const value = e.target.value;
                setPricingForm((f) => ({ ...f, discountValue: value, discountType: value === "" ? "none" : discountUnit }));
              }}
              placeholder="0"
              aria-label="Overall discount"
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground"
            />
            <div className="flex shrink-0 items-center gap-0.5">
              {([["percent", "%"], ["flat", "₹"]] as const).map(([type, symbol]) => (
                <button
                  key={type}
                  type="button"
                  aria-pressed={discountUnit === type}
                  title={type === "percent" ? "Percent" : "Rupees"}
                  onClick={() => {
                    setDiscountUnit(type);
                    setPricingForm((f) => (f.discountValue === "" ? f : { ...f, discountType: type }));
                  }}
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                    discountUnit === type ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70",
                  )}
                >
                  {symbol}
                </button>
              ))}
            </div>
          </div>
        </div>
        {quote.taxAmountInr != null && quote.taxAmountInr > 0 && (
          <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{formatInr(quote.taxAmountInr)}</span></div>
        )}
        {quote.tcsAmountInr != null && quote.tcsAmountInr > 0 && (
          <div className="flex justify-between"><span className="text-muted-foreground">TCS</span><span>{formatInr(quote.tcsAmountInr)}</span></div>
        )}
        <div className="flex justify-between border-t border-border pt-1 text-base font-semibold"><span>Total</span><span>{formatInr(quote.totalInr)}</span></div>
        {paxCount > 0 && quote.totalInr != null && (
          <div className="flex justify-between text-xs text-muted-foreground"><span>Per traveller ({paxCount})</span><span>{formatInr(quote.totalInr / paxCount)}</span></div>
        )}
        </div>
      </div>

      <Modal open={confirmStaleSend} onClose={() => setConfirmStaleSend(false)} title="Quote has changed">
        <div className="flex flex-col items-center gap-4 text-center">
          <Body>
            This quote has changed since it was last generated, so the generated copy is out of date. Regenerate it to send the latest, or send the older copy as it is.
          </Body>
          <div className="flex justify-center gap-2">
            <Button variant="ghost" onClick={() => setConfirmStaleSend(false)}>Cancel</Button>
            <Button
              variant="secondary"
              onClick={() => {
                setConfirmStaleSend(false);
                handleMarkSent();
              }}
            >
              Send old copy
            </Button>
            <Button
              onClick={() => {
                setConfirmStaleSend(false);
                handleGenerate();
              }}
            >
              Regenerate
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={showTemplatePicker} onClose={() => setShowTemplatePicker(false)} title="Choose template">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <IoSearchOutline className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
            <input
              autoFocus
              value={templateSearch}
              onChange={(e) => setTemplateSearch(e.target.value)}
              placeholder="Search templates…"
              className="h-9 w-full rounded border border-border bg-card pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="show-scrollbar flex max-h-72 flex-col gap-1.5 overflow-y-auto">
            {[{ id: "", name: "Org default", description: "The organisation's default template" }, ...templates]
              .filter((t) => t.name.toLowerCase().includes(templateSearch.trim().toLowerCase()))
              .map((t) => {
                const selected = templateChoice === t.id;
                return (
                  <button
                    key={t.id || "default"}
                    type="button"
                    onClick={async () => {
                      setShowTemplatePicker(false);
                      await handleTemplateChange(t.id);
                    }}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition-colors",
                      selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
                    )}
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium text-foreground">{t.name}</span>
                      {t.description && <span className="truncate text-xs text-muted-foreground">{t.description}</span>}
                    </span>
                    {selected && <IoCheckmark className="shrink-0 text-primary" size={16} />}
                  </button>
                );
              })}
            {templates.length > 0 &&
              ![{ name: "Org default" }, ...templates].some((t) => t.name.toLowerCase().includes(templateSearch.trim().toLowerCase())) && (
                <p className="py-2 text-center text-sm text-muted-foreground">No templates match &quot;{templateSearch}&quot;.</p>
              )}
          </div>
        </div>
      </Modal>

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
