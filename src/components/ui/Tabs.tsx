"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface TabItem {
  id: string;
  label: string;
}

// Generic tab primitive — render-prop content so each caller controls what
// shows per tab without a separate TabPanel abstraction. Active tab reads in
// the app's primary color with a small bottom accent bar; the tablist itself
// sits on a subtle border-b divider, matching the rest of the design system's
// use of border-border for section dividers (e.g. Card sub-sections).
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
    <div className="flex flex-col">
      <div role="tablist" className="flex items-center gap-4 border-b border-border">
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
                "relative px-1 py-2 text-sm font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
              {isActive && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />}
            </button>
          );
        })}
      </div>
      <div className="pt-3">{children(active)}</div>
    </div>
  );
}
