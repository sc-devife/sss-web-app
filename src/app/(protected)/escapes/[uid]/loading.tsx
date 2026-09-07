import Link from "next/link";
import { FaChevronLeft } from "react-icons/fa";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

// The escape detail page is a Server Component that fetches hotels/
// activities/transports/service-providers before it can render anything —
// without this file, clicking a row on /escapes leaves the previous page
// frozen on screen with no feedback until that fetch resolves. Next.js
// automatically wraps page.tsx in a Suspense boundary using this as the
// fallback, shown immediately on navigation.
//
// Mirrors EscapeDetailPanel's own client-side loading skeleton (same
// two-column layout) so there's no visual jump handing off from this
// server-side fallback to that one once the page hydrates.
export default function Loading() {
  return (
    <Card variant="page" className="flex min-h-full flex-col gap-2">
      <Link
        href="/escapes"
        className="inline-flex w-fit items-center gap-0.5 text-[13px] text-foreground/70 transition-colors hover:text-foreground"
      >
        <FaChevronLeft size={12} className="shrink-0" />
        <span className="font-semibold">Back to Escapes</span>
      </Link>
      <div className="border-t border-border" />
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-[1.2fr_3.4fr]">
        <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex flex-col gap-2 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 rounded" />
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    </Card>
  );
}
