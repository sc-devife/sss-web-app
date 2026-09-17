import { notFound } from "next/navigation";
import { ServiceProviderDetailPanel } from "@/components/library/ServiceProviderDetailPanel";
import { getServiceProviderByUid } from "@/lib/service-providers";
import { getEscapePoints } from "@/lib/escape-points";

export default async function Page({ params }: { params: { uid: string } }) {
  const [provider, escapePoints] = await Promise.all([
    getServiceProviderByUid(params.uid).catch(() => null),
    getEscapePoints(),
  ]);

  if (!provider) {
    notFound();
  }

  return <ServiceProviderDetailPanel provider={provider} escapePoints={escapePoints} />;
}
