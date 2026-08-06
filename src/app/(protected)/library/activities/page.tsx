import { ActivitiesPanel } from "@/components/library/ActivitiesPanel";
import { getEscapePoints } from "@/lib/escape-points";

export default async function Page() {
  const escapePoints = await getEscapePoints();

  return (
    <div className="flex flex-col gap-5">
      <ActivitiesPanel escapePoints={escapePoints} />
    </div>
  );
}
