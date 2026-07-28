"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Badge } from "@/components/ui/Badge";
import { Body, Caption } from "@/components/ui/Typography";
import type { Deal } from "@/lib/deals";
import type { PaymentMilestone } from "@/lib/payment-milestones";

const emptyForm = { label: "", dueDate: "", amountUsd: "" };

export function DealPanel({ deal }: { deal: Deal }) {
  const [milestones, setMilestones] = useState<PaymentMilestone[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [payAmounts, setPayAmounts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deal.uid]);

  async function load() {
    const res = await fetch(`/api/payment-milestones?dealUid=${deal.uid}`);
    setMilestones(await res.json());
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      const res = await fetch("/api/payment-milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealUid: deal.uid,
          label: form.label,
          dueDate: form.dueDate,
          amountUsd: Number(form.amountUsd),
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.message ?? "Failed to add milestone");
      setForm(emptyForm);
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add milestone");
    } finally {
      setBusy(false);
    }
  }

  async function handleRecordPayment(uid: string) {
    const amount = Number(payAmounts[uid]);
    if (!amount || amount <= 0) return;
    setBusy(true);
    try {
      await fetch(`/api/payment-milestones/${uid}/record-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      setPayAmounts((p) => ({ ...p, [uid]: "" }));
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(uid: string) {
    setBusy(true);
    try {
      await fetch(`/api/payment-milestones/${uid}`, { method: "DELETE" });
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Caption>Deal &amp; payment milestones</Caption>
        <Badge tone="success">{deal.status}</Badge>
      </div>

      {milestones === null && <Body muted>Loading…</Body>}
      {milestones !== null && milestones.length === 0 && !showForm && (
        <Body muted>No payment milestones yet.</Body>
      )}

      {milestones && milestones.length > 0 && (
        <div className="flex flex-col gap-2">
          {milestones.map((m) => (
            <div
              key={m.uid}
              className="flex flex-col gap-2 rounded border border-border px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <span>
                <Badge
                  tone={
                    m.status === "paid"
                      ? "success"
                      : m.status === "overdue"
                      ? "danger"
                      : m.status === "partially_paid"
                      ? "warning"
                      : "neutral"
                  }
                >
                  {m.status}
                </Badge>{" "}
                <span className="font-medium text-foreground">{m.label}</span>{" "}
                <span className="text-muted-foreground">
                  due {m.dueDate} · ${m.amountPaidUsd.toFixed(2)} / ${m.amountUsd.toFixed(2)} USD
                </span>
              </span>
              {m.status !== "paid" && (
                <div className="flex items-center gap-2">
                  <TextInput
                    label=""
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Amount"
                    value={payAmounts[m.uid] ?? ""}
                    onChange={(e) => setPayAmounts((p) => ({ ...p, [m.uid]: e.target.value }))}
                    className="w-28"
                  />
                  <Button size="sm" disabled={busy} onClick={() => handleRecordPayment(m.uid)}>
                    Record payment
                  </Button>
                  <button type="button" onClick={() => handleDelete(m.uid)} disabled={busy} className="text-danger hover:underline">
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center border-t border-border pt-3">
        <Button size="sm" variant="secondary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : "Add milestone"}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="grid grid-cols-1 gap-3 rounded border border-border p-3 sm:grid-cols-3">
          <TextInput label="Label" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} required />
          <TextInput label="Due date" type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} required />
          <TextInput
            label="Amount (USD)"
            type="number"
            min={0}
            step="0.01"
            value={form.amountUsd}
            onChange={(e) => setForm((f) => ({ ...f, amountUsd: e.target.value }))}
            required
          />
          {error && <p className="col-span-full text-sm text-danger">{error}</p>}
          <Button type="submit" size="sm" disabled={busy} className="col-span-full sm:col-span-1">
            {busy ? "Saving…" : "Save milestone"}
          </Button>
        </form>
      )}
    </Card>
  );
}
