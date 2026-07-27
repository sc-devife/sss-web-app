import { Heading, Body } from "@/components/ui/Typography";
import { HotelsPanel } from "@/components/library/HotelsPanel";
import { getHotels } from "@/lib/hotels";
import { getLocations } from "@/lib/locations";
import { getDestinations } from "@/lib/destinations";

export default async function Page() {
  const [hotels, locations, destinations] = await Promise.all([
    getHotels(),
    getLocations(),
    getDestinations(),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <Heading as="h2">Hotels</Heading>
      <Body muted>Your organization&apos;s hotel catalog, reused across itineraries.</Body>
      <HotelsPanel initialHotels={hotels} locations={locations} destinations={destinations} />
    </div>
  );
}
