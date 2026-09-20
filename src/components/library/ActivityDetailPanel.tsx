"use client";

import { cn } from "@/lib/cn";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { FaChevronLeft, FaLocationDot, FaPlus } from "react-icons/fa6";
import { CiImageOff } from "react-icons/ci";
import { IoSearchOutline } from "react-icons/io5";
import { PiHashFill } from "react-icons/pi";
import { TbCalendarX, TbEditFilled, TbMailForward } from "react-icons/tb";
import { BsCalendarCheck } from "react-icons/bs";
import type { IconType } from "react-icons";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { Body, Caption } from "@/components/ui/Typography";
import { HoverMarqueeText } from "@/components/ui/HoverMarqueeText";
import { Skeleton } from "@/components/ui/Skeleton";
import { TextInput } from "@/components/ui/TextInput";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { ActivityFormModal, CATEGORY_OPTIONS } from "@/components/library/ActivityFormModal";
import { ActivityPaymentModal } from "@/components/library/ActivityPaymentModal";
import { ActivityBookingEmailModal } from "@/components/library/ActivityBookingEmailModal";
import { CancellationEmailModal } from "@/components/library/CancellationEmailModal";
import { GalleryImage } from "@/components/library/GalleryImage";
import { resolveFileUrl } from "@/lib/files";
import { formatDisplayDate, formatDisplayTime } from "@/lib/date";
import { formatInr } from "@/lib/currency";
import { hotelStatusTone } from "@/lib/hotel-booking-status";
import { paymentMethodLabel } from "@/lib/payment-methods";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { runValidators, ifscField, accountNumberField } from "@/lib/validators";
import type { Activity, ActivityBooking, ActivityPayment } from "@/lib/activities";
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

function accountDraftFromActivity(activity: Activity): AccountDraft {
  return {
    accountHolderName: activity.accountHolderName ?? "",
    bankName: activity.bankName ?? "",
    branchName: activity.branchName ?? "",
    accountType: activity.accountType ?? "",
    accountNumber: activity.accountNumber ?? "",
    ifsc: activity.ifsc ?? "",
    upiId: activity.upiId ?? "",
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

// The premium, dedicated Activity Details page — mirrors the Hotel Details
// page's pattern exactly: everything descriptive shown directly on the page,
// the more transactional/interactive areas (Notes, Bookings, Payments,
// Account) tabbed below.
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
  const [accountDraft, setAccountDraft] = useState(accountDraftFromActivity(activity));
  const [accountErrors, setAccountErrors] = useState<Record<string, string>>({});
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountError, setAccountError] = useState<string | undefined>();
  const [bookings, setBookings] = useState<ActivityBooking[] | null>(null);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingSearch, setBookingSearch] = useState("");
  const [markingBookedUid, setMarkingBookedUid] = useState<string | null>(null);
  const [emailModalItineraryItemUid, setEmailModalItineraryItemUid] = useState<string | null>(null);
  const [cancellationEmailItineraryItemUid, setCancellationEmailItineraryItemUid] = useState<string | null>(null);
  const [payments, setPayments] = useState<ActivityPayment[] | null>(null);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);

  useEffect(() => {
    setNotesDraft(activity.notes ?? "");
  }, [activity.notes]);

  useEffect(() => {
    setAccountDraft(accountDraftFromActivity(activity));
    setAccountErrors({});
    setAccountError(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity.accountHolderName, activity.bankName, activity.branchName, activity.accountType, activity.accountNumber, activity.ifsc, activity.upiId]);

  useEffect(() => {
    setBookingsLoading(true);
    clientApi
      .get<ActivityBooking[]>(`/library/activities/${activity.uid}/bookings`)
      .then((res) => setBookings(res.data))
      .catch(() => setBookings([]))
      .finally(() => setBookingsLoading(false));
  }, [activity.uid]);

  useEffect(() => {
    setPaymentsLoading(true);
    clientApi
      .get<ActivityPayment[]>(`/library/activities/${activity.uid}/payments`)
      .then((res) => setPayments(res.data))
      .catch(() => setPayments([]))
      .finally(() => setPaymentsLoading(false));
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

  const accountDirty = !accountEquals(accountDraft, accountDraftFromActivity(activity));

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
      await dispatch(updateActivity({ uid: activity.uid, payload: { ...accountDraft } })).unwrap();
      router.refresh();
    } catch (err) {
      setAccountError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to save account details"));
    } finally {
      setSavingAccount(false);
    }
  }

  const images = activity.images ?? [];
  const categoryLabel = CATEGORY_OPTIONS.find((c) => c.value === activity.categoryCode)?.label ?? activity.categoryCode;

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
  // activity's own actual bookings (already fetched for the Bookings tab
  // above) — reusing that data instead of a separate escape-search endpoint.
  const escapeOptions = Array.from(
    new Map((bookings ?? []).map((b) => [b.escapeUid, { escapeUid: b.escapeUid, tripCode: b.tripCode, leadName: b.leadName }])).values(),
  );

  function handlePaymentSaved(payment: ActivityPayment) {
    setPayments((prev) => [payment, ...(prev ?? [])]);
    toast.success("Payment saved.");
  }

  const paymentColumns: DataTableColumn<ActivityPayment>[] = [
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
      render: (p) => formatInr(p.amount),
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
      const res = await clientApi.post<ActivityBooking>(
        `/library/activities/${activity.uid}/bookings/${itineraryItemUid}/mark-booked`,
      );
      setBookings((prev) => (prev ? prev.map((b) => (b.itineraryItemUid === itineraryItemUid ? res.data : b)) : prev));
      toast.success("Booking marked as Booked.");
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to mark booking as Booked"));
    } finally {
      setMarkingBookedUid(null);
    }
  }

  function handleSendCancellationEmail(itineraryItemUid: string) {
    if (!activity.email) {
      toast.error("Activity email not available.");
      return;
    }
    setCancellationEmailItineraryItemUid(itineraryItemUid);
  }

  function handleSendBookingEmail(itineraryItemUid: string) {
    if (!activity.email) {
      toast.error("Activity email not available.");
      return;
    }
    setEmailModalItineraryItemUid(itineraryItemUid);
  }

  // Each of these only renders when it has content. The rich-text editor
  // leaves markup behind when cleared (e.g. "<p></p>"), so strip tags before
  // deciding Rules and Policies is empty.
  const contactNumber = activity.contactNumber?.trim() ?? "";
  const email = activity.email?.trim() ?? "";
  const hasRules = (activity.rulesAndPolicies ?? "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim() !== "";

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
            <HoverMarqueeText as="h1" className="truncate text-2xl font-bold tracking-tight text-white md:text-3xl">{activity.name}</HoverMarqueeText>
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
        <StatCard label="Base Price" value={activity.basePrice != null ? formatInr(activity.basePrice) : "—"} />
        <StatCard label="Category" value={categoryLabel ?? "—"} />
      </div>

      {/* Description */}
      <div className="rounded-xl border border-border bg-muted/20 p-4">
        <Caption>About this Activity</Caption>
        <Body className="mt-1 whitespace-pre-wrap leading-6">
          {activity.description || "No description available."}
        </Body>
      </div>

      {hasRules && (
        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <Caption>Rules and Policies</Caption>
          <div
            className="prose-content mt-2 text-sm text-foreground"
            dangerouslySetInnerHTML={{ __html: activity.rulesAndPolicies ?? "" }}
          />
        </div>
      )}

      {(contactNumber || email) && (
        <div className={cn("grid grid-cols-1 gap-3", contactNumber && email && "md:grid-cols-2")}>
          {contactNumber && (
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <Caption>Contact Number</Caption>
              <Body className="mt-1">{contactNumber}</Body>
            </div>
          )}
          {email && (
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <Caption>Email</Caption>
              <Body className="mt-1 break-all">{email}</Body>
            </div>
          )}
        </div>
      )}

      {images.length > 1 && (
        <div>
          <Caption>Gallery</Caption>
          <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {images.map((url) => (
              <div key={url} className="relative aspect-square overflow-hidden rounded-lg border border-border">
                <GalleryImage
                  src={resolveFileUrl(url)}
                  alt={activity.name}
                  className="h-full w-full object-cover transition-transform hover:scale-[1.02]"
                />
              </div>
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
            { id: "accounting", label: "Account" },
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

                              <div className="mt-2.5">
                                <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Total Amount</div>
                                <div className="mt-0.5 text-sm font-semibold text-foreground">{formatInr(b.totalAmount)}</div>
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
                                {b.bookingStatus === "Drop" && (
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
                  <EmptyState message="No bookings found for this activity." icon={TbCalendarX} />
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
                    emptyMessage="No payments recorded for this activity yet."
                    getRowLabel={(p) => p.transactionId ?? p.tripCode ?? "Payment"}
                    loading={paymentsLoading}
                  />
                </div>
              )}

              {activeTab === "accounting" && (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                  </div>
                  <TextInput
                    label="UPI ID"
                    placeholder="e.g. vendorname@upi"
                    value={accountDraft.upiId}
                    onChange={(e) => setAccountDraft((d) => ({ ...d, upiId: e.target.value }))}
                    className="sm:max-w-xs"
                  />

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
              )}
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

      <ActivityPaymentModal
        open={addPaymentOpen}
        activityUid={activity.uid}
        escapeOptions={escapeOptions}
        onClose={() => setAddPaymentOpen(false)}
        onSaved={handlePaymentSaved}
      />

      <ActivityBookingEmailModal
        open={emailModalItineraryItemUid !== null}
        activityUid={activity.uid}
        itineraryItemUid={emailModalItineraryItemUid}
        activityEmail={activity.email ?? ""}
        onClose={() => setEmailModalItineraryItemUid(null)}
        onSent={() => {
          setEmailModalItineraryItemUid(null);
          toast.success("Activity booking email sent successfully.");
        }}
      />

      {cancellationEmailItineraryItemUid && (
        <CancellationEmailModal
          open
          previewUrl={`/library/activities/${activity.uid}/bookings/${cancellationEmailItineraryItemUid}/cancellation-email-preview`}
          sendUrl={`/library/activities/${activity.uid}/bookings/${cancellationEmailItineraryItemUid}/send-cancellation-email`}
          onClose={() => setCancellationEmailItineraryItemUid(null)}
          onSent={() => {
            setCancellationEmailItineraryItemUid(null);
            toast.success("Cancellation email sent successfully.");
          }}
        />
      )}
    </Card>
  );
}
