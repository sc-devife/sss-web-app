"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaChevronLeft, FaLocationDot } from "react-icons/fa6";
import { CiImageOff } from "react-icons/ci";
import { PiClockCountdownFill, PiStarFill } from "react-icons/pi";
import { TbCalendarX, TbEditFilled } from "react-icons/tb";
import { BsFillBookmarkXFill, BsBookmarkCheckFill } from "react-icons/bs";
import type { IconType } from "react-icons";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { Caption } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import { HotelFormModal, AMENITY_OPTIONS } from "@/components/library/HotelFormModal";
import { resolveFileUrl } from "@/lib/files";
import { formatDisplayDate, formatDisplayTime } from "@/lib/date";
import { clientApi } from "@/lib/axios/clientClient";
import type { Hotel, HotelBooking } from "@/lib/hotels";
import type { LibraryLocation } from "@/lib/locations";
import type { EscapePoint } from "@/lib/escape-points";
import type { MealPlan } from "@/lib/meal-plans";
import type { RoomType } from "@/lib/room-types";
import type { Service } from "@/lib/services";
import { useAppDispatch } from "@/store/hooks";
import { updateHotel } from "@/features/hotels/hotelsThunks";

function BackToHotels() {
  return (
    <Link
      href="/library/hotels"
      className="inline-flex w-fit items-center gap-0.5 text-[13px] text-foreground/70 transition-colors hover:text-foreground"
    >
      <FaChevronLeft size={12} className="shrink-0" />
      <span className="font-semibold">Back to Hotels</span>
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

function ServiceList({ services }: { services: { uid: string; name: string; description: string | null }[] }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {services.map((s) => (
        <div
          key={s.uid}
          className="flex items-start gap-2.5 rounded-lg border border-border bg-background px-3 py-2.5"
        >
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <BsBookmarkCheckFill size={14} />
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-foreground">{s.name}</div>
            {s.description && (
              <div className="mt-0.5 text-xs leading-snug text-muted-foreground">{s.description}</div>
            )}
          </div>
        </div>
      ))}
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

function TagGroup({ label, tags }: { label: string; tags: { key: string; text: string }[] }) {
  return (
    <div>
      <Caption>{label}</Caption>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {tags.length > 0 ? (
          tags.map((t) => (
            <Badge key={t.key} tone="neutral">
              {t.text}
            </Badge>
          ))
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </div>
    </div>
  );
}

// The premium, dedicated Hotel Details page — replaces the old View modal
// (a hotel carries far too much information to do justice in a popup).
// Everything descriptive about the property (location, stay policies, meal
// plans/room types/services, amenities, gallery) is shown directly on the
// page; the more transactional/interactive areas (Notes, Bookings,
// Payments, Accounting) stay tabbed below, same grouping the old modal used.
export function HotelDetailPanel({
  hotel,
  locations,
  escapePoints,
  mealPlans,
  roomTypes,
  services,
}: {
  hotel: Hotel;
  locations: LibraryLocation[];
  escapePoints: EscapePoint[];
  mealPlans: MealPlan[];
  roomTypes: RoomType[];
  services: Service[];
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [editOpen, setEditOpen] = useState(false);
  const [notesDraft, setNotesDraft] = useState(hotel.notes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [bookings, setBookings] = useState<HotelBooking[] | null>(null);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  useEffect(() => {
    setNotesDraft(hotel.notes ?? "");
  }, [hotel.notes]);

  useEffect(() => {
    setBookingsLoading(true);
    clientApi
      .get<HotelBooking[]>(`/library/hotels/${hotel.uid}/bookings`)
      .then((res) => setBookings(res.data))
      .catch(() => setBookings([]))
      .finally(() => setBookingsLoading(false));
  }, [hotel.uid]);

  async function handleSaveNotes() {
    setSavingNotes(true);
    try {
      await dispatch(updateHotel({ uid: hotel.uid, payload: { notes: notesDraft } })).unwrap();
      router.refresh();
    } finally {
      setSavingNotes(false);
    }
  }

  const images = hotel.images ?? [];

  return (
    <Card variant="page" className="flex min-h-full flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <BackToHotels />
        <Button onClick={() => setEditOpen(true)}>
          <TbEditFilled size={16} />
          Edit hotel
        </Button>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-border">
        {images.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={resolveFileUrl(images[0])} alt={hotel.name} className="h-64 w-full object-cover md:h-80" />
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
            <h1 className="truncate text-2xl font-bold tracking-tight text-white md:text-3xl">{hotel.name}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/90">
              {hotel.stars != null && (
                <span className="flex items-center gap-1">
                  {Array.from({ length: hotel.stars }, (_, i) => (
                    <PiStarFill key={i} size={13} />
                  ))}
                </span>
              )}
              <span className="flex items-center gap-1">
                <FaLocationDot size={12} />
                {hotel.location?.displayName || "No location available"}
              </span>
            </div>
          </div>
          <Badge tone={hotel.status === "archived" ? "danger" : "success"}>{hotel.status ?? "active"}</Badge>
        </div>
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.slice(1).map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={resolveFileUrl(url)}
              alt={hotel.name}
              className="h-20 w-28 shrink-0 rounded-lg border border-border object-cover"
            />
          ))}
        </div>
      )}

      {/* Escape point + quick facts */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-background p-3">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Escape Point</div>
          <div className="mt-1">
            {hotel.escapePoint ? (
              <Badge tone="neutral">{hotel.escapePoint.name}</Badge>
            ) : (
              <span className="text-sm text-muted-foreground">Not assigned</span>
            )}
          </div>
        </div>
        <StatCard label="Check-in" value={formatDisplayTime(hotel.checkInTime) || "—"} />
        <StatCard label="Check-out" value={formatDisplayTime(hotel.checkOutTime) || "—"} />
        <StatCard
          label="Rate Valid"
          value={
            hotel.rateValidFrom || hotel.rateValidTo
              ? `${formatDisplayDate(hotel.rateValidFrom) ?? "—"} to ${formatDisplayDate(hotel.rateValidTo) ?? "—"}`
              : "—"
          }
        />
      </div>

      {/* Property details + offerings */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 p-4">
          <Caption>Property Details</Caption>
          {hotel.childAgeForExtraBed && (
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Child Extra-bed Age</div>
              <div className="mt-0.5 text-sm font-medium text-foreground">{hotel.childAgeForExtraBed}</div>
            </div>
          )}
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Address</div>
            <div className="mt-0.5 text-sm font-medium text-foreground">{hotel.address || "—"}</div>
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Contact Info</div>
            <div className="mt-0.5 text-sm font-medium text-foreground">{hotel.contactInfo || "—"}</div>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 p-4">
          <Caption>Offerings</Caption>
          <TagGroup
            label="Meal Plans"
            tags={(hotel.mealPlans ?? []).map((m) => ({ key: m.uid, text: m.code }))}
          />
          <TagGroup
            label="Room Types"
            tags={(hotel.roomTypes ?? []).map((r) => ({ key: r.uid, text: r.name }))}
          />
        </div>
      </div>

      {hotel.amenities && hotel.amenities.length > 0 && (
        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <Caption>Amenities</Caption>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {hotel.amenities.map((a) => (
              <Badge key={a} tone="neutral">
                {AMENITY_OPTIONS.find((o) => o.value === a)?.label ?? a}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {images.length > 1 && (
        <div>
          <Caption>Gallery</Caption>
          <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {images.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={resolveFileUrl(url)}
                alt={hotel.name}
                className="aspect-square w-full rounded-lg border border-border object-cover transition-transform hover:scale-[1.02]"
              />
            ))}
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1">
        <Tabs
          tabs={[
            { id: "notes", label: "Hotel Notes" },
            { id: "bookings", label: "Bookings" },
            { id: "payments", label: "Payments" },
            { id: "accounting", label: "Accounting" },
            { id: "services", label: "Services" },
          ]}
        >
          {(activeTab) => (
            <div className="flex flex-col gap-4 p-1">
              {activeTab === "notes" && (
                <div className="flex flex-col gap-3">
                  <textarea
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    placeholder="No notes yet — add internal notes about this hotel."
                    rows={8}
                    className="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground outline-none focus:border-primary"
                  />
                  <Button
                    className="self-end"
                    onClick={handleSaveNotes}
                    disabled={savingNotes || notesDraft === (hotel.notes ?? "")}
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
                  <EmptyState message="No bookings found for this hotel." icon={TbCalendarX} />
                ))}

              {activeTab === "payments" && <InlineComingSoon label="Payments" />}
              {activeTab === "accounting" && <InlineComingSoon label="Accounting" />}

              {activeTab === "services" &&
                (hotel.services && hotel.services.length > 0 ? (
                  <ServiceList services={hotel.services} />
                ) : (
                  <EmptyState message="No services found for this hotel." icon={BsFillBookmarkXFill} />
                ))}
            </div>
          )}
        </Tabs>
      </div>

      <HotelFormModal
        open={editOpen}
        hotel={hotel}
        onClose={() => setEditOpen(false)}
        onSaved={() => router.refresh()}
        locations={locations}
        escapePoints={escapePoints}
        mealPlans={mealPlans}
        roomTypes={roomTypes}
        services={services}
      />
    </Card>
  );
}
