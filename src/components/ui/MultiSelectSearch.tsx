"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IoAdd, IoClose, IoSearchOutline } from "react-icons/io5";
import { cn } from "@/lib/cn";
import { HoverMarqueeText } from "@/components/ui/HoverMarqueeText";
import type { SelectOption } from "@/components/ui/Select";

interface MultiSelectSearchProps {
  label: string;
  /** Small muted line under the label, e.g. "Optional, select one or more". */
  helperText?: string;
  options: SelectOption[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  /**
   * Opt-in "creatable" affordance: when provided, a "+ Add "<query>"" row
   * appears at the bottom of the dropdown once the search text doesn't
   * exactly match an existing option's label. Resolving to an option
   * selects it immediately, same as picking an existing one. Rejecting
   * (thrown error) surfaces its message inline in the panel.
   */
  onCreateOption?: (query: string) => Promise<SelectOption>;
}

// Search-first multi-select: nothing but the search box shows until the user
// focuses/types (unlike MultiSelect.tsx's always-visible checkbox grid,
// which doesn't scale once a library has more than a handful of entries).
// Same portal/positioning/keyboard-nav mechanics as EscapePointSelect.tsx,
// generalized for a multi-value selection that stays open across picks and
// renders selections as removable chips below the field instead of a single
// closed-button value.
export function MultiSelectSearch({
  label,
  helperText,
  options,
  value,
  onChange,
  placeholder = "Search…",
  error,
  disabled,
  className,
  required,
  onCreateOption,
}: MultiSelectSearchProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [pos, setPos] = useState<{ left: number; top: number; width: number }>({ left: 0, top: 0, width: 0 });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | undefined>();

  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const selectedOptions = value.map((v) => options.find((o) => o.value === v)).filter((o): o is SelectOption => !!o);

  const filtered = (search.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(search.trim().toLowerCase()))
    : options
  ).slice(0, 50); // scrollable list stays snappy even against a large library

  function toggle(optValue: string) {
    if (value.includes(optValue)) {
      onChange(value.filter((v) => v !== optValue));
    } else {
      onChange([...value, optValue]);
    }
  }

  function remove(optValue: string) {
    onChange(value.filter((v) => v !== optValue));
  }

  function close() {
    setOpen(false);
    setSearch("");
    setCreateError(undefined);
  }

  const trimmedSearch = search.trim();
  const hasExactMatch = options.some((o) => o.label.toLowerCase() === trimmedSearch.toLowerCase());
  const showCreateRow = !!onCreateOption && trimmedSearch.length > 0 && !hasExactMatch;

  async function handleCreate() {
    if (!onCreateOption || !trimmedSearch || creating) return;
    setCreating(true);
    setCreateError(undefined);
    try {
      const created = await onCreateOption(trimmedSearch);
      onChange([...value, created.value]);
      close();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to add option");
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => {
    setActiveIndex(-1);
    setCreateError(undefined);
  }, [search]);

  useLayoutEffect(() => {
    if (!open) return;

    function positionPanel() {
      const input = inputRef.current;
      if (!input) return;
      const rect = input.getBoundingClientRect();
      const panelHeight = panelRef.current?.getBoundingClientRect().height ?? 260;

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
      if (panelRef.current?.contains(target) || inputRef.current?.contains(target)) return;
      close();
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
        inputRef.current?.blur();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const opt = filtered[activeIndex];
        if (opt) {
          toggle(opt.value);
        } else if (showCreateRow) {
          handleCreate();
        }
      } else if (e.key === "Backspace" && !search && value.length > 0) {
        // Same "backspace pops the last chip" affordance most tag inputs have.
        remove(value[value.length - 1]);
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
  }, [open, filtered, activeIndex, search, value]);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div>
        <span className="text-sm font-medium text-foreground">{label}</span>
        {required && <span className="ml-1 text-danger">*</span>}
        {helperText && <span className="ml-1.5 text-xs text-muted-foreground">{helperText}</span>}
      </div>

      <div className="relative">
        <IoSearchOutline className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
        <input
          ref={inputRef}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          disabled={disabled}
          placeholder={placeholder}
          aria-haspopup="listbox"
          aria-expanded={open}
          required={required}
          className={cn(
            "h-9 w-full rounded border bg-background pl-7 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors",
            "focus:ring-2",
            error ? "border-danger focus:border-danger focus:ring-danger/20" : "border-border focus:border-primary focus:ring-primary/20",
            disabled && "cursor-not-allowed opacity-60",
          )}
        />
      </div>

      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedOptions.map((opt) => (
            <span
              key={opt.value}
              className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 py-1 pl-2.5 pr-1.5 text-xs font-medium text-primary"
            >
              {opt.label}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => remove(opt.value)}
                  aria-label={`Remove ${opt.label}`}
                  className="rounded-full p-0.5 transition-colors hover:bg-primary/20"
                >
                  <IoClose size={12} />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {error && <span className="text-xs text-danger">{error}</span>}

      {open && !disabled && createPortal(
        <div
          ref={panelRef}
          data-floating-panel
          style={{ position: "fixed", left: pos.left, top: pos.top, width: pos.width }}
          className="z-50 flex flex-col overflow-hidden rounded border border-border bg-card text-card-foreground shadow-xl"
        >
          <div role="listbox" aria-label={label} aria-multiselectable className="max-h-60 overflow-y-auto py-1">
            {options.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted-foreground">No options available</div>
            )}
            {options.length > 0 && filtered.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted-foreground">No matches for &quot;{search}&quot;</div>
            )}
            {filtered.map((opt, i) => {
              const isSelected = value.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => toggle(opt.value)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={cn(
                    "flex w-full items-center justify-between px-3 py-2 text-left text-sm outline-none transition-colors",
                    isSelected ? "bg-primary/10 text-primary" : "text-foreground",
                    activeIndex === i && !isSelected && "bg-muted",
                  )}
                >
                  <HoverMarqueeText className="truncate">{opt.label}</HoverMarqueeText>
                  {isSelected && <span className="text-xs font-medium">Selected</span>}
                </button>
              );
            })}
          </div>
          {showCreateRow && (
            <div className="border-t border-border p-1">
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left text-sm text-primary transition-colors hover:bg-primary/10 disabled:cursor-wait disabled:opacity-60"
              >
                <IoAdd size={14} />
                <HoverMarqueeText className="truncate">
                  {creating ? "Adding…" : `Add "${trimmedSearch}"`}
                </HoverMarqueeText>
              </button>
              {createError && <p className="px-2 pb-1 text-xs text-danger">{createError}</p>}
            </div>
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}
