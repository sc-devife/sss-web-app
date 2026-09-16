"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
    <div className="flex items-center justify-between gap-4 rounded-lg bg-muted/40 p-4">
      <div>
        <Body className="font-medium">Auto-assignment</Body>
        <Caption>
          {organization.settings?.auto_assign_enabled
            ? "New leads are automatically assigned using the rules below as soon as they come in. If a lead converts to an escape, the same agent carries over rather than being reassigned."
            : "New leads and converted escapes land unassigned for a Lead Assigner to handle manually."}
        </Caption>
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
      <label className="relative inline-flex shrink-0 cursor-pointer items-center">
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
    </div>
  );
}
