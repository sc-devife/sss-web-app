"use client";

import { useEffect, useLayoutEffect, useRef, useState, useId } from "react";
import { createPortal } from "react-dom";
import { IoTimeOutline } from "react-icons/io5";
import { cn } from "@/lib/cn";
import { formatDisplayTime } from "@/lib/date";

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1); // 1..12
const MINUTES = Array.from({ length: 60 }, (_, i) => i); // 0..59
const PERIODS = ["AM", "PM"] as const;
type Period = (typeof PERIODS)[number];

interface Pending {
  hour: number | null;
  minute: number | null;
  period: Period | null;
}

const EMPTY_PENDING: Pending = { hour: null, minute: null, period: null };

// Reads the "HH:mm" (24-hour) value shape a native `<input type="time">`
// already used across these forms into 12-hour column state.
function parseValue(value: string): Pending {
  const match = /^(\d{1,2}):(\d{2})/.exec(value.trim());
  if (!match) return EMPTY_PENDING;
  const h24 = Number(match[1]);
  const m = Number(match[2]);
  if (Number.isNaN(h24) || Number.isNaN(m) || h24 > 23 || m > 59) return EMPTY_PENDING;
  const period: Period = h24 < 12 ? "AM" : "PM";
  const hour = h24 % 12 === 0 ? 12 : h24 % 12;
  return { hour, minute: m, period };
}

function toValue(pending: Pending): string {
  const { hour, minute, period } = pending;
  if (hour == null || minute == null || period == null) return "";
  let h24 = hour % 12;
  if (period === "PM") h24 += 12;
  return `${String(h24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export interface TimePickerProps {
  label?: string;
  /** "HH:mm" (24-hour), or "" for no selection — same shape a native
   * `<input type="time">` already used across these forms. */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
}

// Custom time picker replacing the native `<input type="time">` — one
// dropdown with 3 scrollable columns (Hour / Minute / AM-PM), matching
// DatePicker's compact rounded-card look. Picking a value in whichever
// column is left commits immediately once all 3 columns have a value (no
// separate Apply/Cancel step, same "auto-commit" convention as DatePicker).
export function TimePicker({
  label,
  value,
  onChange,
  placeholder = "Select time",
  error,
  required,
  disabled,
  className,
  id,
}: TimePickerProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<Pending>(EMPTY_PENDING);
  const [pos, setPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const hourListRef = useRef<HTMLDivElement>(null);
  const minuteListRef = useRef<HTMLDivElement>(null);
  const periodListRef = useRef<HTMLDivElement>(null);

  function openPicker() {
    if (disabled) return;
    setPending(parseValue(value));
    setOpen(true);
  }

  function close() {
    setOpen(false);
  }

  function pick(patch: Partial<Pending>) {
    const next = { ...pending, ...patch };
    setPending(next);
    if (next.hour != null && next.minute != null && next.period != null) {
      onChange(toValue(next));
      setOpen(false);
      triggerRef.current?.focus();
    }
  }

  // Scroll each column to its current selection right after the panel
  // mounts (before paint), so there's no visible jump and no reliance on a
  // hidden-until-measured gate that would break the scroll math.
  useLayoutEffect(() => {
    if (!open) return;
    const scrollToSelected = (container: HTMLDivElement | null, index: number) => {
      const target = container?.children[index] as HTMLElement | undefined;
      target?.scrollIntoView({ block: "center" });
    };
    scrollToSelected(hourListRef.current, pending.hour != null ? pending.hour - 1 : 0);
    scrollToSelected(minuteListRef.current, pending.minute ?? 0);
    scrollToSelected(periodListRef.current, pending.period === "PM" ? 1 : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;

    function positionPanel() {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const panelWidth = panelRef.current?.getBoundingClientRect().width ?? 220;
      const panelHeight = panelRef.current?.getBoundingClientRect().height ?? 260;

      let left = rect.left;
      let top = rect.bottom + 4;
      if (left + panelWidth > window.innerWidth - 8) left = Math.max(8, window.innerWidth - panelWidth - 8);
      if (top + panelHeight > window.innerHeight - 8) top = Math.max(8, rect.top - panelHeight - 4);

      setPos({ left, top });
    }

    positionPanel();
    window.addEventListener("resize", positionPanel);
    window.addEventListener("scroll", positionPanel, true);
    return () => {
      window.removeEventListener("resize", positionPanel);
      window.removeEventListener("scroll", positionPanel, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      close();
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
        triggerRef.current?.focus();
      }
    }
    function handleViewportChange() {
      close();
    }

    document.addEventListener("mousedown", handlePointerDown, true);
    document.addEventListener("keydown", handleKey, true);
    window.addEventListener("resize", handleViewportChange);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKey, true);
      window.removeEventListener("resize", handleViewportChange);
    };
  }, [open]);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-danger"> *</span>}
        </label>
      )}

      <button
        ref={triggerRef}
        id={inputId}
        type="button"
        disabled={disabled}
        onClick={() => (open ? close() : openPicker())}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded border border-border bg-background px-3 text-left text-sm text-foreground",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary",
          !value && "text-muted-foreground",
          error && "border-danger",
          disabled && "cursor-not-allowed opacity-60",
          className,
        )}
      >
        <span className="truncate">{value ? formatDisplayTime(value) : placeholder}</span>
        <IoTimeOutline size={15} className="shrink-0 text-muted-foreground" />
      </button>
      {error && <span className="text-xs text-danger">{error}</span>}

      {open && createPortal(
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Choose a time"
          style={{ position: "fixed", left: pos.left, top: pos.top }}
          className="z-50 w-[220px] rounded-2xl border border-border bg-card p-3 text-card-foreground shadow-xl"
        >
          <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] gap-1">
            <div className="flex flex-col items-center gap-1 overflow-hidden">
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Hour</span>
              <div ref={hourListRef} className="flex max-h-44 w-full flex-col gap-0.5 overflow-y-auto">
                {HOURS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => pick({ hour: h })}
                    className={cn(
                      "w-full shrink-0 rounded-md py-1.5 text-center text-sm transition-colors",
                      pending.hour === h ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted",
                    )}
                  >
                    {String(h).padStart(2, "0")}
                  </button>
                ))}
              </div>
            </div>

            <span className="pt-6 text-sm font-medium text-muted-foreground">:</span>

            <div className="flex flex-col items-center gap-1 overflow-hidden">
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Min</span>
              <div ref={minuteListRef} className="flex max-h-44 w-full flex-col gap-0.5 overflow-y-auto">
                {MINUTES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => pick({ minute: m })}
                    className={cn(
                      "w-full shrink-0 rounded-md py-1.5 text-center text-sm transition-colors",
                      pending.minute === m ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted",
                    )}
                  >
                    {String(m).padStart(2, "0")}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-px self-stretch bg-border" />

            <div className="flex flex-col items-center gap-1 overflow-hidden">
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">&nbsp;</span>
              <div ref={periodListRef} className="flex w-full flex-col gap-0.5">
                {PERIODS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => pick({ period: p })}
                    className={cn(
                      "w-full shrink-0 rounded-md py-1.5 text-center text-sm transition-colors",
                      pending.period === p ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted",
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
