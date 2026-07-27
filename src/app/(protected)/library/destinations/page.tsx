import { Heading, Body } from "@/components/ui/Typography";
import { DestinationsPanel } from "@/components/library/DestinationsPanel";
import { getDestinations } from "@/lib/destinations";

export default async function Page() {
  const destinations = await getDestinations();

  return (
    <div className="flex flex-col gap-5">
      <Heading as="h2">Destinations</Heading>
      <Body muted>Your organization&apos;s destination catalog, reused across hotels, activities, and itineraries.</Body>
      <DestinationsPanel initialDestinations={destinations} />
    </div>
  );
}
