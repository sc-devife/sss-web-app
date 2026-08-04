"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Badge } from "@/components/ui/Badge";
import { Body, Caption } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchBankAccounts, createBankAccount, setBankAccountStatus } from "@/features/bankAccounts/bankAccountsThunks";
import { selectBankAccounts, selectBankAccountsStatus, selectBankAccountsError } from "@/features/bankAccounts/bankAccountsSelectors";
import { FaPlus } from "react-icons/fa";

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

export function BankAccountsPanel({ orgId }: { orgId: number }) {
  const dispatch = useAppDispatch();
  const accounts = useAppSelector(selectBankAccounts);
  const status = useAppSelector(selectBankAccountsStatus);
  const error = useAppSelector(selectBankAccountsError);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    dispatch(fetchBankAccounts(orgId));
  }, [dispatch, orgId]);

  function update<K extends keyof typeof emptyForm>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(undefined);
    try {
      await dispatch(createBankAccount({ orgId, payload: form })).unwrap();
      dispatch(fetchBankAccounts(orgId));
      setForm(emptyForm);
      setShowForm(false);
    } catch (err) {
      setFormError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to add account"));
    } finally {
      setSaving(false);
    }
  }

  async function handleSetStatus(accountId: number, action: "deactivate" | "reactivate") {
    setUpdatingId(accountId);
    try {
      await dispatch(setBankAccountStatus({ orgId, accountId, action }));
      dispatch(fetchBankAccounts(orgId));
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">

      {!showForm && (
        <Button className="self-end" onClick={() => setShowForm(true)}>
          <FaPlus /> Add bank account
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

            {formError && <p className="col-span-2 text-sm text-danger">{formError}</p>}

            <div className="col-span-2 flex gap-2">
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save account"}</Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {status === "loading" && accounts.length === 0 ? (
        <LoadingState label="Loading bank accounts…" />
      ) : status === "failed" ? (
        <Body className="text-danger">{error}</Body>
      ) : (
        <div className="flex flex-col gap-3">
          {accounts.length === 0 && !showForm && <Body muted>No bank accounts added yet.</Body>}
          {accounts.map((account) => (
            <Card key={account.id} className="flex items-center justify-between">
              <div>
                <Body className="font-medium">
                  {account.bankName} · {account.accountName}{" "}
                  <Badge tone={account.status === "active" ? "success" : "neutral"}>{account.status}</Badge>
                </Body>
                <Caption>{account.accountNumber} · {account.branchCity}, {account.country} · {account.currency}</Caption>
              </div>
              {account.status === "active" ? (
                <Button variant="danger" size="sm" disabled={updatingId === account.id} onClick={() => handleSetStatus(account.id, "deactivate")}>
                  Deactivate
                </Button>
              ) : (
                <Button variant="secondary" size="sm" disabled={updatingId === account.id} onClick={() => handleSetStatus(account.id, "reactivate")}>
                  Reactivate
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
