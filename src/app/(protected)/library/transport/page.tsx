import { Heading, Body } from "@/components/ui/Typography";
import { TransportPanel } from "@/components/library/TransportPanel";
import { getServiceProviders } from "@/lib/service-providers";
import { getDestinations } from "@/lib/destinations";

export default async function Page() {
  const [providers, destinations] = await Promise.all([getServiceProviders(), getDestinations()]);

  return (
    <div className="flex flex-col gap-5">
      <TransportPanel providers={providers} destinations={destinations} />
    </div>
  );
}
