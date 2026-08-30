import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Heading, Body } from "@/components/ui/Typography";
import { cn } from "@/lib/cn";

// Shared shell for every dashboard chart — title/subtitle/optional
// header-right slot (e.g. a period selector), a centered empty state when
// there's genuinely no data (matching the app's existing centered-empty-
// state convention), and an `isDummy` flag for any future section that ends
// up needing clearly-labelled sample data (unused by the sections shipped
// today — every one of them is backed by real aggregated data).
export function ChartCard({
  title,
  subtitle,
  headerRight,
  isDummy,
  isEmpty,
  emptyMessage = "No data yet.",
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  headerRight?: ReactNode;
  isDummy?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card variant="elevated" className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Heading as="h4">{title}</Heading>
            {isDummy && <Badge tone="warning">Sample Data</Badge>}
          </div>
          {subtitle && <Body muted className="mt-0.5 text-xs">{subtitle}</Body>}
        </div>
        {headerRight}
      </div>
      {isEmpty ? (
        <div className="flex min-h-[160px] items-center justify-center text-center">
          <Body muted>{emptyMessage}</Body>
        </div>
      ) : (
        children
      )}
    </Card>
  );
}
