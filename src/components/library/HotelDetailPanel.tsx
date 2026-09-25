"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { FaChevronLeft, FaLocationDot, FaPlus } from "react-icons/fa6";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import { CiImageOff } from "react-icons/ci";
import { IoSearchOutline } from "react-icons/io5";
import { PiStarFill, PiHashFill } from "react-icons/pi";
import { TbCalendarX, TbEditFilled, TbMailForward } from "react-icons/tb";
import { BsCalendarCheck } from "react-icons/bs";
import type { IconType } from "react-icons";
import { FormAppearanceProvider } from "@/components/ui/FormAppearance";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { Alert } from "@/components/ui/Alert";
import { Caption } from "@/components/ui/Typography";
import { HoverMarqueeText } from "@/components/ui/HoverMarqueeText";
import { Skeleton } from "@/components/ui/Skeleton";
import { TextInput } from "@/components/ui/TextInput";
import { Select } from "@/components/ui/Select";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { HotelPaymentModal } from "@/components/library/HotelPaymentModal";
import { HotelFormModal } from "@/components/library/HotelFormModal";
import type { LibraryLocation } from "@/lib/locations";
import type { EscapePoint } from "@/lib/escape-points";
import type { MealPlan } from "@/lib/meal-plans";
import type { RoomType } from "@/lib/room-types";
import type { Service } from "@/lib/services";
import type { Amenity } from "@/lib/amenities";
import { HotelServicesEditor } from "@/components/library/HotelServicesEditor";
import { EditIconActions, EditableSection, MealPlansEditor, RoomTypesEditor, AmenitiesEditor, RulesEditor, ImagesEditor } from "@/components/library/HotelSectionEditors";
import { HotelBookingEmailModal } from "@/components/library/HotelBookingEmailModal";
import { CancellationEmailModal } from "@/components/library/CancellationEmailModal";
import { CancelBookingModal } from "@/components/library/CancelBookingModal";
import { resolveFileUrl } from "@/lib/files";
import { formatDisplayDate, formatDisplayTime } from "@/lib/date";
import { formatMoney, formatMoneyWithOriginal } from "@/lib/currency";
import { hotelStatusTone } from "@/lib/hotel-booking-status";
import { paymentMethodLabel } from "@/lib/payment-methods";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { runValidators, ifscField, accountNumberField } from "@/lib/validators";
import type { Hotel, HotelBooking, HotelPayment } from "@/lib/hotels";
import { useAppDispatch } from "@/store/hooks";
import { updateHotel, setHotelPriorityImage } from "@/features/hotels/hotelsThunks";

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

function EmptyState({ message, icon: Icon }: { message: string; icon?: IconType }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Icon size={20} />
        </div>
      )}
      <div className="text-sm font-medium text-muted-foreground">{message}</div>
    </div>
  );
}

function ServiceList({ services, currency }: { services: { uid: string; name: string; description: string | null; price: number | null; hotelId?: string | null }[]; currency?: string | null }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-muted/40">
            <th className="px-3 py-1.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Service</th>
            <th className="px-3 py-1.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Description</th>
            <th className="px-3 py-1.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Price</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {services.map((s) => (
            <tr key={s.uid}>
              <td className="whitespace-nowrap px-3 py-2 align-top font-medium text-foreground">
                {s.name}
                {s.hotelId && <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary">Custom</span>}
              </td>
              <td className="px-3 py-2 align-top text-muted-foreground">{s.description || "—"}</td>
              <td className="whitespace-nowrap px-3 py-2 text-right align-top font-medium tabular-nums text-foreground">
                {s.price != null ? formatMoney(s.price, currency || undefined) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RoomTypeTable({ roomTypes, currency }: { roomTypes: { roomTypeId: string; name: string; price: number | null }[]; currency?: string | null }) {
  return (
    <div>
      {roomTypes.length > 0 ? (
        <div className="mt-1.5 overflow-hidden rounded-lg border border-border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-muted/40">
                <th className="px-3 py-1.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Room Type
                </th>
                <th className="px-3 py-1.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Price / Night
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {roomTypes.map((r) => (
                <tr key={r.roomTypeId}>
                  <td className="px-3 py-2 text-foreground">{r.name}</td>
                  <td className="px-3 py-2 text-right font-medium tabular-nums text-foreground">{formatMoney(r.price, currency || undefined)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-1.5 text-sm text-muted-foreground">—</div>
      )}
    </div>
  );
}

const ACCOUNT_TYPE_OPTIONS = [
  { value: "Savings", label: "Savings" },
  { value: "Current", label: "Current" },
];

type AccountDraft = {
  accountHolderName: string;
  bankName: string;
  branchName: string;
  accountType: string;
  accountNumber: string;
  ifsc: string;
  upiId: string;
};

function accountDraftFromHotel(hotel: Hotel): AccountDraft {
  return {
    accountHolderName: hotel.accountHolderName ?? "",
    bankName: hotel.bankName ?? "",
    branchName: hotel.branchName ?? "",
    accountType: hotel.accountType ?? "",
    accountNumber: hotel.accountNumber ?? "",
    ifsc: hotel.ifsc ?? "",
    upiId: hotel.upiId ?? "",
  };
}

function accountEquals(a: AccountDraft, b: AccountDraft): boolean {
  return (
    a.accountHolderName === b.accountHolderName &&
    a.bankName === b.bankName &&
    a.branchName === b.branchName &&
    a.accountType === b.accountType &&
    a.accountNumber === b.accountNumber &&
    a.ifsc === b.ifsc &&
    a.upiId === b.upiId
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
  amenities,
  startInEditMode = false,
}: {
  hotel: Hotel;
  locations: LibraryLocation[];
  escapePoints: EscapePoint[];
  mealPlans: MealPlan[];
  roomTypes: RoomType[];
  services: Service[];
  amenities: Amenity[];
  startInEditMode?: boolean;
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  // The hotel's own details show as the same pill fields as the edit form, read-only,
  // and become editable in place when Edit Hotel is clicked.
  const [editingDetails, setEditingDetails] = useState(startInEditMode);
  const [editingSection, setEditingSection] = useState<"roomTypes" | "mealPlans" | "amenities" | "rules" | "services" | "notes" | "images" | null>(null);
  const [notesDraft, setNotesDraft] = useState(hotel.notes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [accountDraft, setAccountDraft] = useState(accountDraftFromHotel(hotel));
  const [accountErrors, setAccountErrors] = useState<Record<string, string>>({});
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountError, setAccountError] = useState<string | undefined>();
  const [bookings, setBookings] = useState<HotelBooking[] | null>(null);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingSearch, setBookingSearch] = useState("");
  const [markingBookedUid, setMarkingBookedUid] = useState<string | null>(null);
  const [emailModalItineraryItemUid, setEmailModalItineraryItemUid] = useState<string | null>(null);
  const [cancellationEmailItineraryItemUid, setCancellationEmailItineraryItemUid] = useState<string | null>(null);
  const [cancelBookingUid, setCancelBookingUid] = useState<string | null>(null);
  const [payments, setPayments] = useState<HotelPayment[] | null>(null);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);

  // Server-fetched prop is the source of truth after any router.refresh()
  // (e.g. post-edit); local state additionally lets "Make Priority" update
  // the page instantly without a refetch.
  const [current, setCurrent] = useState(hotel);
  useEffect(() => {
    setCurrent(hotel);
  }, [hotel]);

  const [settingPriorityFor, setSettingPriorityFor] = useState<string | null>(null);
  const [priorityError, setPriorityError] = useState<string | undefined>();

  useEffect(() => {
    setNotesDraft(hotel.notes ?? "");
  }, [hotel.notes]);

  useEffect(() => {
    setAccountDraft(accountDraftFromHotel(hotel));
    setAccountErrors({});
    setAccountError(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotel.accountHolderName, hotel.bankName, hotel.accountNumber, hotel.ifsc, hotel.upiId]);

  function loadBookings() {
    setBookingsLoading(true);
    return clientApi
      .get<HotelBooking[]>(`/library/hotels/${hotel.uid}/bookings`)
      .then((res) => setBookings(res.data))
      .catch(() => setBookings([]))
      .finally(() => setBookingsLoading(false));
  }

  useEffect(() => {
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotel.uid]);

  useEffect(() => {
    setPaymentsLoading(true);
    clientApi
      .get<HotelPayment[]>(`/library/hotels/${hotel.uid}/payments`)
      .then((res) => setPayments(res.data))
      .catch(() => setPayments([]))
      .finally(() => setPaymentsLoading(false));
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

  const accountDirty = !accountEquals(accountDraft, accountDraftFromHotel(hotel));

  async function handleSaveAccount() {
    const nextErrors: Record<string, string> = {};
    const ifscErr = runValidators(accountDraft.ifsc, [ifscField()]);
    if (ifscErr) nextErrors.ifsc = ifscErr;
    const accountNumberErr = runValidators(accountDraft.accountNumber, [accountNumberField()]);
    if (accountNumberErr) nextErrors.accountNumber = accountNumberErr;
    if (Object.keys(nextErrors).length > 0) {
      setAccountErrors(nextErrors);
      return;
    }
    setAccountErrors({});
    setAccountError(undefined);
    setSavingAccount(true);
    try {
      await dispatch(updateHotel({ uid: hotel.uid, payload: { ...accountDraft } })).unwrap();
      router.refresh();
    } catch (err) {
      setAccountError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to save account details"));
    } finally {
      setSavingAccount(false);
    }
  }

  const images = current.images ?? [];
  const cover = current.priorityImage ?? images[0] ?? null;
  // Carousel: the priority image leads, the rest follow in order.
  const slides = cover ? [cover, ...images.filter((u) => u !== cover)] : [];
  const [slide, setSlide] = useState(0);
  const touchX = useRef<number | null>(null);
  const [paused, setPaused] = useState(false);
  const slideIdx = slides.length > 0 ? Math.min(slide, slides.length - 1) : 0;
  const goSlide = (i: number) => setSlide(slides.length ? (i + slides.length) % slides.length : 0);
  // Auto-advance every 5s; hovering the banner pauses it (and any manual move restarts the timer).
  useEffect(() => {
    if (slides.length < 2 || paused || editingSection === "images") return;
    const t = setTimeout(() => setSlide((slideIdx + 1) % slides.length), 5000);
    return () => clearTimeout(t);
  }, [slideIdx, slides.length, paused, editingSection]);

  // Matches on trip code or customer name — the two things someone
  // scanning this list actually recognizes an escape by.
  const trimmedBookingSearch = bookingSearch.trim().toLowerCase();
  const filteredBookings = (bookings ?? []).filter((b) => {
    if (!trimmedBookingSearch) return true;
    return (
      (b.tripCode ?? "").toLowerCase().includes(trimmedBookingSearch) ||
      (b.leadName ?? "").toLowerCase().includes(trimmedBookingSearch)
    );
  });

  // The "Escape ID" choices offered in the Add New Payment popup are this
  // hotel's own actual bookings (already fetched for the Bookings tab above)
  // — reusing that data instead of a separate escape-search endpoint, and
  // deduped since one escape can have multiple day-by-day booking rows.
  const escapeOptions = Array.from(
    new Map((bookings ?? []).map((b) => [b.escapeUid, { escapeUid: b.escapeUid, tripCode: b.tripCode, leadName: b.leadName }])).values(),
  );

  function handlePaymentSaved(payment: HotelPayment) {
    setPayments((prev) => [payment, ...(prev ?? [])]);
    toast.success("Payment saved.");
  }

  const paymentColumns: DataTableColumn<HotelPayment>[] = [
    {
      key: "transactionId",
      header: "Transaction ID",
      render: (p) => p.transactionId || "—",
      filterValue: (p) => p.transactionId ?? "",
    },
    {
      key: "tripCode",
      header: "Escape ID",
      render: (p) => p.tripCode || "—",
      filterValue: (p) => p.tripCode ?? "",
    },
    {
      key: "paymentMethod",
      header: "Payment Method",
      render: (p) => paymentMethodLabel(p.paymentMethod),
    },
    {
      key: "amount",
      header: "Amount",
      render: (p) => formatMoneyWithOriginal(p.amount, p.paidAmount, p.paidCurrency),
      sortValue: (p) => p.amount,
    },
    {
      key: "paidBy",
      header: "Paid By",
      render: (p) => p.paidBy || "—",
      filterValue: (p) => p.paidBy ?? "",
    },
    {
      key: "paymentDate",
      header: "Payment Date",
      render: (p) => formatDisplayDate(p.paymentDate) ?? "—",
      sortValue: (p) => p.paymentDate,
    },
    {
      key: "status",
      header: "Status",
      render: (p) => <Badge tone={p.status === "Paid" ? "success" : "neutral"}>{p.status}</Badge>,
    },
  ];

  async function handleMarkBooked(itineraryItemUid: string) {
    setMarkingBookedUid(itineraryItemUid);
    try {
      const res = await clientApi.post<HotelBooking>(
        `/library/hotels/${hotel.uid}/bookings/${itineraryItemUid}/mark-booked`,
      );
      setBookings((prev) => (prev ? prev.map((b) => (b.itineraryItemUid === itineraryItemUid ? res.data : b)) : prev));
      toast.success("Booking marked as Booked.");
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to mark booking as Booked"));
    } finally {
      setMarkingBookedUid(null);
    }
  }

  function handleSendBookingEmail(itineraryItemUid: string) {
    if (!current.email) {
      toast.error("Hotel email not available.");
      return;
    }
    setEmailModalItineraryItemUid(itineraryItemUid);
  }

  function handleSendCancellationEmail(itineraryItemUid: string) {
    if (!current.email) {
      toast.error("Hotel email not available.");
      return;
    }
    setCancelBookingUid(itineraryItemUid);
  }

  // Booked -> Drop, reusing the exact same generic item-update path the
  // Escape Planning tab's own "Drop Hotel" edit uses (only status/
  // droppingReason/cancellationCharge are written — see
  // ItineraryItemHelper.saveHotelDetail's Drop-mode branch) — no separate
  // cancel endpoint, no duplicated business rule. Once dropped, chains
  // straight into the cancellation-email preview for the same booking.
  async function handleConfirmCancelBooking(reason: string, cancellationCharge: number | undefined) {
    if (!cancelBookingUid) return;
    const uid = cancelBookingUid;
    try {
      await clientApi.put(`/itinerary-items/${uid}`, {
        hotelDetail: { status: "Drop", droppingReason: reason, cancellationCharge },
      });
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Failed to cancel booking"));
    }
    await loadBookings();
    setCancelBookingUid(null);
    setCancellationEmailItineraryItemUid(uid);
  }

  async function handleMakePriority(url: string) {
    setSettingPriorityFor(url);
    setPriorityError(undefined);
    try {
      const updated = await dispatch(setHotelPriorityImage({ uid: current.uid, imageUrl: url })).unwrap();
      setCurrent(updated);
    } catch (err) {
      setPriorityError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to set priority image"));
    } finally {
      setSettingPriorityFor(null);
    }
  }

  // Each section only renders when it has content. The rich-text editor
  // leaves markup behind when cleared (e.g. "<p></p>"), so strip tags before
  // deciding it's empty.
  const aboutText = hotel.about?.trim() ?? "";
  const hasRules = (hotel.rulesAndPolicies ?? "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim() !== "";

  return (
    <div className="flex min-h-full flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <BackToHotels />
      </div>

      {/* Hero, swapped for the image editor while editing images */}
      {editingSection === "images" && (
      <div className="relative flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
        <Caption className="font-semibold">Images</Caption>
        <ImagesEditor
          hotel={hotel}
          priorityImage={current.priorityImage ?? null}
          settingPriorityFor={settingPriorityFor}
          priorityError={priorityError}
          onMakePriority={handleMakePriority}
          onDone={() => setEditingSection(null)}
        />
      </div>
      )}
      {editingSection !== "images" && (
        <div className="group/hero relative overflow-hidden rounded-2xl border border-border bg-card" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          {cover ? (
            <div
              className="h-64 w-full overflow-hidden md:h-80"
              onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
              onTouchEnd={(e) => {
                if (touchX.current == null) return;
                const dx = e.changedTouches[0].clientX - touchX.current;
                touchX.current = null;
                if (Math.abs(dx) > 40) goSlide(slideIdx + (dx < 0 ? 1 : -1));
              }}
            >
              <div
                className="flex h-full transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${slideIdx * 100}%)` }}
              >
                {slides.map((url) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={url} src={resolveFileUrl(url)} alt={hotel.name} draggable={false} className="h-full w-full shrink-0 object-cover" />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center gap-3 bg-muted/30 md:h-80">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <CiImageOff size={22} />
              </div>
              <div className="text-sm font-medium text-muted-foreground">No image available</div>
            </div>
          )}
          <button
            type="button"
            onClick={() => setEditingSection("images")}
            aria-label="Edit Images"
            title="Edit Images"
            className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] transition-colors hover:text-white/80"
          >
            <TbEditFilled size={17} />
          </button>
          {slides.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => goSlide(slideIdx - 1)}
                aria-label="Previous image"
                className="absolute left-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white opacity-0 transition-opacity hover:bg-black/55 focus-visible:opacity-100 group-hover/hero:opacity-100"
              >
                <IoChevronBack size={18} />
              </button>
              <button
                type="button"
                onClick={() => goSlide(slideIdx + 1)}
                aria-label="Next image"
                className="absolute right-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white opacity-0 transition-opacity hover:bg-black/55 focus-visible:opacity-100 group-hover/hero:opacity-100"
              >
                <IoChevronForward size={18} />
              </button>
              <div className="absolute bottom-3 right-5 z-10 flex items-center gap-1.5">
                {slides.map((url, i) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => goSlide(i)}
                    aria-label={`Show image ${i + 1}`}
                    className={`h-2 rounded-full transition-all ${i === slideIdx ? "w-5 bg-white" : "w-2 bg-white/50 hover:bg-white/80"}`}
                  />
                ))}
              </div>
            </>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5">
            <div className="min-w-0">
              <HoverMarqueeText as="h1" className="truncate text-2xl font-bold tracking-tight text-white md:text-3xl">{hotel.name}</HoverMarqueeText>
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
          </div>
        </div>
      )}

      {/* Hotel details: the same fields as the edit form, read-only until Edit Hotel is clicked. */}
      <div className="relative rounded-2xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <Caption className="font-semibold">Hotel Details</Caption>
          {!editingDetails && (
            <button
              type="button"
              onClick={() => setEditingDetails(true)}
              aria-label="Edit Hotel Details"
              title="Edit Hotel Details"
              className="flex h-7 w-7 items-center justify-center text-muted-foreground transition-colors hover:text-primary"
            >
              <TbEditFilled size={17} />
            </button>
          )}
        </div>
        <HotelFormModal
          open
          variant="page"
          embedded
          readOnly={!editingDetails}
          hotel={hotel}
          onClose={() => setEditingDetails(false)}
          onSaved={() => {
            router.refresh();
            setEditingDetails(false);
          }}
          locations={locations}
          escapePoints={escapePoints}
          mealPlans={mealPlans}
          roomTypes={roomTypes}
          services={services}
          amenities={amenities}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <EditableSection
          title="Room Types"
          editing={editingSection === "roomTypes"}
          onEdit={() => setEditingSection("roomTypes")}
          editor={<RoomTypesEditor hotel={hotel} onDone={() => setEditingSection(null)} />}
        >
          <RoomTypeTable roomTypes={hotel.roomTypes ?? []} currency={hotel.priceCurrency} />
        </EditableSection>

        <EditableSection
          title="Meal Plans"
          editing={editingSection === "mealPlans"}
          onEdit={() => setEditingSection("mealPlans")}
          editor={<MealPlansEditor hotel={hotel} onDone={() => setEditingSection(null)} />}
        >
          {hotel.mealPlans && hotel.mealPlans.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-muted/40">
                    <th className="px-3 py-1.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Name</th>
                    <th className="px-3 py-1.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {hotel.mealPlans.map((m) => (
                    <tr key={m.uid}>
                      <td className="whitespace-nowrap px-3 py-2 align-top font-medium text-foreground">
                        {m.name}
                        {m.custom && <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary">Custom</span>}
                      </td>
                      <td className="px-3 py-2 align-top text-muted-foreground">{m.description || mealPlans.find((p) => p.uid === m.uid)?.description || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">No meal plans yet.</span>
          )}
        </EditableSection>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <EditableSection
          title="Amenities"
          editing={editingSection === "amenities"}
          onEdit={() => setEditingSection("amenities")}
          editor={<AmenitiesEditor hotel={hotel} onDone={() => setEditingSection(null)} />}
        >
          {hotel.amenities && hotel.amenities.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {hotel.amenities.map((a) => (
                <Badge key={a} tone="neutral">
                  {a}
                  {!amenities.some((x) => x.name === a) && <span className="ml-1.5 text-[10px] font-semibold uppercase text-primary">Custom</span>}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">No amenities yet.</span>
          )}
        </EditableSection>

        <EditableSection
          title="Services"
          editing={editingSection === "services"}
          onEdit={() => setEditingSection("services")}
          editor={<HotelServicesEditor hotel={hotel} onDone={() => setEditingSection(null)} />}
        >
          {hotel.services && hotel.services.length > 0 ? (
            <ServiceList services={hotel.services} currency={hotel.priceCurrency} />
          ) : (
            <span className="text-sm text-muted-foreground">No services yet.</span>
          )}
        </EditableSection>
      </div>

      {aboutText && (
        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <Caption className="font-semibold">About</Caption>
          <p className="mt-2 whitespace-pre-line text-sm text-foreground">{aboutText}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <EditableSection
          title="Hotel Notes"
          editing={editingSection === "notes"}
          onEdit={() => setEditingSection("notes")}
          editor={
            <div className="flex flex-col gap-3">
              <textarea
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                placeholder="Add internal notes about this hotel."
                rows={6}
                className="w-full rounded-2xl border border-border bg-card p-3 text-sm text-foreground shadow-sm outline-none focus:border-primary"
              />
              <EditIconActions
                saving={savingNotes}
                onCancel={() => {
                  setNotesDraft(hotel.notes ?? "");
                  setEditingSection(null);
                }}
                onSave={async () => {
                  await handleSaveNotes();
                  setEditingSection(null);
                }}
                saveDisabled={notesDraft === (hotel.notes ?? "")}
                label="Save notes"
              />
            </div>
          }
        >
          {hotel.notes ? (
            <p className="whitespace-pre-line text-sm text-foreground">{hotel.notes}</p>
          ) : (
            <span className="text-sm text-muted-foreground">No notes yet.</span>
          )}
        </EditableSection>

        <EditableSection
          title="Rules and Policies"
          editing={editingSection === "rules"}
          onEdit={() => setEditingSection("rules")}
          editor={<RulesEditor hotel={hotel} onDone={() => setEditingSection(null)} />}
        >
          {hasRules ? (
            <div className="prose-content text-sm text-foreground" dangerouslySetInnerHTML={{ __html: hotel.rulesAndPolicies ?? "" }} />
          ) : (
            <span className="text-sm text-muted-foreground">No rules or policies yet.</span>
          )}
        </EditableSection>
      </div>

      <div className="min-h-0 flex-1 rounded-2xl border border-border bg-card p-4">
        <Tabs bare
          tabs={[
            { id: "bookings", label: "Bookings" },
            { id: "payments", label: "Payments" },
            { id: "accounting", label: "Account" },
          ]}
        >
          {(activeTab) => (
            <div className="flex flex-col gap-4 p-1">
              {activeTab === "bookings" &&
                (bookingsLoading ? (
                  <div className="flex flex-col gap-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="rounded-xl border border-border bg-background p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex flex-col gap-1.5">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-3 w-56" />
                          </div>
                          <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : bookings && bookings.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    <div className="relative max-w-xs">
                      <IoSearchOutline className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                      <input
                        value={bookingSearch}
                        onChange={(e) => setBookingSearch(e.target.value)}
                        placeholder="Search by trip ID or customer…"
                        className="h-9 w-full rounded-full border border-transparent bg-[#f8f8fa] pl-8 pr-3 text-sm text-foreground placeholder:text-[#9da3af] transition-colors focus-visible:border-primary/40 focus-visible:bg-background focus-visible:outline-none"
                      />
                    </div>

                    {filteredBookings.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {filteredBookings.map((b) => {
                          const isBooked = b.bookingStatus === "Booked";
                          const isMarking = markingBookedUid === b.itineraryItemUid;
                          return (
                            <div key={b.itineraryItemUid} className="rounded-xl border border-border bg-background p-3 hover:border-primary/40 hover:shadow-sm">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                    <span className="text-sm font-semibold text-foreground">{b.leadName || "Untitled trip"}</span>
                                    {b.tripCode && (
                                      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                                        <PiHashFill className="h-3 w-3 shrink-0" />
                                        {b.tripCode}
                                      </span>
                                    )}
                                  </div>
                                  <div className="mt-0.5 text-xs text-muted-foreground">
                                    {b.escapeStartDate || b.escapeEndDate
                                      ? `${formatDisplayDate(b.escapeStartDate) ?? "—"} to ${formatDisplayDate(b.escapeEndDate) ?? "—"}`
                                      : "—"}
                                    {" · "}Day {b.dayNumber ?? "—"}
                                    {b.startTime ? ` · ${formatDisplayTime(b.startTime)}` : ""}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {b.escapeStatus && <Badge tone="neutral">{b.escapeStatus}</Badge>}
                                  {b.bookingStatus && <Badge tone={hotelStatusTone(b.bookingStatus)}>{b.bookingStatus}</Badge>}
                                </div>
                              </div>

                              <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                <div>
                                  <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Meals</div>
                                  <div className="mt-0.5 text-sm text-foreground">{b.mealPlanName || "—"}</div>
                                </div>
                                <div className="col-span-2 sm:col-span-2">
                                  <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Services</div>
                                  <div className="mt-0.5 text-sm text-foreground">
                                    {b.services.length > 0 ? b.services.join(", ") : "—"}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Total Amount</div>
                                  <div className="mt-0.5 text-sm font-semibold text-foreground">{formatMoney(b.totalAmount)}</div>
                                </div>
                              </div>

                              <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-border pt-2.5">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleMarkBooked(b.itineraryItemUid)}
                                  disabled={isBooked || isMarking}
                                  loading={isMarking}
                                  loadingText="Marking…"
                                >
                                  <BsCalendarCheck size={13} />
                                  {isBooked ? "Booked" : "Mark As Booked"}
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleSendBookingEmail(b.itineraryItemUid)}
                                >
                                  <TbMailForward size={14} />
                                  Send Booking Email
                                </Button>
                                {b.bookingStatus === "Booked" && (
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleSendCancellationEmail(b.itineraryItemUid)}
                                  >
                                    <TbMailForward size={14} />
                                    Send Cancellation Email
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <EmptyState message={`No bookings match "${bookingSearch}".`} icon={TbCalendarX} />
                    )}
                  </div>
                ) : (
                  <EmptyState message="No bookings found for this hotel." icon={TbCalendarX} />
                ))}

              {activeTab === "payments" && (
                <div className="flex flex-col gap-3">
                  <div className="flex justify-end">
                    <Button onClick={() => setAddPaymentOpen(true)}>
                      <FaPlus size={12} />
                      Add New Payment
                    </Button>
                  </div>
                  <DataTable
                    columns={paymentColumns}
                    rows={payments ?? []}
                    rowKey={(p) => p.uid}
                    searchPlaceholder="Search payments…"
                    emptyMessage="No payments recorded for this hotel yet."
                    getRowLabel={(p) => p.transactionId ?? p.tripCode ?? "Payment"}
                    loading={paymentsLoading}
                  />
                </div>
              )}

              {activeTab === "accounting" && (
                <FormAppearanceProvider value="pill">
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-3">
                    <TextInput
                      label="Account Holder Name"
                      value={accountDraft.accountHolderName}
                      onChange={(e) => setAccountDraft((d) => ({ ...d, accountHolderName: e.target.value }))}
                    />
                    <TextInput
                      label="Bank Name"
                      value={accountDraft.bankName}
                      onChange={(e) => setAccountDraft((d) => ({ ...d, bankName: e.target.value }))}
                    />
                    <TextInput
                      label="Branch Name"
                      value={accountDraft.branchName}
                      onChange={(e) => setAccountDraft((d) => ({ ...d, branchName: e.target.value }))}
                    />
                    <Select
                      label="Account Type"
                      options={ACCOUNT_TYPE_OPTIONS}
                      value={accountDraft.accountType}
                      onChange={(e) => setAccountDraft((d) => ({ ...d, accountType: e.target.value }))}
                      placeholder="Select account type"
                    />
                    <TextInput
                      label="Account Number"
                      value={accountDraft.accountNumber}
                      onChange={(e) => {
                        setAccountDraft((d) => ({ ...d, accountNumber: e.target.value }));
                        setAccountErrors((p) => ({ ...p, accountNumber: "" }));
                      }}
                      error={accountErrors.accountNumber}
                    />
                    <TextInput
                      label="IFSC Code"
                      placeholder="e.g. HDFC0001234"
                      value={accountDraft.ifsc}
                      onChange={(e) => {
                        setAccountDraft((d) => ({ ...d, ifsc: e.target.value.toUpperCase() }));
                        setAccountErrors((p) => ({ ...p, ifsc: "" }));
                      }}
                      error={accountErrors.ifsc}
                    />
                    <TextInput
                      label="UPI ID"
                      placeholder="e.g. hotelname@upi"
                      value={accountDraft.upiId}
                      onChange={(e) => setAccountDraft((d) => ({ ...d, upiId: e.target.value }))}
                    />
                  </div>

                  {accountError && (
                    <Alert tone="danger" autoClose={false}>
                      {accountError}
                    </Alert>
                  )}

                  <Button
                    className="self-end"
                    onClick={handleSaveAccount}
                    disabled={savingAccount || !accountDirty}
                    loading={savingAccount}
                    loadingText="Saving…"
                  >
                    Save account details
                  </Button>
                </div>
                </FormAppearanceProvider>
              )}
            </div>
          )}
        </Tabs>
      </div>

      <HotelPaymentModal
        open={addPaymentOpen}
        hotelUid={hotel.uid}
        escapeOptions={escapeOptions}
        onClose={() => setAddPaymentOpen(false)}
        onSaved={handlePaymentSaved}
      />

      <HotelBookingEmailModal
        open={emailModalItineraryItemUid !== null}
        hotelUid={hotel.uid}
        itineraryItemUid={emailModalItineraryItemUid}
        hotelEmail={current.email ?? ""}
        onClose={() => setEmailModalItineraryItemUid(null)}
        onSent={() => {
          setEmailModalItineraryItemUid(null);
          toast.success("Hotel booking email sent successfully.");
        }}
      />

      <CancelBookingModal
        open={!!cancelBookingUid}
        itemLabel={`${current.name}${(() => {
          const b = bookings?.find((x) => x.itineraryItemUid === cancelBookingUid);
          return b?.tripCode ? ` (${b.tripCode})` : "";
        })()}`}
        onClose={() => setCancelBookingUid(null)}
        onConfirm={handleConfirmCancelBooking}
      />

      {cancellationEmailItineraryItemUid && (
        <CancellationEmailModal
          open
          previewUrl={`/library/hotels/${hotel.uid}/bookings/${cancellationEmailItineraryItemUid}/cancellation-email-preview`}
          sendUrl={`/library/hotels/${hotel.uid}/bookings/${cancellationEmailItineraryItemUid}/send-cancellation-email`}
          onClose={() => setCancellationEmailItineraryItemUid(null)}
          onSent={() => {
            setCancellationEmailItineraryItemUid(null);
            toast.success("Cancellation email sent successfully.");
          }}
        />
      )}
    </div>
  );
}
