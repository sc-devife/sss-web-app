"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Body, Caption } from "@/components/ui/Typography";
import type { AppUser, AppRole } from "@/lib/users";
import type { Team } from "@/lib/teams";
import { formatRelativeTime } from "@/lib/date";
import { PiUsersThree, PiUsersFourFill, PiPencilSimple, PiWarningCircleFill, PiLockKeyOpenBold } from "react-icons/pi";
import { useAppDispatch } from "@/store/hooks";
import { updateUserRoles, updateUserTeams, setUserBlockedStatus, fetchUsers } from "@/features/users/usersThunks";
import { ImBlocked } from "react-icons/im";

function RoleEditor({ user, roles, onClose }: { user: AppUser; roles: AppRole[]; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const [selected, setSelected] = useState(new Set(user.roles.map((r) => r.role.name)));
  const [saving, setSaving] = useState(false);

  function toggle(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await dispatch(updateUserRoles({ uid: user.uid, roles: Array.from(selected) }));
      dispatch(fetchUsers());
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 space-y-3 border-t border-border pt-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {roles.map((role) => (
          <label
            key={role.seqp}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 transition-all hover:border-primary hover:bg-primary/5"
          >
            <input
              type="checkbox"
              checked={selected.has(role.name)}
              onChange={() => toggle(role.name)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <span className="text-sm font-medium text-foreground">{role.label}</span>
          </label>
        ))}
      </div>
      <div className="flex gap-2 pt-2">
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save roles"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function TeamEditor({ user, teams, onClose }: { user: AppUser; teams: Team[]; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const [selected, setSelected] = useState(new Set(user.teams.map((t) => t.uid)));
  const [saving, setSaving] = useState(false);

  function toggle(uid: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await dispatch(updateUserTeams({ uid: user.uid, teams: Array.from(selected) }));
      dispatch(fetchUsers());
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 space-y-3 border-t border-border pt-4">
      {teams.length === 0 ? (
        <Caption className="text-muted-foreground">No teams yet — create one under Organization → Teams.</Caption>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {teams.map((team) => (
            <label
              key={team.uid}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 transition-all hover:border-primary hover:bg-primary/5"
            >
              <input
                type="checkbox"
                checked={selected.has(team.uid)}
                onChange={() => toggle(team.uid)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium text-foreground">{team.name}</span>
            </label>
          ))}
        </div>
      )}
      <div className="flex gap-2 pt-2">
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save teams"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export function UsersList({ users, roles, teams }: { users: AppUser[]; roles: AppRole[]; teams: Team[] }) {
  const dispatch = useAppDispatch();
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [editingTeamsUid, setEditingTeamsUid] = useState<string | null>(null);
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);

  async function toggleBlocked(user: AppUser) {
    setUpdatingUid(user.uid);
    try {
      await dispatch(setUserBlockedStatus({ uid: user.uid, blocked: !user.blocked }));
      dispatch(fetchUsers());
    } finally {
      setUpdatingUid(null);
    }
  }

  if (users.length === 0) {
    return (
      <EmptyState
        icon={PiUsersThree}
        title="No Active Members"
        description="Invite someone to get started."
      />
    );
  }

  return (
    <div className="space-y-3">
      {users.map((user) => (
        <div
          key={user.uid}
          className="group rounded-xl border border-border bg-card p-3 transition-all duration-200 hover:border-primary/30 hover:shadow-md"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
                  <span className="text-sm font-semibold text-primary-foreground">
                    {user.first_name[0]}
                    {user.last_name[0]}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Body className="truncate font-semibold">
                      {user.first_name} {user.last_name}
                    </Body>
                    {user.blocked && <PiWarningCircleFill className="h-4 w-4 shrink-0 text-danger" />}
                  </div>
                  <Caption className="truncate">{user.email}</Caption>
                  {user.lastActiveAt && (
                    <Caption className="truncate text-muted-foreground">
                      Active {formatRelativeTime(user.lastActiveAt)}
                    </Caption>
                  )}
                  {user.invitedByName && (
                    <Caption className="truncate text-muted-foreground">
                      Invited by {user.invitedByName}
                    </Caption>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {user.blocked && <Badge tone="danger">Blocked</Badge>}
              {user.roles.length === 0 ? (
                <Badge tone="warning">No role</Badge>
              ) : (
                user.roles.map((r) => (
                  <Badge key={r.role.name} tone="neutral">
                    {r.role.label}
                  </Badge>
                ))
              )}
              {user.teams.map((t) => (
                <Badge key={t.uid} tone="neutral" icon={PiUsersFourFill}>
                  {t.name}
                </Badge>
              ))}
            </div>

            <div className="flex justify-end gap-2 sm:justify-start">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setEditingUid(editingUid === user.uid ? null : user.uid)}
                aria-label="Edit roles"
                title="Edit roles"
              >
                <PiPencilSimple className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setEditingTeamsUid(editingTeamsUid === user.uid ? null : user.uid)}
                aria-label="Edit teams"
                title="Edit teams"
              >
                <PiUsersFourFill className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={user.blocked ? "secondary" : "ghost"}
                disabled={updatingUid === user.uid}
                onClick={() => toggleBlocked(user)}
                aria-label={user.blocked ? "Unblock user" : "Block user"}
                className={user.blocked ? "" : "text-danger hover:bg-danger/10"}
                title={user.blocked ? "Unblock user" : "Block user"}
              >
                {user.blocked ? <PiLockKeyOpenBold className="h-4 w-4 text-green-500" /> : <ImBlocked className="h-4 w-4 text-red-500" />}
              </Button>
            </div>
          </div>

          {editingUid === user.uid && <RoleEditor user={user} roles={roles} onClose={() => setEditingUid(null)} />}
          {editingTeamsUid === user.uid && <TeamEditor user={user} teams={teams} onClose={() => setEditingTeamsUid(null)} />}
        </div>
      ))}
    </div>
  );
}
