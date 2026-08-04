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
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { convertLeadToTrip } from "@/features/leads/leadsThunks";
import { selectConvertStatus, selectConvertError } from "@/features/leads/leadsSelectors";

// Traveller fetch/create here deliberately stays a direct clientApi call
// rather than a thunk — Travellers is its own module (per the migration
// inventory) and gets its own slice in a later stage; this modal only needs
// a quick picker/inline-create, not full CRUD state management. The actual
// lead-to-trip conversion below IS genuinely "Leads" data (it mutates the
// lead's status), so that one goes through Redux.
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
  const dispatch = useAppDispatch();
  const convertStatus = useAppSelector(selectConvertStatus);
  const convertError = useAppSelector(selectConvertError);

  const [travellers, setTravellers] = useState<Traveller[]>([]);
  const [travellerIds, setTravellerIds] = useState<string[]>([]);
  const [destinationIds, setDestinationIds] = useState<string[]>(() => {
    // lead.destinationId is the EscapePoint's uid; the trip-conversion API
    // wants numeric seqp values (matching the travellerIds pattern below),
    // so resolve the lead's pre-selected destination to its seqp up front.
    const preselected = destinations.find((d) => d.uid === lead.destinationId);
    return preselected ? [String(preselected.seqp)] : [];
  });
  const [startDate, setStartDate] = useState(lead.travelDate ?? "");
  const [numberOfDays, setNumberOfDays] = useState(lead.durationDays ? String(lead.durationDays) : "");
  const [addingTraveller, setAddingTraveller] = useState(false);
  const [newTraveller, setNewTraveller] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [savingTraveller, setSavingTraveller] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();

  useEffect(() => {
    clientApi
      .get<Traveller[]>("/travellers")
      .then((res) => setTravellers(res.data))
      .catch(() => setTravellers([]));
  }, []);

  async function handleAddTraveller() {
    if (!newTraveller.firstName.trim()) return;
    setSavingTraveller(true);
    setFormError(undefined);
    try {
      const res = await clientApi.post<Traveller>("/travellers", newTraveller);
      setTravellers((t) => [...t, res.data]);
      setTravellerIds((ids) => [...ids, String(res.data.seqp)]);
      setNewTraveller({ firstName: "", lastName: "", email: "", phone: "" });
      setAddingTraveller(false);
    } catch (err) {
      setFormError(extractErrorMessage(err, "Failed to add traveller"));
    } finally {
      setSavingTraveller(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (travellerIds.length === 0) {
      setFormError("Add at least one traveller");
      return;
    }
    if (destinationIds.length === 0) {
      setFormError("Select at least one destination");
      return;
    }
    if (!startDate || !numberOfDays) {
      setFormError("Start date and duration are required");
      return;
    }
    setFormError(undefined);
    try {
      const result = await dispatch(
        convertLeadToTrip({
          leadId: lead.seqp,
          travellerIds: travellerIds.map(Number),
          destinationIds: destinationIds.map(Number),
          startDate,
          numberOfDays: Number(numberOfDays),
        }),
      ).unwrap();
      router.push(`/trips/${result.seqp}`);
    } catch {
      // convertError already set in the slice, rendered below.
    }
  }

  const busy = savingTraveller || convertStatus === "loading";
  const displayError = formError ?? convertError;

  return (
    <Modal open onClose={onClose} title="Convert to trip" className="max-w-xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <MultiSelect
          label="Destinations"
          options={destinations.map((d) => ({ value: String(d.seqp), label: d.name }))}
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
              <Button type="button" size="sm" disabled={busy} onClick={handleAddTraveller}>Add traveller</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setAddingTraveller(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {displayError && <p className="text-sm text-danger">{displayError}</p>}

        <div className="flex gap-2">
          <Button type="submit" disabled={busy}>{convertStatus === "loading" ? "Converting…" : "Convert to trip"}</Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}
