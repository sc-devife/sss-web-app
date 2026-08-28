"use client";

import { useEffect, useState, type FormEvent } from "react";

import { TextInput } from "@/components/ui/TextInput";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { LoadingState } from "@/components/ui/Spinner";
import { Body } from "@/components/ui/Typography";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updateOrganizationSettings, fetchMyOrganization } from "@/features/organization/organizationThunks";
import { selectOrganization, selectOrganizationStatus, selectOrganizationError } from "@/features/organization/organizationSelectors";
import type { SupportedCurrency } from "@/lib/currencies";

export function OrganizationSettingsPanel() {
  const dispatch = useAppDispatch();
  const organization = useAppSelector(selectOrganization);
  const status = useAppSelector(selectOrganizationStatus);
  const error = useAppSelector(selectOrganizationError);

  useEffect(() => {
    dispatch(fetchMyOrganization());
  }, [dispatch]);

  const [defaultCurrencyCode, setDefaultCurrencyCode] = useState("");
  const [currencies, setCurrencies] = useState<SupportedCurrency[]>([]);
  const [timezone, setTimezone] = useState("");
  const [defaultLocale, setDefaultLocale] = useState("");
  const [defaultPaymentTermsDays, setDefaultPaymentTermsDays] = useState("");
  const [brandPrimaryColor, setBrandPrimaryColor] = useState("#0f172a");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    clientApi.get<SupportedCurrency[]>("/currencies").then((res) => setCurrencies(res.data)).catch(() => { });
  }, []);

  useEffect(() => {
    if (!organization) return;
    setDefaultCurrencyCode(organization.settings?.default_currency_code ?? "");
    setTimezone(organization.settings?.timezone ?? "");
    setDefaultLocale(organization.settings?.default_locale ?? "");
    setDefaultPaymentTermsDays(
      organization.settings?.default_payment_terms_days != null ? String(organization.settings.default_payment_terms_days) : "",
    );
    setBrandPrimaryColor(organization.settings?.brand_primary_color ?? "#0f172a");
  }, [organization]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaveError(undefined);
    setSaved(false);
    setSaving(true);

    try {
      await dispatch(updateOrganizationSettings({
        default_currency_code: defaultCurrencyCode || undefined,
        timezone: timezone || undefined,
        default_locale: defaultLocale || undefined,
        default_payment_terms_days: defaultPaymentTermsDays ? Number(defaultPaymentTermsDays) : undefined,
        brand_primary_color: brandPrimaryColor || undefined,
      })).unwrap();

      setSaved(true);
    } catch (err) {
      setSaveError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to save"));
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading" && !organization) {
    return <LoadingState label="Loading organization…" />;
  }

  if (status === "failed" || !organization) {
    return <Body className="text-danger">{error ?? "Failed to load organization"}</Body>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <fieldset disabled={saving} className="contents">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Select
            label="Default Currency"
            options={currencies.map((c) => ({ value: c.code, label: `${c.code} — ${c.name}` }))}
            value={defaultCurrencyCode}
            onChange={(e) => setDefaultCurrencyCode(e.target.value)}
            placeholder="Select a currency"
          />

          <TextInput label="Timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="e.g. Asia/Kolkata" />
          <TextInput label="Default Locale" value={defaultLocale} onChange={(e) => setDefaultLocale(e.target.value)} placeholder="e.g. en" />
          <TextInput
            label="Default Payment Terms (days)"
            type="number"
            min={0}
            value={defaultPaymentTermsDays}
            onChange={(e) => setDefaultPaymentTermsDays(e.target.value)}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Brand Primary Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={/^#[0-9a-fA-F]{6}$/.test(brandPrimaryColor) ? brandPrimaryColor : "#0f172a"}
                onChange={(e) => setBrandPrimaryColor(e.target.value)}
                className="h-10 w-12 shrink-0 cursor-pointer rounded border border-border bg-background"
              />
              <input
                value={brandPrimaryColor}
                onChange={(e) => setBrandPrimaryColor(e.target.value)}
                placeholder="#0f172a"
                className="h-10 flex-1 rounded border border-border bg-background px-3 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              />
            </div>
          </div>
        </div>
      </fieldset>

      {saveError && (
        <Alert tone="danger" autoClose={false}>
          {saveError}
        </Alert>
      )}

      {saved && <Alert tone="success">Settings updated successfully.</Alert>}

      <div className="flex justify-end border-t border-border pt-4">
        <Button type="submit" disabled={saving} loading={saving} loadingText="Saving..." className="min-w-[170px]">
          Save Changes
        </Button>
      </div>
    </form>
  );
}
