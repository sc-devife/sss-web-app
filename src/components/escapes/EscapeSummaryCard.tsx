"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { IconType } from "react-icons";
import { toast } from "react-toastify";
import { IoMailOutline, IoCallOutline } from "react-icons/io5";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import {
  PiMapPinFill,
  PiImageFill,
  PiUsersFill,
  PiCalendarBlankFill,
  PiClockFill,
  PiCurrencyDollarFill,
  PiMapPinLineFill,
  PiSuitcaseFill,
  PiUserCircleFill,
  PiHashFill,
  PiWarningCircleFill,
} from "react-icons/pi";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { HoverMarqueeText } from "@/components/ui/HoverMarqueeText";
import { Avatar } from "@/components/ui/Avatar";
import { Body, Caption } from "@/components/ui/Typography";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";
import { resolveFileUrl } from "@/lib/files";
import { escapeStatusTone, escapeStatusIcon, ESCAPE_STATUS_CANCELLED } from "@/lib/escape-status";
import { formatDisplayDate, formatDisplayDateTime } from "@/lib/date";
import type { Escape } from "@/lib/escapes";
import type { EscapeAuditLogEntry } from "@/features/escapes/types";
import { FaLocationArrow } from "react-icons/fa";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { advanceEscapeStatus, cancelEscape, fetchEscapeById, fetchEscapeAuditLog } from "@/features/escapes/escapesThunks";
import {
  selectAdvanceStatus,
  selectAdvanceError,
  selectCurrentEscapeStatus,
  selectCancelStatus,
  selectCancelError,
} from "@/features/escapes/escapesSelectors";
import { resetAdvanceStatus, resetCancelStatus } from "@/features/escapes/escapesSlice";

// Sizing here is done via plain styled spans rather than the shared
// Typography components (Heading/Body) in places that need a size the
// components don't default to — cn() in this codebase is plain clsx with no
// tailwind-merge, so a className meant to override a component's own baked-in
// text-size utility isn't guaranteed to win the cascade (confirmed elsewhere:
// Button's bg-primary silently beat a passed bg-[#c8ff32]). Sidestepping
// that class of bug entirely rather than fighting it.

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 border-t border-border pt-3 first:border-t-0 first:pt-0">
      <Caption className="font-semibold tracking-wide">{title}</Caption>
      {children}
    </div>
  );
}

// Every icon+text line in this card uses the same pattern: inline-flex with
// items-center so the icon sits on the text's visual center regardless of
// the SVG's own baseline, plus one shared icon size so nothing looks
// mismatched line to line.
function IconLine({ icon: Icon, children, className }: { icon: IconType; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[11px] text-muted-foreground", className)}>
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <HoverMarqueeText className="truncate">{children}</HoverMarqueeText>
    </span>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: IconType; label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-lg border border-border/60 bg-muted/40 px-2.5 py-2">
      <div className="flex min-w-0 items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <HoverMarqueeText className="truncate text-[11px] text-muted-foreground">{label}</HoverMarqueeText>
      </div>
      <HoverMarqueeText className="truncate text-xs font-semibold text-foreground">{formatDisplayDate(value)}</HoverMarqueeText>
    </div>
  );
}

// Escape Confirmed -> Ongoing and Ongoing -> Completed are date-gated: the
// trip's own start/end date decides when the next step becomes available,
// not the operator's say-so — otherwise a future trip could be marked
// Ongoing or Completed before it's actually happened. Fully Paid -> Escape
// Confirmed has nothing to gate on; paying in full is itself the signal.
function resolveNextStep(escape: Escape): { targetStatus: string; label: string } | null {
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  if (escape.status === "Fully Paid") {
    return { targetStatus: "Escape Confirmed", label: "Mark as Escape Confirmed" };
  }
  if (escape.status === "Escape Confirmed" && escape.startDate && escape.startDate <= todayIso) {
    return { targetStatus: "Ongoing", label: "Mark as Ongoing" };
  }
  if (escape.status === "Ongoing" && escape.endDate && escape.endDate <= todayIso) {
    return { targetStatus: "Completed", label: "Mark as Completed" };
  }
  return null;
}

export function EscapeSummaryCard({
  escape,
  collapsed = false,
  onToggleCollapsed,
}: {
  escape: Escape;
  auditLog: EscapeAuditLogEntry[] | null;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}) {
  // Only the cover image and the collapsed rail's title need a single
  // representative escape point — the full list below renders every one.
  const escapePoint = escape.escapePoints[0];
  const lead = escape.lead;

  const cover = escapePoint?.priorityImage ?? escapePoint?.images?.[0];
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => {
    setImageFailed(false);
  }, [cover]);

  const leadName = lead?.name ?? `Escape #${escape.uid}`;

  // The lifecycle's other stages either advance themselves as a side effect
  // of a real action elsewhere (accepting a quote, verifying a payment) or
  // stay manual-only forever (Ongoing/Completed only make sense once the
  // trip's own dates say so). These three are the only forward transitions
  // that need an operator-facing trigger, each offered right on the status
  // it changes.
  const dispatch = useAppDispatch();
  const advanceStatus = useAppSelector(selectAdvanceStatus);
  const advanceError = useAppSelector(selectAdvanceError);
  const currentEscapeStatus = useAppSelector(selectCurrentEscapeStatus);
  // advanceStatus alone flips to "succeeded" as soon as the status-change
  // call resolves — before the escape has actually been refetched with its
  // new status, which would otherwise flash the button back while the badge
  // is still showing the old value. Stay busy through that refetch too,
  // reusing the same currentEscapeStatus EscapeDetailPanel already tracks.
  const advancing = advanceStatus === "loading" || (advanceStatus === "succeeded" && currentEscapeStatus === "loading");
  const nextStep = resolveNextStep(escape);

  // Section P0-2 UI — the cancelEscape thunk/slice/proxy already existed
  // (confirmed working via a direct API call in the audit) but nothing
  // dispatched them. Wired here, next to the status badge, same place the
  // forward "Mark as X" trigger already lives — reusing the slice's own
  // cancelStatus/cancelError rather than local state, since that's exactly
  // what it was built for.
  const cancelStatus = useAppSelector(selectCancelStatus);
  const cancelError = useAppSelector(selectCancelError);
  const cancelling = cancelStatus === "loading" || (cancelStatus === "succeeded" && currentEscapeStatus === "loading");
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [reasonError, setReasonError] = useState<string | undefined>();
  const isCancelled = escape.status === ESCAPE_STATUS_CANCELLED;

  function closeCancelForm() {
    if (cancelling) return;
    setShowCancelForm(false);
    setCancelReason("");
    setReasonError(undefined);
    dispatch(resetCancelStatus());
  }

  async function handleCancelEscape() {
    if (!cancelReason.trim()) {
      setReasonError("A cancellation reason is required");
      return;
    }
    setReasonError(undefined);
    dispatch(resetCancelStatus());
    try {
      await dispatch(cancelEscape({ escapeUid: escape.uid, reason: cancelReason.trim() })).unwrap();
      await dispatch(fetchEscapeById(escape.uid));
      // Same staleness fix handleAdvance already applies — the CANCELLED
      // entry (and every HOTEL_DROPPED/ACTIVITY_DROPPED/TRANSPORT_DROPPED
      // entry the backend cascade just wrote) wouldn't show up in History
      // until a reload otherwise.
      dispatch(fetchEscapeAuditLog(escape.uid));
      setShowCancelForm(false);
      setCancelReason("");
      toast.success("Escape cancelled.");
    } catch (err) {
      // cancelError below already surfaces the failure inline; the toast
      // makes sure it's noticed even if attention isn't on this card.
      toast.error(typeof err === "string" ? err : "Failed to cancel escape");
    }
  }

  async function handleAdvance(targetStatus: string) {
    dispatch(resetAdvanceStatus());
    try {
      await dispatch(advanceEscapeStatus({ escapeUid: escape.uid, targetStatus })).unwrap();
      await dispatch(fetchEscapeById(escape.uid));
      // History (audit log) is otherwise only fetched once on mount — without
      // this, the STATUS_ADVANCED entry this action just created wouldn't
      // show up there until the page was reloaded, same staleness bug this
      // whole flow was built to avoid.
      dispatch(fetchEscapeAuditLog(escape.uid));
    } catch {
      // advanceError below already surfaces the failure
    }
  }

  return (
    <div
      className={cn(
        "relative rounded-none border border-border bg-card text-card-foreground shadow-sm lg:flex lg:flex-col",
        // Collapsed keeps the *same* full height as expanded (a slim tall
        // rail, matching the right EscapeSidePanel's collapsed behavior) —
        // only the width shrinks, driven by the parent grid column. 8rem
        // (not 7rem) — EscapeDetailPanel's outer Card now nests a second
        // padded wrapper around its content, adding another 0.5rem top +
        // 0.5rem bottom that this offset has to account for, or the card's
        // bottom edge gets clipped by the ancestor's lg:overflow-hidden
        // instead of leaving room to breathe.
        collapsed ? "lg:h-[calc(100vh-8rem)]" : "lg:max-h-[calc(100vh-8rem)]",
      )}
    >
      {onToggleCollapsed && (
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? "Expand summary" : "Collapse summary"}
          title={collapsed ? "Expand summary" : "Collapse summary"}
          className="absolute -right-2.5 top-1/2 z-10 hidden h-8 w-5 -translate-y-1/2 items-center justify-center rounded-r-md border border-l-0 border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground lg:flex"
        >
          {collapsed ? <FaChevronRight className="h-3 w-3" /> : <FaChevronLeft className="h-3 w-3" />}
        </button>
      )}

      {collapsed && (
        <div className="hidden flex-col items-center gap-4 py-4 lg:flex" aria-hidden="true">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground" title="Cover image">
            <PiImageFill className="h-4 w-4" />
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground" title={escapePoint?.name ?? "Location"}>
            <PiMapPinFill className="h-4 w-4" />
          </span>
          <span title={leadName}>
            <Avatar name={leadName} />
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground" title="Schedule">
            <PiCalendarBlankFill className="h-4 w-4" />
          </span>
        </div>
      )}

      <div className={cn("show-scrollbar flex flex-col gap-3 p-3.5 lg:overflow-y-auto", collapsed && "lg:hidden")}>
        {cover && !imageFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolveFileUrl(cover)}
            alt={escapePoint?.name ?? leadName}
            className="aspect-[16/9] w-full rounded-none border border-border object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex aspect-[16/9] w-full items-center justify-center rounded-none border border-border bg-gradient-to-br from-primary/10 to-accent/10">
            <PiImageFill className="h-8 w-8 text-muted-foreground/40" />
          </div>
        )}
        {/* Escape information */}
        <Section title="Escape information">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-semibold text-foreground">{leadName}</span>
            <Badge tone={escapeStatusTone(escape.status)} icon={escapeStatusIcon(escape.status)}>
              {escape.status}
            </Badge>
            {nextStep && (
              advancing ? (
                <span aria-label={`Marking as ${nextStep.targetStatus}`} title="Updating…" className="inline-flex items-center">
                  <Spinner size="sm" />
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleAdvance(nextStep.targetStatus)}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {nextStep.label}
                </button>
              )
            )}
            {!isCancelled && (
              cancelling ? (
                <span aria-label="Cancelling escape" title="Cancelling…" className="inline-flex items-center">
                  <Spinner size="sm" />
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCancelForm(true)}
                  className="text-xs font-medium text-danger hover:underline"
                >
                  Cancel Escape
                </button>
              )
            )}
          </div>
          {escape.tripCode && <IconLine icon={PiHashFill}>{escape.tripCode}</IconLine>}
          {advanceError && <p className="text-xs text-danger">{advanceError}</p>}
          {escape.escapePoints.length > 0 ? (
            <div className="flex flex-col gap-2 border-t border-border pt-2">
              {escape.escapePoints.map((ep) => (
                <div key={ep.uid} className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <FaLocationArrow className="h-3 w-3 shrink-0 text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">{ep.name}</span>
                  </div>
                  {ep.locationLabel && <IconLine icon={PiMapPinFill}>{ep.locationLabel}</IconLine>}
                  {ep.description && (
                    <span className="text-[11px] leading-snug text-muted-foreground">{ep.description}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">No escape point selected</span>
          )}
        </Section>

        {/* Traveller information */}
        <Section title="Traveller information">
          {lead ? (
            <>
              <div className="flex items-start gap-2">
                <div className="flex min-w-0 flex-col gap-1 pt-0.5">
                  <div className="flex items-center gap-1.5">
                    <Avatar name={lead.name} />
                    <span className="text-xs font-medium text-foreground">{lead.name}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {lead.email && <IconLine icon={IoMailOutline}>{lead.email}</IconLine>}
                    {lead.phone && <IconLine icon={IoCallOutline}>{lead.phone}</IconLine>}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <InfoRow icon={PiUsersFill} label="Travellers" value={lead.numberOfPeople != null ? String(lead.numberOfPeople) : null} />
                <InfoRow icon={PiCalendarBlankFill} label="Travel date" value={lead.travelDate} />
                <InfoRow icon={PiMapPinLineFill} label="Origin city" value={lead.originCity} />
                <InfoRow icon={PiSuitcaseFill} label="Travel type" value={lead.travelType} />
                <InfoRow
                  icon={PiCurrencyDollarFill}
                  label="Budget"
                  value={lead.budget != null ? `₹${lead.budget.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : null}
                />
              </div>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">No lead information available</span>
          )}
        </Section>

        {/* Escape schedule */}
        <Section title="Escape schedule">
          <div className="grid grid-cols-2 gap-2">
            <InfoRow icon={PiCalendarBlankFill} label="Start date" value={escape.startDate} />
            <InfoRow icon={PiCalendarBlankFill} label="End date" value={escape.endDate} />
            <InfoRow icon={PiClockFill} label="Duration" value={escape.numberOfDays ? `${escape.numberOfDays} days` : null} />
          </div>
          {escape.createdAt && (
            <span className="text-[11px] text-muted-foreground">Created {formatDisplayDateTime(escape.createdAt)}</span>
          )}
        </Section>

        {/* Assignment — lives on the Escape itself, not the Lead: decided
            once by the assignment engine at conversion time. */}
        <Section title="Assignment">
          <InfoRow icon={PiUserCircleFill} label="Assigned to" value={escape.assignedToUserName ?? "Unassigned"} />
        </Section>

      </div>

      <Modal open={showCancelForm} onClose={closeCancelForm} title="Cancel this Escape?">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-danger/10 text-danger">
            <PiWarningCircleFill size={28} aria-hidden="true" />
          </div>
          <Body>
            This will mark the Escape as <strong>Cancelled</strong>. Any Hotel, Activity or Transport booking
            still Initialize/Booked will be automatically Dropped — nothing is deleted, and this can be reviewed
            in History afterward.
          </Body>
          <div className="w-full text-left">
            <label htmlFor="escape-cancel-reason" className="text-sm font-medium text-foreground">
              Reason for cancelling this Escape
            </label>
            <textarea
              id="escape-cancel-reason"
              value={cancelReason}
              onChange={(e) => {
                setCancelReason(e.target.value);
                if (reasonError) setReasonError(undefined);
              }}
              rows={2}
              disabled={cancelling}
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
            />
          </div>
          {(reasonError || cancelError) && <p className="text-sm text-danger">{reasonError ?? cancelError}</p>}
          <div className="flex w-full gap-3 border-t pt-5">
            <Button type="button" disabled={cancelling} onClick={closeCancelForm} className="w-full">
              Keep Escape
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={cancelling}
              loading={cancelling}
              loadingText="Cancelling…"
              onClick={handleCancelEscape}
              className="w-full"
            >
              Cancel Escape
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
