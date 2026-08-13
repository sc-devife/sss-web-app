"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface TabItem {
  id: string;
  label: string;
}

// Generic tab primitive — render-prop content so each caller controls what
// shows per tab without a separate TabPanel abstraction. Pills sit centered
// in a row, each its own separately-bordered/filled button (not a
// continuous underlined strip) — the active pill fills solid, inactive ones
// stay plain outlined so the row reads as a segmented control. On desktop
// the content box fills the rest of the available height and scrolls
// internally (lg:flex-1 + overflow-y-auto) so the page itself never needs
// to scroll; below lg it just sizes to content and the page scrolls as
// usual, since there's no fixed-height ancestor to fill on mobile.
export function Tabs({
  tabs,
  defaultTab,
  children,
}: {
  tabs: TabItem[];
  defaultTab?: string;
  children: (activeTab: string) => ReactNode;
}) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id);

  return (
    <div className="flex flex-col gap-3 lg:h-full lg:min-h-0">
      <div role="tablist" className="flex items-center justify-center gap-2">
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
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
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
      <div className="show-scrollbar rounded-lg border border-border bg-[#f2f2f5] p-3 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:overflow-y-auto">
        {children(active)}
      </div>
    </div>
  );
}
