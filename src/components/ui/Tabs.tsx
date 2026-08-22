"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface TabItem {
  id: string;
  label: string;
}

// Generic tab primitive — render-prop content so each caller controls what
// shows per tab without a separate TabPanel abstraction. Pills sit left-
// aligned in a row, each its own separately-bordered/filled button (not a
// continuous underlined strip) — the active pill fills solid, inactive ones
// stay plain outlined so the row reads as a segmented control. An optional
// `aside` renders right-aligned in that same row, for context that doesn't
// belong to any one tab (e.g. which record is currently selected elsewhere
// on the page) — scoped outside the tabs themselves rather than duplicated
// inside every tab's own content. On desktop the content box fills the
// rest of the available height and scrolls internally (lg:flex-1 +
// overflow-y-auto) so the page itself never needs to scroll; below lg it
// just sizes to content and the page scrolls as usual, since there's no
// fixed-height ancestor to fill on mobile.
export function Tabs({
  tabs,
  defaultTab,
  aside,
  children,
}: {
  tabs: TabItem[];
  defaultTab?: string;
  aside?: ReactNode;
  children: (activeTab: string) => ReactNode;
}) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id);

  return (
    <div className="flex min-w-0 flex-col gap-3 lg:h-full lg:min-h-0">
      {/* Single scroll container for the whole row — tabs and aside scroll
          together as one unit rather than each getting its own scrollbar,
          so the row reads as one continuous strip when it doesn't fit. */}
      <div className="show-scrollbar flex min-w-0 items-center gap-3 overflow-x-auto">
        <div role="tablist" className="flex shrink-0 items-center gap-2">
          {tabs.map((tab) => {
            const isActive = active === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActive(tab.id)}
                className={cn(
                  "shrink-0 whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        {aside && <div className="flex shrink-0 items-center">{aside}</div>}
      </div>
      <div className="show-scrollbar min-w-0 overflow-x-auto rounded-lg border border-border bg-[#f2f2f5] p-2 lg:flex lg:min-h-0 lg:flex-1 lg:w-full lg:flex-col lg:overflow-y-auto">
        {children(active)}
      </div>
    </div>
  );
}
