"use client";

import { useState, type FormEvent } from "react";
import { PiUserPlus, PiCheckCircleFill } from "react-icons/pi";
import { Modal } from "@/components/ui/Modal";
import { TextInput } from "@/components/ui/TextInput";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { emailField, required, runValidators } from "@/lib/validators";
import type { AppRole } from "@/lib/users";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { useAppDispatch } from "@/store/hooks";
import { inviteUser, fetchPendingInvitations } from "@/features/users/usersThunks";

export function InviteUserForm({ roles }: { roles: AppRole[] }) {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [emailError, setEmailError] = useState<string | undefined>();
  const [rolesError, setRolesError] = useState<string | undefined>();
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
    setEmailError(undefined);
    setRolesError(undefined);
    setError(undefined);
    setSentTo(undefined);
    setOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const nextEmailError = runValidators(email, [required("Email is required"), emailField()]);
    const nextRolesError = selectedRoles.size === 0 ? "Select at least one role" : undefined;
    if (nextEmailError || nextRolesError) {
      setEmailError(nextEmailError);
      setRolesError(nextRolesError);
      return;
    }
    setEmailError(undefined);
    setRolesError(undefined);
    setError(undefined);
    setSending(true);
    try {
      await dispatch(inviteUser({ email, roles: Array.from(selectedRoles) })).unwrap();
      dispatch(fetchPendingInvitations());
      setSentTo(email);
      setOpen(false);
    } catch (err) {
      setError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to send invitation"));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Button onClick={openModal}>
        <PiUserPlus className="h-5 w-5" />
        Invite New User
      </Button>

      {sentTo && (
        <Alert tone="success" icon={PiCheckCircleFill}>
          Invitation sent to <span className="font-semibold">{sentTo}</span>
        </Alert>
      )}

      <Modal
        open={open}
        onClose={() => {
          if (sending) return;
          setOpen(false);
        }}
        title="Send User Invitation"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <fieldset disabled={sending} className="contents">
          <TextInput
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError(undefined);
            }}
            error={emailError}
            placeholder="user@example.com"
            autoFocus
          />

          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-foreground">Assign Roles</label>
            <div className="grid grid-cols-2 gap-2">
              {roles.map((role) => (
                <label
                  key={role.seqp}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:border-primary hover:bg-primary/5"
                >
                  <input
                    type="checkbox"
                    checked={selectedRoles.has(role.name)}
                    onChange={() => {
                      toggleRole(role.name);
                      setRolesError(undefined);
                    }}
                    className="h-4 w-4 cursor-pointer rounded border-border text-primary focus:ring-primary"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{role.label}</span>
                    <span className="text-xs text-muted-foreground">{role.name}</span>
                  </div>
                </label>
              ))}
            </div>
            {rolesError && <span className="text-xs text-danger">{rolesError}</span>}
          </div>
        </fieldset>

          {error && (
            <Alert tone="danger" autoClose={false}>
              {error}
            </Alert>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={sending} loading={sending} loadingText="Sending…" className="flex-1">
              <PiCheckCircleFill className="h-4 w-4" />
              Send Invitation
            </Button>
            <Button type="button" variant="ghost" disabled={sending} onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
