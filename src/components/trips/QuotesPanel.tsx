"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Body, Caption } from "@/components/ui/Typography";
import type { Quote } from "@/lib/quotes";

const emptyForm = {
  currencyCode: "USD",
  subtotalUsd: "",
  taxAmountUsd: "",
  totalUsd: "",
  discountType: "none",
  discountValue: "",
  validUntil: "",
};

// Pricing fields are plain caller-entered values this phase — real tax/FX
// computation is Phase 5's Quotation Engine, not wired in here yet.
export function QuotesPanel({ itineraryUid }: { itineraryUid: string }) {
  const [quotes, setQuotes] = useState<Quote[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itineraryUid]);

  async function load() {
    const res = await fetch(`/api/quotes?itineraryUid=${itineraryUid}`);
    setQuotes(await res.json());
  }

  function update<K extends keyof typeof emptyForm>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itineraryUid,
          currencyCode: form.currencyCode || null,
          subtotalUsd: form.subtotalUsd ? Number(form.subtotalUsd) : null,
          taxAmountUsd: form.taxAmountUsd ? Number(form.taxAmountUsd) : null,
          totalUsd: form.totalUsd ? Number(form.totalUsd) : null,
          discountType: form.discountType,
          discountValue: form.discountValue ? Number(form.discountValue) : null,
          validUntil: form.validUntil || null,
        }),
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
            <div key={q.uid} className="flex items-center justify-between rounded border border-border px-3 py-2 text-sm">
              <span>
                <Badge tone={q.status === "accepted" ? "success" : q.status === "superseded" ? "neutral" : "neutral"}>
                  v{q.version} · {q.status}
                </Badge>{" "}
                {q.totalUsd != null ? `$${q.totalUsd.toFixed(2)} USD` : "No total set"}
                {q.validUntil && <span className="text-muted-foreground"> · valid until {q.validUntil}</span>}
              </span>
              <div className="flex gap-2">
                <button type="button" onClick={() => handleRevise(q.uid)} disabled={busy} className="text-primary hover:underline">Revise</button>
                <button type="button" onClick={() => handleDelete(q.uid)} disabled={busy} className="text-danger hover:underline">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded border border-border p-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <TextInput label="Currency" value={form.currencyCode} onChange={(e) => update("currencyCode", e.target.value.toUpperCase())} maxLength={3} />
            <TextInput label="Subtotal (USD)" type="number" min={0} step="0.01" value={form.subtotalUsd} onChange={(e) => update("subtotalUsd", e.target.value)} />
            <TextInput label="Tax (USD)" type="number" min={0} step="0.01" value={form.taxAmountUsd} onChange={(e) => update("taxAmountUsd", e.target.value)} />
            <TextInput label="Total (USD)" type="number" min={0} step="0.01" value={form.totalUsd} onChange={(e) => update("totalUsd", e.target.value)} />
            <Select
              label="Discount type"
              options={[
                { value: "none", label: "None" },
                { value: "percent", label: "Percent" },
                { value: "flat", label: "Flat" },
              ]}
              value={form.discountType}
              onChange={(e) => update("discountType", e.target.value)}
            />
            <TextInput label="Discount value" type="number" min={0} step="0.01" value={form.discountValue} onChange={(e) => update("discountValue", e.target.value)} />
            <TextInput label="Valid until" type="date" value={form.validUntil} onChange={(e) => update("validUntil", e.target.value)} />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" size="sm" disabled={busy}>{busy ? "Saving…" : "Save quote"}</Button>
        </form>
      )}
    </div>
  );
}
