"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { TextInput } from "@/components/ui/TextInput";
import { Button } from "@/components/ui/Button";
import { Body } from "@/components/ui/Typography";
import { isValidEmail, validationMessages } from "@/lib/validators";
import type { AppRole } from "@/lib/users";

export function InviteUserForm({ roles }: { roles: AppRole[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [sentTo, setSentTo] = useState<string | undefined>();

  function toggleRole(name: string) {
    setSelectedRoles((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function openModal() {
    setEmail("");
    setSelectedRoles(new Set());
    setError(undefined);
    setSentTo(undefined);
    setOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setError(validationMessages.email);
      return;
    }
    if (selectedRoles.size === 0) {
      setError("Select at least one role");
      return;
    }
    setError(undefined);
    setSending(true);
    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, roles: Array.from(selectedRoles) }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "Failed to send invitation");
      }
      setSentTo(email);
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invitation");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 items-start">
      <Button onClick={openModal}>Send User Invitation</Button>
      {sentTo && <Body className="text-success">Invitation sent to {sentTo}.</Body>}

      <Modal open={open} onClose={() => setOpen(false)} title="Send User Invitation">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TextInput
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />

          <div className="flex flex-col gap-2">
            <Body className="font-medium">Role</Body>
            <div className="flex flex-wrap gap-3">
              {roles.map((role) => (
                <label key={role.seqp} className="flex items-center gap-1.5 text-sm">
                  <input type="checkbox" checked={selectedRoles.has(role.name)} onChange={() => toggleRole(role.name)} />
                  {role.label}
                </label>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex gap-2">
            <Button type="submit" disabled={sending}>{sending ? "Sending…" : "Send Invitation"}</Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
