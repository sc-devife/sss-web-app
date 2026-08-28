import { Card } from "@/components/ui/Card";
import { EscapePointsPanel } from "@/components/library/EscapePointsPanel";
import { getLocations } from "@/lib/locations";

export default async function Page() {
  const locations = await getLocations();

  return (
    <Card variant="page" className="flex min-h-full flex-col gap-5">
      <EscapePointsPanel locations={locations} />
    </Card>
  );
}
