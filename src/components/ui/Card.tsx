import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded border border-border bg-card text-card-foreground p-4", className)}>
      {children}
    </div>
  );
}
