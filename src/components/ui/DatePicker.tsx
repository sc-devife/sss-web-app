"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import { cn } from "@/lib/cn";

const WEEKDAY_LABELS = ["Sa", "Su", "Mo", "Tu", "We", "Th", "Fr"];
const MONTH_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Reads the Y/M/D digits straight out of the string (same approach as
// lib/date.ts's formatDisplayDate) rather than `new Date(value)`, so a bare
// "YYYY-MM-DD" isn't reinterpreted as UTC midnight and shifted a day in
// timezones behind UTC.
function parseIsoDate(value: string | undefined | null): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDisplay(value: string): string {
  const date = parseIsoDate(value);
  if (!date) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}-${month}-${date.getFullYear()}`;
}

function isSameDay(a: Date, b: Date | null): boolean {
  return !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// Week starts Saturday, matching the design reference exactly: [Sa,Su,Mo,Tu,We,Th,Fr].
function buildMonthGrid(year: number, month: number): { date: Date; inMonth: boolean }[] {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 1) % 7; // JS Sun=0..Sat=6 -> Sa-first index
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: { date: Date; inMonth: boolean }[] = [];
  for (let i = startOffset - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, daysInPrevMonth - i), inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), inMonth: true });
  }
  while (cells.length < 42) {
    const last = cells[cells.length - 1].date;
    cells.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), inMonth: false });
  }
  return cells;
}

export interface DatePickerProps {
  label?: string;
  /** "YYYY-MM-DD", or "" for no selection — same shape every existing date field already used. */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  /** "YYYY-MM-DD" bounds — days outside this range render disabled. */
  min?: string;
  max?: string;
  /** Applies to the trigger element itself, matching TextInput/Select's className convention. */
  className?: string;
  id?: string;
}

// Custom calendar popover replacing the native `<input type="date">` —
// single-date selection (no range). Picking a day commits immediately (calls
// onChange and closes) — no separate confirm step. Reused everywhere a date
// field is needed; see TextInput's className convention note for why
// `className` lands on the trigger, not a wrapper div.
export function DatePicker({
  label,
  value,
  onChange,
  placeholder = "Select date",
  error,
  required,
  disabled,
  min,
  max,
  className,
  id,
}: DatePickerProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(() => parseIsoDate(value) ?? new Date());
  const [pos, setPos] = useState<{ left: number; top: number; ready: boolean }>({ left: 0, top: 0, ready: false });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  function openPicker() {
    if (disabled) return;
    setViewDate(parseIsoDate(value) ?? new Date());
    setOpen(true);
  }

  function close() {
    setOpen(false);
  }

  function selectDay(date: Date) {
    onChange(toIsoDate(date));
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;

    function positionPanel() {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const panelRect = panelRef.current?.getBoundingClientRect();
      const panelWidth = panelRect?.width ?? 300;
      const panelHeight = panelRect?.height ?? 360;

      let left = rect.left;
      let top = rect.bottom + 6;
      if (left + panelWidth > window.innerWidth - 8) left = Math.max(8, window.innerWidth - panelWidth - 8);
      if (top + panelHeight > window.innerHeight - 8) top = Math.max(8, rect.top - panelHeight - 6);

      setPos({ left, top, ready: true });
    }

    positionPanel();
    window.addEventListener("resize", positionPanel);
    window.addEventListener("scroll", positionPanel, true);
    return () => {
      window.removeEventListener("resize", positionPanel);
      window.removeEventListener("scroll", positionPanel, true);
    };
  }, [open, viewDate]);

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

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const grid = buildMonthGrid(year, month);
  const selectedDate = parseIsoDate(value);
  const minDate = parseIsoDate(min);
  const maxDate = parseIsoDate(max);

  function isDayDisabled(date: Date) {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  }

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
          "flex h-10 items-center rounded border border-border bg-background px-3 text-left text-sm text-foreground",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary",
          !value && "text-muted-foreground",
          error && "border-danger",
          disabled && "cursor-not-allowed opacity-60",
          className,
        )}
      >
        {value ? formatDisplay(value) : placeholder}
      </button>
      {error && <span className="text-xs text-danger">{error}</span>}

      {open && createPortal(
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Choose a date"
          style={{ position: "fixed", left: pos.left, top: pos.top, visibility: pos.ready ? "visible" : "hidden" }}
          className="z-50 w-[300px] rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-xl"
        >
          <div className="flex items-center justify-between pb-3">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <IoChevronBack size={16} />
            </button>
            <span className="text-sm font-semibold text-foreground">
              {MONTH_LABELS[month]} {year}
            </span>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <IoChevronForward size={16} />
            </button>
          </div>

          <div className="border-t border-border pt-3">
            <div className="grid grid-cols-7 text-center text-xs font-medium text-muted-foreground">
              {WEEKDAY_LABELS.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-y-1 text-center text-sm">
              {grid.map(({ date, inMonth }, i) => {
                const dayDisabled = isDayDisabled(date);
                const selected = isSameDay(date, selectedDate);
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={dayDisabled}
                    onClick={() => selectDay(date)}
                    className={cn(
                      "mx-auto flex h-9 w-9 items-center justify-center rounded-full transition-colors",
                      !inMonth && "text-muted-foreground/40",
                      inMonth && !selected && !dayDisabled && "text-foreground hover:bg-muted",
                      selected && "bg-primary text-primary-foreground",
                      dayDisabled && "cursor-not-allowed opacity-40",
                    )}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
