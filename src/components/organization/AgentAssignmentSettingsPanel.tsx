"use client";

import { useEffect, useState } from "react";
import { IoSearchOutline } from "react-icons/io5";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { CheckOption } from "@/components/ui/CheckOption";
import { maxConcurrentOptions } from "@/lib/max-concurrent";
import { ToolbarMultiSelect } from "@/components/ui/ToolbarMultiSelect";
import { MultiSelectSearch } from "@/components/ui/MultiSelectSearch";
import { Switch } from "@/components/ui/Switch";
import { Body, Caption } from "@/components/ui/Typography";
import { Skeleton } from "@/components/ui/Skeleton";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import type { AppUser } from "@/lib/users";
import type { EscapePoint } from "@/lib/escape-points";
import { LANGUAGE_OPTIONS } from "@/lib/languages";
import { Alert } from "@/components/ui/Alert";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { deepEqual } from "@/lib/forms";
import { integerField, numberInRange, runValidators } from "@/lib/validators";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchUsers, fetchAssignableRoles, updateAgentAssignmentSettings } from "@/features/users/usersThunks";
import { selectOrgUsers, selectOrgUsersStatus, selectOrgUsersError, selectAssignableRoles } from "@/features/users/usersSelectors";

interface RowState {
  isSpecialist: boolean;
  specialistEscapePoints: string[];
  maxConcurrentAssignments: string;
  eligibleForPriorityLeads: boolean;
  eligibleForLargeGroups: boolean;
  languages: string[];
  acceptingLeads: boolean;
}

function toRowState(user: AppUser): RowState {
  return {
    isSpecialist: !!user.isSpecialist,
    specialistEscapePoints: (user.specialistEscapePoints ?? []).map(String),
    maxConcurrentAssignments: user.maxConcurrentAssignments != null ? String(user.maxConcurrentAssignments) : "",
    eligibleForPriorityLeads: !!user.eligibleForPriorityLeads,
    eligibleForLargeGroups: !!user.eligibleForLargeGroups,
    languages: user.languages ?? [],
    acceptingLeads: user.acceptingLeads !== false,
  };
}

// `user.name` is the login username (set to the email at signup), so the
// person's real name comes from first_name + last_name — same as UsersList.
function displayName(user: AppUser): string {
  return `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || user.name;
}

const MAX_CONCURRENT_PRESETS = [5, 10, 15, 20, 50];

// Assignment filter options. Ticked options combine with AND (e.g. specialist
// + priority-eligible shows only users who are both) — except the two
// accepting-leads options, which are mutually exclusive and so combine with OR
// (both ticked = no restriction on that switch). Tested against the saved user
// values, not in-progress edits, so a card doesn't vanish while being edited.
const ASSIGNMENT_FILTER_OPTIONS = [
  { value: "specialist", label: "Escape Point specialist" },
  { value: "priority", label: "Eligible for priority leads" },
  { value: "largeGroups", label: "More than 5 Travelers" },
  { value: "accepting", label: "Accepting leads" },
  { value: "notAccepting", label: "Not accepting leads" },
];

function matchesAssignmentFilter(user: AppUser, selected: string[]): boolean {
  if (selected.includes("specialist") && !user.isSpecialist) return false;
  if (selected.includes("priority") && !user.eligibleForPriorityLeads) return false;
  if (selected.includes("largeGroups") && !user.eligibleForLargeGroups) return false;
  const wantsAccepting = selected.includes("accepting");
  const wantsNotAccepting = selected.includes("notAccepting");
  if (wantsAccepting !== wantsNotAccepting) {
    const accepting = user.acceptingLeads !== false;
    if (wantsAccepting !== accepting) return false;
  }
  return true;
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
  const roles = useAppSelector(selectAssignableRoles);

  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [originalRows, setOriginalRows] = useState<Record<string, RowState>>({});
  const [rowErrors, setRowErrors] = useState<Record<string, Record<string, string>>>({});
  const [savingUid, setSavingUid] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | undefined>();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string[]>([]);
  const [escapePointFilter, setEscapePointFilter] = useState<string[]>([]);
  const [languageFilter, setLanguageFilter] = useState<string[]>([]);
  const [assignmentFilter, setAssignmentFilter] = useState<string[]>([]);

  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchAssignableRoles());
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

  // Discards in-progress edits, restoring the values last loaded from (or
  // saved to) the backend — no API call, same as clicking away without
  // saving would conceptually mean.
  function handleCancel(uid: string) {
    setRows((r) => ({ ...r, [uid]: originalRows[uid] }));
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
            eligibleForLargeGroups: row.eligibleForLargeGroups,
            languages: row.languages,
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

  if ((status === "idle" || status === "loading") && users.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-44" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton key={j} className="h-4 w-40" />
              ))}
            </div>
            <Skeleton className="h-8 w-16 rounded" />
          </Card>
        ))}
      </div>
    );
  }

  if (status === "failed") {
    return <Body className="text-danger">{error}</Body>;
  }

  // Name, email and role, case-insensitive. Filtering only hides cards — each
  // user's in-progress edits live in `rows` keyed by uid, so they survive a search.
  const query = search.trim().toLowerCase();
  const visibleUsers = users.filter((u) => {
    if (roleFilter.length > 0 && !u.roles.some((r) => roleFilter.includes(r.role.name))) return false;
    // Matches on the escape points a user is a specialist for (saved values).
    if (
      escapePointFilter.length > 0 &&
      !(u.specialistEscapePoints ?? []).some((seqp) => escapePointFilter.includes(String(seqp)))
    )
      return false;
    if (languageFilter.length > 0 && !(u.languages ?? []).some((l) => languageFilter.includes(l))) return false;
    if (!matchesAssignmentFilter(u, assignmentFilter)) return false;
    if (!query) return true;
    return [displayName(u), u.name, u.email, ...u.roles.map((r) => r.role.label)].some((v) => v?.toLowerCase().includes(query));
  });

  return (
    <div className="flex flex-col gap-3">
      {formError && (
        <Alert tone="danger" autoClose={false}>
          {formError}
        </Alert>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <IoSearchOutline className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users…"
            aria-label="Search users"
            className="h-8 w-full rounded-full border border-transparent bg-[#f8f8fa] pl-7 pr-3 text-sm text-foreground placeholder:text-[#9da3af] transition-colors focus-visible:border-primary/40 focus-visible:bg-background focus-visible:outline-none"
          />
        </div>
        <ToolbarMultiSelect
          label="Role"
          options={roles.map((r) => ({ value: r.name, label: r.label }))}
          value={roleFilter}
          onChange={setRoleFilter}
          placeholder="Default"
        />
        <ToolbarMultiSelect
          label="Escape Point"
          options={escapePoints.map((d) => ({ value: String(d.seqp), label: d.name }))}
          value={escapePointFilter}
          onChange={setEscapePointFilter}
          placeholder="Default"
          searchable
          searchPlaceholder="Search escape points…"
        />
        <ToolbarMultiSelect
          label="Language"
          options={LANGUAGE_OPTIONS}
          value={languageFilter}
          onChange={setLanguageFilter}
          placeholder="Default"
          searchable
          searchPlaceholder="Search languages…"
        />
        <ToolbarMultiSelect
          label="Assignment"
          options={ASSIGNMENT_FILTER_OPTIONS}
          value={assignmentFilter}
          onChange={setAssignmentFilter}
          placeholder="Default"
        />
      </div>
      {visibleUsers.map((user) => {
        const row = rows[user.uid];
        if (!row) return null;
        const rowIsSaving = savingUid === user.uid;
        const fullName = displayName(user);
        const rowDirty = !deepEqual(originalRows[user.uid], row);
        const errs = rowErrors[user.uid] ?? {};
        return (
          <Card key={user.uid} className="flex flex-col gap-3 rounded-xl">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={fullName} className="h-10 w-10 text-base" />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Body className="font-medium leading-tight">{fullName}</Body>
                    {user.roles.length > 0 && (
                      <Badge tone="neutral">{user.roles.map((r) => r.role.label).join(", ")}</Badge>
                    )}
                  </div>
                  <Caption className="lowercase leading-tight">{user.email.toLowerCase()}</Caption>
                </div>
              </div>
              <Switch
                checked={row.acceptingLeads}
                onChange={(next) => update(user.uid, { acceptingLeads: next })}
                disabled={rowIsSaving}
                ariaLabel={`${fullName}: accepting leads`}
                title={row.acceptingLeads ? "Accepting leads" : "Not accepting leads"}
              />
            </div>

            <fieldset disabled={rowIsSaving} className="flex flex-col gap-4 border-t border-border pt-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <CheckOption checked={row.isSpecialist} onChange={(next) => update(user.uid, { isSpecialist: next })}>
                  Escape Point specialist
                </CheckOption>
                <CheckOption
                  checked={row.eligibleForPriorityLeads}
                  onChange={(next) => update(user.uid, { eligibleForPriorityLeads: next })}
                >
                  Eligible for priority leads
                </CheckOption>
                <CheckOption
                  checked={row.eligibleForLargeGroups}
                  onChange={(next) => update(user.uid, { eligibleForLargeGroups: next })}
                >
                  More than 5 Travelers
                </CheckOption>
              </div>

              {/* One field per row on mobile, two on tablet (md), three on desktop (lg). */}
              <div className="grid grid-cols-1 items-start gap-x-6 gap-y-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="min-w-0">
                  <Select
                    label="Maximum concurrent leads/escapes"
                    options={maxConcurrentOptions(row.maxConcurrentAssignments, MAX_CONCURRENT_PRESETS, "No limit")}
                    value={row.maxConcurrentAssignments}
                    onChange={(e) => update(user.uid, { maxConcurrentAssignments: e.target.value })}
                    error={errs.maxConcurrentAssignments}
                  />
                </div>

                <div className="min-w-0">
                  <MultiSelectSearch
                    label="Languages"
                    helperText="Select one or more"
                    placeholder="Search languages…"
                    options={LANGUAGE_OPTIONS}
                    value={row.languages}
                    onChange={(next) => update(user.uid, { languages: next })}
                    disabled={rowIsSaving}
                  />
                </div>

                {/* Only for "Escape Point specialist" users (checkbox above). */}
                {row.isSpecialist && (
                  <div className="min-w-0">
                    <MultiSelectSearch
                      label="Specialist escape points"
                      helperText="Select one or more"
                      placeholder="Search escape points…"
                      options={escapePoints.map((d) => ({ value: String(d.seqp), label: d.name }))}
                      value={row.specialistEscapePoints}
                      onChange={(next) => update(user.uid, { specialistEscapePoints: next })}
                      error={errs.specialistEscapePoints}
                      disabled={rowIsSaving}
                    />
                  </div>
                )}
              </div>
            </fieldset>

            <div className="flex items-center justify-end gap-2">
              <Button
                size="sm"
                variant="ghost"
                disabled={rowIsSaving || !rowDirty}
                onClick={() => handleCancel(user.uid)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={rowIsSaving || !rowDirty}
                loading={rowIsSaving}
                loadingText="Saving…"
                onClick={() => handleSave(user.uid)}
              >
                Save Changes
              </Button>
            </div>
          </Card>
        );
      })}
      {users.length === 0 && <Body muted className="text-center">No agents in your organization yet.</Body>}
      {users.length > 0 && visibleUsers.length === 0 && (
        <Body muted className="text-center">No users match your filters.</Body>
      )}
    </div>
  );
}
