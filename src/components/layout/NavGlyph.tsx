"use client";

import { useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/cn";

// Fraction of the box a glyph's √area should occupy.
const GLYPH_FILL = 0.82;

type NavIcon = React.ComponentType<{ className?: string }>;

// Renders a sidebar icon so every glyph reads as the same size, whatever
// icon family or shape it comes from. react-icons families pad their glyphs
// differently inside the viewBox (Bootstrap fills it edge to edge, Phosphor
// leaves ~12% margin, a squares-grid is far smaller than a handshake), so an
// identical `h-x w-x` still looks larger or smaller per icon. After mount we
// re-fit each svg's viewBox to a centered square around the glyph's real
// bounding box so every glyph carries about the same visual weight.
export function NavGlyph({ Icon, className }: { Icon: NavIcon; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const svg = ref.current?.querySelector("svg");
    if (!svg) return;
    let x1 = Infinity;
    let y1 = Infinity;
    let x2 = -Infinity;
    let y2 = -Infinity;
    for (const child of Array.from(svg.children)) {
      try {
        const b = (child as SVGGraphicsElement).getBBox();
        if (b.width === 0 && b.height === 0) continue;
        x1 = Math.min(x1, b.x);
        y1 = Math.min(y1, b.y);
        x2 = Math.max(x2, b.x + b.width);
        y2 = Math.max(y2, b.y + b.height);
      } catch {
        // getBBox throws on non-rendered nodes — leave the default viewBox.
      }
    }
    const w = x2 - x1;
    const h = y2 - y1;
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return;
    // Size by visual weight (√area), not the longest side: fitting the longest
    // side alone makes wide glyphs (handshake) look small and round/solid ones
    // (power, grid) look big. Wide glyphs are still clamped to the box.
    const side = Math.max(w, h, Math.sqrt(w * h) / GLYPH_FILL);
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    svg.setAttribute("viewBox", `${cx - side / 2} ${cy - side / 2} ${side} ${side}`);
  }, [Icon]);

  return (
    <span ref={ref} className={cn("inline-flex shrink-0 items-center justify-center", className)}>
      <Icon className="size-full" aria-hidden="true" />
    </span>
  );
}
