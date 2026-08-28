"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Modal } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import { Body, Caption } from "@/components/ui/Typography";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { accountNumberField, ifscField, pattern, required, runValidators, swiftField } from "@/lib/validators";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchBankAccounts, createBankAccount, setBankAccountStatus } from "@/features/bankAccounts/bankAccountsThunks";
import { selectBankAccounts, selectBankAccountsStatus, selectBankAccountsError } from "@/features/bankAccounts/bankAccountsSelectors";
import { FaMapMarkerAlt, FaPlus, FaUniversity } from "react-icons/fa";

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

type BankAccountFormState = typeof emptyForm;

function maskAccountNumber(value: string) {
  if (value.length <= 4) return value;
  return `•••• ${value.slice(-4)}`;
}

function OptionalDetail({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <Caption className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</Caption>
      <Body className="truncate text-sm">{value}</Body>
    </div>
  );
}

// No dirty-check here — this form is Add-only (no Edit/Update flow exists
// for bank accounts today, confirmed via the feature module's thunks).
function validate(v: BankAccountFormState): Record<string, string> {
  const errors: Record<string, string> = {};
  const err = (key: keyof BankAccountFormState, validators: Parameters<typeof runValidators>[1]) => {
    const e = runValidators(v[key], validators);
    if (e) errors[key] = e;
  };
  err("accountName", [required("Account holder name is required")]);
  err("accountNumber", [required("Account number is required"), accountNumberField()]);
  err("bankName", [required("Bank name is required")]);
  err("bankShortName", [required("Bank short name is required")]);
  err("branchName", [required("Branch name is required")]);
  err("ifsc", [required("IFSC code is required"), ifscField()]);
  err("swiftCode", [swiftField()]); // optional, format-checked only if filled
  err("country", [required("Country is required")]);
  err("branchState", [required("Branch state is required")]);
  err("branchCity", [required("Branch city is required")]);
  err("currency", [required("Currency is required"), pattern(/^[A-Z]{3}$/, "Use a 3-letter currency code (e.g. USD, INR)")]);
  return errors;
}

export function BankAccountsPanel({ orgId }: { orgId: string }) {
  const dispatch = useAppDispatch();
  const accounts = useAppSelector(selectBankAccounts);
  const status = useAppSelector(selectBankAccountsStatus);
  const error = useAppSelector(selectBankAccountsError);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [isDefault, setIsDefault] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchBankAccounts(orgId));
  }, [dispatch, orgId]);

  function update<K extends keyof typeof emptyForm>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function openAddModal() {
    setForm(emptyForm);
    setIsDefault(false);
    setErrors({});
    setFormError(undefined);
    setShowForm(true);
  }

  // Ignored while a save is in flight — the modal's X button, backdrop
  // click, and Escape key all route through this, so a pending request
  // can't be silently abandoned mid-flight.
  function closeAddModal() {
    if (saving) return;
    setShowForm(false);
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setFormError(undefined);

    const nextErrors = validate(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      await dispatch(createBankAccount({ orgId, payload: { ...form, isDefault } })).unwrap();
      dispatch(fetchBankAccounts(orgId));
      setForm(emptyForm);
      setIsDefault(false);
      setShowForm(false);
    } catch (err) {
      setFormError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to add account"));
    } finally {
      setSaving(false);
    }
  }

  async function handleSetStatus(accountId: string, action: "deactivate" | "reactivate" | "set-default") {
    setUpdatingId(accountId);
    try {
      await dispatch(setBankAccountStatus({ orgId, accountId, action }));
      dispatch(fetchBankAccounts(orgId));
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-5 border-b border-border/70 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <Caption className="font-semibold uppercase tracking-[0.18em] text-primary">Organization finance</Caption>
          <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Bank accounts</h1>
          <Body className="max-w-2xl text-muted-foreground">Manage settlement accounts and keep your organization&apos;s banking details organized in one secure place.</Body>
        </div>
        <Button className="shrink-0" onClick={openAddModal}>
          <FaPlus /> Add bank account
        </Button>
      </header>

      {status === "loading" && accounts.length === 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Loading bank accounts">
          {[1, 2, 3].map((item) => (
            <Card key={item} className="flex min-h-[280px] flex-col gap-5 border-border/70 p-5">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-xl bg-muted" />
                <div className="flex flex-1 flex-col gap-2"><div className="h-4 w-32 rounded bg-muted" /><div className="h-3 w-20 rounded bg-muted" /></div>
              </div>
              <div className="h-16 rounded-lg bg-muted/70" />
              <div className="mt-auto h-10 rounded-lg bg-muted" />
            </Card>
          ))}
        </div>
      ) : status === "failed" ? (
        <Body className="text-danger">{error}</Body>
      ) : accounts.length === 0 ? (
        <Card className="flex min-h-[280px] flex-col items-center justify-center gap-4 border-dashed border-border/80 bg-muted/20 p-8 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl border border-border bg-background text-primary shadow-sm"><FaUniversity className="size-6" /></div>
          <div className="flex flex-col gap-1"><Body className="font-semibold">No bank accounts yet</Body><Caption>Add your first settlement account to get started.</Caption></div>
          <Button variant="secondary" size="sm" onClick={openAddModal}><FaPlus /> Add bank account</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {accounts.map((account) => {
            const isActive = account.status === "active";
            return (
              <Card key={account.uid} className="group flex min-h-[280px] flex-col gap-5 border-border/70 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/50 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"><FaUniversity className="size-5" /></div>
                    <div className="flex min-w-0 flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Body className="truncate font-semibold">{account.bankName}</Body>
                        {account.isDefault && <span className="shrink-0 rounded bg-success/15 px-1.5 py-0.5 text-[10px] font-medium text-success">Default</span>}
                      </div>
                      <Caption className="truncate text-muted-foreground">{account.bankShortName} · {account.branchName}</Caption>
                    </div>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground"><span className={isActive ? "size-2 rounded-full bg-success" : "size-2 rounded-full bg-muted-foreground/50"} />{isActive ? "Active" : "Inactive"}</span>
                </div>

                <div className="rounded-xl border border-border/70 bg-muted/30 p-4"><Caption className="uppercase tracking-wider text-muted-foreground">Account number</Caption><Body className="mt-1 font-mono text-lg font-semibold tracking-widest">{maskAccountNumber(account.accountNumber)}</Body></div>
                <div className="grid grid-cols-2 gap-4"><OptionalDetail label="Account holder" value={account.accountName} /><OptionalDetail label="IFSC" value={account.ifsc} /><OptionalDetail label="SWIFT" value={account.swiftCode} /><OptionalDetail label="MICR" value={account.micrCode} /></div>
                <div className="mt-auto flex items-end justify-between gap-4 border-t border-border/70 pt-4">
                  <div className="flex min-w-0 items-center gap-2 text-muted-foreground"><FaMapMarkerAlt className="size-3.5 shrink-0" /><Caption className="truncate">{account.branchCity}, {account.country} · {account.currency}</Caption></div>
                  <div className="flex shrink-0 gap-2">
                    {!account.isDefault && (
                      <Button variant="secondary" size="sm" disabled={updatingId === account.uid} onClick={() => handleSetStatus(account.uid, "set-default")}>Set Default</Button>
                    )}
                    {isActive ? <Button variant="danger" size="sm" disabled={updatingId === account.uid} onClick={() => handleSetStatus(account.uid, "deactivate")}>Deactivate</Button> : <Button variant="secondary" size="sm" disabled={updatingId === account.uid} onClick={() => handleSetStatus(account.uid, "reactivate")}>Reactivate</Button>}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={showForm} onClose={closeAddModal} title="Add Bank Account" className="max-w-2xl">
        <form onSubmit={handleAdd} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <fieldset disabled={saving} className="contents">
            {(
              [
                ["accountName", "Account holder name"],
                ["accountNumber", "Account number"],
                ["bankName", "Bank name"],
                ["bankShortName", "Bank short name"],
                ["branchName", "Branch name"],
                ["ifsc", "IFSC"],
                ["swiftCode", "SWIFT code"],
                ["micrCode", "MICR code"],
                ["country", "Country"],
                ["branchState", "Branch state"],
                ["branchCity", "Branch city"],
              ] as const
            ).map(([key, label]) => (
              <TextInput
                key={key}
                label={label}
                value={form[key]}
                onChange={(e) => {
                  update(key, e.target.value);
                  setErrors((p) => ({ ...p, [key]: "" }));
                }}
                error={errors[key]}
                required={key !== "swiftCode" && key !== "micrCode"}
              />
            ))}
            <TextInput
              label="Currency"
              value={form.currency}
              onChange={(e) => {
                update("currency", e.target.value.toUpperCase());
                setErrors((p) => ({ ...p, currency: "" }));
              }}
              error={errors.currency}
              required
              maxLength={3}
            />
            <TextInput
              label="Branch address"
              value={form.branchAddress}
              onChange={(e) => update("branchAddress", e.target.value)}
              className="sm:col-span-2"
            />
            <label className="flex cursor-pointer items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              Set as default account
            </label>
          </fieldset>

          {formError && (
            <Alert tone="danger" autoClose={false} className="sm:col-span-2">
              {formError}
            </Alert>
          )}

          <div className="flex justify-end gap-3 border-t pt-5 sm:col-span-2">
            <Button type="button" variant="ghost" disabled={saving} onClick={closeAddModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} loading={saving} loadingText="Saving…">
              Save account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
