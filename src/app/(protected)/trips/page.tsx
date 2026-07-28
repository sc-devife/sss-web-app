import { Heading, Body } from "@/components/ui/Typography";
import { TripsPanel } from "@/components/trips/TripsPanel";
import { getTrips } from "@/lib/trips";

export default async function Page() {
  const trips = await getTrips();

  return (
    <div className="flex flex-col gap-5">
      <Heading as="h2">Trips</Heading>
      <Body muted>Converted leads, from itinerary planning through to completion.</Body>
      <TripsPanel initialTrips={trips} />
    </div>
  );
}
