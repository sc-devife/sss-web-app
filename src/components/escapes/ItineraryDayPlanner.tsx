"use client";

import { useEffect, useState, type FormEvent } from "react";
import { IoChevronUpOutline, IoChevronDownOutline, IoTrashOutline } from "react-icons/io5";
import { PiPlusFill } from "react-icons/pi";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { TimePicker } from "@/components/ui/TimePicker";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Body, Caption } from "@/components/ui/Typography";
import { LoadingState, Spinner } from "@/components/ui/Spinner";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import type { Hotel } from "@/lib/hotels";
import type { Activity } from "@/lib/activities";
import type { Transport } from "@/lib/transports";
import type { ServiceProvider } from "@/lib/service-providers";
import type { ItineraryItem, PlanningItemType } from "@/lib/itinerary-items";
import {
  PLANNING_ITEM_TYPES,
  PLANNING_ITEM_ICON,
  PLANNING_ITEM_BADGE_CLASS,
  PLANNING_ITEM_REF_KIND,
  dayNumberToDate,
  formatDayDateWithWeekday,
  formatStartTime,
  getItemTotalPrice,
} from "@/lib/itinerary-planning";
import { transportModeIcon } from "@/lib/transport-modes";
import { formatInr } from "@/lib/currency";
import { cn } from "@/lib/cn";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchItineraryItems,
  updateItineraryItem,
  deleteItineraryItem,
  reorderItineraryItems,
} from "@/features/itineraryItems/itineraryItemsThunks";
import { selectItineraryItems, selectItineraryItemsStatus } from "@/features/itineraryItems/itineraryItemsSelectors";
import { fetchEscapeById, updateEscapeDuration } from "@/features/escapes/escapesThunks";
import { selectCurrentEscape } from "@/features/escapes/escapesSelectors";
import { AddPlanningItemModal, type PlanningLibraryOption } from "@/components/escapes/AddPlanningItemModal";
import {
  TransportDetailFields,
  fromTransportDetail,
  toTransportDetailPayload,
  type TransportDetailFormState,
} from "@/components/escapes/TransportDetailFields";
import {
  HotelDetailFields,
  fromHotelDetail,
  toHotelDetailPayload,
  type HotelDetailFormState,
} from "@/components/escapes/HotelDetailFields";
import { RiEdit2Line } from "react-icons/ri";

interface ModalState {
  open: boolean;
  editingUid: string;
  dayNumber: string;
  itemType: PlanningItemType;
  referenceId: string;
  title: string;
  titleAutoFilled: boolean;
  startTime: string;
  notes: string;
  price: string;
  transportForm: TransportDetailFormState;
  hotelForm: HotelDetailFormState;
}

function editModalState(item: ItineraryItem): ModalState {
  return {
    open: true,
    editingUid: item.uid,
    dayNumber: String(item.dayNumber),
    itemType: item.itemType,
    referenceId: item.referenceId ?? "",
    title: item.title ?? "",
    titleAutoFilled: false,
    startTime: formatStartTime(item.startTime) ?? "",
    notes: item.notes ?? "",
    price: item.price != null ? String(item.price) : "",
    transportForm: fromTransportDetail(item.transportDetail),
    hotelForm: fromHotelDetail(item.hotelDetail),
  };
}

type QuickAddType = "transport" | "hotel" | "activity";

// "Meal" was removed as its own quick-add — meals are now taken from the
// selected hotel's own Meal Plan field instead of a separate itinerary item.
const QUICK_ADD_BUTTONS: { itemType: QuickAddType; label: string }[] = [
  { itemType: "transport", label: "Transport" },
  { itemType: "hotel", label: "Hotel" },
  { itemType: "activity", label: "Activity" },
];

function TimelineRow({
  item,
  isFirst,
  isLast,
  onMove,
  onEdit,
  onDelete,
  deleting,
  roomTypesByUid,
}: {
  item: ItineraryItem;
  isFirst: boolean;
  isLast: boolean;
  onMove: (direction: -1 | 1) => void;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
  roomTypesByUid: Record<string, string>;
}) {
  const isTransportItem = item.itemType === "transport" || item.itemType === "pickup_drop";
  const Icon = isTransportItem ? transportModeIcon(item.transportDetail?.modeCode) : PLANNING_ITEM_ICON[item.itemType];
  const time = formatStartTime(item.startTime);
  const flightLeg = item.transportDetail?.modeCode === "flight" ? item.transportDetail.legs[0] : null;
  const flightSummary = flightLeg
    ? [flightLeg.flightNumber, [flightLeg.departureAirport, flightLeg.arrivalAirport].filter(Boolean).join(" → ")]
      .filter(Boolean)
      .join(" · ")
    : null;
  const hotelSummary = item.hotelDetail
    ? [
      item.hotelDetail.roomTypeId ? roomTypesByUid[item.hotelDetail.roomTypeId] : null,
      item.hotelDetail.roomCount ? `${item.hotelDetail.roomCount} room${item.hotelDetail.roomCount > 1 ? "s" : ""}` : null,
    ]
      .filter(Boolean)
      .join(" · ") || null
    : null;
  const totalPrice = getItemTotalPrice(item);

  return (
    <div className="flex min-w-[420px] items-start gap-3 rounded-lg border border-border p-3">
      <div className="w-12 shrink-0 pt-0.5 text-xs font-medium text-muted-foreground">{time ?? "—"}</div>
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", PLANNING_ITEM_BADGE_CLASS[item.itemType])}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-[120px] flex-1">
        <Body className="font-medium">{item.referenceLabel}</Body>
        {flightSummary && <Caption className="mt-0.5 block normal-case text-muted-foreground">{flightSummary}</Caption>}
        {hotelSummary && <Caption className="mt-0.5 block normal-case text-muted-foreground">{hotelSummary}</Caption>}
        {item.notes && <Caption className="mt-0.5 block normal-case text-muted-foreground">{item.notes}</Caption>}
      </div>
      {totalPrice != null && (
        <div className="shrink-0 pt-0.5 text-sm font-semibold text-foreground">{formatInr(totalPrice)}</div>
      )}
      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          onClick={() => onMove(-1)}
          disabled={isFirst}
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
          aria-label="Move up"
          title="Move up"
        >
          <IoChevronUpOutline size={14} />
        </button>
        <button
          type="button"
          onClick={() => onMove(1)}
          disabled={isLast}
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
          aria-label="Move down"
          title="Move down"
        >
          <IoChevronDownOutline size={14} />
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Edit"
          title="Edit"
        >
          <RiEdit2Line size={14} />
        </button>
        {deleting ? (
          <span aria-label="Removing" title="Removing…" className="flex items-center justify-center p-1">
            <Spinner size="sm" />
          </span>
        ) : (
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="rounded p-1 text-muted-foreground hover:bg-danger/10 hover:text-danger disabled:opacity-50"
            aria-label="Remove"
            title="Remove"
          >
            <IoTrashOutline size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

export function ItineraryDayPlanner({
  itineraryUid,
  escapeStartDate,
  numberOfDays,
  hotels,
  activities,
  transports,
  serviceProviders,
}: {
  itineraryUid: string;
  escapeStartDate: string | null;
  numberOfDays: number | null;
  hotels: Hotel[];
  activities: Activity[];
  transports: Transport[];
  serviceProviders: ServiceProvider[];
}) {
  const dispatch = useAppDispatch();
  const items = useAppSelector((s) => selectItineraryItems(s, itineraryUid));
  const itemsStatus = useAppSelector((s) => selectItineraryItemsStatus(s, itineraryUid));
  const escape = useAppSelector(selectCurrentEscape);

  // Local, mutable copy of the (server-fetched) hotels prop — needed so
  // HotelDetailFields' "+ Add Meal" can append the new meal plan to the
  // right hotel's option list immediately, without a full page reload.
  const [localHotels, setLocalHotels] = useState(hotels);
  useEffect(() => setLocalHotels(hotels), [hotels]);

  function handleMealPlanCreated(hotelUid: string, mealPlan: { uid: string; code: string; name: string }) {
    setLocalHotels((hs) => hs.map((h) => (h.uid === hotelUid ? { ...h, mealPlans: [...(h.mealPlans ?? []), mealPlan] } : h)));
  }

  // Only hotels/activities linked to one of this escape's own escape points
  // belong in the itinerary's pickers — the full library list would
  // otherwise mix in options from unrelated destinations.
  const escapePointUids = new Set((escape?.escapePoints ?? []).map((ep) => ep.uid));
  const hotelsForEscape = localHotels.filter((h) => h.escapePoint && escapePointUids.has(h.escapePoint.uid));
  const activitiesForEscape = activities.filter((a) => a.escapePoint && escapePointUids.has(a.escapePoint.uid));

  // Real pax counts from the escape's travellers — used to pre-fill the
  // flight pricing grid instead of starting it blank.
  const defaultPax = (escape?.travellers ?? []).reduce(
    (acc, t) => {
      if (t.type === "ADULT") acc.adults += 1;
      else if (t.type === "CHILD") acc.children += 1;
      else if (t.type === "INFANT") acc.infants += 1;
      return acc;
    },
    { adults: 0, children: 0, infants: 0 },
  );

  // RoomType is org-wide master data — the same uid always names the same
  // room type regardless of which hotel it came from — so a flat map built
  // from every hotel's own roomTypes is enough to label a hotel item's
  // summary line without knowing which specific hotel it references.
  const roomTypesByUid = hotelsForEscape.reduce<Record<string, string>>((acc, h) => {
    (h.roomTypes ?? []).forEach((rt) => {
      acc[rt.uid] = rt.name;
    });
    return acc;
  }, {});

  const [deletingUid, setDeletingUid] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [addingType, setAddingType] = useState<QuickAddType | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const [openDay, setOpenDay] = useState(1);
  const [confirmingAddDay, setConfirmingAddDay] = useState(false);
  const [addingDay, setAddingDay] = useState(false);
  const [addDayError, setAddDayError] = useState<string | undefined>();

  useEffect(() => {
    if (itemsStatus === "idle") {
      dispatch(fetchItineraryItems(itineraryUid));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadItems() {
    dispatch(fetchItineraryItems(itineraryUid));
  }

  const maxItemDay = items.length ? Math.max(...items.map((i) => i.dayNumber)) : 0;
  const dayCount = Math.max(numberOfDays ?? 1, maxItemDay, 1);

  async function handleConfirmAddDay() {
    if (!escape?.lead) return;
    setAddingDay(true);
    setAddDayError(undefined);
    try {
      const nextDay = dayCount + 1;
      await dispatch(
        updateEscapeDuration({
          escapeUid: escape.uid,
          leadUid: escape.lead.uid,
          startDate: escape.startDate,
          numberOfDays: nextDay,
        }),
      ).unwrap();
      await dispatch(fetchEscapeById(escape.uid));
      setOpenDay(nextDay);
      setConfirmingAddDay(false);
    } catch (err) {
      setAddDayError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to extend escape duration"));
    } finally {
      setAddingDay(false);
    }
  }

  const itemsByDay = items.reduce<Record<number, ItineraryItem[]>>((acc, item) => {
    (acc[item.dayNumber] ??= []).push(item);
    return acc;
  }, {});

  async function handleMove(item: ItineraryItem, direction: -1 | 1) {
    const sameDay = items.filter((i) => i.dayNumber === item.dayNumber).sort((a, b) => a.sortOrder - b.sortOrder);
    const index = sameDay.findIndex((i) => i.uid === item.uid);
    const swapWith = sameDay[index + direction];
    if (!swapWith) return;

    const orderedItemUids = items
      .slice()
      .sort((a, b) => a.dayNumber - b.dayNumber || a.sortOrder - b.sortOrder)
      .map((i) => (i.uid === item.uid ? swapWith.uid : i.uid === swapWith.uid ? item.uid : i.uid));

    await dispatch(reorderItineraryItems({ itineraryUid, orderedItemUids }));
    loadItems();
  }

  async function handleDeleteItem(uid: string) {
    setDeletingUid(uid);
    try {
      await dispatch(deleteItineraryItem({ uid, itineraryUid }));
      loadItems();
    } finally {
      setDeletingUid(null);
    }
  }

  const referenceOptions = (() => {
    if (!modal) return [];
    const kind = PLANNING_ITEM_REF_KIND[modal.itemType];
    if (kind === "hotel") return hotelsForEscape.map((h) => ({ value: h.uid, label: h.name }));
    if (kind === "activity") return activitiesForEscape.map((a) => ({ value: a.uid, label: a.name }));
    if (kind === "transport")
      return transports.map((t) => ({ value: t.uid, label: `${t.modeCode}${t.vehicleTypeCode ? " — " + t.vehicleTypeCode : ""}` }));
    if (kind === "serviceProvider") return serviceProviders.map((p) => ({ value: p.uid, label: p.name }));
    return [];
  })();

  function handleTypeChange(itemType: PlanningItemType) {
    setModal((m) => (m ? { ...m, itemType, referenceId: "" } : m));
  }

  function handleReferenceChange(referenceId: string) {
    setModal((m) => {
      if (!m) return m;
      const option = referenceOptions.find((o) => o.value === referenceId);
      const nextTitle = option && (m.title === "" || m.titleAutoFilled) ? option.label : m.title;
      return { ...m, referenceId, title: nextTitle, titleAutoFilled: !!option && nextTitle === option.label };
    });
  }

  function handleTitleChange(title: string) {
    setModal((m) => (m ? { ...m, title, titleAutoFilled: false } : m));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!modal) return;
    const isActivity = modal.itemType === "activity";
    if (isActivity && !modal.referenceId) {
      setFormError("Pick an activity from the library");
      return;
    }
    if (!isActivity && !modal.title.trim() && !modal.referenceId) {
      setFormError("Enter a title or pick a library item");
      return;
    }
    setSaving(true);
    setFormError(undefined);
    try {
      await dispatch(
        updateItineraryItem({
          uid: modal.editingUid,
          itineraryUid,
          dayNumber: Number(modal.dayNumber),
          itemType: modal.itemType,
          referenceId: modal.referenceId || undefined,
          title: isActivity ? undefined : modal.title.trim() || undefined,
          startTime: modal.startTime || undefined,
          notes: modal.notes.trim() || undefined,
          price: isActivity && modal.price ? Number(modal.price) : undefined,
          transportDetail:
            modal.itemType === "transport" ? toTransportDetailPayload(modal.transportForm) : undefined,
          hotelDetail: modal.itemType === "hotel" ? toHotelDetailPayload(modal.hotelForm) : undefined,
        }),
      ).unwrap();
      loadItems();
      setModal(null);
    } catch (err) {
      setFormError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to save item"));
    } finally {
      setSaving(false);
    }
  }

  if (itemsStatus === "loading" && items.length === 0) {
    return <LoadingState label="Loading day plan…" />;
  }

  const activeDayItems = (itemsByDay[openDay] ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder);

  const quickAddConfig: Record<
    QuickAddType,
    {
      title: string;
      searchPlaceholder: string;
      libraryEmptyLabel: string;
      nameFieldLabel: string;
      namePlaceholder: string;
      libraryOptions: PlanningLibraryOption[];
    }
  > = {
    transport: {
      title: "Add Transport",
      searchPlaceholder: "Search transport…",
      libraryEmptyLabel: "No transport options in the library yet.",
      nameFieldLabel: "Transport name",
      namePlaceholder: "e.g. Private cab to airport",
      libraryOptions: transports.map((t) => ({
        uid: t.uid,
        label: `${t.modeCode}${t.vehicleTypeCode ? " — " + t.vehicleTypeCode : ""}`,
        transportPrefill: { modeCode: t.modeCode, vehicleTypeCode: t.vehicleTypeCode, price: t.basePrice },
      })),
    },
    hotel: {
      title: "Add Hotel",
      searchPlaceholder: "Search hotels…",
      libraryEmptyLabel: "No hotels linked to this escape's destination yet.",
      nameFieldLabel: "Hotel name",
      namePlaceholder: "e.g. Wildflower Resort",
      libraryOptions: hotelsForEscape.map((h) => ({
        uid: h.uid,
        label: h.name,
        roomTypes: h.roomTypes ?? [],
        mealPlans: h.mealPlans ?? [],
      })),
    },
    activity: {
      title: "Add Activity",
      searchPlaceholder: "Search activities…",
      libraryEmptyLabel: "No activities linked to this escape's destination yet.",
      nameFieldLabel: "Activity name",
      namePlaceholder: "e.g. Sunset boat ride",
      libraryOptions: activitiesForEscape.map((a) => ({
        uid: a.uid,
        label: a.name,
        activityPrefill: { price: a.basePrice },
      })),
    },
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative z-10 flex shrink-0 items-center gap-1.5 overflow-x-auto">
        {Array.from({ length: dayCount }, (_, i) => i + 1).map((day) => {
          const isActive = openDay === day;
          const date = dayNumberToDate(escapeStartDate, day);
          const dayTotal = (itemsByDay[day] ?? []).reduce((sum, item) => sum + (getItemTotalPrice(item) ?? 0), 0);
          return (
            <button
              key={day}
              type="button"
              onClick={() => setOpenDay(day)}
              className={cn(
                "flex h-11 min-w-[100px] shrink-0 flex-col items-center justify-center rounded-t-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                isActive
                  ? "-mb-px border-primary border-b-card bg-card text-foreground shadow-sm"
                  : "rounded-b-lg border-border/60 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              Day {day}
              {date && <span className="text-[8px] font-normal text-muted-foreground">{formatDayDateWithWeekday(date)}</span>}
              {dayTotal > 0 && <span className="text-[8px] font-semibold text-primary">{formatInr(dayTotal)}</span>}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => {
            setAddDayError(undefined);
            setConfirmingAddDay(true);
          }}
          className="flex h-11 min-w-[100px] shrink-0 items-center justify-center gap-1 rounded-lg border border-dashed border-border/70 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          <PiPlusFill className="h-3 w-3" />
          Add day
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 rounded-lg border border-border bg-card p-2 shadow-sm">
        <div
          className={cn(
            "show-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto",
            activeDayItems.length === 0 && "items-center justify-center text-center",
          )}
        >
          {activeDayItems.length === 0 ? (
            <>
              <Body muted>No items planned for this day yet.</Body>
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {QUICK_ADD_BUTTONS.map(({ itemType, label }) => {
                  const ButtonIcon = PLANNING_ITEM_ICON[itemType];
                  return (
                    <button
                      key={itemType}
                      type="button"
                      onClick={() => setAddingType(itemType)}
                      className="flex h-7 shrink-0 items-center gap-1.5 rounded-full border border-primary bg-transparent px-3 text-xs font-semibold text-primary shadow-sm transition-colors hover:bg-primary hover:text-primary-foreground"
                    >
                      <ButtonIcon className="h-3.5 w-3.5" />
                      {label}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            activeDayItems.map((item, i) => (
              <TimelineRow
                key={item.uid}
                item={item}
                isFirst={i === 0}
                isLast={i === activeDayItems.length - 1}
                onMove={(direction) => handleMove(item, direction)}
                onEdit={() => setModal(editModalState(item))}
                onDelete={() => handleDeleteItem(item.uid)}
                deleting={deletingUid === item.uid}
                roomTypesByUid={roomTypesByUid}
              />
            ))
          )}
        </div>
        {activeDayItems.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 self-start">
            {QUICK_ADD_BUTTONS.map(({ itemType, label }) => {
              const ButtonIcon = PLANNING_ITEM_ICON[itemType];
              return (
                <button
                  key={itemType}
                  type="button"
                  onClick={() => setAddingType(itemType)}
                  className="flex h-7 shrink-0 items-center gap-1.5 rounded-full border border-primary bg-transparent px-3 text-xs font-semibold text-primary shadow-sm transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  <ButtonIcon className="h-3.5 w-3.5" />
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {addingType && (
        <AddPlanningItemModal
          open={!!addingType}
          onClose={() => setAddingType(null)}
          itineraryUid={itineraryUid}
          dayNumber={openDay}
          itemType={addingType}
          onCreated={loadItems}
          defaultPax={defaultPax}
          onMealPlanCreated={handleMealPlanCreated}
          {...quickAddConfig[addingType]}
        />
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title="Edit planning item">
        {modal && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <TimePicker
              label="Start time"
              value={modal.startTime}
              onChange={(v) => setModal((m) => (m ? { ...m, startTime: v } : m))}
            />
            <Select
              label="Type"
              options={PLANNING_ITEM_TYPES}
              value={modal.itemType}
              onChange={(e) => handleTypeChange(e.target.value as PlanningItemType)}
            />
            {referenceOptions.length > 0 && (
              <Select
                label={modal.itemType === "activity" ? "Select from library" : "Select from library (optional)"}
                options={referenceOptions}
                value={modal.referenceId}
                onChange={(e) => handleReferenceChange(e.target.value)}
                placeholder="Not linked to a library item"
              />
            )}
            {modal.itemType !== "activity" && (
              <TextInput
                label="Title"
                value={modal.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Airport Pickup"
                required={!modal.referenceId}
              />
            )}
            {modal.itemType === "transport" && (
              <TransportDetailFields
                value={modal.transportForm}
                onChange={(next) => setModal((m) => (m ? { ...m, transportForm: next } : m))}
                defaultPax={defaultPax}
              />
            )}
            {modal.itemType === "hotel" && (
              <HotelDetailFields
                value={modal.hotelForm}
                onChange={(next) => setModal((m) => (m ? { ...m, hotelForm: next } : m))}
                mealPlans={hotelsForEscape.find((h) => h.uid === modal.referenceId)?.mealPlans ?? []}
                roomTypes={hotelsForEscape.find((h) => h.uid === modal.referenceId)?.roomTypes ?? []}
                hotelName={hotelsForEscape.find((h) => h.uid === modal.referenceId)?.name ?? modal.title}
                hotelUid={modal.referenceId || null}
                onMealPlanCreated={(mealPlan) => {
                  if (modal.referenceId) handleMealPlanCreated(modal.referenceId, mealPlan);
                }}
              />
            )}
            {modal.itemType === "activity" && (
              <TextInput
                label="Price (INR)"
                type="number"
                min={0}
                step="0.01"
                value={modal.price}
                onChange={(e) => setModal((m) => (m ? { ...m, price: e.target.value } : m))}
              />
            )}
            <TextInput
              label="Notes"
              value={modal.notes}
              onChange={(e) => setModal((m) => (m ? { ...m, notes: e.target.value } : m))}
              placeholder="e.g. Bengaluru → Netravati"
            />
            {formError && <p className="text-sm text-danger">{formError}</p>}
            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <Button type="button" variant="ghost" disabled={saving} onClick={() => setModal(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} loading={saving} loadingText="Saving…">
                Save
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={confirmingAddDay}
        onClose={() => !addingDay && setConfirmingAddDay(false)}
        title="Extend escape duration"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <Body>
            Adding a day extends this escape&apos;s duration from{" "}
            <span className="font-medium text-foreground">{dayCount} days</span> to{" "}
            <span className="font-medium text-foreground">{dayCount + 1} days</span> and updates its end date. Do you
            want to continue?
          </Body>
          {addDayError && <p className="text-sm text-danger">{addDayError}</p>}
          <div className="flex justify-center gap-2">
            <Button type="button" variant="ghost" disabled={addingDay} onClick={() => setConfirmingAddDay(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={addingDay} loading={addingDay} loadingText="Extending…" onClick={handleConfirmAddDay}>
              Continue
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
