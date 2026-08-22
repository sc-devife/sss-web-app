import { Card } from "@/components/ui/Card";
import { HotelsPanel } from "@/components/library/HotelsPanel";
import { getLocations } from "@/lib/locations";
import { getEscapePoints } from "@/lib/escape-points";
import { getMealPlans } from "@/lib/meal-plans";
import { getRoomTypes } from "@/lib/room-types";

export default async function Page() {
  const [locations, escapePoints, mealPlans, roomTypes] = await Promise.all([
    getLocations(),
    getEscapePoints(),
    getMealPlans(),
    getRoomTypes(),
  ]);

  return (
    <Card variant="page" className="flex min-h-full flex-col gap-5">
      <HotelsPanel locations={locations} escapePoints={escapePoints} mealPlans={mealPlans} roomTypes={roomTypes} />
    </Card>
  );
}
