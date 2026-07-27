import { Heading, Body } from "@/components/ui/Typography";
import { LeadsPanel } from "@/components/leads/LeadsPanel";
import { getLeads } from "@/lib/leads";
import { getOrgUsers } from "@/lib/users";
import { getDestinations } from "@/lib/destinations";

export default async function Page() {
  const [leads, users, destinations] = await Promise.all([getLeads(), getOrgUsers(), getDestinations()]);

  return (
    <div className="flex flex-col gap-5">
      <Heading as="h2">Leads</Heading>
      <Body muted>Inbound trip requests, from manual entry through to conversion.</Body>
      <LeadsPanel initialLeads={leads} users={users} destinations={destinations} />
    </div>
  );
}
