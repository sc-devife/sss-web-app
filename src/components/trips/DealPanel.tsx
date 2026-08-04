"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Badge } from "@/components/ui/Badge";
import { Body, Caption } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import type { Deal } from "@/lib/deals";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchMilestonesForDeal, createPaymentMilestone, recordPayment, deletePaymentMilestone } from "@/features/paymentMilestones/paymentMilestonesThunks";
import { selectPaymentMilestones, selectPaymentMilestonesStatus, selectPaymentMilestonesError } from "@/features/paymentMilestones/paymentMilestonesSelectors";

const emptyForm = { label: "", dueDate: "", amountUsd: "" };

export function DealPanel({ deal }: { deal: Deal }) {
  const dispatch = useAppDispatch();
  const milestones = useAppSelector(selectPaymentMilestones);
  const status = useAppSelector(selectPaymentMilestonesStatus);
  const error = useAppSelector(selectPaymentMilestonesError);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [payAmounts, setPayAmounts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();

  useEffect(() => {
    dispatch(fetchMilestonesForDeal(deal.uid));
  }, [dispatch, deal.uid]);

  function refresh() {
    dispatch(fetchMilestonesForDeal(deal.uid));
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormError(undefined);
    try {
      await dispatch(
        createPaymentMilestone({
          dealUid: deal.uid,
          label: form.label,
          dueDate: form.dueDate,
          amountUsd: Number(form.amountUsd),
        }),
      ).unwrap();
      refresh();
      setForm(emptyForm);
      setShowForm(false);
    } catch (err) {
      setFormError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to add milestone"));
    } finally {
      setBusy(false);
    }
  }

  async function handleRecordPayment(uid: string) {
    const amount = Number(payAmounts[uid]);
    if (!amount || amount <= 0) return;
    setBusy(true);
    try {
      await dispatch(recordPayment({ uid, dealUid: deal.uid, amount }));
      setPayAmounts((p) => ({ ...p, [uid]: "" }));
      refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(uid: string) {
    setBusy(true);
    try {
      await dispatch(deletePaymentMilestone({ uid, dealUid: deal.uid }));
      refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Caption>Deal &amp; payment milestones</Caption>
        <div className="flex items-center gap-3">
          <a href={`/deals/${deal.uid}/invoice-preview`} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
            Invoice preview
          </a>
          <Badge tone="success">{deal.status}</Badge>
        </div>
      </div>

      {status === "loading" && milestones.length === 0 ? (
        <LoadingState />
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
        </>
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
          {formError && <p className="col-span-full text-sm text-danger">{formError}</p>}
          <Button type="submit" size="sm" disabled={busy} className="col-span-full sm:col-span-1">
            {busy ? "Saving…" : "Save milestone"}
          </Button>
        </form>
      )}
    </Card>
  );
}
