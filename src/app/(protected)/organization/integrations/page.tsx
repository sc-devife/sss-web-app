import { Heading, Body } from "@/components/ui/Typography";
import { IntegrationsPanel } from "@/components/integrations/IntegrationsPanel";
import { getIntegrations } from "@/lib/integrations";
import { getMyOrganization } from "@/lib/organization";

export default async function Page() {
  const [integrations, org] = await Promise.all([getIntegrations(), getMyOrganization()]);

  return (
    <div className="flex flex-col gap-5">
      <Heading as="h2">Integrations</Heading>
      <Body muted>Connect lead channels so incoming enquiries create leads automatically.</Body>
      <IntegrationsPanel initialIntegrations={integrations} orgUid={org.uid} />
    </div>
  );
}
