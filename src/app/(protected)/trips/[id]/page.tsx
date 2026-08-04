import { TripDetailPanel } from "@/components/trips/TripDetailPanel";
import { getHotels } from "@/lib/hotels";
import { getActivities } from "@/lib/activities";
import { getTransports } from "@/lib/transports";

export default async function TripDetailPage({ params }: { params: { id: string } }) {
  const tripId = Number(params.id);
  const [hotels, activities, transports] = await Promise.all([getHotels(), getActivities(), getTransports()]);

  return <TripDetailPanel tripId={tripId} hotels={hotels} activities={activities} transports={transports} />;
}
