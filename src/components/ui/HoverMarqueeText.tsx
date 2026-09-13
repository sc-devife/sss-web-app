"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/cn";

// Tuned for "comfortable reading speed" per the design brief, not raw scroll
// speed — slow enough to actually read while still feeling responsive.
const HOVER_DELAY_MS = 380;
const PX_PER_SECOND = 45;
const MIN_DURATION_S = 2.2;
const MAX_DURATION_S = 14;
// The keyframes below (see globals.css's `app-marquee`) spend ~70% of the
// cycle actually moving and the rest paused at each end — this back-solves
// the total cycle duration so the *moving* portion still runs at
// PX_PER_SECOND regardless of how the pauses are weighted.
const MOVING_FRACTION = 0.7;

interface HoverMarqueeTextProps {
  /** Plain-text content. Ignored if `children` is given. */
  text?: ReactNode;
  children?: ReactNode;
  /** Element for the outer, width-constrained box — pass whatever tag the
   * call site used before (defaults to "span"). This element must already
   * carry the truncation classes (`truncate`, `overflow-hidden`, a
   * max-width, etc.) exactly as it did before adopting this component —
   * this component adds hover-marquee *behavior*, not truncation styling,
   * so nothing about the caller's existing width/layout/responsive classes
   * needs to change. */
  as?: ElementType;
  className?: string;
}

// Drop-in replacement for `<span className="truncate ...">{text}</span>`
// (and its div/h1/p variants) that reveals the hidden tail of truncated text
// via a right-to-left hover marquee, mirroring the ChatGPT sidebar's
// conversation-title hover behavior — instead of every page hand-rolling its
// own overflow-detection + animation logic, this is the one place that does.
//
// Overflow is measured by comparing the inner content span's natural
// (unwrapped) width against the outer box's clientWidth; the marquee is
// wired up only when that content genuinely overflows, so a value that
// already fits never animates on hover (a plain truncate span, functionally).
export function HoverMarqueeText({ text, children, as: Tag = "span", className }: HoverMarqueeTextProps) {
  const outerRef = useRef<HTMLElement | null>(null);
  const innerRef = useRef<HTMLSpanElement | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [distance, setDistance] = useState(0);
  const [durationS, setDurationS] = useState(MIN_DURATION_S);

  const content = children ?? text;

  useLayoutEffect(() => {
    measure();
    // Re-measure whenever the rendered content changes (e.g. dynamic data
    // arriving after an API fetch resolves) — not just on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  useEffect(() => {
    const outer = outerRef.current;
    if (!outer || typeof ResizeObserver === "undefined") return;
    // Covers both the container shrinking/growing (responsive layouts,
    // sidebar collapse, column resize) and the content's own natural width
    // changing (e.g. a font finishing its load).
    const ro = new ResizeObserver(() => measure());
    ro.observe(outer);
    if (innerRef.current) ro.observe(innerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
    };
  }, []);

  function measure() {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    const overflow = inner.scrollWidth - outer.clientWidth;
    // Small epsilon — subpixel layout rounding shouldn't flip this on/off.
    const overflowing = overflow > 1;
    setIsOverflowing(overflowing);
    const clamped = Math.max(0, overflow);
    setDistance(clamped);
    setDurationS(
      clamped <= 0
        ? MIN_DURATION_S
        : Math.min(MAX_DURATION_S, Math.max(MIN_DURATION_S, (2 * (clamped / PX_PER_SECOND)) / MOVING_FRACTION)),
    );
  }

  function prefersReducedMotion() {
    return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  }

  function handleMouseEnter() {
    if (!isOverflowing || prefersReducedMotion()) return;
    hoverTimer.current = setTimeout(() => setIsAnimating(true), HOVER_DELAY_MS);
  }

  function handleMouseLeave() {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    // Removing the animation immediately snaps the transform back to its
    // resting translateX(0) — no separate "reset" step needed.
    setIsAnimating(false);
  }

  const innerStyle: CSSProperties | undefined = isAnimating
    ? ({ "--marquee-distance": `-${distance}px`, animationDuration: `${durationS}s` } as CSSProperties)
    : undefined;

  return (
    <Tag
      ref={outerRef}
      className={className}
      // Beats the (already-present) `truncate` utility's `text-overflow:
      // ellipsis` only while animating — otherwise the ellipsis glyph gets
      // baked into the line at layout time and would slide along with the
      // text instead of disappearing once the hidden tail is revealed.
      style={{ textOverflow: isAnimating ? "clip" : undefined }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span
        ref={innerRef}
        className={cn("inline-block max-w-full align-bottom", isAnimating && "app-marquee-run")}
        style={innerStyle}
      >
        {content}
      </span>
    </Tag>
  );
}
