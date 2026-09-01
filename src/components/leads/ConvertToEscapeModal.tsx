"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { DatePicker } from "@/components/ui/DatePicker";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { Badge } from "@/components/ui/Badge";
import { Caption } from "@/components/ui/Typography";
import type { Lead } from "@/lib/leads";
import type { Traveller } from "@/lib/travellers";
import type { EscapePoint } from "@/lib/escape-points";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { countryCodeField, runValidators } from "@/lib/validators";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { convertLeadToEscape } from "@/features/leads/leadsThunks";
import { selectConvertStatus, selectConvertError } from "@/features/leads/leadsSelectors";

const emptyTravellerForm = { firstName: "", lastName: "", email: "", phone: "" };
type TravellerFormState = typeof emptyTravellerForm;

// Traveller creation here deliberately stays a direct clientApi call rather
// than a thunk — Travellers is its own module (per the migration inventory)
// and gets its own slice in a later stage; this modal only needs to create
// exactly as many travellers as the lead calls for. The actual
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

  // The Lead already carries its Escape Point and traveller count — this
  // popup shouldn't ask for either again, it just uses what's on the lead.
  // Leads can name their escape point two ways (see LeadsPanel's form): a
  // direct library link (escapePointId) or free text (destination) typed
  // instead of picking one — fall back to matching that text against the
  // library by name so leads created either way still resolve here.
  const leadEscapePoint =
    escapePoints.find((d) => d.uid === lead.escapePointId) ??
    escapePoints.find((d) => lead.destination && d.name.trim().toLowerCase() === lead.destination.trim().toLowerCase());
  const travellerCount = Math.max(1, lead.numberOfPeople ?? 1);

  const [travellerForms, setTravellerForms] = useState<TravellerFormState[]>(() =>
    Array.from({ length: travellerCount }, () => ({ ...emptyTravellerForm })),
  );
  const [travellerErrors, setTravellerErrors] = useState<Record<number, string>>({});
  const [startDate, setStartDate] = useState(lead.travelDate ?? "");
  const [numberOfDays, setNumberOfDays] = useState(lead.durationDays ? String(lead.durationDays) : "");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();

  function updateTraveller(index: number, field: keyof TravellerFormState, value: string) {
    setTravellerForms((forms) => forms.map((f, i) => (i === index ? { ...f, [field]: value } : f)));
    setTravellerErrors((errs) => ({ ...errs, [index]: "" }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!leadEscapePoint) {
      setFormError("This lead has no escape point assigned");
      return;
    }
    if (!startDate || !numberOfDays) {
      setFormError("Start date and duration are required");
      return;
    }

    const nextErrors: Record<number, string> = {};
    travellerForms.forEach((f, i) => {
      if (!f.firstName.trim()) {
        nextErrors[i] = "First name is required";
        return;
      }
      const phoneErr = runValidators(f.phone, [countryCodeField()]);
      if (phoneErr) nextErrors[i] = phoneErr;
    });
    if (Object.keys(nextErrors).length > 0) {
      setTravellerErrors(nextErrors);
      return;
    }

    setFormError(undefined);
    setSaving(true);
    let created: Traveller[];
    try {
      created = await Promise.all(
        travellerForms.map((f) => clientApi.post<Traveller>("/travellers", f).then((res) => res.data)),
      );
    } catch (err) {
      setFormError(extractErrorMessage(err, "Failed to create travellers"));
      setSaving(false);
      return;
    }

    try {
      const result = await dispatch(
        convertLeadToEscape({
          leadUid: lead.uid,
          travellerUids: created.map((t) => t.uid),
          escapePointUids: [leadEscapePoint.uid],
          startDate,
          numberOfDays: Number(numberOfDays),
        }),
      ).unwrap();
      router.push(`/escapes/${result.uid}`);
    } catch {
      // convertError already set in the slice, rendered below.
    } finally {
      setSaving(false);
    }
  }

  const busy = saving || convertStatus === "loading";
  const displayError = formError ?? convertError;

  return (
    <Modal open onClose={onClose} title="Convert to escape" className="max-w-xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <Caption>Escape Point</Caption>
          <div className="mt-1">
            {leadEscapePoint ? (
              <Badge tone="neutral">{leadEscapePoint.name}</Badge>
            ) : (
              <span className="text-sm text-danger">This lead has no escape point assigned</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <DatePicker label="Start date" value={startDate} onChange={setStartDate} required />
          <TextInput label="Number of days" type="number" min={1} value={numberOfDays} onChange={(e) => setNumberOfDays(e.target.value)} required />
        </div>

        <div className="flex flex-col gap-3">
          <Caption>Travellers ({travellerCount})</Caption>
          {travellerForms.map((f, i) => (
            <div key={i} className="flex flex-col gap-3 rounded border border-border p-3">
              <div className="text-sm font-medium text-foreground">Traveller {i + 1}</div>
              <div className="grid grid-cols-2 gap-3">
                <TextInput
                  label="First name"
                  value={f.firstName}
                  onChange={(e) => updateTraveller(i, "firstName", e.target.value)}
                  error={travellerErrors[i] === "First name is required" ? travellerErrors[i] : undefined}
                  required
                />
                <TextInput label="Last name" value={f.lastName} onChange={(e) => updateTraveller(i, "lastName", e.target.value)} />
                <TextInput label="Email" type="email" value={f.email} onChange={(e) => updateTraveller(i, "email", e.target.value)} />
                <PhoneInput
                  label="Phone"
                  value={f.phone}
                  onChange={(v) => updateTraveller(i, "phone", v)}
                  error={travellerErrors[i] && travellerErrors[i] !== "First name is required" ? travellerErrors[i] : undefined}
                />
              </div>
            </div>
          ))}
        </div>

        {displayError && <p className="text-sm text-danger">{displayError}</p>}

        <div className="flex gap-2">
          <Button type="submit" disabled={busy}>{convertStatus === "loading" ? "Converting…" : "Convert to escape"}</Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}
