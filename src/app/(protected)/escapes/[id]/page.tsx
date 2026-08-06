import { EscapeDetailPanel } from "@/components/escapes/EscapeDetailPanel";
import { getHotels } from "@/lib/hotels";
import { getActivities } from "@/lib/activities";
import { getTransports } from "@/lib/transports";

export default async function EscapeDetailPage({ params }: { params: { id: string } }) {
  const escapeId = Number(params.id);
  const [hotels, activities, transports] = await Promise.all([getHotels(), getActivities(), getTransports()]);

  return <EscapeDetailPanel escapeId={escapeId} hotels={hotels} activities={activities} transports={transports} />;
}
