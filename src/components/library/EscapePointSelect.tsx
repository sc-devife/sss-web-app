"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HiOutlineChevronDown } from "react-icons/hi";
import { IoSearchOutline } from "react-icons/io5";
import { cn } from "@/lib/cn";
import type { EscapePoint } from "@/lib/escape-points";

interface EscapePointSelectProps {
  label: string;
  escapePoints: EscapePoint[];
  /** Empty string means "Apply for All" (org-wide, no specific escape point). */
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

// Same portal/positioning/keyboard pattern as Select.tsx and CountrySelect.tsx,
// but with two differences specific to this field: "Apply for All" is a
// pinned row that's always visible above the list and never removed by
// search, and the search box is always shown (not threshold-gated) since
// this list is expected to grow significantly over time.
export function EscapePointSelect({ label, escapePoints, value, onChange, disabled }: EscapePointSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  // -1 represents the pinned "Apply for All" row; 0+ indexes into filteredPoints.
  const [activeIndex, setActiveIndex] = useState(-1);
  const [pos, setPos] = useState<{ left: number; top: number; width: number }>({ left: 0, top: 0, width: 0 });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selected = escapePoints.find((p) => p.uid === value);
  const filteredPoints = search.trim()
    ? escapePoints.filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase()))
    : escapePoints;

  function openDropdown() {
    if (disabled) return;
    setSearch("");
    const idx = value ? filteredPoints.findIndex((p) => p.uid === value) : -1;
    setActiveIndex(idx);
    setOpen(true);
  }

  function close() {
    setOpen(false);
  }

  function select(uid: string) {
    onChange(uid);
    setOpen(false);
    triggerRef.current?.focus();
  }

  useEffect(() => {
    setActiveIndex(-1);
  }, [search]);

  useEffect(() => {
    if (open) searchInputRef.current?.focus();
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;

    function positionPanel() {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const panelHeight = panelRef.current?.getBoundingClientRect().height ?? 320;

      let top = rect.bottom + 4;
      if (top + panelHeight > window.innerHeight - 8) top = Math.max(8, rect.top - panelHeight - 4);

      setPos({ left: rect.left, top, width: rect.width });
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
        setActiveIndex((i) => Math.min(i + 1, filteredPoints.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, -1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (activeIndex === -1) {
          select("");
        } else {
          const opt = filteredPoints[activeIndex];
          if (opt) select(opt.uid);
        }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, filteredPoints, activeIndex]);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>

      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => (open ? close() : openDropdown())}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded border border-border bg-background px-3 text-left text-sm text-foreground",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary",
          !selected && "text-primary",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <span className="truncate">{selected ? selected.name : "Apply for All"}</span>
        <HiOutlineChevronDown
          size={16}
          className={cn("shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>

      {open && createPortal(
        <div
          ref={panelRef}
          style={{ position: "fixed", left: pos.left, top: pos.top, width: pos.width }}
          className="z-50 flex flex-col overflow-hidden rounded border border-border bg-card text-card-foreground shadow-xl"
        >
          <button
            type="button"
            role="option"
            aria-selected={!value}
            onClick={() => select("")}
            onMouseEnter={() => setActiveIndex(-1)}
            className={cn(
              "flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium outline-none transition-colors",
              !value ? "bg-primary/10 text-primary" : "text-foreground",
              activeIndex === -1 && !!value && "bg-muted",
            )}
          >
            <span>Apply for All</span>
            <span className="text-xs font-normal text-muted-foreground">All escape points</span>
          </button>

          <div className="border-b border-border p-2">
            <div className="relative">
              <IoSearchOutline className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
              <input
                ref={searchInputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search escape points…"
                className="h-8 w-full rounded border border-transparent bg-[#f8f8fa] pl-7 pr-3 text-sm text-foreground placeholder:text-[#9da3af] transition-colors focus-visible:border-primary/40 focus-visible:bg-background focus-visible:outline-none"
              />
            </div>
          </div>

          <div role="listbox" aria-label={label} className="max-h-60 overflow-y-auto py-1">
            {escapePoints.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted-foreground">No escape points available</div>
            )}
            {escapePoints.length > 0 && filteredPoints.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted-foreground">No escape points match &quot;{search}&quot;</div>
            )}
            {filteredPoints.map((p, i) => {
              const isSelected = p.uid === value;
              return (
                <button
                  key={p.uid}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => select(p.uid)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={cn(
                    "flex w-full items-center px-3 py-2 text-left text-sm outline-none transition-colors",
                    isSelected ? "bg-primary/10 text-primary" : "text-foreground",
                    activeIndex === i && !isSelected && "bg-muted",
                  )}
                >
                  {p.name}
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
