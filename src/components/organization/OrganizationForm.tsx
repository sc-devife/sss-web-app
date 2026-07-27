"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { TextInput } from "@/components/ui/TextInput";
import { Button } from "@/components/ui/Button";
import type { Organization } from "@/lib/organization";

export function OrganizationForm({ organization }: { organization: Organization }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(organization.display_name ?? "");
  const [registeredName, setRegisteredName] = useState(organization.registered_name ?? "");
  const [supportPhone, setSupportPhone] = useState(organization.support_ph_num ?? "");
  const [countryCode, setCountryCode] = useState(organization.country_code ?? "");
  const [currencyCode, setCurrencyCode] = useState(organization.default_currency_code ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(undefined);
    setSaved(false);
    try {
      const res = await fetch("/api/organizations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: organization.uid,
          display_name: displayName,
          registered_name: registeredName,
          support_ph_num: supportPhone,
          country_code: countryCode,
          default_currency_code: currencyCode,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "Failed to save");
      }
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-lg">
      <TextInput label="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      <TextInput label="Legal / registered name" value={registeredName} onChange={(e) => setRegisteredName(e.target.value)} />
      <TextInput label="Support phone number" value={supportPhone} onChange={(e) => setSupportPhone(e.target.value)} />
      <div className="grid grid-cols-2 gap-4">
        <TextInput
          label="Country code"
          value={countryCode}
          onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
          placeholder="e.g. IN"
          maxLength={2}
        />
        <TextInput
          label="Default currency"
          value={currencyCode}
          onChange={(e) => setCurrencyCode(e.target.value.toUpperCase())}
          placeholder="e.g. USD"
          maxLength={3}
        />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      {saved && <p className="text-sm text-success">Saved.</p>}
      <Button type="submit" disabled={saving} className="self-start">
        {saving ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
