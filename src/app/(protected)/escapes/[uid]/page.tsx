import { EscapeDetailPanel } from "@/components/escapes/EscapeDetailPanel";
import { getHotels } from "@/lib/hotels";
import { getActivities } from "@/lib/activities";
import { getTransports } from "@/lib/transports";

export default async function EscapeDetailPage({ params }: { params: { uid: string } }) {
  const [hotels, activities, transports] = await Promise.all([getHotels(), getActivities(), getTransports()]);

  return <EscapeDetailPanel escapeUid={params.uid} hotels={hotels} activities={activities} transports={transports} />;
}
