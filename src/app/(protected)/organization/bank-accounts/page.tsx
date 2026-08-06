import { BankAccountsPanel } from "@/components/organization/BankAccountsPanel";
import { getMyOrganization } from "@/lib/organization";

export default async function BankAccountsPage() {
  const organization = await getMyOrganization();

  return (
    <div className="flex flex-col gap-5">
      <BankAccountsPanel orgId={organization.seqp} />
    </div>
  );
}
