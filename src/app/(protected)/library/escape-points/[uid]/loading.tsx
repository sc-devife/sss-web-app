import { DetailHeroSkeleton } from "@/components/library/DetailHeroSkeleton";

// This page is a Server Component that fetches the escape point, its
// sibling escape points, and locations before it can render anything —
// without this file, clicking a row on /library/escape-points leaves the
// previous page frozen with no feedback until that fetch resolves.
// EscapePointDetailPanel has no tab bar (unlike Hotel/Activity), so this
// skips that part of the shared skeleton.
export default function Loading() {
  return (
    <DetailHeroSkeleton backHref="/library/escape-points" backLabel="Back to Escape Points" statCount={2} showTabs={false} />
  );
}
