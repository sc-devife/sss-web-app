"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ChangeEvent, type SelectHTMLAttributes } from "react";
import { createPortal } from "react-dom";
import { HiOutlineChevronDown } from "react-icons/hi";
import { IoSearchOutline } from "react-icons/io5";
import { cn } from "@/lib/cn";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label: string;
  options: SelectOption[];
  error?: string;
  placeholder?: string;
}

// Long lists (country pickers, etc.) get a search box at the top of the
// panel; short ones (Active/Inactive-style) don't need the extra chrome.
const SEARCH_THRESHOLD = 7;

// Custom-styled dropdown replacing the native <select> — a floating listbox
// positioned/clamped like DatePicker's calendar, so every field that used to
// pop the browser's own (unstyleable, OS-themed) select menu now gets the
// same look everywhere. Keeps the exact same prop contract as before
// (value/onChange behave like the native element's, via a synthesized
// `{ target: { value } }` event) so no call site needed to change.
export function Select({
  label,
  options,
  error,
  placeholder,
  value,
  onChange,
  disabled,
  required,
  id,
  name,
  className,
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? name ?? generatedId;

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [pos, setPos] = useState<{ left: number; top: number; width: number }>({ left: 0, top: 0, width: 0 });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const currentValue = value != null ? String(value) : "";
  const selectedOption = options.find((o) => o.value === currentValue);
  const showSearch = options.length > SEARCH_THRESHOLD;
  const filteredOptions = showSearch && search.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(search.trim().toLowerCase()))
    : options;

  function openDropdown() {
    if (disabled) return;
    setSearch("");
    const idx = options.findIndex((o) => o.value === currentValue);
    setActiveIndex(idx >= 0 ? idx : 0);
    setOpen(true);
  }

  function close() {
    setOpen(false);
  }

  function selectOption(opt: SelectOption) {
    onChange?.({ target: { value: opt.value, name } } as unknown as ChangeEvent<HTMLSelectElement>);
    setOpen(false);
    triggerRef.current?.focus();
  }

  useEffect(() => {
    setActiveIndex(0);
  }, [search]);

  useEffect(() => {
    if (open && showSearch) {
      searchInputRef.current?.focus();
    }
  }, [open, showSearch]);

  // Layout effect so the panel is measured/repositioned before the browser
  // paints — no visible "jump", and (unlike a plain effect) the panel is
  // never rendered in a hidden state, so the autofocus effect below can
  // actually focus the search input the first time it runs.
  useLayoutEffect(() => {
    if (!open) return;

    function positionPanel() {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const panelHeight = panelRef.current?.getBoundingClientRect().height ?? 240;

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
        setActiveIndex((i) => Math.min(i + 1, filteredOptions.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const opt = filteredOptions[activeIndex];
        if (opt) selectOption(opt);
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
  }, [open, filteredOptions, activeIndex]);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-danger"> *</span>}
      </label>

      <button
        ref={triggerRef}
        id={selectId}
        type="button"
        disabled={disabled}
        onClick={() => (open ? close() : openDropdown())}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded border border-border bg-background px-3 text-left text-sm text-foreground",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary",
          !selectedOption && "text-muted-foreground",
          error && "border-danger",
          disabled && "cursor-not-allowed opacity-60",
          className,
        )}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder ?? ""}</span>
        <HiOutlineChevronDown
          size={16}
          className={cn("shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>
      {error && <span className="text-xs text-danger">{error}</span>}

      {open && createPortal(
        <div
          ref={panelRef}
          style={{ position: "fixed", left: pos.left, top: pos.top, width: pos.width }}
          className="z-50 flex flex-col overflow-hidden rounded border border-border bg-card text-card-foreground shadow-xl"
        >
          {showSearch && (
            <div className="border-b border-border p-2">
              <div className="relative">
                <IoSearchOutline className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <input
                  ref={searchInputRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="h-8 w-full rounded border border-transparent bg-[#f8f8fa] pl-7 pr-3 text-sm text-foreground placeholder:text-[#9da3af] transition-colors focus-visible:border-primary/40 focus-visible:bg-background focus-visible:outline-none"
                />
              </div>
            </div>
          )}
          <div role="listbox" aria-label={label} className="max-h-60 overflow-y-auto py-1">
            {options.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted-foreground">No options available</div>
            )}
            {options.length > 0 && filteredOptions.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted-foreground">No options match &quot;{search}&quot;</div>
            )}
            {filteredOptions.map((opt, i) => {
              const selected = opt.value === currentValue;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => selectOption(opt)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={cn(
                    "flex w-full items-center px-3 py-2 text-left text-sm outline-none transition-colors",
                    selected ? "bg-primary/10 text-primary" : "text-foreground",
                    activeIndex === i && !selected && "bg-muted",
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
