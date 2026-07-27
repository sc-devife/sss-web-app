import { Heading, Body } from "@/components/ui/Typography";
import { TransportPanel } from "@/components/library/TransportPanel";
import { getTransports } from "@/lib/transports";
import { getServiceProviders } from "@/lib/service-providers";

export default async function Page() {
  const [transports, providers] = await Promise.all([getTransports(), getServiceProviders()]);

  return (
    <div className="flex flex-col gap-5">
      <Heading as="h2">Transport</Heading>
      <Body muted>Vehicles and transport options your organization can include in itineraries.</Body>
      <TransportPanel initialTransports={transports} providers={providers} />
    </div>
  );
}
