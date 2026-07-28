"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Body, Caption } from "@/components/ui/Typography";
import type { Quote } from "@/lib/quotes";
import type { TaxProfile } from "@/lib/tax-profiles";
import type { SupportedCurrency } from "@/lib/currencies";
import type { QuoteTemplate } from "@/lib/quote-templates";

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
  tripId,
  onDealChanged,
}: {
  itineraryUid: string;
  tripId: number;
  onDealChanged?: () => void;
}) {
  const [quotes, setQuotes] = useState<Quote[] | null>(null);
  const [taxProfiles, setTaxProfiles] = useState<TaxProfile[]>([]);
  const [currencies, setCurrencies] = useState<SupportedCurrency[]>([]);
  const [templates, setTemplates] = useState<QuoteTemplate[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [dealExists, setDealExists] = useState(false);

  const [computingUid, setComputingUid] = useState<string | null>(null);
  const [computeForm, setComputeForm] = useState(emptyComputeForm);
  const [computeWarnings, setComputeWarnings] = useState<string[] | null>(null);

  useEffect(() => {
    load();
    fetch("/api/tax-profiles").then((r) => r.json()).then((all: TaxProfile[]) => setTaxProfiles(all.filter((t) => t.status === "active"))).catch(() => setTaxProfiles([]));
    fetch("/api/currencies").then((r) => r.json()).then(setCurrencies).catch(() => setCurrencies([]));
    fetch("/api/quote-templates").then((r) => r.json()).then(setTemplates).catch(() => setTemplates([]));
    fetch(`/api/deals?tripId=${tripId}`).then((r) => setDealExists(r.ok)).catch(() => setDealExists(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itineraryUid, tripId]);

  async function load() {
    const res = await fetch(`/api/quotes?itineraryUid=${itineraryUid}`);
    setQuotes(await res.json());
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itineraryUid, validUntil: form.validUntil || null }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.message ?? "Failed to create quote");
      setForm(emptyForm);
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create quote");
    } finally {
      setBusy(false);
    }
  }

  async function handleRevise(uid: string) {
    setBusy(true);
    try {
      await fetch(`/api/quotes/${uid}/revise`, { method: "POST" });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(uid: string) {
    setBusy(true);
    try {
      await fetch(`/api/quotes/${uid}`, { method: "DELETE" });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function handleAccept(uid: string) {
    setBusy(true);
    setError(undefined);
    try {
      const res = await fetch(`/api/deals/accept-quote/${uid}`, { method: "POST" });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.message ?? "Failed to accept quote");
      setDealExists(true);
      onDealChanged?.();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept quote");
    } finally {
      setBusy(false);
    }
  }

  async function handleSetTemplate(uid: string, templateId: string) {
    setBusy(true);
    try {
      await fetch(`/api/quotes/${uid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: templateId || null }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  }

  function openCompute(uid: string) {
    setComputingUid(uid);
    setComputeForm(emptyComputeForm);
    setComputeWarnings(null);
  }

  async function handleCompute(uid: string) {
    setBusy(true);
    setError(undefined);
    try {
      const res = await fetch(`/api/quotes/${uid}/compute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taxProfileUid: computeForm.taxProfileUid || null,
          discountType: computeForm.discountType,
          discountValue: computeForm.discountValue ? Number(computeForm.discountValue) : null,
          displayCurrencyCode: computeForm.displayCurrencyCode || null,
          fxRateSnapshot: computeForm.fxRateSnapshot ? Number(computeForm.fxRateSnapshot) : null,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.message ?? "Failed to compute pricing");
      setComputeWarnings(body.pricingWarnings ?? []);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to compute pricing");
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

      {quotes === null && <Body muted>Loading…</Body>}
      {quotes !== null && quotes.length === 0 && !showForm && <Body muted>No quotes yet.</Body>}

      {quotes && quotes.length > 0 && (
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
                  {!dealExists && !["accepted", "superseded", "rejected"].includes(q.status) && (
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

              {computingUid === q.uid && (
                <div className="flex flex-col gap-3 rounded border border-border p-3">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <Select
                      label="Tax profile"
                      options={taxProfiles.map((t) => ({ value: t.uid, label: `${t.displayName} (${t.ratePercent}%)` }))}
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
                  <div className="flex gap-2">
                    <Button size="sm" disabled={busy} onClick={() => handleCompute(q.uid)}>{busy ? "Computing…" : "Compute"}</Button>
                    <Button size="sm" variant="ghost" onClick={() => setComputingUid(null)}>Close</Button>
                  </div>
                  {computeWarnings && computeWarnings.length > 0 && (
                    <div className="rounded border border-warning/40 bg-warning/10 p-2 text-xs text-warning">
                      {computeWarnings.map((w, i) => <div key={i}>{w}</div>)}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded border border-border p-3">
          <TextInput label="Valid until" type="date" value={form.validUntil} onChange={(e) => setForm({ validUntil: e.target.value })} />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" size="sm" disabled={busy}>{busy ? "Saving…" : "Save quote"}</Button>
        </form>
      )}
    </div>
  );
}
