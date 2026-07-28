"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Body, Caption } from "@/components/ui/Typography";
import type { PriorityCalendarEntry } from "@/lib/priority-calendar";

const emptyForm = { label: "", startDate: "", endDate: "" };

export function PriorityCalendarPanel({ initialEntries }: { initialEntries: PriorityCalendarEntry[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  function update<K extends keyof typeof emptyForm>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(undefined);
    try {
      const res = await fetch("/api/priority-calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "Failed to add season");
      }
      setForm(emptyForm);
      setShowForm(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add season");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(uid: string) {
    await fetch(`/api/priority-calendar/${uid}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <Caption>Honeymoon and family leads traveling within one of these windows are auto-flagged as priority.</Caption>

      {initialEntries.length === 0 && !showForm && <Body muted>No vacation seasons configured yet.</Body>}

      {initialEntries.map((entry) => (
        <Card key={entry.uid} className="flex items-center justify-between">
          <div>
            <Body className="font-medium">{entry.label}</Body>
            <Caption>{entry.startDate} – {entry.endDate}</Caption>
          </div>
          <Button variant="danger" size="sm" onClick={() => handleDelete(entry.uid)}>Remove</Button>
        </Card>
      ))}

      {!showForm && (
        <Button variant="secondary" className="self-start" onClick={() => setShowForm(true)}>Add vacation season</Button>
      )}

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-4">
            <TextInput label="Label" value={form.label} onChange={(e) => update("label", e.target.value)} required placeholder="e.g. Diwali 2026" />
            <TextInput label="Start date" type="date" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} required />
            <TextInput label="End date" type="date" value={form.endDate} onChange={(e) => update("endDate", e.target.value)} required />
            {error && <p className="col-span-3 text-sm text-danger">{error}</p>}
            <div className="col-span-3 flex gap-2">
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save season"}</Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
