"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Body, Caption } from "@/components/ui/Typography";
import type { AppUser, AppRole } from "@/lib/users";

function RoleEditor({ user, roles, onClose }: { user: AppUser; roles: AppRole[]; onClose: () => void }) {
  const router = useRouter();
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
      await fetch(`/api/users/${user.uid}/roles`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles: Array.from(selected) }),
      });
      router.refresh();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 mt-2 border-t border-border pt-2">
      <div className="flex flex-wrap gap-3">
        {roles.map((role) => (
          <label key={role.seqp} className="flex items-center gap-1.5 text-sm">
            <input type="checkbox" checked={selected.has(role.name)} onChange={() => toggle(role.name)} />
            {role.label}
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save roles"}</Button>
        <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );
}

export function UsersList({ users, roles }: { users: AppUser[]; roles: AppRole[] }) {
  const router = useRouter();
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);

  async function toggleBlocked(user: AppUser) {
    setUpdatingUid(user.uid);
    try {
      await fetch(`/api/users/${user.uid}/block-status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocked: !user.blocked }),
      });
      router.refresh();
    } finally {
      setUpdatingUid(null);
    }
  }

  if (users.length === 0) {
    return <Body muted>No users in your organization yet — invite someone to get started.</Body>;
  }

  return (
    <div className="flex flex-col gap-3">
      {users.map((user) => (
        <Card key={user.uid}>
          <div className="flex items-center justify-between">
            <div>
              <Body className="font-medium">{user.first_name} {user.last_name}</Body>
              <Caption>{user.email}</Caption>
            </div>
            <div className="flex items-center gap-2">
              {user.blocked && <Badge tone="danger">Blocked</Badge>}
              {user.roles.length === 0 ? (
                <Badge tone="warning">No role</Badge>
              ) : (
                user.roles.map((r) => <Badge key={r.role.name}>{r.role.label}</Badge>)
              )}
              <Button size="sm" variant="secondary" onClick={() => setEditingUid(editingUid === user.uid ? null : user.uid)}>
                Edit roles
              </Button>
              <Button
                size="sm"
                variant={user.blocked ? "secondary" : "danger"}
                disabled={updatingUid === user.uid}
                onClick={() => toggleBlocked(user)}
              >
                {user.blocked ? "Unblock" : "Block"}
              </Button>
            </div>
          </div>
          {editingUid === user.uid && (
            <RoleEditor user={user} roles={roles} onClose={() => setEditingUid(null)} />
          )}
        </Card>
      ))}
    </div>
  );
}
