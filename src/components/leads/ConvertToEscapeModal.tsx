"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { DatePicker } from "@/components/ui/DatePicker";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { MultiSelect } from "@/components/ui/MultiSelect";
import type { Lead } from "@/lib/leads";
import type { Traveller } from "@/lib/travellers";
import type { EscapePoint } from "@/lib/escape-points";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { countryCodeField, runValidators } from "@/lib/validators";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { convertLeadToEscape } from "@/features/leads/leadsThunks";
import { selectConvertStatus, selectConvertError } from "@/features/leads/leadsSelectors";

// Traveller fetch/create here deliberately stays a direct clientApi call
// rather than a thunk — Travellers is its own module (per the migration
// inventory) and gets its own slice in a later stage; this modal only needs
// a quick picker/inline-create, not full CRUD state management. The actual
// lead-to-escape conversion below IS genuinely "Leads" data (it mutates the
// lead's status), so that one goes through Redux.
export function ConvertToEscapeModal({
  lead,
  escapePoints,
  onClose,
}: {
  lead: Lead;
  escapePoints: EscapePoint[];
  onClose: () => void;
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const convertStatus = useAppSelector(selectConvertStatus);
  const convertError = useAppSelector(selectConvertError);

  const [travellers, setTravellers] = useState<Traveller[]>([]);
  const [travellerIds, setTravellerIds] = useState<string[]>([]);
  const [escapePointIds, setEscapePointIds] = useState<string[]>(() => {
    // lead.escapePointId is the EscapePoint's uid, which is exactly what the
    // escape-conversion API now wants (escapePointUids), so no resolution
    // step is needed beyond confirming it's a valid option.
    const preselected = escapePoints.find((d) => d.uid === lead.escapePointId);
    return preselected ? [preselected.uid] : [];
  });
  const [startDate, setStartDate] = useState(lead.travelDate ?? "");
  const [numberOfDays, setNumberOfDays] = useState(lead.durationDays ? String(lead.durationDays) : "");
  const [addingTraveller, setAddingTraveller] = useState(false);
  const [newTraveller, setNewTraveller] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [savingTraveller, setSavingTraveller] = useState(false);
  const [travellerPhoneError, setTravellerPhoneError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | undefined>();

  useEffect(() => {
    clientApi
      .get<Traveller[]>("/travellers")
      .then((res) => setTravellers(res.data))
      .catch(() => setTravellers([]));
  }, []);

  async function handleAddTraveller() {
    if (!newTraveller.firstName.trim()) return;
    const nextPhoneError = runValidators(newTraveller.phone, [countryCodeField()]);
    if (nextPhoneError) {
      setTravellerPhoneError(nextPhoneError);
      return;
    }
    setTravellerPhoneError(undefined);
    setSavingTraveller(true);
    setFormError(undefined);
    try {
      const res = await clientApi.post<Traveller>("/travellers", newTraveller);
      setTravellers((t) => [...t, res.data]);
      setTravellerIds((ids) => [...ids, res.data.uid]);
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
    if (escapePointIds.length === 0) {
      setFormError("Select at least one escape point");
      return;
    }
    if (!startDate || !numberOfDays) {
      setFormError("Start date and duration are required");
      return;
    }
    setFormError(undefined);
    try {
      const result = await dispatch(
        convertLeadToEscape({
          leadUid: lead.uid,
          travellerUids: travellerIds,
          escapePointUids: escapePointIds,
          startDate,
          numberOfDays: Number(numberOfDays),
        }),
      ).unwrap();
      router.push(`/escapes/${result.uid}`);
    } catch {
      // convertError already set in the slice, rendered below.
    }
  }

  const busy = savingTraveller || convertStatus === "loading";
  const displayError = formError ?? convertError;

  return (
    <Modal open onClose={onClose} title="Convert to escape" className="max-w-xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <MultiSelect
          label="Escape Points"
          options={escapePoints.map((d) => ({ value: d.uid, label: d.name }))}
          value={escapePointIds}
          onChange={setEscapePointIds}
        />

        <div className="grid grid-cols-2 gap-4">
          <DatePicker label="Start date" value={startDate} onChange={setStartDate} required />
          <TextInput label="Number of days" type="number" min={1} value={numberOfDays} onChange={(e) => setNumberOfDays(e.target.value)} required />
        </div>

        <MultiSelect
          label="Travellers"
          options={travellers.map((t) => ({ value: t.uid, label: `${t.firstName} ${t.lastName ?? ""}`.trim() }))}
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
              <PhoneInput
                label="Phone"
                value={newTraveller.phone}
                onChange={(v) => {
                  setNewTraveller((t) => ({ ...t, phone: v }));
                  setTravellerPhoneError(undefined);
                }}
                error={travellerPhoneError}
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" size="sm" disabled={busy} onClick={handleAddTraveller}>Add traveller</Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setAddingTraveller(false);
                  setTravellerPhoneError(undefined);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {displayError && <p className="text-sm text-danger">{displayError}</p>}

        <div className="flex gap-2">
          <Button type="submit" disabled={busy}>{convertStatus === "loading" ? "Converting…" : "Convert to escape"}</Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}
