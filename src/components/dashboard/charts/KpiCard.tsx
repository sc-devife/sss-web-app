import type { ComponentType, ReactNode } from "react";
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
  categoryIcon: CategoryIcon,
  className,
}: {
  label: string;
  value: ReactNode;
  trend?: KpiTrend | null;
  icon?: ReactNode;
  categoryIcon?: ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <Card
      variant="elevated"
      className={cn(
        "flex gap-3 rounded-lg border border-border/50 p-2",
        className
      )}
    >
      {/* Icon */}
      {CategoryIcon && (
        <div className="flex shrink-0 items-center justify-center self-center rounded-lg bg-primary/10 p-2 text-primary">
          <CategoryIcon className="h-7 w-7" />
        </div>
      )}

      {/* Label + Value */}
      <div className="flex flex-1 flex-col justify-center">
        <div className="flex items-center justify-between">
          <Caption>{label}</Caption>
          {icon && (
            <div className="text-muted-foreground">
              {icon}
            </div>
          )}
        </div>

        <div className="text-2xl font-semibold tracking-tight text-foreground">
          {value}
        </div>

        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium",
              trend.direction === "up"
                ? "text-success"
                : "text-danger"
            )}
          >
            <span>{trend.direction === "up" ? "↑" : "↓"}</span>
            <span>{trend.percent.toFixed(1)}%</span>
            <span className="font-normal text-muted-foreground">
              vs previous period
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
