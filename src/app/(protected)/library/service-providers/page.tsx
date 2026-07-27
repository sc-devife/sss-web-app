import { Heading, Body } from "@/components/ui/Typography";
import { ServiceProvidersPanel } from "@/components/library/ServiceProvidersPanel";
import { getServiceProviders } from "@/lib/service-providers";

export default async function Page() {
  const providers = await getServiceProviders();

  return (
    <div className="flex flex-col gap-5">
      <Heading as="h2">Service Providers</Heading>
      <Body muted>Transport, activity, and guide providers your organization works with.</Body>
      <ServiceProvidersPanel initialProviders={providers} />
    </div>
  );
}
