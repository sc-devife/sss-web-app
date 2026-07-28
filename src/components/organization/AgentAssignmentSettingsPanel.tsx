"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { Badge } from "@/components/ui/Badge";
import { Body, Caption } from "@/components/ui/Typography";
import type { AppUser } from "@/lib/users";
import type { Destination } from "@/lib/destinations";

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

export function AgentAssignmentSettingsPanel({ users, destinations }: { users: AppUser[]; destinations: Destination[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<Record<string, RowState>>(() =>
    Object.fromEntries(users.map((u) => [u.uid, toRowState(u)])),
  );
  const [savingUid, setSavingUid] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>();

  function update(uid: string, patch: Partial<RowState>) {
    setRows((r) => ({ ...r, [uid]: { ...r[uid], ...patch } }));
  }

  async function handleSave(uid: string) {
    const row = rows[uid];
    setSavingUid(uid);
    setError(undefined);
    try {
      const res = await fetch(`/api/users/${uid}/assignment-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isSpecialist: row.isSpecialist,
          specialistDestinations: row.isSpecialist ? row.specialistDestinations.map(Number) : [],
          maxConcurrentAssignments: row.maxConcurrentAssignments ? Number(row.maxConcurrentAssignments) : null,
          eligibleForPriorityLeads: row.eligibleForPriorityLeads,
          acceptingLeads: row.acceptingLeads,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "Failed to save agent settings");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save agent settings");
    } finally {
      setSavingUid(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-sm text-danger">{error}</p>}
      {users.map((user) => {
        const row = rows[user.uid];
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
