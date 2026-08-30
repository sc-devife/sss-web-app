import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { Caption } from "@/components/ui/Typography";
import { cn } from "@/lib/cn";

export interface KpiTrend {
  direction: "up" | "down";
  /** Absolute percent change vs the previous period of equal length — always real, never fabricated (see DashboardServiceImpl). */
  percent: number;
}

// A trend arrow only ever appears when the caller passes real
// previous-period data — point-in-time gauges (e.g. "Active Escapes") have
// no meaningful "vs previous period" and simply omit the `trend` prop.
export function KpiCard({
  label,
  value,
  trend,
  icon,
  className,
}: {
  label: string;
  value: ReactNode;
  trend?: KpiTrend | null;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <Card variant="elevated" className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between">
        <Caption>{label}</Caption>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className="text-2xl font-semibold tracking-tight text-foreground">{value}</div>
      {trend && (
        <div className={cn("flex items-center gap-1 text-xs font-medium", trend.direction === "up" ? "text-success" : "text-danger")}>
          <span>{trend.direction === "up" ? "↑" : "↓"}</span>
          <span>{trend.percent.toFixed(1)}%</span>
          <span className="font-normal text-muted-foreground">vs previous period</span>
        </div>
      )}
    </Card>
  );
}
