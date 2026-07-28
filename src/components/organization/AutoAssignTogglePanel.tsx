"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Body, Caption } from "@/components/ui/Typography";
import type { Organization } from "@/lib/organization";

export function AutoAssignTogglePanel({ organization }: { organization: Organization }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function handleToggle(next: boolean) {
    setBusy(true);
    setError(undefined);
    try {
      const res = await fetch("/api/organizations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: organization.uid, auto_assign_enabled: next }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "Failed to update setting");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update setting");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="flex items-center justify-between gap-4">
      <div>
        <Body className="font-medium">Auto-assign new leads</Body>
        <Caption>
          {organization.auto_assign_enabled
            ? "New leads are automatically assigned using the rules below."
            : "New leads land in an unassigned queue for a Lead Assigner to handle manually."}
        </Caption>
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
      <label className="relative inline-flex cursor-pointer items-center">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={organization.auto_assign_enabled}
          disabled={busy}
          onChange={(e) => handleToggle(e.target.checked)}
        />
        <div className="h-6 w-11 rounded-full bg-muted peer-checked:bg-primary peer-disabled:opacity-50" />
        <div className="absolute left-1 h-4 w-4 rounded-full bg-background transition-transform peer-checked:translate-x-5" />
      </label>
    </Card>
  );
}
