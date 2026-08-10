"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import { Body, Caption } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { accountNumberField, ifscField, pattern, required, runValidators, swiftField } from "@/lib/validators";
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

type BankAccountFormState = typeof emptyForm;

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

  async function handleSetStatus(accountId: string, action: "deactivate" | "reactivate") {
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

      <Button className="self-end" onClick={openAddModal}>
        <FaPlus /> Add bank account
      </Button>

      {status === "loading" && accounts.length === 0 ? (
        <LoadingState label="Loading bank accounts…" />
      ) : status === "failed" ? (
        <Body className="text-danger">{error}</Body>
      ) : (
        <div className="flex flex-col gap-3">
          {accounts.length === 0 && <Body muted>No bank accounts added yet.</Body>}
          {accounts.map((account) => (
            <Card key={account.uid} className="flex items-center justify-between">
              <div>
                <Body className="font-medium">
                  {account.bankName} · {account.accountName}{" "}
                  <Badge tone={account.status === "active" ? "success" : "neutral"}>{account.status}</Badge>
                </Body>
                <Caption>{account.accountNumber} · {account.branchCity}, {account.country} · {account.currency}</Caption>
              </div>
              {account.status === "active" ? (
                <Button variant="danger" size="sm" disabled={updatingId === account.uid} onClick={() => handleSetStatus(account.uid, "deactivate")}>
                  Deactivate
                </Button>
              ) : (
                <Button variant="secondary" size="sm" disabled={updatingId === account.uid} onClick={() => handleSetStatus(account.uid, "reactivate")}>
                  Reactivate
                </Button>
              )}
            </Card>
          ))}
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
