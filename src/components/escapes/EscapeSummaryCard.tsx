"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { IconType } from "react-icons";
import { IoMailOutline, IoCallOutline } from "react-icons/io5";
import {
  PiMapPinFill,
  PiImageFill,
  PiTagFill,
  PiUsersFill,
  PiCalendarBlankFill,
  PiClockFill,
  PiCurrencyDollarFill,
  PiMapPinLineFill,
  PiSuitcaseFill,
  PiUserCircleFill,
} from "react-icons/pi";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Caption } from "@/components/ui/Typography";
import { resolveFileUrl } from "@/lib/files";
import { escapeStatusTone, escapeStatusIcon } from "@/lib/escape-status";
import type { Escape } from "@/lib/escapes";
import type { EscapeAuditLogEntry } from "@/features/escapes/types";
import { FaLocationArrow } from "react-icons/fa";

// Sizing here is done via plain styled spans rather than the shared
// Typography components (Heading/Body) in places that need a size the
// components don't default to — cn() in this codebase is plain clsx with no
// tailwind-merge, so a className meant to override a component's own baked-in
// text-size utility isn't guaranteed to win the cascade (confirmed elsewhere:
// Button's bg-primary silently beat a passed bg-[#c8ff32]). Sidestepping
// that class of bug entirely rather than fighting it.

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 border-t border-border pt-2.5 first:border-t-0 first:pt-0">
      <Caption className="font-semibold">{title}</Caption>
      {children}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: IconType; label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-1.5 rounded-lg border border-border/60 bg-muted/40 p-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <span className="block text-[11px] leading-tight text-muted-foreground">{label}</span>
        <span className="block truncate text-xs font-medium text-foreground">{value}</span>
      </div>
    </div>
  );
}

export function EscapeSummaryCard({
  escape,
  auditLog,
}: {
  escape: Escape;
  auditLog: EscapeAuditLogEntry[] | null;
}) {
  const escapePoint = escape.escapePoints[0];
  const extraEscapePoints = Math.max(escape.escapePoints.length - 1, 0);
  const lead = escape.lead;

  const cover = escapePoint?.images?.[0];
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => {
    setImageFailed(false);
  }, [cover]);

  const leadName = lead?.name ?? `Escape #${escape.uid}`;

  return (
    <Card variant="elevated" className="overflow-hidden p-0">
      {cover && !imageFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolveFileUrl(cover)}
          alt={escapePoint?.name ?? leadName}
          className="aspect-[16/9] w-full object-cover rounded-lg"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="flex aspect-[16/9] w-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
          <PiImageFill className="h-8 w-8 text-muted-foreground/40" />
        </div>
      )}

      <div className="flex flex-col gap-2.5 p-3">
        {/* Escape information */}
        <Section title="Escape information">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-semibold text-foreground">{leadName}</span>
            <Badge tone={escapeStatusTone(escape.status)} icon={escapeStatusIcon(escape.status)}>
              {escape.status}
            </Badge>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <PiTagFill className="h-3 w-3" /> Escape #{escape.uid}
          </span>

          {escapePoint ? (
            <>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <FaLocationArrow className="h-3 w-3 text-muted-foreground" /><span className="text-xs font-medium text-foreground">{escapePoint.name}</span>
                {extraEscapePoints > 0 && <Badge>+{extraEscapePoints} more</Badge>}
              </div>
              {escapePoint.locationLabel && (
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <PiMapPinFill className="h-3 w-3 shrink-0" /> {escapePoint.locationLabel}
                </span>
              )}
              {escapePoint.description && (
                <span className="text-[11px] leading-snug text-muted-foreground">{escapePoint.description}</span>
              )}
            </>
          ) : (
            <span className="text-xs text-muted-foreground">No escape point selected</span>
          )}
        </Section>

        {/* Traveller information */}
        <Section title="Traveller information">
          {lead ? (
            <>
              <div className="flex items-start gap-2">
                <Avatar name={lead.name} />
                <div className="flex min-w-0 flex-col gap-0.5 pt-0.5">
                  <span className="text-xs font-medium text-foreground">{lead.name}</span>
                  {lead.email && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <IoMailOutline className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{lead.email}</span>
                    </span>
                  )}
                  {lead.phone && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <IoCallOutline className="h-3.5 w-3.5 shrink-0" /> {lead.phone}
                    </span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-2 pt-1">
                <InfoRow icon={PiUsersFill} label="Travellers" value={lead.numberOfPeople != null ? String(lead.numberOfPeople) : null} />
                <InfoRow icon={PiCalendarBlankFill} label="Travel date" value={lead.travelDate} />
                <InfoRow icon={PiMapPinLineFill} label="Origin city" value={lead.originCity} />
                <InfoRow icon={PiSuitcaseFill} label="Travel type" value={lead.travelType} />
                <InfoRow
                  icon={PiCurrencyDollarFill}
                  label="Budget"
                  value={lead.budget != null ? `$${lead.budget.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : null}
                />
              </div>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">No lead information available</span>
          )}
        </Section>

        {/* Escape schedule */}
        <Section title="Escape schedule">
          <div className="grid grid-cols-2 gap-x-2 gap-y-2">
            <InfoRow icon={PiCalendarBlankFill} label="Start date" value={escape.startDate} />
            <InfoRow icon={PiCalendarBlankFill} label="End date" value={escape.endDate} />
            <InfoRow icon={PiClockFill} label="Duration" value={escape.numberOfDays ? `${escape.numberOfDays} days` : null} />
          </div>
        </Section>

        {/* Assignment */}
        <Section title="Assignment">
          <InfoRow icon={PiUserCircleFill} label="Assigned to" value={lead?.assignedToUserName ?? "Unassigned"} />
        </Section>

        {/* History */}
        {auditLog && auditLog.length > 0 && (
          <Section title="History">
            <div className="flex max-h-28 flex-col gap-1 overflow-y-auto">
              {auditLog.map((entry, i) => (
                <div key={i} className="text-[11px]">
                  <span className="font-medium text-foreground">{entry.action}</span>{" "}
                  <span className="text-muted-foreground">{new Date(entry.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </Card>
  );
}
