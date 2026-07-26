import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface HeadingProps {
  as?: "h1" | "h2" | "h3" | "h4";
  children: ReactNode;
  className?: string;
}

const headingSizes: Record<NonNullable<HeadingProps["as"]>, string> = {
  h1: "text-2xl font-semibold tracking-tight",
  h2: "text-xl font-semibold tracking-tight",
  h3: "text-lg font-semibold",
  h4: "text-base font-semibold",
};

export function Heading({ as = "h2", children, className }: HeadingProps) {
  const Tag: ElementType = as;
  return <Tag className={cn(headingSizes[as], "text-foreground", className)}>{children}</Tag>;
}

interface BodyProps {
  children: ReactNode;
  className?: string;
  muted?: boolean;
}

export function Body({ children, className, muted }: BodyProps) {
  return (
    <p className={cn("text-sm leading-relaxed", muted ? "text-muted-foreground" : "text-foreground", className)}>
      {children}
    </p>
  );
}

export function Caption({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("text-xs uppercase tracking-wide text-muted-foreground", className)}>{children}</span>
  );
}
