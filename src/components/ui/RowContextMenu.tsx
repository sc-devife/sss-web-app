"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

export interface RowMenuAction {
  key: string;
  label: string;
  onSelect: () => void;
  tone?: "default" | "danger";
  disabled?: boolean;
}

// Custom right-click menu for DataTable rows — positioned at the cursor,
// clamped to the viewport, closes on outside click/right-click, Escape, or
// scroll. Deliberately data-driven (a list of {label, onSelect}) rather than
// taking arbitrary JSX so DataTable can decide up front whether any actions
// exist at all and skip rendering (and skip preventDefault-ing the native
// menu) when they don't.
export function RowContextMenu({
  x,
  y,
  label,
  actions,
  onClose,
}: {
  x: number;
  y: number;
  label?: string;
  actions: RowMenuAction[];
  onClose: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x, top: y, ready: false });
  const [activeIndex, setActiveIndex] = useState(0);

  // Measure after mount so the menu can be flipped/clamped to stay inside
  // the viewport instead of spilling off the right/bottom edge.
  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const rect = menu.getBoundingClientRect();
    const maxLeft = Math.max(8, window.innerWidth - rect.width - 8);
    const maxTop = Math.max(8, window.innerHeight - rect.height - 8);
    setPos({ left: Math.min(x, maxLeft), top: Math.min(y, maxTop), ready: true });
    menu.querySelector<HTMLButtonElement>('[data-index="0"]')?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [x, y]);

  useEffect(() => {
    function isOutside(target: EventTarget | null) {
      return !menuRef.current || !menuRef.current.contains(target as Node);
    }
    function handlePointerDown(e: MouseEvent) {
      if (isOutside(e.target)) onClose();
    }
    function handleContextMenu(e: MouseEvent) {
      if (isOutside(e.target)) onClose();
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, actions.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" || e.key === " ") {
        const action = actions[activeIndex];
        if (action && !action.disabled) {
          e.preventDefault();
          action.onSelect();
          onClose();
        }
      }
    }
    function handleViewportChange() {
      onClose();
    }
    // Capture phase: run before a fresh contextmenu/mousedown on some other
    // row gets a chance to open a new menu, so switching targets doesn't
    // leave two menus mounted.
    document.addEventListener("mousedown", handlePointerDown, true);
    document.addEventListener("contextmenu", handleContextMenu, true);
    document.addEventListener("keydown", handleKey, true);
    window.addEventListener("scroll", handleViewportChange, true);
    window.addEventListener("resize", handleViewportChange);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown, true);
      document.removeEventListener("contextmenu", handleContextMenu, true);
      document.removeEventListener("keydown", handleKey, true);
      window.removeEventListener("scroll", handleViewportChange, true);
      window.removeEventListener("resize", handleViewportChange);
    };
  }, [onClose, actions, activeIndex]);

  useEffect(() => {
    menuRef.current?.querySelector<HTMLButtonElement>(`[data-index="${activeIndex}"]`)?.focus();
  }, [activeIndex]);

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      aria-label={label ?? "Row actions"}
      style={{ position: "fixed", left: pos.left, top: pos.top, visibility: pos.ready ? "visible" : "hidden" }}
      className="z-50 min-w-[170px] overflow-hidden rounded border border-border bg-card py-1 text-card-foreground shadow-lg"
    >
      {label && (
        <div className="truncate border-b border-border px-3 py-1.5 text-xs font-medium text-muted-foreground">
          {label}
        </div>
      )}
      {actions.map((action, i) => (
        <button
          key={action.key}
          type="button"
          role="menuitem"
          data-index={i}
          disabled={action.disabled}
          onClick={() => {
            action.onSelect();
            onClose();
          }}
          onMouseEnter={() => setActiveIndex(i)}
          className={cn(
            "flex w-full items-center px-3 py-2 text-left text-sm outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50",
            action.tone === "danger"
              ? "text-danger hover:bg-danger/10 focus:bg-danger/10"
              : "text-foreground hover:bg-muted focus:bg-muted",
          )}
        >
          {action.label}
        </button>
      ))}
    </div>,
    document.body,
  );
}
