import { Heading, Body } from "@/components/ui/Typography";
import { AutoAssignTogglePanel } from "@/components/organization/AutoAssignTogglePanel";
import { PriorityCalendarPanel } from "@/components/organization/PriorityCalendarPanel";
import { AgentAssignmentSettingsPanel } from "@/components/organization/AgentAssignmentSettingsPanel";
import { getMyOrganization } from "@/lib/organization";
import { getOrgUsers } from "@/lib/users";
import { getDestinations } from "@/lib/destinations";
import { getPriorityCalendarEntries } from "@/lib/priority-calendar";

export default async function Page() {
  const [organization, users, destinations, priorityCalendarEntries] = await Promise.all([
    getMyOrganization(),
    getOrgUsers(),
    getDestinations(),
    getPriorityCalendarEntries(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5">
        <Heading as="h2">Assignment Rules</Heading>
        <Body muted>Control how new leads get routed to your team: specialist matching, load balancing, capacity caps, and priority-lead handling.</Body>
        <AutoAssignTogglePanel organization={organization} />
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-8">
        <Heading as="h3">Priority calendar</Heading>
        <PriorityCalendarPanel initialEntries={priorityCalendarEntries} />
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-8">
        <Heading as="h3">Agent settings</Heading>
        <Body muted>Specialist destinations, capacity caps, priority-lead eligibility, and temporary opt-out per agent.</Body>
        <AgentAssignmentSettingsPanel users={users} destinations={destinations} />
      </div>
    </div>
  );
}
