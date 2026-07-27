import { Heading, Body } from "@/components/ui/Typography";
import { ActivitiesPanel } from "@/components/library/ActivitiesPanel";
import { getActivities } from "@/lib/activities";
import { getDestinations } from "@/lib/destinations";

export default async function Page() {
  const [activities, destinations] = await Promise.all([getActivities(), getDestinations()]);

  return (
    <div className="flex flex-col gap-5">
      <Heading as="h2">Activities</Heading>
      <Body muted>Excursions and experiences your organization can include in itineraries.</Body>
      <ActivitiesPanel initialActivities={activities} destinations={destinations} />
    </div>
  );
}
