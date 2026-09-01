import { Card } from "@/components/ui/Card";
import { HotelsPanel } from "@/components/library/HotelsPanel";
import { getLocations } from "@/lib/locations";
import { getEscapePoints } from "@/lib/escape-points";
import { getMealPlans } from "@/lib/meal-plans";
import { getRoomTypes } from "@/lib/room-types";
import { getServices } from "@/lib/services";

export default async function Page() {
  const [locations, escapePoints, mealPlans, roomTypes, services] = await Promise.all([
    getLocations(),
    getEscapePoints(),
    getMealPlans(),
    getRoomTypes(),
    getServices(),
  ]);

  return (
    <Card variant="page" className="flex min-h-full flex-col gap-5">
      <HotelsPanel
        locations={locations}
        escapePoints={escapePoints}
        mealPlans={mealPlans}
        roomTypes={roomTypes}
        services={services}
      />
    </Card>
  );
}
