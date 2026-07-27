"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Body, Caption } from "@/components/ui/Typography";
import type { BankAccount } from "@/lib/bank-accounts";

const emptyForm = {
  accountName: "",
  accountNumber: "",
  bankName: "",
  bankShortName: "",
  branchName: "",
  ifsc: "",
  swiftCode: "",
  micrCode: "",
  country: "",
  branchState: "",
  branchCity: "",
  branchAddress: "",
  currency: "",
};

export function BankAccountsPanel({ orgId, accounts }: { orgId: number; accounts: BankAccount[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  function update<K extends keyof typeof emptyForm>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(undefined);
    try {
      const res = await fetch("/api/bank-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, ...form }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "Failed to add account");
      }
      setForm(emptyForm);
      setShowForm(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add account");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(accountId: number) {
    await fetch("/api/bank-accounts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId, accountId }),
    });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {accounts.length === 0 && !showForm && <Body muted>No bank accounts added yet.</Body>}
        {accounts.map((account) => (
          <Card key={account.id} className="flex items-center justify-between">
            <div>
              <Body className="font-medium">{account.bankName} · {account.accountName}</Body>
              <Caption>{account.accountNumber} · {account.branchCity}, {account.country} · {account.currency}</Caption>
            </div>
            <Button variant="danger" size="sm" onClick={() => handleDelete(account.id)}>
              Remove
            </Button>
          </Card>
        ))}
      </div>

      {!showForm && (
        <Button variant="secondary" className="self-start" onClick={() => setShowForm(true)}>
          Add bank account
        </Button>
      )}

      {showForm && (
        <Card>
          <form onSubmit={handleAdd} className="grid grid-cols-2 gap-4">
            <TextInput label="Account name" value={form.accountName} onChange={(e) => update("accountName", e.target.value)} required />
            <TextInput label="Account number" value={form.accountNumber} onChange={(e) => update("accountNumber", e.target.value)} required />
            <TextInput label="Bank name" value={form.bankName} onChange={(e) => update("bankName", e.target.value)} required />
            <TextInput label="Bank short name" value={form.bankShortName} onChange={(e) => update("bankShortName", e.target.value)} required />
            <TextInput label="Branch name" value={form.branchName} onChange={(e) => update("branchName", e.target.value)} required />
            <TextInput label="IFSC" value={form.ifsc} onChange={(e) => update("ifsc", e.target.value)} required />
            <TextInput label="SWIFT code" value={form.swiftCode} onChange={(e) => update("swiftCode", e.target.value)} />
            <TextInput label="MICR code" value={form.micrCode} onChange={(e) => update("micrCode", e.target.value)} />
            <TextInput label="Country" value={form.country} onChange={(e) => update("country", e.target.value)} required />
            <TextInput label="Branch state" value={form.branchState} onChange={(e) => update("branchState", e.target.value)} required />
            <TextInput label="Branch city" value={form.branchCity} onChange={(e) => update("branchCity", e.target.value)} required />
            <TextInput label="Currency" value={form.currency} onChange={(e) => update("currency", e.target.value.toUpperCase())} required maxLength={3} />
            <TextInput label="Branch address" value={form.branchAddress} onChange={(e) => update("branchAddress", e.target.value)} className="col-span-2" />

            {error && <p className="col-span-2 text-sm text-danger">{error}</p>}

            <div className="col-span-2 flex gap-2">
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save account"}</Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
