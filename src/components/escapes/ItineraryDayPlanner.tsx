"use client";

import { useEffect, useState, type FormEvent } from "react";
import { IoChevronUpOutline, IoChevronDownOutline, IoPencilOutline, IoTrashOutline } from "react-icons/io5";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Heading, Body, Caption } from "@/components/ui/Typography";
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
  formatDayDate,
  formatStartTime,
} from "@/lib/itinerary-planning";
import { cn } from "@/lib/cn";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchItineraryItems,
  createItineraryItem,
  updateItineraryItem,
  deleteItineraryItem,
  reorderItineraryItems,
} from "@/features/itineraryItems/itineraryItemsThunks";
import { selectItineraryItems, selectItineraryItemsStatus } from "@/features/itineraryItems/itineraryItemsSelectors";

interface ModalState {
  open: boolean;
  editingUid: string | null;
  dayNumber: string;
  itemType: PlanningItemType;
  referenceId: string;
  title: string;
  titleAutoFilled: boolean;
  startTime: string;
  notes: string;
}

function blankModalState(dayNumber: number): ModalState {
  return {
    open: true,
    editingUid: null,
    dayNumber: String(dayNumber),
    itemType: "hotel",
    referenceId: "",
    title: "",
    titleAutoFilled: false,
    startTime: "",
    notes: "",
  };
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

  const [extraDays, setExtraDays] = useState(0);
  const [deletingUid, setDeletingUid] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();

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
  const dayCount = Math.max(numberOfDays ?? 1, maxItemDay, 1) + extraDays;

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
    if (!modal.title.trim() && !modal.referenceId) {
      setFormError("Enter a title or pick a library item");
      return;
    }
    setSaving(true);
    setFormError(undefined);
    try {
      const payload = {
        dayNumber: Number(modal.dayNumber),
        itemType: modal.itemType,
        referenceId: modal.referenceId || undefined,
        title: modal.title.trim() || undefined,
        startTime: modal.startTime || undefined,
        notes: modal.notes.trim() || undefined,
      };
      if (modal.editingUid) {
        await dispatch(updateItineraryItem({ uid: modal.editingUid, itineraryUid, ...payload })).unwrap();
      } else {
        await dispatch(createItineraryItem({ itineraryUid, ...payload })).unwrap();
      }
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

  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: dayCount }, (_, i) => i + 1).map((day) => {
        const dayItems = (itemsByDay[day] ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder);
        const date = dayNumberToDate(escapeStartDate, day);
        return (
          <Card key={day} variant="elevated" className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between border-b border-border pb-2">
              <Heading as="h4">Day {day}</Heading>
              {date && <Caption>{formatDayDate(date)}</Caption>}
            </div>
            <div className="flex flex-col gap-2">
              {dayItems.length === 0 ? (
                <Body muted>No items planned for this day yet.</Body>
              ) : (
                dayItems.map((item, i) => (
                  <TimelineRow
                    key={item.uid}
                    item={item}
                    isFirst={i === 0}
                    isLast={i === dayItems.length - 1}
                    onMove={(direction) => handleMove(item, direction)}
                    onEdit={() => setModal(editModalState(item))}
                    onDelete={() => handleDeleteItem(item.uid)}
                    deleting={deletingUid === item.uid}
                  />
                ))
              )}
            </div>
            <Button type="button" variant="secondary" size="sm" className="self-start" onClick={() => setModal(blankModalState(day))}>
              + Add planning item
            </Button>
          </Card>
        );
      })}

      <Button type="button" variant="ghost" size="sm" className="self-start" onClick={() => setExtraDays((n) => n + 1)}>
        + Add day
      </Button>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.editingUid ? "Edit planning item" : "Add planning item"}>
        {modal && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <TextInput
                label="Day"
                type="number"
                min={1}
                value={modal.dayNumber}
                onChange={(e) => setModal((m) => (m ? { ...m, dayNumber: e.target.value } : m))}
                required
              />
              <TextInput
                label="Start time"
                type="time"
                value={modal.startTime}
                onChange={(e) => setModal((m) => (m ? { ...m, startTime: e.target.value } : m))}
              />
            </div>
            <Select
              label="Type"
              options={PLANNING_ITEM_TYPES}
              value={modal.itemType}
              onChange={(e) => handleTypeChange(e.target.value as PlanningItemType)}
            />
            {referenceOptions.length > 0 && (
              <Select
                label="Select from library (optional)"
                options={referenceOptions}
                value={modal.referenceId}
                onChange={(e) => handleReferenceChange(e.target.value)}
                placeholder="Not linked to a library item"
              />
            )}
            <TextInput
              label="Title"
              value={modal.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Airport Pickup"
              required={!modal.referenceId}
            />
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
    </div>
  );
}
