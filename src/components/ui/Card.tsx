import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type CardVariant = "default" | "elevated" | "page";

// "default" is byte-identical to the original Card so every existing bare
// <Card> is unaffected. "elevated" is the opt-in modern look (rounded-2xl,
// soft shadow, hover lift) — pass it explicitly per call site rather than
// changing the default, since dense/compact usages (dashboard stat tiles,
// list-row cards) aren't designed for that visual weight. "page" is for
// wrapping an entire page's content area (e.g. a list page) — a slightly
// tighter radius than "elevated" and no hover-lift, since a hover effect
// on a whole static page container (triggered by hovering anything inside
// it) doesn't read as intentional the way it does on a single clickable card.
const variantClasses: Record<CardVariant, string> = {
  default: "rounded border border-border bg-card text-card-foreground p-4",
  elevated: "rounded-2xl border border-border bg-card text-card-foreground p-4 shadow-sm transition-all duration-200 hover:shadow-lg",
  page: "rounded-lg border border-border bg-card text-card-foreground p-2 shadow-sm",
};

export function Card({
  children,
  className,
  variant = "default",
}: {
  children: ReactNode;
  className?: string;
  variant?: CardVariant;
}) {
  return <div className={cn(variantClasses[variant], className)}>{children}</div>;
}
