"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaChevronLeft, FaLocationDot } from "react-icons/fa6";
import { CiImageOff } from "react-icons/ci";
import { PiStar, PiStarFill } from "react-icons/pi";
import { TbEditFilled } from "react-icons/tb";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { Body, Caption } from "@/components/ui/Typography";
import { EscapePointFormModal } from "@/components/library/EscapePointFormModal";
import { EscapePointLocationsModal } from "@/components/library/EscapePointLocationsModal";
import { resolveFileUrl } from "@/lib/files";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import type { EscapePoint } from "@/lib/escape-points";
import type { LibraryLocation } from "@/lib/locations";
import { useAppDispatch } from "@/store/hooks";
import { setEscapePointPriorityImage } from "@/features/escapePoints/escapePointsThunks";

function BackToEscapePoints() {
  return (
    <Link
      href="/library/escape-points"
      className="inline-flex w-fit items-center gap-0.5 text-[13px] text-foreground/70 transition-colors hover:text-foreground"
    >
      <FaChevronLeft size={12} className="shrink-0" />
      <span className="font-semibold">Back to Escape Points</span>
    </Link>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

// The premium, dedicated Escape Point Details page — replaces the old View
// modal (same rationale HotelDetailPanel already established: too much to
// do justice in a popup). Adds the one genuinely new capability, choosing a
// priority/main image from the Gallery, which the old popup had no way to
// offer at all.
export function EscapePointDetailPanel({
  escapePoint,
  escapePoints,
  locations,
}: {
  escapePoint: EscapePoint;
  escapePoints: EscapePoint[];
  locations: LibraryLocation[];
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [editOpen, setEditOpen] = useState(false);
  const [managingLocations, setManagingLocations] = useState(false);

  // Server-fetched prop is the source of truth after any router.refresh()
  // (e.g. post-edit); local state additionally lets "Make Priority" update
  // the page instantly without a refetch, per the requirement that the
  // gallery reflect the new priority image with no page reload.
  const [current, setCurrent] = useState(escapePoint);
  useEffect(() => {
    setCurrent(escapePoint);
  }, [escapePoint]);

  const [settingPriorityFor, setSettingPriorityFor] = useState<string | null>(null);
  const [priorityError, setPriorityError] = useState<string | undefined>();

  const images = current.images ?? [];
  const cover = current.priorityImage ?? images[0] ?? null;

  async function handleMakePriority(url: string) {
    setSettingPriorityFor(url);
    setPriorityError(undefined);
    try {
      const updated = await dispatch(setEscapePointPriorityImage({ uid: current.uid, imageUrl: url })).unwrap();
      setCurrent(updated);
    } catch (err) {
      setPriorityError(typeof err === "string" ? err : extractErrorMessage(err, "Failed to set priority image"));
    } finally {
      setSettingPriorityFor(null);
    }
  }

  return (
    <Card variant="page" className="flex min-h-full flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <BackToEscapePoints />
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setManagingLocations(true)}>
            Locations
          </Button>
          <Button onClick={() => setEditOpen(true)}>
            <TbEditFilled size={16} />
            Edit escape point
          </Button>
        </div>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-border">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={resolveFileUrl(cover)} alt={current.name} className="h-64 w-full object-cover md:h-80" />
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
            <h1 className="truncate text-2xl font-bold tracking-tight text-white md:text-3xl">{current.name}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/90">
              <span className="rounded-md bg-white/15 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide backdrop-blur-sm">
                {current.id}
              </span>
              <span className="flex items-center gap-1">
                <FaLocationDot size={12} />
                {current.locationLabel || "No location available"}
              </span>
            </div>
          </div>
          <Badge tone={current.status === "archived" ? "danger" : "success"}>{current.status ?? "active"}</Badge>
        </div>
      </div>

      {/* Quick facts */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <DetailCard label="Escape Point Code" value={current.id} />
        <DetailCard label="Nearest Airport" value={current.nearest_airport || "—"} />
        <DetailCard label="Currency" value={current.currency || "—"} />
        <DetailCard label="Time Zone" value={current.time_zone || "—"} />
      </div>

      {/* Description */}
      <div>
        <Caption>About this Escape Point</Caption>
        <Body className="mt-1 whitespace-pre-wrap leading-6">
          {current.description || "No description available."}
        </Body>
      </div>

      {/* Locations */}
      <div className="rounded-xl border border-border bg-muted/20 p-4">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 text-muted-foreground"><FaLocationDot /></span>
          <Body className="font-medium">{current.locationLabel || "No location available"}</Body>
        </div>
        {current.locations.length > 1 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {current.locations.map((l) => (
              <Badge key={l.uid} tone={l.isPrimary ? "success" : "neutral"}>
                {l.city}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Gallery */}
      <div>
        <div className="flex items-center justify-between">
          <Caption>Gallery</Caption>
          {images.length > 1 && (
            <span className="text-xs text-muted-foreground">Hover an image to set it as the priority image</span>
          )}
        </div>

        {priorityError && (
          <Alert tone="danger" autoClose={false} className="mt-2">
            {priorityError}
          </Alert>
        )}

        {images.length > 0 ? (
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {images.map((url) => {
              const isPriority = url === current.priorityImage;
              const isSettingThis = settingPriorityFor === url;
              return (
                <div key={url} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resolveFileUrl(url)}
                    alt={current.name}
                    className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                  />
                  {isPriority ? (
                    <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground shadow">
                      <PiStarFill size={11} />
                      Priority Image
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleMakePriority(url)}
                      disabled={settingPriorityFor !== null}
                      className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/60 py-1.5 text-[11px] font-medium text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 disabled:cursor-not-allowed"
                    >
                      {isSettingThis ? (
                        <Spinner size="sm" tone="current" />
                      ) : (
                        <>
                          <PiStar size={12} />
                          Make Priority
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-2 flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-muted/30 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <CiImageOff size={22} />
            </div>
            <div className="text-sm font-medium text-muted-foreground">No images available</div>
          </div>
        )}
      </div>

      <EscapePointFormModal
        open={editOpen}
        escapePoint={current}
        escapePoints={escapePoints}
        locations={locations}
        onClose={() => setEditOpen(false)}
        onSaved={() => {
          setEditOpen(false);
          router.refresh();
        }}
      />

      <EscapePointLocationsModal
        escapePoint={managingLocations ? current : null}
        locations={locations}
        onClose={() => setManagingLocations(false)}
        onSaved={() => {
          setManagingLocations(false);
          router.refresh();
        }}
      />
    </Card>
  );
}
