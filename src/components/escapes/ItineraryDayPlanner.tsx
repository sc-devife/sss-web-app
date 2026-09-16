"use client";

import { useEffect, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent } from "react";
import { IoTrashOutline } from "react-icons/io5";
import { PiPlusFill } from "react-icons/pi";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { TimePicker } from "@/components/ui/TimePicker";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Body, Caption } from "@/components/ui/Typography";
import { Spinner } from "@/components/ui/Spinner";
import { Skeleton } from "@/components/ui/Skeleton";
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
  availableHotelNights,
} from "@/lib/itinerary-planning";
import { transportModeIcon } from "@/lib/transport-modes";
import { formatInr } from "@/lib/currency";
import { hotelStatusTone, HOTEL_BOOKING_STATUS_OPTIONS } from "@/lib/hotel-booking-status";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import { chunkPairs } from "@/lib/forms";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchItineraryItems,
  updateItineraryItem,
  deleteItineraryItem,
  reorderItineraryItems,
  reorderItineraryDays,
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
  hotelNightsError,
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
  longDescription: string;
  price: string;
  /** Activity only — see ItineraryItem.travelersCount. */
  travelersCount: string;
  transportForm: TransportDetailFormState;
  hotelForm: HotelDetailFormState;
  /** Item-level Initialize/Booked/Drop status — currently only used for Activity (Hotel keeps its own status on hotelForm). */
  status: string;
  droppingReason: string;
  cancellationCharge: string;
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
    longDescription: item.longDescription ?? "",
    price: item.price != null ? String(item.price) : "",
    travelersCount: item.travelersCount != null ? String(item.travelersCount) : "",
    transportForm: fromTransportDetail(item.transportDetail),
    hotelForm: fromHotelDetail(item.hotelDetail),
    status: item.status || "Initialize",
    droppingReason: item.droppingReason ?? "",
    cancellationCharge: item.cancellationCharge != null ? String(item.cancellationCharge) : "",
  };
}

type QuickAddType = "transport" | "hotel" | "activity" | "other";

// "Meal" was removed as its own quick-add — meals are now taken from the
// selected hotel's own Meal Plan field instead of a separate itinerary item.
// "Other" covers day-tagged extras with no library/pricing shape of their
// own (e.g. "Visa", "complimentary welcome gift") — surfaced in quotation
// PDFs as a standalone "Special Inclusions" section (see
// QuotationDataService.specialInclusions).
const QUICK_ADD_BUTTONS: { itemType: QuickAddType; label: string }[] = [
  { itemType: "transport", label: "Transport" },
  { itemType: "hotel", label: "Hotel" },
  { itemType: "activity", label: "Activity" },
  { itemType: "other", label: "Other" },
];

function TimelineRow({
  item,
  isDragging,
  registerRef,
  onDragPointerDown,
  onDragPointerMove,
  onDragPointerEnd,
  onEdit,
  onDelete,
  deleting,
  roomTypesByUid,
}: {
  item: ItineraryItem;
  // True only for the single card currently being dragged — gets an
  // elevated/highlighted style while everything else stays normal.
  isDragging: boolean;
  // Registers this row's DOM node under its item uid so the drag
  // orchestration in the parent (ItineraryDayPlanner) can hit-test pointer
  // position against every row's live rect, including across auto-scroll.
  registerRef: (el: HTMLDivElement | null) => void;
  onDragPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onDragPointerMove: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onDragPointerEnd: (e: ReactPointerEvent<HTMLDivElement>) => void;
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
  const hotelServices =
    item.hotelDetail?.inclusions
      .filter((i) => i.service)
      .map((i) => (i.totalPrice != null ? `${i.service} (${formatInr(i.totalPrice)})` : i.service))
      .join(", ") || null;
  const totalPrice = getItemTotalPrice(item);

  return (
    <div
      ref={registerRef}
      onPointerDown={onDragPointerDown}
      onPointerMove={onDragPointerMove}
      onPointerUp={onDragPointerEnd}
      onPointerCancel={onDragPointerEnd}
      style={{ touchAction: "none" }}
      className={cn(
        "flex min-w-[420px] cursor-grab select-none items-start gap-3 rounded-lg border border-border bg-card p-3 transition-shadow",
        isDragging && "relative z-20 cursor-grabbing border-primary/50 shadow-lg ring-2 ring-primary/40",
      )}
    >
      <div className="w-12 shrink-0 pt-0.5 text-xs font-medium text-muted-foreground">{time ?? "—"}</div>
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", PLANNING_ITEM_BADGE_CLASS[item.itemType])}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-[120px] flex-1">
        <div className="flex items-center gap-2">
          <Body className="font-medium">{item.referenceLabel}</Body>
          {item.hotelDetail?.status && (
            <Badge tone={hotelStatusTone(item.hotelDetail.status)}>{item.hotelDetail.status}</Badge>
          )}
          {item.itemType === "activity" && item.status && (
            <Badge tone={hotelStatusTone(item.status)}>{item.status}</Badge>
          )}
        </div>
        {flightSummary && <Caption className="mt-0.5 block normal-case text-muted-foreground">{flightSummary}</Caption>}
        {hotelSummary && <Caption className="mt-0.5 block normal-case text-muted-foreground">{hotelSummary}</Caption>}
        {hotelServices && (
          <Caption className="mt-0.5 block normal-case text-muted-foreground">Services: {hotelServices}</Caption>
        )}
        {item.notes && <Caption className="mt-0.5 block normal-case text-muted-foreground">{item.notes}</Caption>}
      </div>
      {totalPrice != null && (
        <div className="shrink-0 pt-0.5 text-sm font-semibold text-foreground">{formatInr(totalPrice)}</div>
      )}
      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
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
            className="rounded-full p-1 text-muted-foreground hover:bg-danger/10 hover:text-danger disabled:opacity-50"
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

  // Only hotels/activities/transports linked to one of this escape's own
  // escape points belong in the itinerary's pickers — the full library list
  // would otherwise mix in options from unrelated destinations. An escape
  // with multiple escape points (e.g. Bali + Lakshadweep) ORs across all of
  // them, not just the first.
  const escapePointUids = new Set((escape?.escapePoints ?? []).map((ep) => ep.uid));
  const hotelsForEscape = localHotels.filter((h) => h.escapePoint && escapePointUids.has(h.escapePoint.uid));
  const activitiesForEscape = activities.filter((a) => a.escapePoint && escapePointUids.has(a.escapePoint.uid));
  const transportsForEscape = transports.filter((t) => t.escapePoint && escapePointUids.has(t.escapePoint.uid));

  // Real pax counts from the escape's travellers — used to pre-fill the
  // flight pricing grid instead of starting it blank. Relies on each
  // traveller's own `type` (Adult/Child/Infant), which agents don't always
  // fill in at lead intake — so this can under-count and isn't used for
  // Activity's simpler "No. of Travelers" default below.
  const defaultPax = (escape?.travellers ?? []).reduce(
    (acc, t) => {
      if (t.type === "ADULT") acc.adults += 1;
      else if (t.type === "CHILD") acc.children += 1;
      else if (t.type === "INFANT") acc.infants += 1;
      return acc;
    },
    { adults: 0, children: 0, infants: 0 },
  );

  // Activity's "No. of Travelers" default is just how many travellers the
  // escape actually has — unlike defaultPax above, this doesn't depend on
  // each traveller's type being filled in, so it stays accurate even when
  // that field was left blank at lead intake.
  const escapeTravelersCount = (escape?.travellers ?? []).length;

  // RoomType is org-wide master data — the same uid always names the same
  // room type regardless of which hotel it came from — so a flat map built
  // from every hotel's own roomTypes is enough to label a hotel item's
  // summary line without knowing which specific hotel it references.
  const roomTypesByUid = hotelsForEscape.reduce<Record<string, string>>((acc, h) => {
    (h.roomTypes ?? []).forEach((rt) => {
      acc[rt.roomTypeId] = rt.name;
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

  // Remaining hotel nights this escape has left to allocate — for a brand
  // new hotel item (create flow) nothing of its own is excluded yet.
  const maxHotelNightsForNewItem = availableHotelNights(items, numberOfDays);

  // --- Day-tab drag-and-drop (moves an entire day's items to a different
  // day POSITION) ---
  // Unlike the itinerary-item drag above, tabs don't live-reorder while
  // dragging — doing that would mean faking each position's item totals
  // mid-drag, since the actual dayNumber reassignment only happens on
  // drop. Instead tabs stay in their normal positions, the dragged tab
  // gets an elevated style, and a thin bar between tabs tracks where it
  // would land — same RAF-driven auto-scroll approach, just along the
  // horizontal axis this strip actually scrolls on. Entirely separate
  // state from the item drag above, so the two never interact.
  const [draggingDay, setDraggingDay] = useState<number | null>(null);
  const [dayDropIndex, setDayDropIndex] = useState<number | null>(null);
  const draggingDayActiveRef = useRef(false);
  const draggingDayRef = useRef<number | null>(null);
  const dayDropIndexRef = useRef<number | null>(null);
  const dayPointerXRef = useRef(0);
  const dayDragRafRef = useRef<number | null>(null);
  const dayTabRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const dayTabsContainerRef = useRef<HTMLDivElement | null>(null);
  const reorderingDaysRef = useRef(false);
  // State twin of reorderingDaysRef — the ref alone doesn't trigger a
  // re-render, so the loading overlay below needs this to actually show
  // while the reorder-days POST + item refetch are in flight (see the
  // timing note in handleDayPointerEnd).
  const [reorderingDays, setReorderingDays] = useState(false);
  // Set for exactly one click right after a real day move commits, so the
  // browser's own click (synthesized on the tab that captured the pointer,
  // which is the OLD day number — now different content) can't clobber the
  // setOpenDay already applied for the new position.
  const suppressNextDayClickRef = useRef(false);

  function registerDayTabRef(day: number, el: HTMLButtonElement | null) {
    if (el) dayTabRefs.current.set(day, el);
    else dayTabRefs.current.delete(day);
  }

  // 0-based insertion slot in [0, dayCount] — "insert before this many
  // existing tabs" — computed from each tab's own (unchanged) rect, same
  // midpoint-crossing test the item drag uses.
  function computeDayDropIndex(pointerX: number): number {
    for (let day = 1; day <= dayCount; day++) {
      const el = dayTabRefs.current.get(day);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (pointerX < rect.left + rect.width / 2) return day - 1;
    }
    return dayCount;
  }

  function dayDragFrame() {
    if (!draggingDayActiveRef.current) {
      dayDragRafRef.current = null;
      return;
    }
    const container = dayTabsContainerRef.current;
    const pointerX = dayPointerXRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      const threshold = 48;
      let direction = 0;
      let intensity = 0;
      if (pointerX < rect.left + threshold) {
        direction = -1;
        intensity = (rect.left + threshold - pointerX) / threshold;
      } else if (pointerX > rect.right - threshold) {
        direction = 1;
        intensity = (pointerX - (rect.right - threshold)) / threshold;
      }
      if (direction !== 0) {
        const speed = 4 + Math.min(intensity, 1) * 14;
        const maxLeft = container.scrollWidth - container.clientWidth;
        container.scrollLeft = Math.max(0, Math.min(maxLeft, container.scrollLeft + direction * speed));
      }
    }
    const newIndex = computeDayDropIndex(pointerX);
    if (newIndex !== dayDropIndexRef.current) {
      dayDropIndexRef.current = newIndex;
      setDayDropIndex(newIndex);
    }
    dayDragRafRef.current = requestAnimationFrame(dayDragFrame);
  }

  function handleDayPointerDown(e: ReactPointerEvent<HTMLButtonElement>, day: number) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (draggingDayActiveRef.current || reorderingDaysRef.current) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    setDraggingDay(day);
    draggingDayRef.current = day;
    draggingDayActiveRef.current = true;
    dayPointerXRef.current = e.clientX;
    const initialIndex = day - 1;
    dayDropIndexRef.current = initialIndex;
    setDayDropIndex(initialIndex);
    document.body.style.cursor = "grabbing";
    dayDragRafRef.current = requestAnimationFrame(dayDragFrame);
  }

  function handleDayPointerMove(e: ReactPointerEvent<HTMLButtonElement>) {
    if (!draggingDayActiveRef.current) return;
    dayPointerXRef.current = e.clientX;
    const newIndex = computeDayDropIndex(e.clientX);
    if (newIndex !== dayDropIndexRef.current) {
      dayDropIndexRef.current = newIndex;
      setDayDropIndex(newIndex);
    }
  }

  async function handleDayPointerEnd(e: ReactPointerEvent<HTMLButtonElement>) {
    if (!draggingDayActiveRef.current) return;
    draggingDayActiveRef.current = false;
    if (dayDragRafRef.current != null) {
      cancelAnimationFrame(dayDragRafRef.current);
      dayDragRafRef.current = null;
    }
    document.body.style.cursor = "";
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    const fromDay = draggingDayRef.current;
    const targetIndex = dayDropIndexRef.current;
    setDraggingDay(null);
    setDayDropIndex(null);
    draggingDayRef.current = null;
    dayDropIndexRef.current = null;
    if (fromDay == null || targetIndex == null) return;

    const fromIndex = fromDay - 1;
    if (targetIndex === fromIndex || targetIndex === fromIndex + 1) return; // dropped back where it started
    const toIndex = targetIndex > fromIndex ? targetIndex - 1 : targetIndex;
    const toDay = toIndex + 1;
    // Only guards a click the browser synthesizes immediately after this
    // drag's pointerup (some browsers fire one on the capturing element
    // even after real movement) — auto-clears shortly after so it can
    // never linger and swallow a later, unrelated click.
    suppressNextDayClickRef.current = true;
    setTimeout(() => {
      suppressNextDayClickRef.current = false;
    }, 400);

    reorderingDaysRef.current = true;
    setReorderingDays(true);
    try {
      await dispatch(reorderItineraryDays({ itineraryUid, fromDayNumber: fromDay, toDayNumber: toDay }));
      await dispatch(fetchItineraryItems(itineraryUid));
    } finally {
      reorderingDaysRef.current = false;
      setReorderingDays(false);
    }

    // Keep showing whatever the user was actually looking at — follow it
    // to its new position with the exact same shift the backend just
    // applied to every item's dayNumber.
    setOpenDay((current) => {
      if (current === fromDay) return toDay;
      if (fromDay < toDay && current > fromDay && current <= toDay) return current - 1;
      if (fromDay > toDay && current >= toDay && current < fromDay) return current + 1;
      return current;
    });
  }

  function handleDayTabClick(day: number) {
    if (suppressNextDayClickRef.current) {
      suppressNextDayClickRef.current = false;
      return;
    }
    setOpenDay(day);
  }

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

  const activeDayItems = (itemsByDay[openDay] ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder);

  // --- Drag-and-drop reordering (within the currently open day only) ---
  // dragItems is a local, live-reordered copy of activeDayItems, rendered
  // only while a drag is in progress: the dragged card's position in the
  // array updates in real time as the pointer crosses other cards, so the
  // reflow itself is the "drop position" indicator, and the dragged card's
  // elevated styling just rides along wherever it currently sits — no
  // separate floating clone or indicator line needed. Falls back to
  // activeDayItems (the redux-backed order) whenever no drag is active.
  const [dragItems, setDragItems] = useState<ItineraryItem[] | null>(null);
  const [draggingUid, setDraggingUid] = useState<string | null>(null);
  const dragItemsRef = useRef<ItineraryItem[] | null>(null);
  const draggingActiveRef = useRef(false);
  const draggingUidRef = useRef<string | null>(null);
  const pointerYRef = useRef(0);
  const dragRafRef = useRef<number | null>(null);
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const dayListRef = useRef<HTMLDivElement | null>(null);
  const reorderingRef = useRef(false);

  function registerRowRef(uid: string, el: HTMLDivElement | null) {
    if (el) rowRefs.current.set(uid, el);
    else rowRefs.current.delete(uid);
  }

  // Re-derives the drop index from the pointer's current Y against every
  // row's live rect and, if it's crossed into a neighbor's half, reorders
  // dragItems to match. Called every animation frame (not just on
  // pointermove) — see dragFrame — so it keeps tracking correctly even
  // while auto-scroll alone is moving rows under a pointer that isn't
  // itself moving.
  function updateDropTargetFromPointer(pointerY: number, draggedUid: string) {
    const list = dragItemsRef.current;
    if (!list) return;
    const draggedIdx = list.findIndex((it) => it.uid === draggedUid);
    if (draggedIdx === -1) return;
    let targetIdx = list.length;
    for (let i = 0; i < list.length; i++) {
      const el = rowRefs.current.get(list[i].uid);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (pointerY < rect.top + rect.height / 2) {
        targetIdx = i;
        break;
      }
    }
    if (targetIdx === draggedIdx || targetIdx === draggedIdx + 1) return;
    const next = list.slice();
    const [moved] = next.splice(draggedIdx, 1);
    const insertAt = targetIdx > draggedIdx ? targetIdx - 1 : targetIdx;
    next.splice(insertAt, 0, moved);
    dragItemsRef.current = next;
    setDragItems(next);
  }

  // Runs once per frame for the whole duration of a drag: auto-scrolls the
  // day list when the pointer is near its top/bottom edge — speed ramps up
  // the closer it gets, and stops the moment the pointer moves away from
  // the edge — and keeps the drop position current the whole time.
  function dragFrame(draggedUid: string) {
    if (!draggingActiveRef.current) {
      dragRafRef.current = null;
      return;
    }
    const container = dayListRef.current;
    const pointerY = pointerYRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      const threshold = 56;
      let direction = 0;
      let intensity = 0;
      if (pointerY < rect.top + threshold) {
        direction = -1;
        intensity = (rect.top + threshold - pointerY) / threshold;
      } else if (pointerY > rect.bottom - threshold) {
        direction = 1;
        intensity = (pointerY - (rect.bottom - threshold)) / threshold;
      }
      if (direction !== 0) {
        const speed = 4 + Math.min(intensity, 1) * 14;
        const maxScrollTop = container.scrollHeight - container.clientHeight;
        container.scrollTop = Math.max(0, Math.min(maxScrollTop, container.scrollTop + direction * speed));
      }
    }
    updateDropTargetFromPointer(pointerY, draggedUid);
    dragRafRef.current = requestAnimationFrame(() => dragFrame(draggedUid));
  }

  function handleRowPointerDown(e: ReactPointerEvent<HTMLDivElement>, item: ItineraryItem) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    // Let Edit/Delete's own onClick handle the press instead of starting a drag.
    if ((e.target as HTMLElement).closest("button")) return;
    if (draggingActiveRef.current || reorderingRef.current) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    const initial = activeDayItems.slice();
    dragItemsRef.current = initial;
    setDragItems(initial);
    setDraggingUid(item.uid);
    draggingUidRef.current = item.uid;
    draggingActiveRef.current = true;
    pointerYRef.current = e.clientY;
    document.body.style.cursor = "grabbing";
    dragRafRef.current = requestAnimationFrame(() => dragFrame(item.uid));
  }

  function handleRowPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!draggingActiveRef.current) return;
    pointerYRef.current = e.clientY;
    // Also update synchronously from the move event itself, rather than
    // relying solely on the next animation frame (see dragFrame) — keeps
    // the reorder feeling immediate and correct even if a browser/test
    // driver delivers pointerdown/move/up back-to-back without yielding
    // for a paint in between.
    if (draggingUidRef.current) {
      updateDropTargetFromPointer(e.clientY, draggingUidRef.current);
    }
  }

  async function handleRowPointerEnd(e: ReactPointerEvent<HTMLDivElement>) {
    if (!draggingActiveRef.current) return;
    draggingActiveRef.current = false;
    if (dragRafRef.current != null) {
      cancelAnimationFrame(dragRafRef.current);
      dragRafRef.current = null;
    }
    document.body.style.cursor = "";
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setDraggingUid(null);
    draggingUidRef.current = null;

    const finalOrder = dragItemsRef.current;
    dragItemsRef.current = null;
    if (!finalOrder) {
      setDragItems(null);
      return;
    }

    const changed =
      finalOrder.length !== activeDayItems.length || finalOrder.some((it, i) => it.uid !== activeDayItems[i]?.uid);
    if (!changed) {
      setDragItems(null);
      return;
    }

    // Global sortOrder spans the whole itinerary (see the backend reorder
    // endpoint), so the payload has to be the full cross-day list with just
    // this day's slice replaced by its new order — same technique the old
    // Move Up/Down buttons used, just generalized to an arbitrary index
    // move instead of a single adjacent swap.
    const sortedAll = items.slice().sort((a, b) => a.dayNumber - b.dayNumber || a.sortOrder - b.sortOrder);
    let dayIdx = 0;
    const orderedItemUids = sortedAll.map((it) => (it.dayNumber === openDay ? finalOrder[dayIdx++].uid : it.uid));

    reorderingRef.current = true;
    try {
      await dispatch(reorderItineraryItems({ itineraryUid, orderedItemUids }));
      // Awaited (unlike loadItems() elsewhere) so dragItems isn't cleared
      // — falling back to the redux-backed order — until that order
      // actually matches what the drag just settled on; otherwise the list
      // would flash back to the pre-drag order for a moment.
      await dispatch(fetchItineraryItems(itineraryUid));
    } finally {
      reorderingRef.current = false;
      setDragItems(null);
    }
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
      return transportsForEscape.map((t) => ({ value: t.uid, label: `${t.modeCode}${t.vehicleTypeCode ? " — " + t.vehicleTypeCode : ""}` }));
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

  // Remaining hotel nights left for the item currently being edited — its
  // own current nights are excluded from "used" so lowering/keeping the
  // value it already has is never blocked against itself.
  const maxHotelNightsForEdit = modal ? availableHotelNights(items, numberOfDays, modal.editingUid) : undefined;

  // Drop mode (status = Drop) replaces the entire modal body with just
  // reason + charge. Hotel keeps its own status on hotelForm (see
  // HotelDetailFields and ItineraryItemHelper.saveHotelDetail); Activity
  // uses the item-level status field instead (see ItineraryItemHelper.update).
  const isHotelDropMode = !!modal && modal.itemType === "hotel" && modal.hotelForm.status === "Drop";
  const isActivityDropMode = !!modal && modal.itemType === "activity" && modal.status === "Drop";
  const isDropMode = isHotelDropMode || isActivityDropMode;

  // Price is a per-traveller rate — this is the booking's actual total,
  // shown read-only alongside it (see ItineraryItem.travelersCount).
  const activityTotalPrice =
    modal && modal.itemType === "activity" && modal.price.trim() && modal.travelersCount.trim()
      ? Number(modal.price) * Number(modal.travelersCount)
      : null;

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
    if (modal.itemType === "hotel") {
      const nightsError = hotelNightsError(modal.hotelForm, maxHotelNightsForEdit);
      if (nightsError) {
        setFormError(nightsError);
        return;
      }
    }
    if (isActivityDropMode && !modal.droppingReason.trim()) {
      setFormError("Dropping reason is required");
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
          longDescription: modal.longDescription.trim() || undefined,
          price: isActivity && modal.price ? Number(modal.price) : undefined,
          travelersCount: isActivity && modal.travelersCount ? Number(modal.travelersCount) : undefined,
          transportDetail:
            modal.itemType === "transport" ? toTransportDetailPayload(modal.transportForm) : undefined,
          hotelDetail: modal.itemType === "hotel" ? toHotelDetailPayload(modal.hotelForm) : undefined,
          status: isActivity ? modal.status : undefined,
          droppingReason: isActivityDropMode ? modal.droppingReason.trim() : undefined,
          cancellationCharge: isActivityDropMode && modal.cancellationCharge ? Number(modal.cancellationCharge) : undefined,
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

  if ((itemsStatus === "idle" || itemsStatus === "loading") && items.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-16 shrink-0 rounded" />
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded border border-border p-3">
              <Skeleton className="h-4 w-14 shrink-0" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

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
      libraryEmptyLabel: "No transport linked to this escape's destination yet.",
      nameFieldLabel: "Transport name",
      namePlaceholder: "e.g. Private cab to airport",
      libraryOptions: transportsForEscape.map((t) => ({
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
        // PlanningLibraryOption/HotelDetailFields key room types by `uid`
        // (remapped from roomTypeId) and now also carry this hotel's own
        // price/night for each one — used both for the suggestion list's
        // "from ₹X" display and to prefill Price once a room type is picked.
        roomTypes: (h.roomTypes ?? []).map((rt) => ({ uid: rt.roomTypeId, name: rt.name, price: rt.price })),
        mealPlans: h.mealPlans ?? [],
        stars: h.stars,
        basePrice: h.basePrice,
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
        basePrice: a.basePrice,
        activityPrefill: { price: a.basePrice },
      })),
    },
    other: {
      title: "Add Special Inclusion",
      searchPlaceholder: "Search…",
      libraryEmptyLabel: "No library items for this type — use Custom.",
      nameFieldLabel: "Inclusion name",
      namePlaceholder: "e.g. Visa, Complimentary welcome gift",
      libraryOptions: [],
    },
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {reorderingDays && (
        <div className="absolute inset-0 z-30 flex items-center justify-center gap-2 rounded-lg bg-card/80 backdrop-blur-[1px]">
          <Spinner size="sm" />
          <Body muted>Reordering days…</Body>
        </div>
      )}
      <div ref={dayTabsContainerRef} className="relative z-10 flex shrink-0 items-center gap-1.5 overflow-x-auto">
        {Array.from({ length: dayCount }, (_, i) => i + 1).flatMap((day, i) => {
          const isActive = openDay === day;
          const date = dayNumberToDate(escapeStartDate, day);
          const dayTotal = (itemsByDay[day] ?? []).reduce((sum, item) => sum + (getItemTotalPrice(item) ?? 0), 0);
          const nodes = [];
          if (draggingDay != null && dayDropIndex === i) {
            nodes.push(<div key={`day-drop-${i}`} className="h-11 w-0.5 shrink-0 self-stretch rounded-full bg-primary" />);
          }
          nodes.push(
            <button
              key={day}
              ref={(el) => registerDayTabRef(day, el)}
              type="button"
              onClick={() => handleDayTabClick(day)}
              onPointerDown={(e) => handleDayPointerDown(e, day)}
              onPointerMove={handleDayPointerMove}
              onPointerUp={handleDayPointerEnd}
              onPointerCancel={handleDayPointerEnd}
              style={{ touchAction: "none" }}
              className={cn(
                "flex h-11 min-w-[100px] shrink-0 cursor-grab flex-col items-center justify-center gap-0.5 rounded-t-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                isActive
                  ? "-mb-px border-primary border-b-card bg-card text-foreground shadow-sm"
                  : "rounded-b-lg border-border/60 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                draggingDay === day && "relative z-20 cursor-grabbing border-primary/50 shadow-lg ring-2 ring-primary/40",
              )}
            >
              <span className="leading-none">Day {day}</span>
              {date && <span className="leading-none text-[8px] font-normal text-muted-foreground">{formatDayDateWithWeekday(date)}</span>}
              {dayTotal > 0 && <span className="leading-none text-[10px] font-semibold text-primary">{formatInr(dayTotal)}</span>}
            </button>,
          );
          return nodes;
        })}
        {draggingDay != null && dayDropIndex === dayCount && (
          <div className="h-11 w-0.5 shrink-0 self-stretch rounded-full bg-primary" />
        )}

        <button
          type="button"
          onClick={() => {
            setAddDayError(undefined);
            setConfirmingAddDay(true);
          }}
          className="flex h-11 min-w-[100px] shrink-0 items-center justify-center gap-1 rounded-full border border-dashed border-border/70 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          <PiPlusFill className="h-3 w-3" />
          Add Day
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 rounded-lg border border-border bg-card p-2 shadow-sm">
        <div
          ref={dayListRef}
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
            (dragItems ?? activeDayItems).map((item) => (
              <TimelineRow
                key={item.uid}
                item={item}
                isDragging={draggingUid === item.uid}
                registerRef={(el) => registerRowRef(item.uid, el)}
                onDragPointerDown={(e) => handleRowPointerDown(e, item)}
                onDragPointerMove={handleRowPointerMove}
                onDragPointerEnd={handleRowPointerEnd}
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
          defaultTravelersCount={escapeTravelersCount}
          onMealPlanCreated={handleMealPlanCreated}
          maxHotelNights={addingType === "hotel" ? maxHotelNightsForNewItem : undefined}
          {...quickAddConfig[addingType]}
        />
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={isHotelDropMode ? "Drop Hotel" : isActivityDropMode ? "Drop Activity" : "Edit Planning Item"}
      >
        {modal && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {modal.itemType === "hotel" && (
              <Select
                label="Status"
                options={HOTEL_BOOKING_STATUS_OPTIONS}
                value={modal.hotelForm.status}
                onChange={(e) =>
                  setModal((m) => (m ? { ...m, hotelForm: { ...m.hotelForm, status: e.target.value } } : m))
                }
              />
            )}
            {modal.itemType === "activity" && (
              <Select
                label="Status"
                options={HOTEL_BOOKING_STATUS_OPTIONS}
                value={modal.status}
                onChange={(e) => setModal((m) => (m ? { ...m, status: e.target.value } : m))}
              />
            )}
            {isActivityDropMode && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground" htmlFor="activity-dropping-reason">
                    Dropping Reason <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="activity-dropping-reason"
                    value={modal.droppingReason}
                    onChange={(e) => setModal((m) => (m ? { ...m, droppingReason: e.target.value } : m))}
                    rows={3}
                    required
                    placeholder="Why this activity is being dropped"
                    className="rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                  />
                </div>
                <TextInput
                  label="Cancellation Charge (INR)"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="Charged for the cancellation, if any"
                  value={modal.cancellationCharge}
                  onChange={(e) => setModal((m) => (m ? { ...m, cancellationCharge: e.target.value } : m))}
                />
              </>
            )}
            {!isDropMode && (
              <>
                {chunkPairs([
                  // Transport renders its own Start time paired with Price
                  // inside TransportDetailFields below, so it's left out of
                  // this generic block for that type only — otherwise it'd
                  // show twice.
                  ...(modal.itemType === "transport"
                    ? []
                    : [
                      <TimePicker
                        key="startTime"
                        label="Start time"
                        value={modal.startTime}
                        onChange={(v) => setModal((m) => (m ? { ...m, startTime: v } : m))}
                      />,
                    ]),
                  <Select
                    key="type"
                    label="Type"
                    options={PLANNING_ITEM_TYPES}
                    value={modal.itemType}
                    onChange={(e) => handleTypeChange(e.target.value as PlanningItemType)}
                  />,
                  ...(referenceOptions.length > 0
                    ? [
                      <Select
                        key="reference"
                        label={modal.itemType === "activity" ? "Select from library" : "Select from library (optional)"}
                        options={referenceOptions}
                        value={modal.referenceId}
                        onChange={(e) => handleReferenceChange(e.target.value)}
                        placeholder="Not linked to a library item"
                      />,
                    ]
                    : []),
                  ...(modal.itemType !== "activity"
                    ? [
                      <TextInput
                        key="title"
                        label="Title"
                        value={modal.title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="e.g. Airport Pickup"
                        required={!modal.referenceId}
                      />,
                    ]
                    : []),
                ]).map((pair, i) => (
                  <div key={i} className="grid grid-cols-2 gap-3">
                    {pair}
                  </div>
                ))}
                {modal.itemType === "transport" && (
                  <TransportDetailFields
                    value={modal.transportForm}
                    onChange={(next) => setModal((m) => (m ? { ...m, transportForm: next } : m))}
                    defaultPax={defaultPax}
                    startTime={modal.startTime}
                    onStartTimeChange={(v) => setModal((m) => (m ? { ...m, startTime: v } : m))}
                  />
                )}
              </>
            )}
            {modal.itemType === "hotel" && (
              <HotelDetailFields
                value={modal.hotelForm}
                onChange={(next) => setModal((m) => (m ? { ...m, hotelForm: next } : m))}
                mealPlans={hotelsForEscape.find((h) => h.uid === modal.referenceId)?.mealPlans ?? []}
                roomTypes={(hotelsForEscape.find((h) => h.uid === modal.referenceId)?.roomTypes ?? []).map((rt) => ({
                  uid: rt.roomTypeId,
                  name: rt.name,
                  price: rt.price,
                }))}
                hotelName={hotelsForEscape.find((h) => h.uid === modal.referenceId)?.name ?? modal.title}
                hotelUid={modal.referenceId || null}
                maxNights={maxHotelNightsForEdit}
                mode="edit"
                onMealPlanCreated={(mealPlan) => {
                  if (modal.referenceId) handleMealPlanCreated(modal.referenceId, mealPlan);
                }}
              />
            )}
            {!isDropMode && (
              <>
                {chunkPairs([
                  ...(modal.itemType === "activity"
                    ? [
                      <TextInput
                        key="price"
                        label="Price (INR)"
                        type="number"
                        min={0}
                        step="0.01"
                        value={modal.price}
                        onChange={(e) => setModal((m) => (m ? { ...m, price: e.target.value } : m))}
                      />,
                      <TextInput
                        key="travelersCount"
                        label="No. of Travelers"
                        type="number"
                        min={0}
                        value={modal.travelersCount}
                        onChange={(e) => setModal((m) => (m ? { ...m, travelersCount: e.target.value } : m))}
                      />,
                      <TextInput key="totalPrice" label="Total Price (INR)" type="number" value={activityTotalPrice ?? ""} disabled />,
                    ]
                    : []),
                  // Hotel pairs Notes with Total Price (INR) in its own row
                  // below instead, so it's left out of this generic block.
                  ...(modal.itemType === "hotel"
                    ? []
                    : [
                      <TextInput
                        key="notes"
                        label="Notes"
                        value={modal.notes}
                        onChange={(e) => setModal((m) => (m ? { ...m, notes: e.target.value } : m))}
                        placeholder="e.g. Bengaluru → Netravati"
                      />,
                    ]),
                ]).map((pair, i) => (
                  <div key={i} className="grid grid-cols-2 gap-3">
                    {pair}
                  </div>
                ))}
                {modal.itemType === "hotel" && (
                  <div className="grid grid-cols-2 gap-3">
                    <TextInput
                      label="Total Price (INR)"
                      type="number"
                      min={0}
                      step="0.01"
                      value={modal.hotelForm.totalPrice}
                      onChange={(e) =>
                        setModal((m) => (m ? { ...m, hotelForm: { ...m.hotelForm, totalPrice: e.target.value } } : m))
                      }
                    />
                    <TextInput
                      label="Notes"
                      value={modal.notes}
                      onChange={(e) => setModal((m) => (m ? { ...m, notes: e.target.value } : m))}
                      placeholder="e.g. Bengaluru → Netravati"
                    />
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground" htmlFor="edit-planning-item-long-description">
                    Description (optional)
                  </label>
                  <textarea
                    id="edit-planning-item-long-description"
                    value={modal.longDescription}
                    onChange={(e) => setModal((m) => (m ? { ...m, longDescription: e.target.value } : m))}
                    rows={3}
                    placeholder="Longer descriptive copy shown as an expandable block in the quotation PDF"
                    className="rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                  />
                </div>
              </>
            )}
            {formError && <p className="text-sm text-danger">{formError}</p>}
            <div className="flex gap-3 w-full border-t border-border pt-5">
              <Button type="button" variant="ghost" disabled={saving} onClick={() => setModal(null)} className="w-full">
                Cancel
              </Button>
              <Button type="submit" disabled={saving} loading={saving} loadingText="Saving…" className="w-full">
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
