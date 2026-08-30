"use client";

import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { PiSuitcaseRollingFill, PiFileTextFill } from "react-icons/pi";
import { cn } from "@/lib/cn";
import { ItineraryManagementCard } from "@/components/escapes/ItineraryManagementCard";
import { DocumentsCard } from "@/components/escapes/DocumentsCard";
import type { Deal } from "@/lib/deals";

// Desktop-only: docked to the right edge of the *viewport* (not the page's
// scrollable white container), spanning from just under the fixed header
// down to the bottom of the screen — stays in place while the center
// workspace scrolls, mirroring how the left Sidebar behaves. Itineraries and
// Documents render "bare" (no own Card) so they read as one continuous
// section split by a single divider, not two stacked cards.
//
// Collapsed state is owned by the parent (EscapeDetailPanel) rather than
// locally, since the outer page Card's right margin needs to shrink/grow in
// sync with this panel's width — a single source of truth driving both.
// The collapse handle is a CHILD of the width-animated container (not a
// separately-positioned sibling), so it always sits exactly on the panel's
// current left edge, including mid-transition, the same way the Sidebar's
// own edge-tab tracks its rail.
export function EscapeSidePanel({
  escapeUid,
  deal,
  collapsed,
  onToggleCollapsed,
  selectedItineraryUid,
  onSelectItinerary,
}: {
  escapeUid: string;
  deal: Deal | null;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  /** Owned by the parent (EscapeDetailPanel) — shared with the center
   * workspace's Planning tab, which renders only this one itinerary. */
  selectedItineraryUid: string | null;
  onSelectItinerary: (uid: string) => void;
}) {
  return (
    <div
      className={cn(
        "fixed inset-y-0 right-0 top-12 z-30 hidden border-l border-border bg-card transition-[width] duration-200 lg:block",
        // Collapsed keeps a slim visible rail — same w-14 the left Sidebar's
        // own collapsed rail uses — instead of vanishing to width 0.
        collapsed ? "w-14" : "w-80",
      )}
    >
      <button
        type="button"
        onClick={onToggleCollapsed}
        aria-label={collapsed ? "Expand panel" : "Collapse panel"}
        title={collapsed ? "Expand panel" : "Collapse panel"}
        className="absolute -left-2.5 top-1/2 z-10 flex h-8 w-5 -translate-y-1/2 items-center justify-center rounded-l-md border border-r-0 border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
      >
        {collapsed ? <FaChevronLeft className="h-3 w-3" /> : <FaChevronRight className="h-3 w-3" />}
      </button>

      {collapsed && (
        <div className="flex flex-col items-center gap-2 pt-4">
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label="Expand panel to view itineraries"
            title="Itineraries"
            className="flex items-center justify-center rounded-xl p-2.5 text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground"
          >
            <PiSuitcaseRollingFill className="h-5 w-5 shrink-0" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label="Expand panel to view quotes"
            title="Quotes"
            className="flex items-center justify-center rounded-xl p-2.5 text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground"
          >
            <PiFileTextFill className="h-5 w-5 shrink-0" aria-hidden="true" />
          </button>
        </div>
      )}

      {!collapsed && (
        <div className="flex h-full w-80 flex-col">
          <div className="flex min-h-0 flex-1 basis-0 flex-col p-3">
            <ItineraryManagementCard
              escapeUid={escapeUid}
              selectedUid={selectedItineraryUid}
              onSelect={onSelectItinerary}
              bare
            />
          </div>
          <div className="flex min-h-0 flex-1 basis-0 flex-col p-3">
            <DocumentsCard deal={deal} escapeUid={escapeUid} selectedItineraryUid={selectedItineraryUid} bare />
          </div>
        </div>
      )}
    </div>
  );
}
