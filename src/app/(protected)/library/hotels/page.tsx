import { Card } from "@/components/ui/Card";
import { HotelsPanel } from "@/components/library/HotelsPanel";
import { getLocations } from "@/lib/locations";
import { getEscapePoints } from "@/lib/escape-points";

export default async function Page() {
  const [locations, escapePoints] = await Promise.all([getLocations(), getEscapePoints()]);

  return (
    <Card variant="page" className="flex min-h-full flex-col gap-5">
      <HotelsPanel locations={locations} escapePoints={escapePoints} />
    </Card>
  );
}
