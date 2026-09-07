"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HiOutlineChevronDown } from "react-icons/hi";
import { IoSearchOutline } from "react-icons/io5";
import { cn } from "@/lib/cn";
import type { SelectOption } from "@/components/ui/Select";

interface ToolbarSelectProps {
  /** Short prefix shown before the current value, e.g. "Sort" -> "Sort: Latest". */
  label: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  /** Shown in place of a label when value doesn't match any option (e.g. "" for "no filter"). */
  placeholder?: string;
  className?: string;
  /** Adds a search box inside the dropdown and caps the unfiltered list to
   * initialLimit entries — for option lists too long to show in full (e.g.
   * a library of escape points). options[0] is treated as a pinned "no
   * filter" entry (mirrors EscapePointSelect's "Apply for All" row): always
   * shown, never counted against initialLimit, never removed by search. */
  searchable?: boolean;
  searchPlaceholder?: string;
  initialLimit?: number;
}

// Compact single-line "Label: Value ▾" filter chip for a table toolbar —
// distinct from Select.tsx (which always renders its own label line above a
// full-width trigger, meant for forms) and PeriodSelector (a segmented
// button group, only sensible for 2-4 options). Same dropdown/portal/
// keyboard-nav mechanics as Select.tsx; a smaller trigger, and a search box
// only when explicitly requested via `searchable`.
export function ToolbarSelect({
  label,
  options,
  value,
  onChange,
  placeholder = "",
  className,
  searchable,
  searchPlaceholder = "Search…",
  initialLimit,
}: ToolbarSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [pos, setPos] = useState<{ left: number; top: number; width: number }>({ left: 0, top: 0, width: 0 });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);

  // options[0] (e.g. "Default") is pinned: excluded from both the initial
  // cap and the search filter, always rendered first.
  const [pinned, ...rest] = options;
  const visibleOptions = !searchable
    ? options
    : [
        pinned,
        ...(search.trim()
          ? rest.filter((o) => o.label.toLowerCase().includes(search.trim().toLowerCase()))
          : initialLimit != null
            ? rest.slice(0, initialLimit)
            : rest),
      ];

  function openDropdown() {
    setSearch("");
    const idx = options.findIndex((o) => o.value === value);
    setActiveIndex(idx >= 0 ? idx : 0);
    setOpen(true);
  }

  function close() {
    setOpen(false);
  }

  function selectOption(opt: SelectOption) {
    onChange(opt.value);
    close();
    triggerRef.current?.focus();
  }

  useEffect(() => {
    setActiveIndex(0);
  }, [search]);

  useEffect(() => {
    if (open && searchable) searchInputRef.current?.focus();
  }, [open, searchable]);

  useLayoutEffect(() => {
    if (!open) return;

    function positionPanel() {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const panelHeight = panelRef.current?.getBoundingClientRect().height ?? 220;

      let top = rect.bottom + 4;
      if (top + panelHeight > window.innerHeight - 8) top = Math.max(8, rect.top - panelHeight - 4);

      setPos({ left: rect.left, top, width: Math.max(rect.width, 200) });
    }

    positionPanel();
    window.addEventListener("resize", positionPanel);
    window.addEventListener("scroll", positionPanel, true);
    return () => {
      window.removeEventListener("resize", positionPanel);
      window.removeEventListener("scroll", positionPanel, true);
    };
  }, [open, search]);

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
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, visibleOptions.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const opt = visibleOptions[activeIndex];
        if (opt) selectOption(opt);
      }
    }
    document.addEventListener("mousedown", handlePointerDown, true);
    document.addEventListener("keydown", handleKey, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKey, true);
      window.removeEventListener("resize", close);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeIndex, visibleOptions]);

  return (
    <div className={className}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? close() : openDropdown())}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex h-7 items-center gap-1 rounded-full border border-transparent bg-[#f8f8fa] px-3 text-sm text-foreground transition-colors",
          "hover:border-primary/30 focus-visible:border-primary/40 focus-visible:outline-none",
        )}
      >
        <span className="text-muted-foreground">{label}:</span>
        <span className="font-medium">{selected ? selected.label : placeholder}</span>
        <HiOutlineChevronDown size={13} className={cn("shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && createPortal(
        <div
          ref={panelRef}
          style={{ position: "fixed", left: pos.left, top: pos.top, width: pos.width }}
          className="z-50 flex flex-col overflow-hidden rounded border border-border bg-card text-card-foreground shadow-xl"
        >
          {searchable && (
            <div className="border-b border-border p-2">
              <div className="relative">
                <IoSearchOutline className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <input
                  ref={searchInputRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-8 w-full rounded border border-transparent bg-[#f8f8fa] pl-7 pr-3 text-sm text-foreground placeholder:text-[#9da3af] transition-colors focus-visible:border-primary/40 focus-visible:bg-background focus-visible:outline-none"
                />
              </div>
            </div>
          )}
          <div role="listbox" aria-label={label} className="max-h-72 overflow-y-auto py-1">
            {searchable && rest.length > 0 && visibleOptions.length === 1 && (
              <div className="px-3 py-2 text-sm text-muted-foreground">No matches for &quot;{search}&quot;</div>
            )}
            {visibleOptions.map((opt, i) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => selectOption(opt)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={cn(
                    "flex w-full items-center px-3 py-2 text-left text-sm outline-none transition-colors",
                    isSelected ? "bg-primary/10 text-primary" : "text-foreground",
                    activeIndex === i && !isSelected && "bg-muted",
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
