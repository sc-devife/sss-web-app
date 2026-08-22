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

function TravellerFormFields({
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
  dateOfBirth,
  setDateOfBirth,
  nationality,
  setNationality,
}: {
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
  dateOfBirth: string;
  setDateOfBirth: (v: string) => void;
  nationality: string;
  setNationality: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <Select label="Salutation" options={SALUTATION_OPTIONS} value={salutation} onChange={(e) => setSalutation(e.target.value)} placeholder="—" />
      <TextInput label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
      <TextInput label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
      <TextInput label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <PhoneInput label="Phone" value={phone} onChange={setPhone} defaultCountry="IN" />
      <TextInput label="Date of birth" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
      <TextInput label="Nationality" value={nationality} onChange={(e) => setNationality(e.target.value)} />
    </div>
  );
}

function TravellerCard({
  escapeUid,
  traveller,
  isPrimary,
  onUpdated,
}: {
  escapeUid: string;
  traveller: Traveller;
  isPrimary: boolean;
  onUpdated: () => void;
}) {
  const dispatch = useAppDispatch();
  const [editing, setEditing] = useState(false);
  const [salutation, setSalutation] = useState(traveller.salutation ?? "");
  const [firstName, setFirstName] = useState(traveller.firstName);
  const [lastName, setLastName] = useState(traveller.lastName ?? "");
  const [email, setEmail] = useState(traveller.email ?? "");
  const [phone, setPhone] = useState(traveller.phone ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(traveller.dateOfBirth ?? "");
  const [nationality, setNationality] = useState(traveller.nationality ?? "");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();

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
    setSalutation(traveller.salutation ?? "");
    setFirstName(traveller.firstName);
    setLastName(traveller.lastName ?? "");
    setEmail(traveller.email ?? "");
    setPhone(traveller.phone ?? "");
    setDateOfBirth(traveller.dateOfBirth ?? "");
    setNationality(traveller.nationality ?? "");
    setFormError(undefined);
    setEditing(true);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!firstName.trim()) return;
    setSaving(true);
    setFormError(undefined);
    try {
      await dispatch(
        updateTraveller({
          travellerUid: traveller.uid,
          salutation: salutation || undefined,
          firstName: firstName.trim(),
          lastName: lastName.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          dateOfBirth: dateOfBirth || undefined,
          nationality: nationality.trim() || undefined,
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
            salutation={salutation}
            setSalutation={setSalutation}
            firstName={firstName}
            setFirstName={setFirstName}
            lastName={lastName}
            setLastName={setLastName}
            email={email}
            setEmail={setEmail}
            phone={phone}
            setPhone={setPhone}
            dateOfBirth={dateOfBirth}
            setDateOfBirth={setDateOfBirth}
            nationality={nationality}
            setNationality={setNationality}
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

  return (
    <Card variant="elevated" className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar name={name} />
          <span className="truncate text-sm font-semibold text-foreground">{name}</span>
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
  onAdded,
}: {
  escapeUid: string;
  atCapacity: boolean;
  onAdded: () => void;
}) {
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const [salutation, setSalutation] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [nationality, setNationality] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();

  function reset() {
    setSalutation("");
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setDateOfBirth("");
    setNationality("");
    setFormError(undefined);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!firstName.trim()) return;
    setSaving(true);
    setFormError(undefined);
    try {
      await dispatch(
        addEscapeTraveller({
          escapeUid,
          salutation: salutation || undefined,
          firstName: firstName.trim(),
          lastName: lastName.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          dateOfBirth: dateOfBirth || undefined,
          nationality: nationality.trim() || undefined,
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
          salutation={salutation}
          setSalutation={setSalutation}
          firstName={firstName}
          setFirstName={setFirstName}
          lastName={lastName}
          setLastName={setLastName}
          email={email}
          setEmail={setEmail}
          phone={phone}
          setPhone={setPhone}
          dateOfBirth={dateOfBirth}
          setDateOfBirth={setDateOfBirth}
          nationality={nationality}
          setNationality={setNationality}
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
                  <AddTravellerForm escapeUid={escapeUid} atCapacity={atCapacity} onAdded={() => { }} />
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
                      onUpdated={() => { }}
                    />
                  ))}
                </div>
                <AddTravellerForm escapeUid={escapeUid} atCapacity={atCapacity} onAdded={() => { }} />
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
                return (
                  <div key={i} className="relative flex gap-3 pb-4 pl-1 last:pb-0">
                    {i < auditLog.length - 1 && (
                      <span className="absolute left-[9px] top-6 h-full w-px bg-border" aria-hidden="true" />
                    )}
                    <span className="relative z-10 mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    </span>
                    <div className="min-w-0 flex-1 rounded-lg border border-border/60 bg-muted/40 p-2.5">
                      <Body className="font-medium">{entry.action}</Body>
                      {change && <Body className="text-sm text-muted-foreground">{change}</Body>}
                      <Caption>
                        by {formatAuditActor(entry.performedByName)}, {formatDisplayDateTime(entry.createdAt)}
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
