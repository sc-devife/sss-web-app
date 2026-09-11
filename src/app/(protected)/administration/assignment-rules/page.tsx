import { Card } from "@/components/ui/Card";
import { Heading, Body } from "@/components/ui/Typography";
import { AutoAssignTogglePanel } from "@/components/organization/AutoAssignTogglePanel";
import { PriorityCalendarPanel } from "@/components/organization/PriorityCalendarPanel";
import { AgentAssignmentSettingsPanel } from "@/components/organization/AgentAssignmentSettingsPanel";
import { getMyOrganization } from "@/lib/organization";
import { getEscapePoints } from "@/lib/escape-points";

// Three configuration areas, each its own Card so an Admin can scan the page
// and immediately see "on/off switch", "seasonal calendar", "per-agent
// settings" as distinct things to manage — rather than one long scroll of
// border-t-divided sections. Card variant="default" (a plain bordered box)
// nested inside the page's own Card variant="page", the same
// page-contains-cards shape src/app/(protected)/administration/settings
// already uses for its own multi-section layout.
export default async function Page() {
  const [organization, escapePoints] = await Promise.all([getMyOrganization(), getEscapePoints()]);

  return (
    <Card variant="page" className="flex min-h-full flex-col gap-2">

      <Card variant="default" className="flex flex-col gap-4 rounded-xl">
        <div className="flex flex-col gap-1">
          <Heading as="h3">Auto-assignment</Heading>
          <Body muted className="text-sm">
            Turns automatic routing on or off for the whole organization.
          </Body>
        </div>
        <AutoAssignTogglePanel organization={organization} />
      </Card>

      <Card variant="default" className="flex flex-col gap-4 rounded-xl">
        <div className="flex flex-col gap-1">
          <Heading as="h3">Priority calendar</Heading>
          <Body muted className="text-sm">
            Honeymoon and family leads traveling within one of these windows are auto-flagged as priority.
          </Body>
        </div>
        <PriorityCalendarPanel />
      </Card>

      <Card variant="default" className="flex flex-col gap-4 rounded-xl">
        <div className="flex flex-col gap-1">
          <Heading as="h3">Agent settings</Heading>
          <Body muted className="text-sm">
            Specialist escape points, capacity caps, priority-lead eligibility, and temporary opt-out — per agent.
          </Body>
        </div>
        <AgentAssignmentSettingsPanel escapePoints={escapePoints} />
      </Card>
    </Card>
  );
}
