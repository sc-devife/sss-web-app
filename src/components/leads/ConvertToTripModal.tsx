"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { MultiSelect } from "@/components/ui/MultiSelect";
import type { Lead } from "@/lib/leads";
import type { Traveller } from "@/lib/travellers";
import type { Destination } from "@/lib/destinations";

export function ConvertToTripModal({
  lead,
  destinations,
  onClose,
}: {
  lead: Lead;
  destinations: Destination[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [travellers, setTravellers] = useState<Traveller[]>([]);
  const [travellerIds, setTravellerIds] = useState<string[]>([]);
  const [destinationIds, setDestinationIds] = useState<string[]>(
    lead.destinationId ? [lead.destinationId] : []
  );
  const [startDate, setStartDate] = useState(lead.travelDate ?? "");
  const [numberOfDays, setNumberOfDays] = useState(lead.durationDays ? String(lead.durationDays) : "");
  const [addingTraveller, setAddingTraveller] = useState(false);
  const [newTraveller, setNewTraveller] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    fetch("/api/travellers")
      .then((r) => r.json())
      .then(setTravellers)
      .catch(() => setTravellers([]));
  }, []);

  async function handleAddTraveller() {
    if (!newTraveller.firstName.trim()) return;
    setSaving(true);
    setError(undefined);
    try {
      const res = await fetch("/api/travellers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTraveller),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.message ?? "Failed to add traveller");
      setTravellers((t) => [...t, body]);
      setTravellerIds((ids) => [...ids, String(body.seqp)]);
      setNewTraveller({ firstName: "", lastName: "", email: "", phone: "" });
      setAddingTraveller(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add traveller");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (travellerIds.length === 0) {
      setError("Add at least one traveller");
      return;
    }
    if (destinationIds.length === 0) {
      setError("Select at least one destination");
      return;
    }
    if (!startDate || !numberOfDays) {
      setError("Start date and duration are required");
      return;
    }
    setSaving(true);
    setError(undefined);
    try {
      const res = await fetch(`/api/leads/${lead.seqp}/actions/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.seqp,
          travellerIds: travellerIds.map(Number),
          destinationIds,
          startDate,
          numberOfDays: Number(numberOfDays),
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.message ?? "Failed to convert lead");
      router.push(`/trips/${body.seqp}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to convert lead");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Convert to trip" className="max-w-xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <MultiSelect
          label="Destinations"
          options={destinations.map((d) => ({ value: d.uid, label: d.name }))}
          value={destinationIds}
          onChange={setDestinationIds}
        />

        <div className="grid grid-cols-2 gap-4">
          <TextInput label="Start date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          <TextInput label="Number of days" type="number" min={1} value={numberOfDays} onChange={(e) => setNumberOfDays(e.target.value)} required />
        </div>

        <MultiSelect
          label="Travellers"
          options={travellers.map((t) => ({ value: String(t.seqp), label: `${t.firstName} ${t.lastName ?? ""}`.trim() }))}
          value={travellerIds}
          onChange={setTravellerIds}
        />

        {!addingTraveller ? (
          <button type="button" onClick={() => setAddingTraveller(true)} className="self-start text-sm text-primary hover:underline">
            + Add a new traveller
          </button>
        ) : (
          <div className="flex flex-col gap-3 rounded border border-border p-3">
            <div className="grid grid-cols-2 gap-3">
              <TextInput label="First name" value={newTraveller.firstName} onChange={(e) => setNewTraveller((t) => ({ ...t, firstName: e.target.value }))} required />
              <TextInput label="Last name" value={newTraveller.lastName} onChange={(e) => setNewTraveller((t) => ({ ...t, lastName: e.target.value }))} />
              <TextInput label="Email" type="email" value={newTraveller.email} onChange={(e) => setNewTraveller((t) => ({ ...t, email: e.target.value }))} />
              <TextInput label="Phone" value={newTraveller.phone} onChange={(e) => setNewTraveller((t) => ({ ...t, phone: e.target.value }))} />
            </div>
            <div className="flex gap-2">
              <Button type="button" size="sm" disabled={saving} onClick={handleAddTraveller}>Add traveller</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setAddingTraveller(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>{saving ? "Converting…" : "Convert to trip"}</Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}
