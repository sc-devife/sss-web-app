"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IoCalendarOutline, IoClose } from "react-icons/io5";
import { Button } from "@/components/ui/Button";
import { DatePicker } from "@/components/ui/DatePicker";
import { cn } from "@/lib/cn";

// With `withDay`, the popup offers a Day / Date range toggle: Day shows one
// Date field (applied as from == to), Date range shows From and To.
//
// "Dates between" filter chip for a table toolbar: opens a small popup with a
// From and a To date. Edits stay in a local draft and are only pushed up on
// Submit (so picking a day doesn't fire a request), same as the Leads page's
// More Filters popup. Either date may be left empty for an open-ended range.
// Same portal + fixed-position + outside-click-close mechanics as
// ToolbarSelect; the DatePicker's own calendar is a portal too, so clicks
// inside it (marked data-floating-panel) must not read as "outside".
export function DateRangeFilter({
  from,
  to,
  onApply,
  label = "Dates between",
  withDay = false,
  toLabel = "To Date",
}: {
  /** Applied range, "YYYY-MM-DD" or "" when unset. */
  from: string;
  to: string;
  onApply: (from: string, to: string) => void;
  label?: string;
  /** Offer a Day / Date range toggle (a single day is applied as from == to). */
  withDay?: boolean;
  /** Label of the second date field in range mode. */
  toLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ from, to });
  const [mode, setMode] = useState<"day" | "range">("range");
  const [pos, setPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const active = Boolean(from || to);

  function openPopover() {
    setDraft({ from, to });
    // An applied single day (from == to) reopens in Day mode.
    setMode(withDay && from && from === to ? "day" : "range");
    setOpen(true);
  }

  function close() {
    setOpen(false);
  }

  useLayoutEffect(() => {
    if (!open) return;
    function position() {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const panelHeight = panelRef.current?.getBoundingClientRect().height ?? 200;
      let top = rect.bottom + 4;
      if (top + panelHeight > window.innerHeight - 8) top = Math.max(8, rect.top - panelHeight - 4);
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - 320 - 8));
      setPos({ left, top });
    }
    position();
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    return () => {
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
    };
  }, [open, draft, mode]);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      if ((target as HTMLElement).closest?.("[data-floating-panel]")) return;
      setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", handlePointerDown, true);
    document.addEventListener("keydown", handleKey, true);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKey, true);
    };
  }, [open]);

  return (
    <div>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? close() : openPopover())}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          "flex h-7 items-center gap-1.5 rounded-full border bg-[#f8f8fa] px-3 text-sm text-foreground transition-colors",
          "hover:border-primary/30 focus-visible:border-primary/40 focus-visible:outline-none",
          active ? "border-primary/40" : "border-transparent",
        )}
      >
        <IoCalendarOutline size={14} className="shrink-0 text-muted-foreground" />
        {label}
        {active && <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-label="Applied" />}
      </button>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-label={label}
            style={{ position: "fixed", left: pos.left, top: pos.top, width: 320 }}
            className="z-50 flex flex-col gap-3 rounded border border-border bg-card p-4 text-card-foreground shadow-xl"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">{label}</span>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                title="Close"
                className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <IoClose size={18} />
              </button>
            </div>

            {withDay && (
              <div role="tablist" aria-label="Filter by" className="inline-flex w-fit items-center gap-1 rounded-full bg-muted p-1">
                {(
                  [
                    ["day", "Day"],
                    ["range", "Date range"],
                  ] as const
                ).map(([value, text]) => (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={mode === value}
                    onClick={() => setMode(value)}
                    className={cn(
                      "rounded-full px-3 py-1 text-sm font-medium transition-colors",
                      mode === value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {text}
                  </button>
                ))}
              </div>
            )}

            {withDay && mode === "day" ? (
              <DatePicker
                label="Date"
                value={draft.from}
                onChange={(v) => setDraft({ from: v, to: v })}
              />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <DatePicker
                  label="From Date"
                  value={draft.from}
                  onChange={(v) => setDraft((d) => ({ ...d, from: v }))}
                  max={draft.to || undefined}
                />
                <DatePicker
                  label={toLabel}
                  value={draft.to}
                  onChange={(v) => setDraft((d) => ({ ...d, to: v }))}
                  min={draft.from || undefined}
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" onClick={() => setDraft({ from: "", to: "" })} className="w-full">
                Clear
              </Button>
              <Button
                type="button"
                onClick={() => {
                  // Day mode applies its one date as from == to, whatever the range
                  // tab last held.
                  if (withDay && mode === "day") onApply(draft.from, draft.from);
                  else onApply(draft.from, draft.to);
                  close();
                }}
                className="w-full"
              >
                Submit
              </Button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
