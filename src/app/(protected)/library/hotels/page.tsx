import { Heading, Body } from "@/components/ui/Typography";
import { HotelsPanel } from "@/components/library/HotelsPanel";
import { getLocations } from "@/lib/locations";
import { getDestinations } from "@/lib/destinations";

export default async function Page() {
  const [locations, destinations] = await Promise.all([getLocations(), getDestinations()]);

  return (
    <div className="flex flex-col gap-5">
      <HotelsPanel locations={locations} destinations={destinations} />
    </div>
  );
}
