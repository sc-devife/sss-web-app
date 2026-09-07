import { DetailHeroSkeleton } from "@/components/library/DetailHeroSkeleton";

// This page is a Server Component that fetches the hotel, locations,
// escape points, meal plans, room types, and services before it can render
// anything — without this file, clicking a row on /library/hotels leaves
// the previous page frozen with no feedback until that fetch resolves.
export default function Loading() {
  return <DetailHeroSkeleton backHref="/library/hotels" backLabel="Back to Hotels" statCount={4} />;
}
