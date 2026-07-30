"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { TextInput } from "@/components/ui/TextInput";
import { FileUpload } from "@/components/ui/FileUpload";
import { Button } from "@/components/ui/Button";
import { Caption } from "@/components/ui/Typography";
import type { Organization } from "@/lib/organization";

export function OrganizationForm({ organization }: { organization: Organization }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(organization.display_name ?? "");
  const [registeredName, setRegisteredName] = useState(organization.registered_name ?? "");
  const [supportPhone, setSupportPhone] = useState(organization.support_ph_num ?? "");
  const [logoFile, setLogoFile] = useState<string[]>(organization.logo_file ? [organization.logo_file] : []);
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
          logo_file: logoFile[0] ?? null,
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
      <div>
        <Caption>Org Id</Caption>
        <p className="text-sm text-foreground">{organization.org_code ?? "—"}</p>
      </div>

      <FileUpload label="Logo" value={logoFile} onChange={setLogoFile} multiple={false} />

      <TextInput label="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      <TextInput label="Legal / registered name" value={registeredName} onChange={(e) => setRegisteredName(e.target.value)} />
      <TextInput label="Support phone number" value={supportPhone} onChange={(e) => setSupportPhone(e.target.value)} />

      {error && <p className="text-sm text-danger">{error}</p>}
      {saved && <p className="text-sm text-success">Saved.</p>}
      <Button type="submit" disabled={saving} className="self-start">
        {saving ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
