"use client";

import { useEffect, useState, type FormEvent } from "react";
import { IoChevronUpOutline, IoChevronDownOutline, IoPencilOutline, IoTrashOutline } from "react-icons/io5";
import { PiPlusFill, PiPlusBold } from "react-icons/pi";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Body, Caption } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
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
} from "@/lib/itinerary-planning";
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
import { AddActivityModal } from "@/components/escapes/AddActivityModal";

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
  };
}

function TimelineRow({
  item,
  isFirst,
  isLast,
  onMove,
  onEdit,
  onDelete,
  deleting,
}: {
  item: ItineraryItem;
  isFirst: boolean;
  isLast: boolean;
  onMove: (direction: -1 | 1) => void;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const Icon = PLANNING_ITEM_ICON[item.itemType];
  const time = formatStartTime(item.startTime);

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border p-3">
      <div className="w-12 shrink-0 pt-0.5 text-xs font-medium text-muted-foreground">{time ?? "—"}</div>
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", PLANNING_ITEM_BADGE_CLASS[item.itemType])}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <Body className="font-medium">{item.referenceLabel}</Body>
        {item.notes && <Caption className="mt-0.5 block normal-case text-muted-foreground">{item.notes}</Caption>}
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          onClick={() => onMove(-1)}
          disabled={isFirst}
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
          aria-label="Move up"
        >
          <IoChevronUpOutline size={14} />
        </button>
        <button
          type="button"
          onClick={() => onMove(1)}
          disabled={isLast}
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
          aria-label="Move down"
        >
          <IoChevronDownOutline size={14} />
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Edit"
        >
          <IoPencilOutline size={14} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="rounded p-1 text-muted-foreground hover:bg-danger/10 hover:text-danger disabled:opacity-50"
          aria-label="Remove"
        >
          <IoTrashOutline size={14} />
        </button>
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

  const [deletingUid, setDeletingUid] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [addingActivity, setAddingActivity] = useState(false);
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
    if (kind === "hotel") return hotels.map((h) => ({ value: h.uid, label: h.name }));
    if (kind === "activity") return activities.map((a) => ({ value: a.uid, label: a.name }));
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

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative z-10 flex shrink-0 items-center gap-1.5 overflow-x-auto">
        {Array.from({ length: dayCount }, (_, i) => i + 1).map((day) => {
          const isActive = openDay === day;
          const date = dayNumberToDate(escapeStartDate, day);
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

      <div className="flex min-h-0 flex-1 flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-sm">
        <div
          className={cn(
            "show-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto",
            activeDayItems.length === 0 && "items-center justify-center text-center",
          )}
        >
          {activeDayItems.length === 0 ? (
            <>
              <Body muted>No items planned for this day yet.</Body>
              <button
                type="button"
                onClick={() => setAddingActivity(true)}
                aria-label="Add Activity"
                title="Add Activity"
                className="flex h-7 w-16 shrink-0 items-center justify-center rounded-full border border-primary bg-transparent text-primary shadow-sm transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                <PiPlusBold className="h-3.5 w-3.5" />
              </button>
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
              />
            ))
          )}
        </div>
        {activeDayItems.length > 0 && (
          <button
            type="button"
            onClick={() => setAddingActivity(true)}
            aria-label="Add Activity"
            title="Add Activity"
            className="flex h-7 w-16 shrink-0 items-center justify-center self-start rounded-full border border-primary bg-transparent text-primary shadow-sm transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            <PiPlusBold className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <AddActivityModal
        open={addingActivity}
        onClose={() => setAddingActivity(false)}
        itineraryUid={itineraryUid}
        dayNumber={openDay}
        activities={activities}
        onCreated={loadItems}
      />

      <Modal open={!!modal} onClose={() => setModal(null)} title="Edit planning item">
        {modal && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <TextInput
              label="Start time"
              type="time"
              value={modal.startTime}
              onChange={(e) => setModal((m) => (m ? { ...m, startTime: e.target.value } : m))}
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
