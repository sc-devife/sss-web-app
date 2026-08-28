import { Card } from "@/components/ui/Card";
import { BankAccountsPanel } from "@/components/organization/BankAccountsPanel";
import { getMyOrganization } from "@/lib/organization";

export default async function BankAccountsPage() {
  const organization = await getMyOrganization();

  return (
    <Card variant="page" className="flex min-h-full flex-col gap-5">
      <BankAccountsPanel orgId={organization.uid} />
    </Card>
  );
}
