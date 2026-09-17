import { notFound } from "next/navigation";
import { ServiceProviderDetailPanel } from "@/components/library/ServiceProviderDetailPanel";
import { getServiceProviderByUid } from "@/lib/service-providers";
import { getEscapePoints } from "@/lib/escape-points";
import { getTransportsByProvider } from "@/lib/transports";

export default async function Page({ params }: { params: { uid: string } }) {
  const [provider, escapePoints] = await Promise.all([
    getServiceProviderByUid(params.uid).catch(() => null),
    getEscapePoints(),
  ]);

  if (!provider) {
    notFound();
  }

  // Only relevant for a Transport-type provider — Activity/Guide/Other
  // providers never have vehicles linked to them (see TransportPanel).
  const vehicles = provider.typeCode === "transport" ? await getTransportsByProvider(provider.uid).catch(() => []) : [];

  return <ServiceProviderDetailPanel provider={provider} escapePoints={escapePoints} vehicles={vehicles} />;
}
