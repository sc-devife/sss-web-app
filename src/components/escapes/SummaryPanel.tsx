"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Select } from "@/components/ui/Select";
import { Body, Caption } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchQuotesForItinerary, computeQuote } from "@/features/quotes/quotesThunks";
import { selectQuotesForItinerary, selectQuotesStatus } from "@/features/quotes/quotesSelectors";
import { fetchTaxProfiles } from "@/features/taxProfiles/taxProfilesThunks";
import { selectTaxProfiles } from "@/features/taxProfiles/taxProfilesSelectors";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import type { PricingBreakdown } from "@/features/quotes/types";

function money(value: number | null | undefined) {
  return `₹${(value ?? 0).toFixed(2)}`;
}

// This tab never computes pricing itself — it's a thin display + controls
// layer over the SAME QuoteComputationService.compute() the Quote tab's
// "Compute pricing" action already calls (via the same computeQuote thunk),
// so the breakdown/subtotal/tax/discount/total shown here can never drift
// from what a quote actually prices. There's no separate calculation here.
export function SummaryPanel({ itineraryUid }: { itineraryUid: string }) {
  const dispatch = useAppDispatch();
  const quotes = useAppSelector((s) => selectQuotesForItinerary(s, itineraryUid));
  const quotesStatus = useAppSelector((s) => selectQuotesStatus(s, itineraryUid));
  const taxProfiles = useAppSelector(selectTaxProfiles);

  const [breakdown, setBreakdown] = useState<PricingBreakdown | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [taxProfileUid, setTaxProfileUid] = useState("");
  const [tcsRatePercent, setTcsRatePercent] = useState("");
  const [discountType, setDiscountType] = useState("none");
  const [discountValue, setDiscountValue] = useState("");

  useEffect(() => {
    dispatch(fetchQuotesForItinerary(itineraryUid));
    dispatch(fetchTaxProfiles());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itineraryUid]);

  // The quote this Summary reflects: the accepted one if there is one,
  // otherwise the most recently created quote that hasn't been rejected or
  // superseded (mirrors "what a customer would actually see"), falling back
  // to the most recent quote overall so Summary still shows something for
  // an itinerary whose only quote was rejected.
  const targetQuote = useMemo(() => {
    if (quotes.length === 0) return null;
    const byRecency = [...quotes].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return (
      byRecency.find((q) => q.status === "accepted") ??
      byRecency.find((q) => q.status !== "rejected" && q.status !== "superseded") ??
      byRecency[0]
    );
  }, [quotes]);

  // Takes the discount/tax values explicitly rather than reading them off
  // component state — called right after seeding that same state below,
  // where state setters haven't committed yet, so reading state here would
  // silently recompute with the PREVIOUS (often empty/default) values
  // instead of the quote's own saved discount/tax.
  async function recompute(uid: string, overrides?: { taxProfileUid: string; tcsRatePercent: string; discountType: string; discountValue: string }) {
    const effectiveTaxProfileUid = overrides?.taxProfileUid ?? taxProfileUid;
    const effectiveTcsRatePercent = overrides?.tcsRatePercent ?? tcsRatePercent;
    const effectiveDiscountType = overrides?.discountType ?? discountType;
    const effectiveDiscountValue = overrides?.discountValue ?? discountValue;
    setBusy(true);
    setError(undefined);
    try {
      const result = await dispatch(
        computeQuote({
          uid,
          itineraryUid,
          taxProfileUid: effectiveTaxProfileUid || null,
          tcsRatePercent: effectiveTcsRatePercent ? Number(effectiveTcsRatePercent) : null,
          discountType: effectiveDiscountType,
          discountValue: effectiveDiscountValue ? Number(effectiveDiscountValue) : null,
          displayCurrencyCode: null,
          fxRateSnapshot: null,
        }),
      ).unwrap();
      setBreakdown(result.breakdown);
      setWarnings(result.pricingWarnings ?? []);
      dispatch(fetchQuotesForItinerary(itineraryUid));
    } catch (err) {
      setError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to compute pricing"));
    } finally {
      setBusy(false);
    }
  }

  // "Always reflect the latest pricing": seed the controls from the target
  // quote's own last-saved discount/tax choice, then immediately recompute
  // against the itinerary's CURRENT items — so opening this tab always shows
  // fresh numbers even if hotels/activities/transport changed since the
  // quote was last computed.
  useEffect(() => {
    if (!targetQuote) return;
    const seeded = {
      taxProfileUid: targetQuote.taxProfileId ?? "",
      tcsRatePercent: targetQuote.tcsRatePercent != null ? String(targetQuote.tcsRatePercent) : "",
      discountType: targetQuote.discountType ?? "none",
      discountValue: targetQuote.discountValue != null ? String(targetQuote.discountValue) : "",
    };
    setTaxProfileUid(seeded.taxProfileUid);
    setTcsRatePercent(seeded.tcsRatePercent);
    setDiscountType(seeded.discountType);
    setDiscountValue(seeded.discountValue);
    recompute(targetQuote.uid, seeded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetQuote?.uid]);

  if (quotesStatus === "loading" && quotes.length === 0) {
    return <LoadingState label="Loading summary…" />;
  }

  if (!targetQuote) {
    return (
      <div className="flex items-center justify-center rounded border border-border py-10">
        <Body muted>No quote yet for this itinerary — add one from the Quote tab to see a pricing summary.</Body>
      </div>
    );
  }

  const q = targetQuote;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Caption>
          Pricing summary for {q.name ?? `v${q.version}`} <span className="text-muted-foreground">({q.status})</span>
        </Caption>
        <Button size="sm" variant="secondary" disabled={busy} loading={busy} loadingText="Recalculating…" onClick={() => recompute(q.uid)}>
          Recalculate
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded border border-border p-3">
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Breakdown</div>
          <dl className="flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between"><dt>Hotels</dt><dd>{money(breakdown?.hotelsInr)}</dd></div>
            <div className="flex justify-between"><dt>Activities</dt><dd>{money(breakdown?.activitiesInr)}</dd></div>
            <div className="flex justify-between"><dt>Transport</dt><dd>{money(breakdown?.transportInr)}</dd></div>
            <div className="flex justify-between"><dt>Other</dt><dd>{money(breakdown?.otherInr)}</dd></div>
          </dl>
        </div>

        <div className="rounded border border-border p-3">
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Totals</div>
          <dl className="flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{money(q.subtotalInr)}</dd></div>
            <div className="flex justify-between"><dt>Tax (GST)</dt><dd>{money(q.taxAmountInr)}</dd></div>
            <div className="flex justify-between"><dt>TCS{q.tcsRatePercent != null ? ` (${q.tcsRatePercent}%)` : ""}</dt><dd>{money(q.tcsAmountInr)}</dd></div>
            <div className="flex justify-between"><dt>Discount</dt><dd>-{money(q.discountValue)}</dd></div>
            <div className="flex justify-between border-t border-border pt-1.5 font-semibold text-foreground"><dt>Total</dt><dd>{money(q.totalInr)}</dd></div>
          </dl>
        </div>
      </div>

      <div className="rounded border border-border p-3">
        <div className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Update discount, GST &amp; TCS</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            label="Tax profile (GST)"
            options={taxProfiles.filter((t) => t.status === "active").map((t) => ({ value: t.uid, label: `${t.displayName} (${t.ratePercent}%)` }))}
            value={taxProfileUid}
            onChange={(e) => setTaxProfileUid(e.target.value)}
            placeholder="No tax"
          />
          <TextInput
            label="TCS rate (%)"
            type="number"
            min={0}
            step="0.01"
            value={tcsRatePercent}
            onChange={(e) => setTcsRatePercent(e.target.value)}
            placeholder="No TCS"
          />
          <Select
            label="Discount type"
            options={[
              { value: "none", label: "None" },
              { value: "percent", label: "Percent" },
              { value: "flat", label: "Flat" },
            ]}
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value)}
          />
          <TextInput
            label="Discount value"
            type="number"
            min={0}
            step="0.01"
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            disabled={discountType === "none"}
          />
        </div>
        <div className="mt-3">
          <Button size="sm" disabled={busy} loading={busy} loadingText="Saving…" onClick={() => recompute(q.uid)}>
            Save &amp; recalculate
          </Button>
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="rounded border border-warning/40 bg-warning/10 p-2 text-xs text-warning">
          {warnings.map((w, i) => <div key={i}>{w}</div>)}
        </div>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
