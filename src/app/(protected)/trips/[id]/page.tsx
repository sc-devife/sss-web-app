import { Heading, Body } from "@/components/ui/Typography";
import { TripDetailPanel } from "@/components/trips/TripDetailPanel";
import { getTripById } from "@/lib/trips";
import { getItinerariesForTrip } from "@/lib/itineraries";
import { getHotels } from "@/lib/hotels";
import { getActivities } from "@/lib/activities";
import { getTransports } from "@/lib/transports";

export default async function TripDetailPage({ params }: { params: { id: string } }) {
  const tripId = Number(params.id);
  const [trip, itineraries, hotels, activities, transports] = await Promise.all([
    getTripById(tripId),
    getItinerariesForTrip(tripId),
    getHotels(),
    getActivities(),
    getTransports(),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <Heading as="h2">{trip.lead?.name ?? `Trip #${trip.seqp}`}</Heading>
      <Body muted>{trip.destinations.map((d) => d.name).join(", ") || "No destinations set"}</Body>
      <TripDetailPanel
        trip={trip}
        initialItineraries={itineraries}
        hotels={hotels}
        activities={activities}
        transports={transports}
      />
    </div>
  );
}
