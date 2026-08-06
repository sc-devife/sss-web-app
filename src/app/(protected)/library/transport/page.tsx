import { TransportPanel } from "@/components/library/TransportPanel";
import { getServiceProviders } from "@/lib/service-providers";
import { getEscapePoints } from "@/lib/escape-points";

export default async function Page() {
  const [providers, escapePoints] = await Promise.all([getServiceProviders(), getEscapePoints()]);

  return (
    <div className="flex flex-col gap-5">
      <TransportPanel providers={providers} escapePoints={escapePoints} />
    </div>
  );
}
