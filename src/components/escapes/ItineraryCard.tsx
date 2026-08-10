"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Body, Caption } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import type { Itinerary } from "@/lib/itineraries";
import type { ItineraryItem } from "@/lib/itinerary-items";
import type { Hotel } from "@/lib/hotels";
import type { Activity } from "@/lib/activities";
import type { Transport } from "@/lib/transports";
import { QuotesPanel } from "@/components/escapes/QuotesPanel";
import { ItineraryContentSection } from "@/components/escapes/ItineraryContentSection";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchItineraryItems,
  createItineraryItem,
  deleteItineraryItem,
  reorderItineraryItems,
} from "@/features/itineraryItems/itineraryItemsThunks";
import { selectItineraryItems, selectItineraryItemsStatus } from "@/features/itineraryItems/itineraryItemsSelectors";
import { deleteItinerary, newItineraryVersion } from "@/features/itineraries/itinerariesThunks";

const ITEM_TYPES = [
  { value: "hotel", label: "Hotel" },
  { value: "activity", label: "Activity" },
  { value: "transport", label: "Transport" },
];

export function ItineraryCard({
  itinerary,
  escapeUid,
  hotels,
  activities,
  transports,
  onChanged,
  onDealChanged,
}: {
  itinerary: Itinerary;
  escapeUid: string;
  hotels: Hotel[];
  activities: Activity[];
  transports: Transport[];
  onChanged: () => void;
  onDealChanged?: () => void;
}) {
  const dispatch = useAppDispatch();
  const items = useAppSelector((s) => selectItineraryItems(s, itinerary.uid));
  const itemsStatus = useAppSelector((s) => selectItineraryItemsStatus(s, itinerary.uid));

  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const [dayNumber, setDayNumber] = useState("1");
  const [itemType, setItemType] = useState("hotel");
  const [referenceId, setReferenceId] = useState("");
  const [notes, setNotes] = useState("");
  const [deletingItemUid, setDeletingItemUid] = useState<string | null>(null);

  const isSuperseded = itinerary.status === "superseded";

  useEffect(() => {
    if (expanded && itemsStatus === "idle") {
      dispatch(fetchItineraryItems(itinerary.uid));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  function loadItems() {
    dispatch(fetchItineraryItems(itinerary.uid));
  }

  const referenceOptions =
    itemType === "hotel"
      ? hotels.map((h) => ({ value: h.uid, label: h.name }))
      : itemType === "activity"
      ? activities.map((a) => ({ value: a.uid, label: a.name }))
      : transports.map((t) => ({ value: t.uid, label: `${t.modeCode}${t.vehicleTypeCode ? " — " + t.vehicleTypeCode : ""}` }));

  async function handleAddItem(e: FormEvent) {
    e.preventDefault();
    if (!referenceId) {
      setError("Pick an item from the library");
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      await dispatch(
        createItineraryItem({
          itineraryUid: itinerary.uid,
          dayNumber: Number(dayNumber),
          itemType: itemType as "hotel" | "activity" | "transport",
          referenceId,
          notes: notes || undefined,
        }),
      ).unwrap();
      loadItems();
      setReferenceId("");
      setNotes("");
    } catch (err) {
      setError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to add item"));
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteItem(uid: string) {
    setDeletingItemUid(uid);
    try {
      await dispatch(deleteItineraryItem({ uid, itineraryUid: itinerary.uid }));
      loadItems();
    } finally {
      setDeletingItemUid(null);
    }
  }

  async function handleMove(item: ItineraryItem, direction: -1 | 1) {
    const sameDay = items.filter((i) => i.dayNumber === item.dayNumber).sort((a, b) => a.sortOrder - b.sortOrder);
    const index = sameDay.findIndex((i) => i.uid === item.uid);
    const swapWith = sameDay[index + direction];
    if (!swapWith) return;

    const orderedItemUids = items
      .slice()
      .sort((a, b) => a.dayNumber - b.dayNumber || a.sortOrder - b.sortOrder)
      .map((i) => (i.uid === item.uid ? swapWith.uid : i.uid === swapWith.uid ? item.uid : i.uid));

    await dispatch(reorderItineraryItems({ itineraryUid: itinerary.uid, orderedItemUids }));
    loadItems();
  }

  async function handleNewVersion() {
    setBusy(true);
    try {
      await dispatch(newItineraryVersion(itinerary.uid));
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      await dispatch(deleteItinerary(itinerary.uid));
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  const itemsByDay = items.reduce<Record<number, ItineraryItem[]>>((acc, item) => {
    (acc[item.dayNumber] ??= []).push(item);
    return acc;
  }, {});

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button type="button" onClick={() => setExpanded((e) => !e)} className="flex items-center gap-2 text-left">
          <Body className="font-medium">{itinerary.name}</Body>
          <Badge tone={isSuperseded ? "neutral" : itinerary.status === "active" ? "success" : "neutral"}>
            v{itinerary.version} · {itinerary.status}
          </Badge>
        </button>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" disabled={busy} onClick={handleNewVersion}>New version</Button>
          <Button size="sm" variant="danger" disabled={busy} onClick={handleDelete}>Delete</Button>
        </div>
      </div>

      {expanded && (
        <div className="flex flex-col gap-4 border-t border-border pt-3">
          <div>
            <Caption>Day-by-day</Caption>
            {itemsStatus === "loading" && items.length === 0 && <LoadingState />}
            {itemsStatus !== "loading" && Object.keys(itemsByDay).length === 0 && <Body muted>No items yet.</Body>}
            {Object.entries(itemsByDay)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([day, dayItems]) => (
                <div key={day} className="mt-2 flex flex-col gap-1">
                  <Caption>Day {day}</Caption>
                  {dayItems
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((item, i) => (
                      <div key={item.uid} className="flex items-center justify-between rounded border border-border px-3 py-1.5 text-sm">
                        <span>
                          <Badge tone="neutral">{item.itemType}</Badge> {item.referenceLabel}
                          {item.notes && <span className="text-muted-foreground"> — {item.notes}</span>}
                        </span>
                        <div className="flex gap-1">
                          <button type="button" onClick={() => handleMove(item, -1)} disabled={i === 0} className="px-1 text-muted-foreground hover:text-foreground disabled:opacity-30">↑</button>
                          <button type="button" onClick={() => handleMove(item, 1)} disabled={i === dayItems.length - 1} className="px-1 text-muted-foreground hover:text-foreground disabled:opacity-30">↓</button>
                          <button type="button" onClick={() => handleDeleteItem(item.uid)} disabled={deletingItemUid === item.uid} className="px-1 text-danger hover:underline disabled:opacity-50">Remove</button>
                        </div>
                      </div>
                    ))}
                </div>
              ))}

            <form onSubmit={handleAddItem} className="mt-3 flex flex-wrap items-end gap-2 rounded border border-border p-3">
              <TextInput label="Day" type="number" min={1} value={dayNumber} onChange={(e) => setDayNumber(e.target.value)} className="w-20" />
              <Select
                label="Type"
                options={ITEM_TYPES}
                value={itemType}
                onChange={(e) => { setItemType(e.target.value); setReferenceId(""); }}
                className="w-36"
              />
              <Select
                label="Item"
                options={referenceOptions}
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                placeholder="Select from library"
                className="min-w-[180px] flex-1"
              />
              <TextInput label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="min-w-[140px] flex-1" />
              <Button type="submit" size="sm" disabled={busy}>Add</Button>
            </form>
            {error && <p className="mt-1 text-sm text-danger">{error}</p>}
          </div>

          <ItineraryContentSection itineraryUid={itinerary.uid} />

          <QuotesPanel itineraryUid={itinerary.uid} escapeUid={escapeUid} onDealChanged={onDealChanged} />
        </div>
      )}
    </Card>
  );
}
