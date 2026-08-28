"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Body, Caption } from "@/components/ui/Typography";
import type { Organization } from "@/lib/organization";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { useAppDispatch } from "@/store/hooks";
import { toggleAutoAssign } from "@/features/assignmentRules/assignmentRulesThunks";

export function AutoAssignTogglePanel({ organization }: { organization: Organization }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function handleToggle(next: boolean) {
    setBusy(true);
    setError(undefined);
    try {
      await dispatch(toggleAutoAssign({ enabled: next })).unwrap();
      // Organization isn't Redux-managed yet — router.refresh() re-runs the
      // Server Component to pick up the new settings.auto_assign_enabled value.
      router.refresh();
    } catch (err) {
      setError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to update setting"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="flex items-center justify-between gap-4">
      <div>
        <Body className="font-medium">Auto-assign new escapes</Body>
        <Caption>
          {organization.settings?.auto_assign_enabled
            ? "When a lead is converted to an escape, it's automatically assigned using the rules below. Leads themselves are never individually assigned — any eligible user can work any lead."
            : "Converted escapes land unassigned for a Lead Assigner to handle manually."}
        </Caption>
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
      <label className="relative inline-flex cursor-pointer items-center">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={organization.settings?.auto_assign_enabled ?? false}
          disabled={busy}
          onChange={(e) => handleToggle(e.target.checked)}
        />
        <div className="h-6 w-11 rounded-full bg-muted peer-checked:bg-primary peer-disabled:opacity-50" />
        <div className="absolute left-1 h-4 w-4 rounded-full bg-background transition-transform peer-checked:translate-x-5" />
      </label>
    </Card>
  );
}
