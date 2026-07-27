import { Heading, Body } from "@/components/ui/Typography";
import { BankAccountsPanel } from "@/components/organization/BankAccountsPanel";
import { getMyOrganization } from "@/lib/organization";
import { getBankAccounts } from "@/lib/bank-accounts";

export default async function BankAccountsPage() {
  const organization = await getMyOrganization();
  const accounts = await getBankAccounts(organization.seqp);

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <Heading as="h2">Bank Accounts</Heading>
      <Body muted>Accounts shown to staff when recording payment milestones for {organization.display_name}.</Body>
      <BankAccountsPanel orgId={organization.seqp} accounts={accounts} />
    </div>
  );
}
