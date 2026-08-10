"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { Badge } from "@/components/ui/Badge";
import { Body, Caption } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import type { AppUser } from "@/lib/users";
import type { EscapePoint } from "@/lib/escape-points";
import { Alert } from "@/components/ui/Alert";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { deepEqual } from "@/lib/forms";
import { integerField, numberInRange, runValidators } from "@/lib/validators";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchUsers, updateAgentAssignmentSettings } from "@/features/users/usersThunks";
import { selectOrgUsers, selectOrgUsersStatus, selectOrgUsersError } from "@/features/users/usersSelectors";

interface RowState {
  isSpecialist: boolean;
  specialistEscapePoints: string[];
  maxConcurrentAssignments: string;
  eligibleForPriorityLeads: boolean;
  acceptingLeads: boolean;
}

function toRowState(user: AppUser): RowState {
  return {
    isSpecialist: !!user.isSpecialist,
    specialistEscapePoints: (user.specialistEscapePoints ?? []).map(String),
    maxConcurrentAssignments: user.maxConcurrentAssignments != null ? String(user.maxConcurrentAssignments) : "",
    eligibleForPriorityLeads: !!user.eligibleForPriorityLeads,
    acceptingLeads: user.acceptingLeads !== false,
  };
}

function validateRow(row: RowState): Record<string, string> {
  const errors: Record<string, string> = {};
  if (row.isSpecialist && row.specialistEscapePoints.length === 0) {
    errors.specialistEscapePoints = "Select at least one escape point";
  }
  const capErr = runValidators(row.maxConcurrentAssignments, [
    integerField("Must be a whole number"),
    numberInRange(0, Number.MAX_SAFE_INTEGER, "Must be zero or greater"),
  ]);
  if (capErr) errors.maxConcurrentAssignments = capErr;
  return errors;
}

export function AgentAssignmentSettingsPanel({ escapePoints }: { escapePoints: EscapePoint[] }) {
  const dispatch = useAppDispatch();
  const users = useAppSelector(selectOrgUsers);
  const status = useAppSelector(selectOrgUsersStatus);
  const error = useAppSelector(selectOrgUsersError);

  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [originalRows, setOriginalRows] = useState<Record<string, RowState>>({});
  const [rowErrors, setRowErrors] = useState<Record<string, Record<string, string>>>({});
  const [savingUid, setSavingUid] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | undefined>();

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  // Row edit state is seeded from Redux once per user — re-seeding on every
  // users update would clobber in-progress edits, so this only fills in rows
  // for users that don't have one yet (first load, or a newly invited user).
  // The original snapshot is seeded the same way, once, so a sibling refetch
  // can't silently redefine what "unchanged" means mid-edit.
  useEffect(() => {
    setRows((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const user of users) {
        if (!next[user.uid]) {
          next[user.uid] = toRowState(user);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    setOriginalRows((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const user of users) {
        if (!next[user.uid]) {
          next[user.uid] = toRowState(user);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [users]);

  function update(uid: string, patch: Partial<RowState>) {
    setRows((r) => ({ ...r, [uid]: { ...r[uid], ...patch } }));
    setRowErrors((r) => ({ ...r, [uid]: {} }));
  }

  async function handleSave(uid: string) {
    const row = rows[uid];
    if (deepEqual(originalRows[uid], row)) return;

    const nextErrors = validateRow(row);
    if (Object.keys(nextErrors).length > 0) {
      setRowErrors((r) => ({ ...r, [uid]: nextErrors }));
      return;
    }
    setRowErrors((r) => ({ ...r, [uid]: {} }));
    setSavingUid(uid);
    setFormError(undefined);
    try {
      await dispatch(
        updateAgentAssignmentSettings({
          uid,
          settings: {
            isSpecialist: row.isSpecialist,
            specialistEscapePoints: row.isSpecialist ? row.specialistEscapePoints.map(Number) : [],
            maxConcurrentAssignments: row.maxConcurrentAssignments ? Number(row.maxConcurrentAssignments) : null,
            eligibleForPriorityLeads: row.eligibleForPriorityLeads,
            acceptingLeads: row.acceptingLeads,
          },
        }),
      ).unwrap();
      // Reset this row's "original" to what was just saved — otherwise the
      // seed-once effect would never overwrite it (it only fills rows that
      // don't have an entry yet) and Save would stay enabled forever after
      // a successful save.
      setOriginalRows((r) => ({ ...r, [uid]: row }));
      dispatch(fetchUsers());
    } catch (err) {
      setFormError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to save agent settings"));
    } finally {
      setSavingUid(null);
    }
  }

  if (status === "loading" && users.length === 0) {
    return <LoadingState label="Loading agents…" />;
  }

  if (status === "failed") {
    return <Body className="text-danger">{error}</Body>;
  }

  return (
    <div className="flex flex-col gap-3">
      {formError && (
        <Alert tone="danger" autoClose={false}>
          {formError}
        </Alert>
      )}
      {users.map((user) => {
        const row = rows[user.uid];
        if (!row) return null;
        const rowIsSaving = savingUid === user.uid;
        const rowDirty = !deepEqual(originalRows[user.uid], row);
        const errs = rowErrors[user.uid] ?? {};
        return (
          <Card key={user.uid} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <Body className="font-medium">{user.name}</Body>
                <Caption>{user.email}</Caption>
              </div>
              {!row.acceptingLeads && <Badge tone="neutral">Not accepting leads</Badge>}
            </div>

            <fieldset disabled={rowIsSaving} className="contents">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 accent-primary"
                  checked={row.isSpecialist}
                  onChange={(e) => update(user.uid, { isSpecialist: e.target.checked })}
                />
                Escape Point specialist
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 accent-primary"
                  checked={row.eligibleForPriorityLeads}
                  onChange={(e) => update(user.uid, { eligibleForPriorityLeads: e.target.checked })}
                />
                Eligible for priority leads
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 accent-primary"
                  checked={row.acceptingLeads}
                  onChange={(e) => update(user.uid, { acceptingLeads: e.target.checked })}
                />
                Accepting leads
              </label>
              <TextInput
                label="Max concurrent leads/escapes"
                type="number"
                min={0}
                value={row.maxConcurrentAssignments}
                onChange={(e) => update(user.uid, { maxConcurrentAssignments: e.target.value })}
                error={errs.maxConcurrentAssignments}
                placeholder="No cap"
              />
            </div>

            {row.isSpecialist && (
              <MultiSelect
                label="Specialist escape points"
                options={escapePoints.map((d) => ({ value: d.uid, label: d.name }))}
                value={row.specialistEscapePoints}
                onChange={(next) => update(user.uid, { specialistEscapePoints: next })}
                error={errs.specialistEscapePoints}
              />
            )}
            </fieldset>

            <div>
              <Button
                size="sm"
                disabled={rowIsSaving || !rowDirty}
                loading={rowIsSaving}
                loadingText="Saving…"
                onClick={() => handleSave(user.uid)}
              >
                Save
              </Button>
            </div>
          </Card>
        );
      })}
      {users.length === 0 && <Body muted>No agents in your organization yet.</Body>}
    </div>
  );
}
