import { DetailHeroSkeleton } from "@/components/library/DetailHeroSkeleton";

// This page is a Server Component that fetches the activity and escape
// points before it can render anything — without this file, clicking a row
// on /library/activities leaves the previous page frozen with no feedback
// until that fetch resolves.
export default function Loading() {
  return <DetailHeroSkeleton backHref="/library/activities" backLabel="Back to Activities" statCount={4} />;
}
