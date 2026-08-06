import { Heading, Body } from "@/components/ui/Typography";
import { AutoAssignTogglePanel } from "@/components/organization/AutoAssignTogglePanel";
import { PriorityCalendarPanel } from "@/components/organization/PriorityCalendarPanel";
import { AgentAssignmentSettingsPanel } from "@/components/organization/AgentAssignmentSettingsPanel";
import { getMyOrganization } from "@/lib/organization";
import { getEscapePoints } from "@/lib/escape-points";

export default async function Page() {
  const [organization, escapePoints] = await Promise.all([getMyOrganization(), getEscapePoints()]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Heading as="h2">Assignment Rules</Heading>
        <Body muted>Control how new leads get routed to your team: specialist matching, load balancing, capacity caps, and priority-lead handling.</Body>
        <AutoAssignTogglePanel organization={organization} />
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-6">
        <Heading as="h3">Priority calendar</Heading>
        <PriorityCalendarPanel />
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-6">
        <Heading as="h3">Agent settings</Heading>
        <Body muted>Specialist escape points, capacity caps, priority-lead eligibility, and temporary opt-out per agent.</Body>
        <AgentAssignmentSettingsPanel escapePoints={escapePoints} />
      </div>
    </div>
  );
}
