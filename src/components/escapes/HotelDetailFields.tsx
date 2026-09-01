"use client";

import { useState } from "react";
import { TextInput } from "@/components/ui/TextInput";
import { Select } from "@/components/ui/Select";
import { TimePicker } from "@/components/ui/TimePicker";
import { Button } from "@/components/ui/Button";
import { Caption } from "@/components/ui/Typography";
import type { HotelDetail, HotelInclusion } from "@/lib/itinerary-items";
import { addMinutesToTime, formatDisplayTime } from "@/lib/date";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";

export interface HotelInclusionFormState {
  service: string;
  startTime: string;
  durationMinutes: string;
  totalPrice: string;
  comments: string;
}

export interface HotelDetailFormState {
  mealPlanId: string;
  roomTypeId: string;
  paxPerRoom: string;
  roomCount: string;
  adultsWithExtraBed: string;
  childrenWithExtraBed: string;
  childrenNoBed: string;
  complimentaryChildCount: string;
  price: string;
  totalPrice: string;
  inclusions: HotelInclusionFormState[];
}

export function emptyInclusion(): HotelInclusionFormState {
  return { service: "", startTime: "", durationMinutes: "", totalPrice: "", comments: "" };
}

export function emptyHotelDetailForm(): HotelDetailFormState {
  return {
    mealPlanId: "",
    roomTypeId: "",
    paxPerRoom: "",
    roomCount: "",
    adultsWithExtraBed: "",
    childrenWithExtraBed: "",
    childrenNoBed: "",
    complimentaryChildCount: "",
    price: "",
    totalPrice: "",
    inclusions: [],
  };
}

// Converts saved response data into editable form state (strings for every
// numeric field, matching the rest of this codebase's form convention).
export function fromHotelDetail(detail: HotelDetail | null): HotelDetailFormState {
  if (!detail) return emptyHotelDetailForm();
  return {
    mealPlanId: detail.mealPlanId ?? "",
    roomTypeId: detail.roomTypeId ?? "",
    paxPerRoom: detail.paxPerRoom != null ? String(detail.paxPerRoom) : "",
    roomCount: detail.roomCount != null ? String(detail.roomCount) : "",
    adultsWithExtraBed: detail.adultsWithExtraBed != null ? String(detail.adultsWithExtraBed) : "",
    childrenWithExtraBed: detail.childrenWithExtraBed != null ? String(detail.childrenWithExtraBed) : "",
    childrenNoBed: detail.childrenNoBed != null ? String(detail.childrenNoBed) : "",
    complimentaryChildCount: detail.complimentaryChildCount != null ? String(detail.complimentaryChildCount) : "",
    price: detail.price != null ? String(detail.price) : "",
    totalPrice: detail.totalPrice != null ? String(detail.totalPrice) : "",
    inclusions: (detail.inclusions ?? []).map((i) => ({
      service: i.service ?? "",
      startTime: i.startTime ?? "",
      durationMinutes: i.durationMinutes != null ? String(i.durationMinutes) : "",
      totalPrice: i.totalPrice != null ? String(i.totalPrice) : "",
      comments: i.comments ?? "",
    })),
  };
}

// Converts form state back to the API shape. Returns undefined when nothing
// has actually been entered, so the caller can omit hotelDetail entirely.
export function toHotelDetailPayload(form: HotelDetailFormState): HotelDetail | undefined {
  const hasAnyField =
    !!form.mealPlanId ||
    !!form.roomTypeId ||
    !!form.paxPerRoom ||
    !!form.roomCount ||
    !!form.adultsWithExtraBed ||
    !!form.childrenWithExtraBed ||
    !!form.childrenNoBed ||
    !!form.complimentaryChildCount ||
    !!form.price ||
    !!form.totalPrice ||
    form.inclusions.length > 0;
  if (!hasAnyField) return undefined;

  const inclusions: HotelInclusion[] = form.inclusions
    .filter((i) => i.service.trim() || i.startTime || i.durationMinutes || i.totalPrice || i.comments.trim())
    .map((i) => ({
      service: i.service || null,
      startTime: i.startTime || null,
      durationMinutes: i.durationMinutes ? Number(i.durationMinutes) : null,
      totalPrice: i.totalPrice ? Number(i.totalPrice) : null,
      comments: i.comments || null,
    }));

  return {
    mealPlanId: form.mealPlanId || null,
    roomTypeId: form.roomTypeId || null,
    paxPerRoom: form.paxPerRoom ? Number(form.paxPerRoom) : null,
    roomCount: form.roomCount ? Number(form.roomCount) : null,
    adultsWithExtraBed: form.adultsWithExtraBed ? Number(form.adultsWithExtraBed) : null,
    childrenWithExtraBed: form.childrenWithExtraBed ? Number(form.childrenWithExtraBed) : null,
    childrenNoBed: form.childrenNoBed ? Number(form.childrenNoBed) : null,
    complimentaryChildCount: form.complimentaryChildCount ? Number(form.complimentaryChildCount) : null,
    price: form.price ? Number(form.price) : null,
    totalPrice: form.totalPrice ? Number(form.totalPrice) : null,
    inclusions,
  };
}

// The structured hotel-stay field block: Meal Plan / Room Type are scoped to
// the picked hotel's own options (passed in, not a global list), plus
// occupancy/room counts, rate, and a repeatable Special Inclusions ledger —
// same shape as TransportDetailFields' leg cards.
export function HotelDetailFields({
  value,
  onChange,
  mealPlans,
  roomTypes,
  hotelName,
  hotelUid,
  onMealPlanCreated,
}: {
  value: HotelDetailFormState;
  onChange: (next: HotelDetailFormState) => void;
  mealPlans: { uid: string; code: string; name: string }[];
  roomTypes: { uid: string; name: string }[];
  hotelName: string;
  // Only set once a library hotel is actually picked — "+ Add Meal" needs a
  // real hotel to link the new meal plan to, so it's hidden for custom
  // (non-library) hotel items.
  hotelUid?: string | null;
  onMealPlanCreated?: (mealPlan: { uid: string; code: string; name: string }) => void;
}) {
  const [addingMeal, setAddingMeal] = useState(false);
  const [newMeal, setNewMeal] = useState({ code: "", name: "" });
  const [savingMeal, setSavingMeal] = useState(false);
  const [mealError, setMealError] = useState<string | undefined>();

  function update<K extends keyof HotelDetailFormState>(key: K, v: HotelDetailFormState[K]) {
    onChange({ ...value, [key]: v });
  }

  async function handleAddMeal() {
    if (!hotelUid || !newMeal.code.trim() || !newMeal.name.trim()) return;
    setSavingMeal(true);
    setMealError(undefined);
    try {
      const created = await clientApi
        .post<{ uid: string; code: string; name: string }>("/library/meal-plans", newMeal)
        .then((res) => res.data);
      await clientApi.put(`/library/hotels/${hotelUid}`, {
        mealPlanIds: [...mealPlans.map((m) => m.uid), created.uid],
      });
      onMealPlanCreated?.(created);
      update("mealPlanId", created.uid);
      setNewMeal({ code: "", name: "" });
      setAddingMeal(false);
    } catch (err) {
      setMealError(extractErrorMessage(err, "Failed to add meal"));
    } finally {
      setSavingMeal(false);
    }
  }

  function updateInclusion(index: number, patch: Partial<HotelInclusionFormState>) {
    onChange({
      ...value,
      inclusions: value.inclusions.map((inc, i) => (i === index ? { ...inc, ...patch } : inc)),
    });
  }

  function addInclusion() {
    onChange({ ...value, inclusions: [...value.inclusions, emptyInclusion()] });
  }

  function removeInclusion(index: number) {
    onChange({ ...value, inclusions: value.inclusions.filter((_, i) => i !== index) });
  }

  const mealPlanOptions = mealPlans.map((m) => ({ value: m.uid, label: `${m.code} — ${m.name}` }));
  const roomTypeOptions = roomTypes.map((r) => ({ value: r.uid, label: r.name }));

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Meal Plan"
          options={mealPlanOptions}
          value={value.mealPlanId}
          onChange={(e) => update("mealPlanId", e.target.value)}
          placeholder={mealPlanOptions.length ? "Select" : "Not applicable"}
          disabled={!mealPlanOptions.length}
        />
        <Select
          label="Room Type"
          options={roomTypeOptions}
          value={value.roomTypeId}
          onChange={(e) => update("roomTypeId", e.target.value)}
          placeholder={roomTypeOptions.length ? "Select" : "Not applicable"}
          disabled={!roomTypeOptions.length}
        />
      </div>

      {hotelUid && (
        !addingMeal ? (
          <button
            type="button"
            onClick={() => setAddingMeal(true)}
            className="self-start text-sm text-primary hover:underline"
          >
            + Add Meal
          </button>
        ) : (
          <div className="flex flex-col gap-3 rounded border border-border p-3">
            <div className="grid grid-cols-2 gap-3">
              <TextInput
                label="Code"
                placeholder="e.g. CP"
                value={newMeal.code}
                onChange={(e) => setNewMeal((m) => ({ ...m, code: e.target.value }))}
                required
              />
              <TextInput
                label="Name"
                placeholder="e.g. Continental Plan"
                value={newMeal.name}
                onChange={(e) => setNewMeal((m) => ({ ...m, name: e.target.value }))}
                required
              />
            </div>
            {mealError && <p className="text-sm text-danger">{mealError}</p>}
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                disabled={savingMeal || !newMeal.code.trim() || !newMeal.name.trim()}
                loading={savingMeal}
                loadingText="Saving…"
                onClick={handleAddMeal}
              >
                Add meal
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={savingMeal}
                onClick={() => {
                  setAddingMeal(false);
                  setMealError(undefined);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )
      )}

      <div className="grid grid-cols-2 gap-3">
        <TextInput
          label="Pax/room (WoEB)"
          type="number"
          min={0}
          value={value.paxPerRoom}
          onChange={(e) => update("paxPerRoom", e.target.value)}
        />
        <TextInput
          label="No. of rooms"
          type="number"
          min={0}
          value={value.roomCount}
          onChange={(e) => update("roomCount", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-4 gap-3">
        <TextInput
          label="AWEB"
          type="number"
          min={0}
          value={value.adultsWithExtraBed}
          onChange={(e) => update("adultsWithExtraBed", e.target.value)}
        />
        <TextInput
          label="CWEB"
          type="number"
          min={0}
          value={value.childrenWithExtraBed}
          onChange={(e) => update("childrenWithExtraBed", e.target.value)}
        />
        <TextInput
          label="CNB"
          type="number"
          min={0}
          value={value.childrenNoBed}
          onChange={(e) => update("childrenNoBed", e.target.value)}
        />
        <TextInput
          label="Comp Child"
          type="number"
          min={0}
          value={value.complimentaryChildCount}
          onChange={(e) => update("complimentaryChildCount", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <TextInput
          label="Price (INR)"
          type="number"
          min={0}
          step="0.01"
          value={value.price}
          onChange={(e) => update("price", e.target.value)}
        />
        <TextInput
          label="Total Price (INR)"
          type="number"
          min={0}
          step="0.01"
          value={value.totalPrice}
          onChange={(e) => update("totalPrice", e.target.value)}
        />
      </div>

      <div className="rounded-lg border border-border/60 p-3">
        <div className="mb-2 flex items-center justify-between">
          <Caption>Services{hotelName ? ` — ${hotelName}` : ""}</Caption>
        </div>
        {value.inclusions.length > 0 && (
          <div className="flex flex-col gap-3">
            {value.inclusions.map((inclusion, i) => (
              <div key={i} className="flex flex-col gap-2 rounded-lg border border-border/60 p-3">
                <div className="flex items-center justify-between">
                  <Caption>Service {i + 1}</Caption>
                  <button
                    type="button"
                    onClick={() => removeInclusion(i)}
                    className="text-xs text-muted-foreground hover:text-danger"
                  >
                    Remove
                  </button>
                </div>
                <TextInput
                  label="Service"
                  placeholder="e.g. Candle Light Dinner"
                  value={inclusion.service}
                  onChange={(e) => updateInclusion(i, { service: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <TimePicker
                      label="Start Time"
                      value={inclusion.startTime}
                      onChange={(v) => updateInclusion(i, { startTime: v })}
                    />
                    {inclusion.startTime && inclusion.durationMinutes && (
                      <span className="text-xs text-muted-foreground">
                        This service will end at{" "}
                        {formatDisplayTime(addMinutesToTime(inclusion.startTime, Number(inclusion.durationMinutes)))}
                      </span>
                    )}
                  </div>
                  <TextInput
                    label="Duration (min)"
                    type="number"
                    min={0}
                    placeholder="e.g. 30"
                    value={inclusion.durationMinutes}
                    onChange={(e) => updateInclusion(i, { durationMinutes: e.target.value })}
                  />
                </div>
                <TextInput
                  label="Total Price (INR)"
                  type="number"
                  min={0}
                  step="0.01"
                  value={inclusion.totalPrice}
                  onChange={(e) => updateInclusion(i, { totalPrice: e.target.value })}
                />
                <TextInput
                  label="Comments"
                  placeholder="Any comments regarding service"
                  value={inclusion.comments}
                  onChange={(e) => updateInclusion(i, { comments: e.target.value })}
                />
              </div>
            ))}
          </div>
        )}
        <button type="button" onClick={addInclusion} className="mt-2 self-start text-sm text-primary hover:underline">
          + Add Service
        </button>
      </div>
    </div>
  );
}
