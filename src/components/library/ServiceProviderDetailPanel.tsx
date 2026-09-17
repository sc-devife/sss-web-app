"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaChevronLeft, FaLocationDot } from "react-icons/fa6";
import { TbEditFilled } from "react-icons/tb";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Body, Caption } from "@/components/ui/Typography";
import { HoverMarqueeText } from "@/components/ui/HoverMarqueeText";
import { ServiceProviderFormModal, SERVICE_PROVIDER_TYPE_OPTIONS } from "@/components/library/ServiceProviderFormModal";
import { MODE_OPTIONS, VEHICLE_TYPE_OPTIONS, transportModeIcon } from "@/lib/transport-modes";
import { formatInr } from "@/lib/currency";
import type { ServiceProvider } from "@/lib/service-providers";
import type { EscapePoint } from "@/lib/escape-points";
import type { Transport } from "@/lib/transports";

function BackToServiceProviders() {
  return (
    <Link
      href="/library/service-providers"
      className="inline-flex w-fit items-center gap-0.5 text-[13px] text-foreground/70 transition-colors hover:text-foreground"
    >
      <FaChevronLeft size={12} className="shrink-0" />
      <span className="font-semibold">Back to Service Providers</span>
    </Link>
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

const QUANTITY_LABELS: Record<string, string> = {
  transport: "No. of Vehicles",
  activity: "No. of Activities",
  guide: "No. of Guides",
  other: "No. of Other",
};

export function ServiceProviderDetailPanel({
  provider,
  escapePoints,
  vehicles,
}: {
  provider: ServiceProvider;
  escapePoints: EscapePoint[];
  vehicles: Transport[];
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);

  const typeLabel = SERVICE_PROVIDER_TYPE_OPTIONS.find((t) => t.value === provider.typeCode)?.label ?? provider.typeCode;
  const quantityLabel = QUANTITY_LABELS[provider.typeCode] ?? "Quantity";

  return (
    <Card variant="page" className="flex min-h-full flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <BackToServiceProviders />
        <Button onClick={() => setEditOpen(true)}>
          <TbEditFilled size={16} />
          Edit service provider
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-muted/20 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <HoverMarqueeText as="h1" className="truncate text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              {provider.name}
            </HoverMarqueeText>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span>{provider.typeCode === "other" ? provider.otherTypeLabel || "Other" : typeLabel}</span>
              {provider.escapePoint && (
                <span className="flex items-center gap-1">
                  <FaLocationDot size={12} />
                  {provider.escapePoint.name}
                </span>
              )}
            </div>
          </div>
          <Badge tone={provider.status === "archived" ? "danger" : "success"}>{provider.status ?? "active"}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-background p-3">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Escape Point</div>
          <div className="mt-1">
            {provider.escapePoint ? (
              <Badge tone="neutral">{provider.escapePoint.name}</Badge>
            ) : (
              <span className="text-sm text-muted-foreground">Not assigned</span>
            )}
          </div>
        </div>
        <StatCard label="Type" value={typeLabel} />
        <StatCard
          label={quantityLabel}
          // Transport-type providers now have ground truth (the Vehicles
          // section below) — show the actual linked count instead of the
          // manually-entered quantity, which is easy to leave stale/blank.
          value={
            provider.typeCode === "transport"
              ? String(vehicles.length)
              : provider.quantity != null
                ? String(provider.quantity)
                : "—"
          }
        />
        <StatCard label="Country" value={provider.countryLabel || "—"} />
      </div>

      <div className="rounded-xl border border-border bg-muted/20 p-4">
        <Caption>Contact</Caption>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Contact Name</div>
            <Body className="mt-0.5">{provider.contactName || "—"}</Body>
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Contact Number</div>
            <Body className="mt-0.5">{provider.contactNumber || "—"}</Body>
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Contact Email</div>
            <Body className="mt-0.5">{provider.contactEmail || "—"}</Body>
          </div>
        </div>
      </div>

      {provider.typeCode === "transport" && (
        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <Caption>Vehicles ({vehicles.length})</Caption>
          {vehicles.length === 0 ? (
            <div className="mt-3 flex items-center justify-center rounded border border-border bg-background py-8">
              <Body muted>No vehicles linked to this provider yet — add one from the Transport page.</Body>
            </div>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {vehicles.map((v) => {
                const Icon = transportModeIcon(v.modeCode);
                const modeLabel = MODE_OPTIONS.find((m) => m.value === v.modeCode)?.label ?? v.modeCode;
                const vehicleTypeLabel = VEHICLE_TYPE_OPTIONS[v.modeCode]?.find((t) => t.value === v.vehicleTypeCode)?.label
                  ?? v.vehicleTypeCode;
                return (
                  <div key={v.uid} className="flex items-start gap-3 rounded border border-border bg-background px-3 py-2 text-sm">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-medium text-foreground">
                          {modeLabel}
                          {vehicleTypeLabel ? ` — ${vehicleTypeLabel}` : ""}
                        </span>
                        {v.vehicleNumber && <Badge tone="neutral">{v.vehicleNumber}</Badge>}
                        <Badge tone={v.status === "archived" ? "danger" : "success"}>{v.status ?? "active"}</Badge>
                      </div>
                      <Caption className="mt-0.5 block normal-case text-muted-foreground">
                        Provider: {v.provider?.name ?? provider.name}
                        {v.capacity != null && ` · Capacity: ${v.capacity}`}
                        {v.escapePoint && ` · ${v.escapePoint.name}`}
                      </Caption>
                    </div>
                    {v.basePrice != null && <span className="shrink-0 font-semibold text-foreground">{formatInr(v.basePrice)}</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <ServiceProviderFormModal
        open={editOpen}
        provider={provider}
        escapePoints={escapePoints}
        onClose={() => setEditOpen(false)}
        onSaved={() => {
          setEditOpen(false);
          router.refresh();
        }}
      />
    </Card>
  );
}
