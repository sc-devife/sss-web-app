"use client";

import { useEffect, useRef } from "react";
import { TextInput } from "@/components/ui/TextInput";
import { Select } from "@/components/ui/Select";
import { Caption } from "@/components/ui/Typography";
import { MODE_OPTIONS, VEHICLE_TYPE_OPTIONS } from "@/lib/transport-modes";
import type { TransportDetail, TransportLeg } from "@/lib/itinerary-items";
import { cn } from "@/lib/cn";

export interface TransportLegFormState {
  direction: "onward" | "return" | null;
  departureAirport: string;
  departureTerminal: string;
  departureTime: string; // datetime-local value: "YYYY-MM-DDTHH:mm"
  arrivalAirport: string;
  arrivalTerminal: string;
  arrivalTime: string;
  flightNumber: string;
}

export interface TransportDetailFormState {
  modeCode: string;
  vehicleTypeCode: string;
  price: string;
  tripType: "one_way" | "round_trip" | "multi_city";
  costPrice: string;
  costPricePerPerson: boolean;
  sellingPrice: string;
  sellingPricePerPerson: boolean;
  adultsCount: string;
  childrenCount: string;
  infantsCount: string;
  additionalOptions: string;
  legs: TransportLegFormState[];
}

export function emptyLeg(direction: TransportLegFormState["direction"] = null): TransportLegFormState {
  return {
    direction,
    departureAirport: "",
    departureTerminal: "",
    departureTime: "",
    arrivalAirport: "",
    arrivalTerminal: "",
    arrivalTime: "",
    flightNumber: "",
  };
}

export function emptyTransportDetailForm(): TransportDetailFormState {
  return {
    modeCode: "",
    vehicleTypeCode: "",
    price: "",
    tripType: "one_way",
    costPrice: "",
    costPricePerPerson: false,
    sellingPrice: "",
    sellingPricePerPerson: false,
    adultsCount: "",
    childrenCount: "",
    infantsCount: "",
    additionalOptions: "",
    legs: [emptyLeg()],
  };
}

function legsForTripType(
  tripType: TransportDetailFormState["tripType"],
  existing: TransportLegFormState[],
): TransportLegFormState[] {
  // Preserves already-entered leg data across a trip-type switch, but always
  // relabels direction to match the new type — otherwise a leg carried over
  // from "one way" keeps a stale null direction and renders as "Leg 1"
  // instead of "Onward" once Round Trip is picked.
  if (tripType === "one_way") {
    const [first] = existing;
    return [first ? { ...first, direction: null } : emptyLeg()];
  }
  if (tripType === "round_trip") {
    const [first, second] = existing;
    return [
      first ? { ...first, direction: "onward" } : emptyLeg("onward"),
      second ? { ...second, direction: "return" } : emptyLeg("return"),
    ];
  }
  const withoutDirection = existing.map((leg) => ({ ...leg, direction: null }));
  return withoutDirection.length >= 2 ? withoutDirection : [withoutDirection[0] ?? emptyLeg(), emptyLeg()];
}

// Converts saved response data into editable form state (strings for every
// numeric/date field, matching the rest of this codebase's form convention).
export function fromTransportDetail(detail: TransportDetail | null): TransportDetailFormState {
  if (!detail) return emptyTransportDetailForm();
  return {
    modeCode: detail.modeCode ?? "",
    vehicleTypeCode: detail.vehicleTypeCode ?? "",
    price: detail.price != null ? String(detail.price) : "",
    tripType: detail.tripType ?? "one_way",
    costPrice: detail.costPrice != null ? String(detail.costPrice) : "",
    costPricePerPerson: !!detail.costPricePerPerson,
    sellingPrice: detail.sellingPrice != null ? String(detail.sellingPrice) : "",
    sellingPricePerPerson: !!detail.sellingPricePerPerson,
    adultsCount: detail.adultsCount != null ? String(detail.adultsCount) : "",
    childrenCount: detail.childrenCount != null ? String(detail.childrenCount) : "",
    infantsCount: detail.infantsCount != null ? String(detail.infantsCount) : "",
    additionalOptions: detail.additionalOptions ?? "",
    legs:
      detail.legs && detail.legs.length > 0
        ? detail.legs.map((leg) => ({
            direction: leg.direction,
            departureAirport: leg.departureAirport ?? "",
            departureTerminal: leg.departureTerminal ?? "",
            departureTime: leg.departureTime ? leg.departureTime.slice(0, 16) : "",
            arrivalAirport: leg.arrivalAirport ?? "",
            arrivalTerminal: leg.arrivalTerminal ?? "",
            arrivalTime: leg.arrivalTime ? leg.arrivalTime.slice(0, 16) : "",
            flightNumber: leg.flightNumber ?? "",
          }))
        : [emptyLeg()],
  };
}

// Converts form state back to the API shape. Returns undefined when no mode
// has been picked at all, so the caller can omit transportDetail entirely
// rather than sending an empty object.
export function toTransportDetailPayload(form: TransportDetailFormState): TransportDetail | undefined {
  if (!form.modeCode) return undefined;
  const isFlight = form.modeCode === "flight";
  const legs: TransportLeg[] = isFlight
    ? form.legs.map((leg, i) => ({
        legOrder: i,
        direction: leg.direction,
        departureAirport: leg.departureAirport || null,
        departureTerminal: leg.departureTerminal || null,
        departureTime: leg.departureTime ? `${leg.departureTime}:00` : null,
        arrivalAirport: leg.arrivalAirport || null,
        arrivalTerminal: leg.arrivalTerminal || null,
        arrivalTime: leg.arrivalTime ? `${leg.arrivalTime}:00` : null,
        flightNumber: leg.flightNumber || null,
      }))
    : [];
  return {
    modeCode: form.modeCode,
    vehicleTypeCode: form.vehicleTypeCode || null,
    price: form.price ? Number(form.price) : null,
    tripType: isFlight ? form.tripType : null,
    costPrice: form.costPrice ? Number(form.costPrice) : null,
    costPricePerPerson: form.costPricePerPerson,
    sellingPrice: form.sellingPrice ? Number(form.sellingPrice) : null,
    sellingPricePerPerson: form.sellingPricePerPerson,
    adultsCount: form.adultsCount ? Number(form.adultsCount) : null,
    childrenCount: form.childrenCount ? Number(form.childrenCount) : null,
    infantsCount: form.infantsCount ? Number(form.infantsCount) : null,
    additionalOptions: form.additionalOptions || null,
    legs,
  };
}

const TRIP_TYPES: { value: TransportDetailFormState["tripType"]; label: string }[] = [
  { value: "one_way", label: "One Way" },
  { value: "round_trip", label: "Round Trip" },
  { value: "multi_city", label: "Multi City" },
];

// The dynamic-by-mode field block for a transport booking: Mode / Vehicle
// type / Price always show; picking Flight swaps Price for the richer
// trip-type + per-leg + cost/selling pricing set from the reference
// screenshot. Every other mode stays at the simple common set — see the
// plan's scoping note on why only Flight gets extra fields for now.
export function TransportDetailFields({
  value,
  onChange,
  defaultPax,
}: {
  value: TransportDetailFormState;
  onChange: (next: TransportDetailFormState) => void;
  defaultPax: { adults: number; children: number; infants: number };
}) {
  function update<K extends keyof TransportDetailFormState>(key: K, v: TransportDetailFormState[K]) {
    onChange({ ...value, [key]: v });
  }

  function updateLeg(index: number, patch: Partial<TransportLegFormState>) {
    onChange({ ...value, legs: value.legs.map((leg, i) => (i === index ? { ...leg, ...patch } : leg)) });
  }

  function handleModeChange(modeCode: string) {
    onChange({ ...value, modeCode, vehicleTypeCode: "" });
  }

  // Defaults the pax counts from the escape's real travellers the moment
  // Mode becomes "flight" — regardless of whether that happened via this
  // Select or via a library Transport pick in the parent (which sets
  // modeCode directly, bypassing handleModeChange above). Starts at "" (not
  // value.modeCode) so a component that first mounts already on "flight" —
  // e.g. picking a flight straight from the library — still counts as a
  // fresh transition into flight, not a no-op.
  const prevModeCode = useRef("");
  useEffect(() => {
    const becameFlight = value.modeCode === "flight" && prevModeCode.current !== "flight";
    prevModeCode.current = value.modeCode;
    if (becameFlight && !value.adultsCount && !value.childrenCount && !value.infantsCount) {
      onChange({
        ...value,
        adultsCount: String(defaultPax.adults),
        childrenCount: String(defaultPax.children),
        infantsCount: String(defaultPax.infants),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.modeCode]);

  function handleTripTypeChange(tripType: TransportDetailFormState["tripType"]) {
    onChange({ ...value, tripType, legs: legsForTripType(tripType, value.legs) });
  }

  function addLeg() {
    onChange({ ...value, legs: [...value.legs, emptyLeg()] });
  }

  function removeLeg(index: number) {
    if (value.legs.length <= 1) return;
    onChange({ ...value, legs: value.legs.filter((_, i) => i !== index) });
  }

  const vehicleTypeOptions = VEHICLE_TYPE_OPTIONS[value.modeCode] ?? [];
  const isFlight = value.modeCode === "flight";

  const totalPax = (Number(value.adultsCount) || 0) + (Number(value.childrenCount) || 0) + (Number(value.infantsCount) || 0);
  const costTotal = value.costPrice ? Number(value.costPrice) * (value.costPricePerPerson ? Math.max(totalPax, 1) : 1) : null;
  const sellingTotal = value.sellingPrice
    ? Number(value.sellingPrice) * (value.sellingPricePerPerson ? Math.max(totalPax, 1) : 1)
    : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Mode"
          options={MODE_OPTIONS}
          value={value.modeCode}
          onChange={(e) => handleModeChange(e.target.value)}
          placeholder="Select mode"
        />
        <Select
          label={isFlight ? "Travel Class" : "Vehicle type"}
          options={vehicleTypeOptions}
          value={value.vehicleTypeCode}
          onChange={(e) => update("vehicleTypeCode", e.target.value)}
          placeholder={vehicleTypeOptions.length ? "Select" : "Not applicable"}
          disabled={!vehicleTypeOptions.length}
        />
      </div>

      {!isFlight && (
        <TextInput
          label="Price (INR)"
          type="number"
          min={0}
          step="0.01"
          value={value.price}
          onChange={(e) => update("price", e.target.value)}
        />
      )}

      {isFlight && (
        <>
          <div className="inline-flex items-center gap-0.5 self-start rounded-full bg-muted p-1">
            {TRIP_TYPES.map(({ value: tripType, label }) => (
              <button
                key={tripType}
                type="button"
                onClick={() => handleTripTypeChange(tripType)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                  value.tripType === tripType
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {value.legs.map((leg, i) => (
              <div key={i} className="flex flex-col gap-3 rounded-lg border border-border/60 p-3">
                <div className="flex items-center justify-between">
                  <Caption>
                    {leg.direction === "onward" ? "Onward" : leg.direction === "return" ? "Return" : `Leg ${i + 1}`}
                  </Caption>
                  {value.tripType === "multi_city" && value.legs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLeg(i)}
                      className="text-xs text-muted-foreground hover:text-danger"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <TextInput
                    label="Departure Airport"
                    value={leg.departureAirport}
                    onChange={(e) => updateLeg(i, { departureAirport: e.target.value })}
                  />
                  <TextInput
                    label="Terminal"
                    value={leg.departureTerminal}
                    onChange={(e) => updateLeg(i, { departureTerminal: e.target.value })}
                  />
                </div>
                <TextInput
                  label="Departure Time"
                  type="datetime-local"
                  value={leg.departureTime}
                  onChange={(e) => updateLeg(i, { departureTime: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-3">
                  <TextInput
                    label="Arrival Airport"
                    value={leg.arrivalAirport}
                    onChange={(e) => updateLeg(i, { arrivalAirport: e.target.value })}
                  />
                  <TextInput
                    label="Terminal"
                    value={leg.arrivalTerminal}
                    onChange={(e) => updateLeg(i, { arrivalTerminal: e.target.value })}
                  />
                </div>
                <TextInput
                  label="Arrival Time"
                  type="datetime-local"
                  value={leg.arrivalTime}
                  onChange={(e) => updateLeg(i, { arrivalTime: e.target.value })}
                />
                <TextInput
                  label="Flight Number"
                  placeholder="e.g. AI-1234"
                  value={leg.flightNumber}
                  onChange={(e) => updateLeg(i, { flightNumber: e.target.value })}
                />
              </div>
            ))}
            {value.tripType === "multi_city" && (
              <button type="button" onClick={addLeg} className="self-start text-sm text-primary hover:underline">
                + Add another leg
              </button>
            )}
          </div>

          <TextInput
            label="Additional Options (optional)"
            placeholder="Baggage / Fare / Meal"
            value={value.additionalOptions}
            onChange={(e) => update("additionalOptions", e.target.value)}
          />

          <div className="rounded-lg border border-border/60 p-3">
            <Caption className="mb-2 block">Pricing</Caption>
            <div className="grid grid-cols-3 gap-3">
              <TextInput
                label="Adults"
                type="number"
                min={0}
                value={value.adultsCount}
                onChange={(e) => update("adultsCount", e.target.value)}
              />
              <TextInput
                label="Children (2–12yrs)"
                type="number"
                min={0}
                value={value.childrenCount}
                onChange={(e) => update("childrenCount", e.target.value)}
              />
              <TextInput
                label="Infants (below 2yrs)"
                type="number"
                min={0}
                value={value.infantsCount}
                onChange={(e) => update("infantsCount", e.target.value)}
              />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <TextInput
                  label="Cost Price (INR)"
                  type="number"
                  min={0}
                  step="0.01"
                  value={value.costPrice}
                  onChange={(e) => update("costPrice", e.target.value)}
                />
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={value.costPricePerPerson}
                    onChange={(e) => update("costPricePerPerson", e.target.checked)}
                    className="h-3.5 w-3.5 accent-primary"
                  />
                  Per person
                </label>
              </div>
              <div className="flex flex-col gap-1.5">
                <TextInput
                  label="Selling Price (INR)"
                  type="number"
                  min={0}
                  step="0.01"
                  value={value.sellingPrice}
                  onChange={(e) => update("sellingPrice", e.target.value)}
                />
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={value.sellingPricePerPerson}
                    onChange={(e) => update("sellingPricePerPerson", e.target.checked)}
                    className="h-3.5 w-3.5 accent-primary"
                  />
                  Per person
                </label>
              </div>
            </div>
            {(costTotal !== null || sellingTotal !== null) && (
              <div className="mt-3 flex items-center justify-between rounded border border-border bg-muted/30 px-3 py-2 text-sm">
                <span className="font-medium text-foreground">Total</span>
                <span className="text-muted-foreground">
                  {costTotal !== null && `Cost ₹${costTotal.toFixed(2)}`}
                  {costTotal !== null && sellingTotal !== null && " · "}
                  {sellingTotal !== null && `Selling ₹${sellingTotal.toFixed(2)}`}
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
