import { Card } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/Spinner";

// The escape detail page is a Server Component that fetches hotels/
// activities/transports/service-providers before it can render anything —
// without this file, clicking a row on /escapes leaves the previous page
// frozen on screen with no feedback until that fetch resolves. Next.js
// automatically wraps page.tsx in a Suspense boundary using this as the
// fallback, shown immediately on navigation.
export default function Loading() {
  return (
    <Card variant="page" className="flex min-h-full flex-col gap-2">
      <LoadingState label="Loading escape…" />
    </Card>
  );
}
