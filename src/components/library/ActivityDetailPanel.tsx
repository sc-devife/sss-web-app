"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaChevronLeft, FaLocationDot } from "react-icons/fa6";
import { CiImageOff } from "react-icons/ci";
import { PiClockCountdownFill } from "react-icons/pi";
import { TbCalendarX, TbEditFilled } from "react-icons/tb";
import type { IconType } from "react-icons";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { Body, Caption } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import { ActivityFormModal, CATEGORY_OPTIONS } from "@/components/library/ActivityFormModal";
import { resolveFileUrl } from "@/lib/files";
import { formatDisplayDate, formatDisplayTime } from "@/lib/date";
import { clientApi } from "@/lib/axios/clientClient";
import type { Activity, ActivityBooking } from "@/lib/activities";
import type { EscapePoint } from "@/lib/escape-points";
import { useAppDispatch } from "@/store/hooks";
import { updateActivity } from "@/features/activities/activitiesThunks";

function BackToActivities() {
  return (
    <Link
      href="/library/activities"
      className="inline-flex w-fit items-center gap-0.5 text-[13px] text-foreground/70 transition-colors hover:text-foreground"
    >
      <FaChevronLeft size={12} className="shrink-0" />
      <span className="font-semibold">Back to Activities</span>
    </Link>
  );
}

function InlineComingSoon({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-muted/30 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <PiClockCountdownFill size={22} />
      </div>
      <div className="text-sm font-medium text-muted-foreground">{label} · coming soon</div>
    </div>
  );
}

function EmptyState({ message, icon: Icon }: { message: string; icon?: IconType }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-muted/30 py-14 text-center">
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Icon size={20} />
        </div>
      )}
      <div className="text-sm font-medium text-muted-foreground">{message}</div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

// The premium, dedicated Activity Details page — replaces the old View
// modal, mirroring the Hotel Details page's pattern: everything descriptive
// shown directly on the page, the more transactional/interactive areas
// (Notes, Bookings, Payments) tabbed below.
export function ActivityDetailPanel({
  activity,
  escapePoints,
}: {
  activity: Activity;
  escapePoints: EscapePoint[];
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [editOpen, setEditOpen] = useState(false);
  const [notesDraft, setNotesDraft] = useState(activity.notes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [bookings, setBookings] = useState<ActivityBooking[] | null>(null);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  useEffect(() => {
    setNotesDraft(activity.notes ?? "");
  }, [activity.notes]);

  useEffect(() => {
    setBookingsLoading(true);
    clientApi
      .get<ActivityBooking[]>(`/library/activities/${activity.uid}/bookings`)
      .then((res) => setBookings(res.data))
      .catch(() => setBookings([]))
      .finally(() => setBookingsLoading(false));
  }, [activity.uid]);

  async function handleSaveNotes() {
    setSavingNotes(true);
    try {
      await dispatch(updateActivity({ uid: activity.uid, payload: { notes: notesDraft } })).unwrap();
      router.refresh();
    } finally {
      setSavingNotes(false);
    }
  }

  const images = activity.images ?? [];
  const categoryLabel = CATEGORY_OPTIONS.find((c) => c.value === activity.categoryCode)?.label ?? activity.categoryCode;

  return (
    <Card variant="page" className="flex min-h-full flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <BackToActivities />
        <Button onClick={() => setEditOpen(true)}>
          <TbEditFilled size={16} />
          Edit activity
        </Button>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-border">
        {images.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={resolveFileUrl(images[0])} alt={activity.name} className="h-64 w-full object-cover md:h-80" />
        ) : (
          <div className="flex h-64 flex-col items-center justify-center gap-3 bg-muted/30 md:h-80">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <CiImageOff size={22} />
            </div>
            <div className="text-sm font-medium text-muted-foreground">No image available</div>
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold tracking-tight text-white md:text-3xl">{activity.name}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/90">
              {categoryLabel && <span>{categoryLabel}</span>}
              {activity.escapePoint && (
                <span className="flex items-center gap-1">
                  <FaLocationDot size={12} />
                  {activity.escapePoint.name}
                </span>
              )}
            </div>
          </div>
          <Badge tone={activity.status === "archived" ? "danger" : "success"}>{activity.status ?? "active"}</Badge>
        </div>
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.slice(1).map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={resolveFileUrl(url)}
              alt={activity.name}
              className="h-20 w-28 shrink-0 rounded-lg border border-border object-cover"
            />
          ))}
        </div>
      )}

      {/* Quick facts */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-background p-3">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Escape Point</div>
          <div className="mt-1">
            {activity.escapePoint ? (
              <Badge tone="neutral">{activity.escapePoint.name}</Badge>
            ) : (
              <span className="text-sm text-muted-foreground">Not assigned</span>
            )}
          </div>
        </div>
        <StatCard label="Duration" value={activity.durationMinutes ? `${activity.durationMinutes} min` : "—"} />
        <StatCard label="Base Price" value={activity.basePrice != null ? `₹${activity.basePrice.toFixed(2)}` : "—"} />
        <StatCard label="Category" value={categoryLabel ?? "—"} />
      </div>

      {/* Description */}
      <div className="rounded-xl border border-border bg-muted/20 p-4">
        <Caption>About this Activity</Caption>
        <Body className="mt-1 whitespace-pre-wrap leading-6">
          {activity.description || "No description available."}
        </Body>
      </div>

      {images.length > 1 && (
        <div>
          <Caption>Gallery</Caption>
          <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {images.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={resolveFileUrl(url)}
                alt={activity.name}
                className="aspect-square w-full rounded-lg border border-border object-cover transition-transform hover:scale-[1.02]"
              />
            ))}
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1">
        <Tabs
          tabs={[
            { id: "notes", label: "Activity Notes" },
            { id: "bookings", label: "Bookings" },
            { id: "payments", label: "Payments" },
          ]}
        >
          {(activeTab) => (
            <div className="flex flex-col gap-4 p-1">
              {activeTab === "notes" && (
                <div className="flex flex-col gap-3">
                  <textarea
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    placeholder="No notes yet — add internal notes about this activity."
                    rows={8}
                    className="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground outline-none focus:border-primary"
                  />
                  <Button
                    className="self-end"
                    onClick={handleSaveNotes}
                    disabled={savingNotes || notesDraft === (activity.notes ?? "")}
                    loading={savingNotes}
                    loadingText="Saving…"
                  >
                    Save notes
                  </Button>
                </div>
              )}

              {activeTab === "bookings" &&
                (bookingsLoading ? (
                  <LoadingState label="Loading bookings…" />
                ) : bookings && bookings.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {bookings.map((b) => (
                      <div key={b.itineraryItemUid} className="rounded-xl border border-border bg-background p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-foreground">{b.leadName || "Untitled trip"}</div>
                            <div className="mt-0.5 text-xs text-muted-foreground">
                              {b.escapeStartDate || b.escapeEndDate
                                ? `${formatDisplayDate(b.escapeStartDate) ?? "—"} to ${formatDisplayDate(b.escapeEndDate) ?? "—"}`
                                : "—"}
                              {" · "}Day {b.dayNumber ?? "—"}
                              {b.startTime ? ` · ${formatDisplayTime(b.startTime)}` : ""}
                            </div>
                          </div>
                          {b.escapeStatus && <Badge tone="neutral">{b.escapeStatus}</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState message="No bookings found for this activity." icon={TbCalendarX} />
                ))}

              {activeTab === "payments" && <InlineComingSoon label="Payments" />}
            </div>
          )}
        </Tabs>
      </div>

      <ActivityFormModal
        open={editOpen}
        activity={activity}
        onClose={() => setEditOpen(false)}
        onSaved={() => router.refresh()}
        escapePoints={escapePoints}
      />
    </Card>
  );
}
