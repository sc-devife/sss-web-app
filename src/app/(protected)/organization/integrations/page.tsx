import { Heading, Body } from "@/components/ui/Typography";
import { IntegrationsPanel } from "@/components/integrations/IntegrationsPanel";
import { getMyOrganization } from "@/lib/organization";

export default async function Page() {
  const org = await getMyOrganization();

  return (
    <div className="flex flex-col gap-5">
      <IntegrationsPanel orgUid={org.uid} />
    </div>
  );
}
