import { Card } from "@/components/ui/Card";
import { IntegrationsPanel } from "@/components/integrations/IntegrationsPanel";
import { getMyOrganization } from "@/lib/organization";

export default async function Page() {
  const org = await getMyOrganization();

  return (
    <Card variant="page" className="flex min-h-full flex-col gap-5">
      <IntegrationsPanel orgUid={org.uid} />
    </Card>
  );
}
