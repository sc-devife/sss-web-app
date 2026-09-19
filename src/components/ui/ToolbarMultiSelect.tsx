"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HiOutlineChevronDown } from "react-icons/hi";
import { IoCheckmark, IoSearchOutline } from "react-icons/io5";
import { cn } from "@/lib/cn";
import type { SelectOption } from "@/components/ui/Select";

interface ToolbarMultiSelectProps {
  /** Prefix shown before the current value, e.g. "Role" -> "Role: Default". */
  label: string;
  options: SelectOption[];
  /** Selected option values; empty means "no filter" (shown as `placeholder`). */
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  className?: string;
  /** Adds a search box at the top of the panel, for long option lists. */
  searchable?: boolean;
  searchPlaceholder?: string;
}

// Multi-select sibling of ToolbarSelect: the same compact "Label: Value ▾"
// pill and portal-positioned panel, but the panel stays open while options are
// toggled and each row carries a checkbox. An empty selection is the "no
// filter" state, so the trigger reads the placeholder ("Default").
export function ToolbarMultiSelect({
  label,
  options,
  value,
  onChange,
  placeholder = "Default",
  className,
  searchable,
  searchPlaceholder = "Search…",
}: ToolbarMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number; width: number }>({ left: 0, top: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const selectedOptions = options.filter((o) => value.includes(o.value));
  const summary =
    selectedOptions.length === 0
      ? placeholder
      : selectedOptions.length === 1
        ? selectedOptions[0].label
        : `${selectedOptions.length} selected`;

  const query = search.trim().toLowerCase();
  const visibleOptions = searchable && query ? options.filter((o) => o.label.toLowerCase().includes(query)) : options;

  function toggle(optValue: string) {
    onChange(value.includes(optValue) ? value.filter((v) => v !== optValue) : [...value, optValue]);
  }

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
  }, [open, value, search]);

  useEffect(() => {
    if (open && searchable) searchInputRef.current?.focus();
  }, [open, searchable]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    const close = () => setOpen(false);
    document.addEventListener("mousedown", handlePointerDown, true);
    document.addEventListener("keydown", handleKey, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKey, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  return (
    <div className={className}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setSearch("");
          setOpen((o) => !o);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex h-8 items-center gap-1 rounded-full border border-transparent bg-[#f8f8fa] px-3 text-sm text-foreground transition-colors",
          "hover:border-primary/30 focus-visible:border-primary/40 focus-visible:outline-none",
        )}
      >
        <span className="text-muted-foreground">{label}:</span>
        <span className="font-medium">{summary}</span>
        <HiOutlineChevronDown size={13} className={cn("shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open &&
        createPortal(
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
            <div role="listbox" aria-label={label} aria-multiselectable="true" className="max-h-72 overflow-y-auto py-1">
              {visibleOptions.map((opt) => {
                const checked = value.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={checked}
                    onClick={() => toggle(opt.value)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground outline-none transition-colors hover:bg-muted focus-visible:bg-muted"
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                        checked ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background",
                      )}
                    >
                      {checked && <IoCheckmark size={12} />}
                    </span>
                    {opt.label}
                  </button>
                );
              })}
              {options.length === 0 && <div className="px-3 py-2 text-sm text-muted-foreground">No options available.</div>}
              {options.length > 0 && visibleOptions.length === 0 && (
                <div className="px-3 py-2 text-sm text-muted-foreground">No matches for &quot;{search}&quot;</div>
              )}
            </div>
            {value.length > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="border-t border-border px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Clear ({value.length})
              </button>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
