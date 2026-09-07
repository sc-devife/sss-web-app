import Link from "next/link";
import { FaChevronLeft } from "react-icons/fa6";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

// This page is a Server Component that fetches the lead + escape points
// before it can render anything — without this file, clicking a row on
// /leads leaves the previous page frozen with no feedback until that fetch
// resolves. Next.js automatically wraps page.tsx in a Suspense boundary
// using this as the fallback, shown immediately on navigation.
//
// Mirrors LeadDetailPanel's real layout (header block, stat grid, history)
// so there's no visual jump once the page hydrates with real data.
export default function Loading() {
  return (
    <Card variant="page" className="flex min-h-full flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/leads"
          className="inline-flex w-fit items-center gap-0.5 text-[13px] text-foreground/70 transition-colors hover:text-foreground"
        >
          <FaChevronLeft size={12} className="shrink-0" />
          <span className="font-semibold">Back to Leads</span>
        </Link>
        <Skeleton className="h-8 w-24 rounded" />
      </div>

      <div className="rounded-2xl border border-border bg-muted/20 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-background p-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-2 h-4 w-20" />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-muted/20 p-4">
        <Skeleton className="h-3 w-16" />
        <div className="mt-3 flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-16 shrink-0" />
              <Skeleton className="h-5 w-5 shrink-0 rounded-full" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
