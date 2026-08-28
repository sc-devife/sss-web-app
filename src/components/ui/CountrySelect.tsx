"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ComponentType } from "react";
import { createPortal } from "react-dom";
import { HiOutlineChevronDown } from "react-icons/hi";
import { IoSearchOutline } from "react-icons/io5";
import type { Country } from "react-phone-number-input";
import { cn } from "@/lib/cn";

interface CountryOption {
  value?: Country;
  label: string;
  divider?: boolean;
}

interface CountryIconProps {
  country?: Country;
  label?: string;
  "aria-hidden"?: boolean;
}

interface CountrySelectProps {
  value?: Country;
  options: CountryOption[];
  onChange: (value?: Country) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  disabled?: boolean;
  readOnly?: boolean;
  iconComponent: ComponentType<CountryIconProps>;
  name?: string;
  "aria-label"?: string;
}

// Drop-in replacement for react-phone-number-input's default `<select>`
// country picker (passed via PhoneInput's `countrySelectComponent` prop) —
// same portal/search pattern as Select.tsx, so the 240-country list gets a
// searchable flag+name+dial-code dropdown instead of an unstyled native list.
// `iconComponent` is the library's own flag renderer, reused as-is.
export function CountrySelect({
  value,
  options,
  onChange,
  onFocus,
  onBlur,
  disabled,
  readOnly,
  iconComponent: Icon,
  name,
  "aria-label": ariaLabel,
}: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [pos, setPos] = useState<{ left: number; top: number; width: number }>({ left: 0, top: 0, width: 0 });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const realOptions = options.filter((o) => !o.divider);
  const selectedOption = realOptions.find((o) => o.value === value);
  const filteredOptions = search.trim()
    ? realOptions.filter((o) => o.label.toLowerCase().includes(search.trim().toLowerCase()))
    : realOptions;
  const isInteractive = !disabled && !readOnly;

  function openDropdown() {
    if (!isInteractive) return;
    setSearch("");
    const idx = realOptions.findIndex((o) => o.value === value);
    setActiveIndex(idx >= 0 ? idx : 0);
    setOpen(true);
  }

  function close() {
    setOpen(false);
    onBlur?.();
  }

  function selectOption(opt: CountryOption) {
    onChange(opt.value);
    setOpen(false);
    triggerRef.current?.focus();
  }

  useEffect(() => {
    setActiveIndex(0);
  }, [search]);

  useEffect(() => {
    if (open) searchInputRef.current?.focus();
  }, [open]);

  // Layout effect so the panel is measured/repositioned before paint —
  // mirrors Select.tsx's fix for the autofocus-on-hidden-element bug.
  useLayoutEffect(() => {
    if (!open) return;

    function positionPanel() {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const panelHeight = panelRef.current?.getBoundingClientRect().height ?? 320;
      const panelWidth = 288;

      let left = rect.left;
      let top = rect.bottom + 4;
      if (left + panelWidth > window.innerWidth - 8) left = Math.max(8, window.innerWidth - panelWidth - 8);
      if (top + panelHeight > window.innerHeight - 8) top = Math.max(8, rect.top - panelHeight - 4);

      setPos({ left, top, width: panelWidth });
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
    <div className="PhoneInputCountry">
      <button
        ref={triggerRef}
        type="button"
        name={name}
        aria-label={ariaLabel ?? "Country"}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={!isInteractive}
        onClick={() => (open ? close() : openDropdown())}
        onFocus={onFocus}
        className={cn(
          "flex h-full items-center gap-1 rounded-sm bg-transparent px-0.5 text-sm text-foreground",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary",
          !isInteractive && "cursor-not-allowed opacity-60",
        )}
      >
        {selectedOption?.value && <Icon country={selectedOption.value} label={selectedOption.label} aria-hidden />}
        <HiOutlineChevronDown
          size={12}
          className={cn("shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>

      {open && createPortal(
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Choose a country"
          style={{ position: "fixed", left: pos.left, top: pos.top, width: pos.width }}
          className="z-50 flex flex-col overflow-hidden rounded border border-border bg-card text-card-foreground shadow-xl"
        >
          <div className="border-b border-border p-2">
            <div className="relative">
              <IoSearchOutline className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
              <input
                ref={searchInputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country or code…"
                className="h-8 w-full rounded border border-transparent bg-[#f8f8fa] pl-7 pr-3 text-sm text-foreground placeholder:text-[#9da3af] transition-colors focus-visible:border-primary/40 focus-visible:bg-background focus-visible:outline-none"
              />
            </div>
          </div>
          <div role="listbox" aria-label={ariaLabel ?? "Country"} className="max-h-72 overflow-y-auto py-1">
            {filteredOptions.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted-foreground">No countries match &quot;{search}&quot;</div>
            )}
            {filteredOptions.map((opt, i) => {
              const selected = opt.value === value;
              return (
                <button
                  key={opt.value ?? "ZZ"}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => selectOption(opt)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm outline-none transition-colors",
                    selected ? "bg-primary/10 text-primary" : "text-foreground",
                    activeIndex === i && !selected && "bg-muted",
                  )}
                >
                  {opt.value && <Icon country={opt.value} label={opt.label} aria-hidden />}
                  <span className="flex-1 truncate">{opt.label}</span>
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
