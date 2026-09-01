"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { IconType } from "react-icons";
import { PiPulseFill, PiUsersFill } from "react-icons/pi";
import { IoMailOutline, IoCallOutline, IoCheckmarkCircle } from "react-icons/io5";
import { Tabs } from "@/components/ui/Tabs";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { TextInput } from "@/components/ui/TextInput";
import { DatePicker } from "@/components/ui/DatePicker";
import { Select } from "@/components/ui/Select";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Body, Caption } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import { ItineraryCard } from "@/components/escapes/ItineraryCard";
import { DealPanel } from "@/components/escapes/DealPanel";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { formatDisplayDateTime } from "@/lib/date";
import { formatAuditActor, formatAuditChange } from "@/lib/audit";
import { countryCodeField, runValidators } from "@/lib/validators";
import { fetchCountryOptions } from "@/lib/reference-data-client";
import type { ReferenceOption } from "@/lib/reference-data-client";
import type { Hotel } from "@/lib/hotels";
import type { Activity } from "@/lib/activities";
import type { Transport } from "@/lib/transports";
import type { ServiceProvider } from "@/lib/service-providers";
import type { Traveller } from "@/lib/travellers";
import type { Deal } from "@/lib/deals";
import type { EscapeAuditLogEntry } from "@/features/escapes/types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchItinerariesForEscape } from "@/features/itineraries/itinerariesThunks";
import { selectItineraries, selectItinerariesStatus } from "@/features/itineraries/itinerariesSelectors";
import { addEscapeTraveller, updateTraveller, deleteTraveller, fetchEscapeById } from "@/features/escapes/escapesThunks";
import { fetchQuotesForItinerary } from "@/features/quotes/quotesThunks";
import { selectQuotesForItinerary } from "@/features/quotes/quotesSelectors";

const TABS = [
  { id: "planning", label: "Planning" },
  { id: "travellers", label: "Travellers" },
  { id: "payments", label: "Payments" },
  { id: "history", label: "History" },
];

function TravellerFact({ icon: Icon, value }: { icon: IconType; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <Icon className="h-3.5 w-3.5 shrink-0" /> {value}
    </span>
  );
}

// Shared name/email/phone fields for both the add-traveller and
// edit-traveller forms, so the two stay visually and behaviorally identical.
const SALUTATION_OPTIONS = [
  { value: "Mr", label: "Mr" },
  { value: "Mrs", label: "Mrs" },
  { value: "Ms", label: "Ms" },
  { value: "Dr", label: "Dr" },
];

const TRAVELLER_TYPE_OPTIONS = [
  { value: "ADULT", label: "Adult" },
  { value: "CHILD", label: "Child" },
  { value: "INFANT", label: "Infant" },
];

function TravellerFormFields({
  type,
  setType,
  salutation,
  setSalutation,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  email,
  setEmail,
  phone,
  setPhone,
  phoneError,
  dateOfBirth,
  setDateOfBirth,
  age,
  setAge,
  nationality,
  setNationality,
  passportNumber,
  setPassportNumber,
  passportExpiry,
  setPassportExpiry,
  passportIssuingCountry,
  setPassportIssuingCountry,
  countryOptions,
}: {
  type: string;
  setType: (v: string) => void;
  salutation: string;
  setSalutation: (v: string) => void;
  firstName: string;
  setFirstName: (v: string) => void;
  lastName: string;
  setLastName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  phoneError?: string;
  dateOfBirth: string;
  setDateOfBirth: (v: string) => void;
  age: string;
  setAge: (v: string) => void;
  nationality: string;
  setNationality: (v: string) => void;
  passportNumber: string;
  setPassportNumber: (v: string) => void;
  passportExpiry: string;
  setPassportExpiry: (v: string) => void;
  passportIssuingCountry: string;
  setPassportIssuingCountry: (v: string) => void;
  countryOptions: ReferenceOption[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Select label="Type" options={TRAVELLER_TYPE_OPTIONS} value={type} onChange={(e) => setType(e.target.value)} placeholder="—" />
        <Select label="Salutation" options={SALUTATION_OPTIONS} value={salutation} onChange={(e) => setSalutation(e.target.value)} placeholder="—" />
        <TextInput label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        <TextInput label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        <TextInput label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <PhoneInput label="Phone" value={phone} onChange={setPhone} defaultCountry="IN" error={phoneError} />
        <DatePicker label="Date of birth" value={dateOfBirth} onChange={setDateOfBirth} />
        <TextInput label="Age" type="number" min={0} value={age} onChange={(e) => setAge(e.target.value)} />
        {/* Stored/matched by country name, not code like Issuing country below
            — nationality was a free-text field before this dropdown, so
            existing saved values (a name, e.g. "India") still round-trip. */}
        <Select
          label="Nationality"
          options={countryOptions.map((c) => ({ value: c.label, label: c.label }))}
          value={nationality}
          onChange={(e) => setNationality(e.target.value)}
          placeholder="Select a country"
        />
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-3">
        <Caption className="font-medium text-foreground">Passport / travel document</Caption>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <TextInput label="Passport number" value={passportNumber} onChange={(e) => setPassportNumber(e.target.value)} />
          <DatePicker label="Passport expiry" value={passportExpiry} onChange={setPassportExpiry} />
          <div className="sm:col-span-2">
            <Select
              label="Issuing country"
              options={countryOptions.map((c) => ({ value: c.code, label: c.label }))}
              value={passportIssuingCountry}
              onChange={(e) => setPassportIssuingCountry(e.target.value)}
              placeholder="Select a country"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function TravellerCard({
  escapeUid,
  traveller,
  isPrimary,
  countryOptions,
  onUpdated,
}: {
  escapeUid: string;
  traveller: Traveller;
  isPrimary: boolean;
  countryOptions: ReferenceOption[];
  onUpdated: () => void;
}) {
  const dispatch = useAppDispatch();
  const [editing, setEditing] = useState(false);
  const [type, setType] = useState(traveller.type ?? "");
  const [salutation, setSalutation] = useState(traveller.salutation ?? "");
  const [firstName, setFirstName] = useState(traveller.firstName);
  const [lastName, setLastName] = useState(traveller.lastName ?? "");
  const [email, setEmail] = useState(traveller.email ?? "");
  const [phone, setPhone] = useState(traveller.phone ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(traveller.dateOfBirth ?? "");
  const [age, setAge] = useState(traveller.age != null ? String(traveller.age) : "");
  const [nationality, setNationality] = useState(traveller.nationality ?? "");
  const [passportNumber, setPassportNumber] = useState(traveller.passportNumber ?? "");
  const [passportExpiry, setPassportExpiry] = useState(traveller.passportExpiry ?? "");
  const [passportIssuingCountry, setPassportIssuingCountry] = useState(traveller.passportIssuingCountry ?? "");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const [phoneError, setPhoneError] = useState<string | undefined>();

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | undefined>();

  const name = [traveller.salutation, traveller.firstName, traveller.lastName].filter(Boolean).join(" ");

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(undefined);
    try {
      await dispatch(deleteTraveller({ escapeUid, travellerUid: traveller.uid })).unwrap();
      dispatch(fetchEscapeById(escapeUid));
      onUpdated();
      setConfirmingDelete(false);
    } catch (err) {
      setDeleteError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to delete traveller"));
    } finally {
      setDeleting(false);
    }
  }

  function startEdit() {
    setType(traveller.type ?? "");
    setSalutation(traveller.salutation ?? "");
    setFirstName(traveller.firstName);
    setLastName(traveller.lastName ?? "");
    setEmail(traveller.email ?? "");
    setPhone(traveller.phone ?? "");
    setDateOfBirth(traveller.dateOfBirth ?? "");
    setAge(traveller.age != null ? String(traveller.age) : "");
    setNationality(traveller.nationality ?? "");
    setPassportNumber(traveller.passportNumber ?? "");
    setPassportExpiry(traveller.passportExpiry ?? "");
    setPassportIssuingCountry(traveller.passportIssuingCountry ?? "");
    setFormError(undefined);
    setPhoneError(undefined);
    setEditing(true);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!firstName.trim()) return;
    const nextPhoneError = runValidators(phone, [countryCodeField()]);
    if (nextPhoneError) {
      setPhoneError(nextPhoneError);
      return;
    }
    setPhoneError(undefined);
    setSaving(true);
    setFormError(undefined);
    try {
      await dispatch(
        updateTraveller({
          travellerUid: traveller.uid,
          type: type || undefined,
          salutation: salutation || undefined,
          firstName: firstName.trim(),
          lastName: lastName.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          dateOfBirth: dateOfBirth || undefined,
          age: age ? Number(age) : undefined,
          nationality: nationality.trim() || undefined,
          passportNumber: passportNumber.trim() || undefined,
          passportExpiry: passportExpiry || undefined,
          passportIssuingCountry: passportIssuingCountry || undefined,
        }),
      ).unwrap();
      dispatch(fetchEscapeById(escapeUid));
      onUpdated();
      setEditing(false);
    } catch (err) {
      setFormError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to update traveller"));
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <Card>
        <form onSubmit={handleSave} className="flex flex-col gap-2">
          <TravellerFormFields
            type={type}
            setType={setType}
            salutation={salutation}
            setSalutation={setSalutation}
            firstName={firstName}
            setFirstName={setFirstName}
            lastName={lastName}
            setLastName={setLastName}
            email={email}
            setEmail={setEmail}
            phone={phone}
            setPhone={(v) => {
              setPhone(v);
              setPhoneError(undefined);
            }}
            phoneError={phoneError}
            dateOfBirth={dateOfBirth}
            setDateOfBirth={setDateOfBirth}
            age={age}
            setAge={setAge}
            nationality={nationality}
            setNationality={setNationality}
            passportNumber={passportNumber}
            setPassportNumber={setPassportNumber}
            passportExpiry={passportExpiry}
            setPassportExpiry={setPassportExpiry}
            passportIssuingCountry={passportIssuingCountry}
            setPassportIssuingCountry={setPassportIssuingCountry}
            countryOptions={countryOptions}
          />
          {formError && <p className="text-xs text-danger">{formError}</p>}
          <div className="flex gap-1.5">
            <Button type="submit" size="sm" disabled={saving} loading={saving} loadingText="Saving…">
              Save changes
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={saving} onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    );
  }

  const typeLabel = TRAVELLER_TYPE_OPTIONS.find((t) => t.value === traveller.type)?.label;

  return (
    <Card variant="elevated" className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar name={name} />
          <span className="truncate text-sm font-semibold text-foreground">{name}</span>
          {typeLabel && <Badge tone="neutral">{typeLabel}</Badge>}
          {isPrimary && (
            <Badge tone="success" icon={IoCheckmarkCircle}>
              Primary
            </Badge>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={startEdit}>
            Edit
          </Button>
          {!isPrimary && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-danger hover:bg-danger/10"
              onClick={() => setConfirmingDelete(true)}
            >
              Delete
            </Button>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:gap-x-5 sm:gap-y-1.5">
        <TravellerFact icon={IoMailOutline} value={traveller.email} />
        <TravellerFact icon={IoCallOutline} value={traveller.phone} />
      </div>

      <Modal
        open={confirmingDelete}
        onClose={() => !deleting && setConfirmingDelete(false)}
        title="Remove traveller"
      >
        <div className="flex flex-col gap-3">
          <Body>
            Remove <span className="font-medium text-foreground">{name}</span> from this escape? This can&apos;t be undone.
          </Body>
          {deleteError && <p className="text-sm text-danger">{deleteError}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" disabled={deleting} onClick={() => setConfirmingDelete(false)}>
              Cancel
            </Button>
            <Button type="button" variant="danger" disabled={deleting} loading={deleting} loadingText="Removing…" onClick={handleDelete}>
              Remove
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}

// Collects the details of a traveller the lead mentioned at intake but
// whose name/email/phone were never captured — a plain uncontrolled-ish
// local form, same shape as ItineraryManagementCard's "Add itinerary" box.
// atCapacity: the lead only mentioned N travellers total (1 already
// captured at lead creation, the rest collected here) — once that many
// traveller records exist, adding more isn't offered.
function AddTravellerForm({
  escapeUid,
  atCapacity,
  countryOptions,
  onAdded,
}: {
  escapeUid: string;
  atCapacity: boolean;
  countryOptions: ReferenceOption[];
  onAdded: () => void;
}) {
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("");
  const [salutation, setSalutation] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [age, setAge] = useState("");
  const [nationality, setNationality] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [passportExpiry, setPassportExpiry] = useState("");
  const [passportIssuingCountry, setPassportIssuingCountry] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const [phoneError, setPhoneError] = useState<string | undefined>();

  function reset() {
    setType("");
    setSalutation("");
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setDateOfBirth("");
    setAge("");
    setNationality("");
    setPassportNumber("");
    setPassportExpiry("");
    setPassportIssuingCountry("");
    setFormError(undefined);
    setPhoneError(undefined);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!firstName.trim()) return;
    const nextPhoneError = runValidators(phone, [countryCodeField()]);
    if (nextPhoneError) {
      setPhoneError(nextPhoneError);
      return;
    }
    setPhoneError(undefined);
    setSaving(true);
    setFormError(undefined);
    try {
      await dispatch(
        addEscapeTraveller({
          escapeUid,
          type: type || undefined,
          salutation: salutation || undefined,
          firstName: firstName.trim(),
          lastName: lastName.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          dateOfBirth: dateOfBirth || undefined,
          age: age ? Number(age) : undefined,
          nationality: nationality.trim() || undefined,
          passportNumber: passportNumber.trim() || undefined,
          passportExpiry: passportExpiry || undefined,
          passportIssuingCountry: passportIssuingCountry || undefined,
        }),
      ).unwrap();
      dispatch(fetchEscapeById(escapeUid));
      onAdded();
      reset();
      setOpen(false);
    } catch (err) {
      setFormError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to add traveller"));
    } finally {
      setSaving(false);
    }
  }

  if (atCapacity) {
    return <Caption>All mentioned travellers have been added.</Caption>;
  }

  if (!open) {
    return (
      <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(true)}>
        + Add traveller
      </Button>
    );
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <TravellerFormFields
          type={type}
          setType={setType}
          salutation={salutation}
          setSalutation={setSalutation}
          firstName={firstName}
          setFirstName={setFirstName}
          lastName={lastName}
          setLastName={setLastName}
          email={email}
          setEmail={setEmail}
          phone={phone}
          setPhone={(v) => {
            setPhone(v);
            setPhoneError(undefined);
          }}
          phoneError={phoneError}
          dateOfBirth={dateOfBirth}
          setDateOfBirth={setDateOfBirth}
          age={age}
          setAge={setAge}
          nationality={nationality}
          setNationality={setNationality}
          passportNumber={passportNumber}
          setPassportNumber={setPassportNumber}
          passportExpiry={passportExpiry}
          setPassportExpiry={setPassportExpiry}
          passportIssuingCountry={passportIssuingCountry}
          setPassportIssuingCountry={setPassportIssuingCountry}
          countryOptions={countryOptions}
        />
        {formError && <p className="text-xs text-danger">{formError}</p>}
        <div className="flex gap-1.5">
          <Button type="submit" size="sm" disabled={saving} loading={saving} loadingText="Saving…">
            Save traveller
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={saving}
            onClick={() => {
              reset();
              setOpen(false);
            }}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

// The center workspace for an Escape. Planning re-activates the existing
// ItineraryCard detail view (items/content/quotes) — it deliberately does
// NOT dispatch fetchItinerariesForEscape itself, since ItineraryManagementCard
// (right panel, untouched) already owns that fetch and both are mounted on
// the same page; dispatching it again here would be a duplicate GET on every
// load. onChanged below only re-fetches after a user-triggered mutation
// (new version/delete), same pattern the right panel already uses.
export function EscapeWorkspaceTabs({
  escapeUid,
  hotels,
  activities,
  transports,
  serviceProviders,
  escapeStartDate,
  numberOfDays,
  travellers,
  primaryTravellerUid,
  leadTravellerCount,
  auditLog,
  deal,
  onDealChanged,
  selectedItineraryUid,
  onSelectItinerary,
}: {
  escapeUid: string;
  hotels: Hotel[];
  activities: Activity[];
  transports: Transport[];
  serviceProviders: ServiceProvider[];
  escapeStartDate: string | null;
  numberOfDays: number | null;
  travellers: Traveller[];
  // uid of the traveller established as primary at escape-creation time —
  // null for escapes created before this field existed, in which case no
  // traveller is badged/protected (see Escape.primaryTravellerUid).
  primaryTravellerUid: string | null;
  // Traveller count the lead gave at intake (Lead.numberOfPeople) — may
  // differ from travellers.length, since that's how many full traveller
  // records have actually been added since. Shown alongside the list for
  // context, not treated as a target the record count must match.
  leadTravellerCount: number | null;
  auditLog: EscapeAuditLogEntry[] | null;
  deal: Deal | null;
  onDealChanged?: () => void;
  /** Which itinerary the Planning tab renders — same selection the right
   * rail's Itineraries list drives, so only one itinerary's day-plan/terms/
   * quotes show at a time instead of every itinerary on the escape stacked
   * on top of each other. */
  selectedItineraryUid: string | null;
  onSelectItinerary: (uid: string) => void;
}) {
  const dispatch = useAppDispatch();
  const itineraries = useAppSelector(selectItineraries);
  const itinerariesStatus = useAppSelector(selectItinerariesStatus);

  // Fetched once here (rather than per-traveller-form) since every traveller
  // add/edit form on this tab needs the same country list for the passport
  // issuing-country picker.
  const [countryOptions, setCountryOptions] = useState<ReferenceOption[]>([]);
  useEffect(() => {
    fetchCountryOptions().then(setCountryOptions).catch(() => { });
  }, []);

  function refreshItineraries() {
    dispatch(fetchItinerariesForEscape(escapeUid));
  }

  const sortedItineraries = itineraries.slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));

  const activeItinerary =
    sortedItineraries.find((i) => i.uid === selectedItineraryUid) ?? sortedItineraries[0] ?? null;

  useEffect(() => {
    if (activeItinerary && activeItinerary.uid !== selectedItineraryUid) {
      onSelectItinerary(activeItinerary.uid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeItinerary]);

  // Quotes for whichever itinerary is selected — only needed here to show
  // its name alongside the itinerary's own, next to the top-level tabs
  // (scoped to the selection, not to ItineraryCard's own inner sub-tabs).
  const quotes = useAppSelector((s) => (activeItinerary ? selectQuotesForItinerary(s, activeItinerary.uid) : []));
  useEffect(() => {
    if (activeItinerary) dispatch(fetchQuotesForItinerary(activeItinerary.uid));
  }, [dispatch, activeItinerary]);
  const latestQuote = quotes.slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0))[0];

  const selectionAside = activeItinerary && (
    <div className="flex shrink-0 items-start gap-4">
      <div className="flex max-w-[9rem] shrink-0 flex-col">
        <span className="whitespace-nowrap text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Itinerary</span>
        <span className="truncate whitespace-nowrap text-sm font-semibold text-foreground">{activeItinerary.name}</span>
      </div>
      <div className="flex max-w-[9rem] shrink-0 flex-col">
        <span className="whitespace-nowrap text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Quote</span>
        <span className="truncate whitespace-nowrap text-sm font-semibold text-foreground">
          {latestQuote ? latestQuote.name ?? `Quote ${latestQuote.version}` : "No quotes yet"}
        </span>
      </div>
    </div>
  );

  return (
    <div className="flex min-w-0 flex-col gap-2 lg:h-full lg:min-h-0">
      <Tabs tabs={TABS} defaultTab="planning" aside={selectionAside}>
        {(active) => {
          if (active === "planning") {
            if (itinerariesStatus === "loading" && itineraries.length === 0) {
              return <LoadingState label="Loading itineraries…" />;
            }
            if (sortedItineraries.length === 0) {
              return (
                <EmptyState
                  icon={PiPulseFill}
                  title="No itineraries yet"
                  description="Add one from the Itineraries panel to start planning."
                />
              );
            }
            if (!activeItinerary) return null;
            return (
              <ItineraryCard
                key={activeItinerary.uid}
                itinerary={activeItinerary}
                escapeUid={escapeUid}
                hotels={hotels}
                activities={activities}
                transports={transports}
                serviceProviders={serviceProviders}
                escapeStartDate={escapeStartDate}
                numberOfDays={numberOfDays}
                onChanged={refreshItineraries}
                onDealChanged={onDealChanged}
              />
            );
          }

          if (active === "travellers") {
            const countLabel =
              leadTravellerCount != null
                ? `${leadTravellerCount} traveller${leadTravellerCount === 1 ? "" : "s"} mentioned at lead intake`
                : null;
            const atCapacity = leadTravellerCount != null && travellers.length >= leadTravellerCount;

            if (travellers.length === 0) {
              return (
                <div className="flex flex-col gap-3">
                  {countLabel && <Caption>{countLabel}</Caption>}
                  <EmptyState
                    icon={PiUsersFill}
                    title="No travellers yet"
                    description="Traveller details will appear here once they're added to this escape."
                  />
                  <AddTravellerForm escapeUid={escapeUid} atCapacity={atCapacity} countryOptions={countryOptions} onAdded={() => { }} />
                </div>
              );
            }
            return (
              <div className="flex flex-col gap-3">
                {countLabel && (
                  <div className="flex items-center justify-between">
                    <Caption className="font-semibold">Traveller details</Caption>
                    <Caption>{countLabel}</Caption>
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  {travellers.map((traveller) => (
                    <TravellerCard
                      key={traveller.uid}
                      escapeUid={escapeUid}
                      traveller={traveller}
                      isPrimary={traveller.uid === primaryTravellerUid}
                      countryOptions={countryOptions}
                      onUpdated={() => { }}
                    />
                  ))}
                </div>
                <AddTravellerForm escapeUid={escapeUid} atCapacity={atCapacity} countryOptions={countryOptions} onAdded={() => { }} />
              </div>
            );
          }

          if (active === "payments") {
            if (!deal) {
              return (
                <EmptyState
                  icon={PiPulseFill}
                  title="No deal yet"
                  description="Accept a quote from the Planning tab to start tracking payment milestones."
                />
              );
            }
            return <DealPanel deal={deal} />;
          }

          // history
          if (!auditLog || auditLog.length === 0) {
            return <Body muted>No history yet.</Body>;
          }
          return (
            <div className="flex flex-col">
              {auditLog.map((entry, i) => {
                const change = formatAuditChange(entry.previousValue, entry.newValue);
                const isCancelled = entry.action.toUpperCase().includes("CANCEL");
                return (
                  <div key={i} className="relative flex gap-3 pb-4 pl-1 last:pb-0">
                    {i < auditLog.length - 1 && (
                      <span className="absolute left-[12px] top-6 h-full w-1 bg-border" aria-hidden="true" />
                    )}
                    <span className={`relative z-10 mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${isCancelled ? "bg-danger/15" : "bg-primary/15"}`}>
                      <span className={`h-2 w-2 rounded-full ${isCancelled ? "bg-danger" : "bg-primary"}`} />
                    </span>
                    <div className="min-w-0 flex-1 rounded-lg border border-border/60 bg-muted/40 p-2.5">
                      <Body className="font-medium flex justify-between">{entry.action}
                        <div>{formatDisplayDateTime(entry.createdAt)}</div>
                      </Body>
                      {change && <Body className="text-sm text-muted-foreground">{change}</Body>}
                      <Caption>
                        by {formatAuditActor(entry.performedByName)}
                      </Caption>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        }}
      </Tabs>
    </div>
  );
}
