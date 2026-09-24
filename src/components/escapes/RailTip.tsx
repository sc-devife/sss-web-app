"use client";

import { useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

// Hover/focus tooltip for the collapsed summary rail's icon widgets. Rendered
// in a portal at fixed coordinates beside the widget so the card's own
// overflow can never clip it. `content` can be text or richer markup (the
// cover-image widget passes the picture itself).
export function RailTip({
  label,
  content,
  children,
  side = "right",
}: {
  label: string;
  content: ReactNode;
  children: ReactNode;
  /** Which side of the widget the tooltip opens on (a right-docked rail opens it to the left). */
  side?: "right" | "left";
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ left?: number; right?: number; top: number } | null>(null);

  function show() {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const top = rect.top + rect.height / 2;
    setPos(side === "right" ? { left: rect.right + 10, top } : { right: window.innerWidth - rect.left + 10, top });
  }

  return (
    <span
      ref={ref}
      tabIndex={0}
      role="img"
      aria-label={label}
      onMouseEnter={show}
      onMouseLeave={() => setPos(null)}
      onFocus={show}
      onBlur={() => setPos(null)}
      className="flex outline-none"
    >
      {children}
      {pos &&
        createPortal(
          <div
            role="tooltip"
            style={{ position: "fixed", left: pos.left, right: pos.right, top: pos.top, transform: "translateY(-50%)" }}
            className="pointer-events-none z-50 max-w-xs rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground shadow-xl"
          >
            {content}
          </div>,
          document.body,
        )}
    </span>
  );
}
