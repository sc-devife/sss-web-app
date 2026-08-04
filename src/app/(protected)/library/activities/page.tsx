import { Heading, Body } from "@/components/ui/Typography";
import { ActivitiesPanel } from "@/components/library/ActivitiesPanel";
import { getDestinations } from "@/lib/destinations";

export default async function Page() {
  const destinations = await getDestinations();

  return (
    <div className="flex flex-col gap-5">
      <ActivitiesPanel destinations={destinations} />
    </div>
  );
}
