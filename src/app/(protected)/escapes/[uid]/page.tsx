import { EscapeDetailPanel } from "@/components/escapes/EscapeDetailPanel";
import { getHotels } from "@/lib/hotels";
import { getActivities } from "@/lib/activities";
import { getTransports } from "@/lib/transports";
import { getServiceProviders } from "@/lib/service-providers";

export default async function EscapeDetailPage({ params }: { params: { uid: string } }) {
  const [hotels, activities, transports, serviceProviders] = await Promise.all([
    getHotels(),
    getActivities(),
    getTransports(),
    getServiceProviders(),
  ]);

  return (
    <EscapeDetailPanel
      escapeUid={params.uid}
      hotels={hotels}
      activities={activities}
      transports={transports}
      serviceProviders={serviceProviders}
    />
  );
}
