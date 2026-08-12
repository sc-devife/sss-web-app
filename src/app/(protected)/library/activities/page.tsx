import { Card } from "@/components/ui/Card";
import { ActivitiesPanel } from "@/components/library/ActivitiesPanel";
import { getEscapePoints } from "@/lib/escape-points";

export default async function Page() {
  const escapePoints = await getEscapePoints();

  return (
    <Card variant="page" className="flex min-h-full flex-col gap-5">
      <ActivitiesPanel escapePoints={escapePoints} />
    </Card>
  );
}
