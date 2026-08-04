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
import type { Destination } from "@/lib/destinations";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchUsers, updateAgentAssignmentSettings } from "@/features/users/usersThunks";
import { selectOrgUsers, selectOrgUsersStatus, selectOrgUsersError } from "@/features/users/usersSelectors";

interface RowState {
  isSpecialist: boolean;
  specialistDestinations: string[];
  maxConcurrentAssignments: string;
  eligibleForPriorityLeads: boolean;
  acceptingLeads: boolean;
}

function toRowState(user: AppUser): RowState {
  return {
    isSpecialist: !!user.isSpecialist,
    specialistDestinations: (user.specialistDestinations ?? []).map(String),
    maxConcurrentAssignments: user.maxConcurrentAssignments != null ? String(user.maxConcurrentAssignments) : "",
    eligibleForPriorityLeads: !!user.eligibleForPriorityLeads,
    acceptingLeads: user.acceptingLeads !== false,
  };
}

export function AgentAssignmentSettingsPanel({ destinations }: { destinations: Destination[] }) {
  const dispatch = useAppDispatch();
  const users = useAppSelector(selectOrgUsers);
  const status = useAppSelector(selectOrgUsersStatus);
  const error = useAppSelector(selectOrgUsersError);

  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [savingUid, setSavingUid] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | undefined>();

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  // Row edit state is seeded from Redux once per user — re-seeding on every
  // users update would clobber in-progress edits, so this only fills in rows
  // for users that don't have one yet (first load, or a newly invited user).
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
  }, [users]);

  function update(uid: string, patch: Partial<RowState>) {
    setRows((r) => ({ ...r, [uid]: { ...r[uid], ...patch } }));
  }

  async function handleSave(uid: string) {
    const row = rows[uid];
    setSavingUid(uid);
    setFormError(undefined);
    try {
      await dispatch(
        updateAgentAssignmentSettings({
          uid,
          settings: {
            isSpecialist: row.isSpecialist,
            specialistDestinations: row.isSpecialist ? row.specialistDestinations.map(Number) : [],
            maxConcurrentAssignments: row.maxConcurrentAssignments ? Number(row.maxConcurrentAssignments) : null,
            eligibleForPriorityLeads: row.eligibleForPriorityLeads,
            acceptingLeads: row.acceptingLeads,
          },
        }),
      ).unwrap();
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
      {formError && <p className="text-sm text-danger">{formError}</p>}
      {users.map((user) => {
        const row = rows[user.uid];
        if (!row) return null;
        return (
          <Card key={user.uid} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <Body className="font-medium">{user.name}</Body>
                <Caption>{user.email}</Caption>
              </div>
              {!row.acceptingLeads && <Badge tone="neutral">Not accepting leads</Badge>}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 accent-primary"
                  checked={row.isSpecialist}
                  onChange={(e) => update(user.uid, { isSpecialist: e.target.checked })}
                />
                Destination specialist
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
                label="Max concurrent leads/trips"
                type="number"
                min={0}
                value={row.maxConcurrentAssignments}
                onChange={(e) => update(user.uid, { maxConcurrentAssignments: e.target.value })}
                placeholder="No cap"
              />
            </div>

            {row.isSpecialist && (
              <MultiSelect
                label="Specialist destinations"
                options={destinations.map((d) => ({ value: String(d.seqp), label: d.name }))}
                value={row.specialistDestinations}
                onChange={(next) => update(user.uid, { specialistDestinations: next })}
              />
            )}

            <div>
              <Button size="sm" disabled={savingUid === user.uid} onClick={() => handleSave(user.uid)}>
                {savingUid === user.uid ? "Saving…" : "Save"}
              </Button>
            </div>
          </Card>
        );
      })}
      {users.length === 0 && <Body muted>No agents in your organization yet.</Body>}
    </div>
  );
}
