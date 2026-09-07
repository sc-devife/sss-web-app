import Link from "next/link";
import { FaChevronLeft } from "react-icons/fa6";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

// Shared by the Hotel/Activity/EscapePoint detail routes' loading.tsx
// fallbacks — all three panels share the same hero-image + stat-grid +
// tabs layout (see HotelDetailPanel/ActivityDetailPanel/
// EscapePointDetailPanel), so this is the one place that shape is defined
// instead of duplicating it per route.
export function DetailHeroSkeleton({
  backHref,
  backLabel,
  statCount = 4,
  showTabs = true,
}: {
  backHref: string;
  backLabel: string;
  statCount?: number;
  showTabs?: boolean;
}) {
  return (
    <Card variant="page" className="flex min-h-full flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={backHref}
          className="inline-flex w-fit items-center gap-0.5 text-[13px] text-foreground/70 transition-colors hover:text-foreground"
        >
          <FaChevronLeft size={12} className="shrink-0" />
          <span className="font-semibold">{backLabel}</span>
        </Link>
        <Skeleton className="h-8 w-28 rounded" />
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-border">
        <Skeleton className="h-64 w-full rounded-none md:h-80" />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: statCount }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-background p-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-2 h-4 w-20" />
          </div>
        ))}
      </div>

      {showTabs && (
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 rounded" />
            ))}
          </div>
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      )}
    </Card>
  );
}
