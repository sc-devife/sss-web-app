"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { TextInput } from "@/components/ui/TextInput";
import { Button } from "@/components/ui/Button";
import { Body } from "@/components/ui/Typography";
import { isValidEmail, validationMessages } from "@/lib/validators";

export function InviteUserForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [sentTo, setSentTo] = useState<string | undefined>();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setError(validationMessages.email);
      return;
    }
    setError(undefined);
    setSending(true);
    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "Failed to send invitation");
      }
      setSentTo(email);
      setEmail("");
      setShowForm(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invitation");
    } finally {
      setSending(false);
    }
  }

  if (!showForm) {
    return (
      <div className="flex flex-col gap-2 items-start">
        <Button onClick={() => { setShowForm(true); setSentTo(undefined); }}>Invite user</Button>
        {sentTo && <Body className="text-success">Invitation sent to {sentTo}.</Body>}
      </div>
    );
  }

  return (
    <Card className="max-w-sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <TextInput
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error}
          autoFocus
        />
        <div className="flex gap-2">
          <Button type="submit" disabled={sending}>{sending ? "Sending…" : "Send invitation"}</Button>
          <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
        </div>
      </form>
    </Card>
  );
}
