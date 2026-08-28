import { Card } from "@/components/ui/Card";
import { Heading, Body } from "@/components/ui/Typography";
import { OrganizationSettingsPanel } from "@/components/organization/OrganizationSettingsPanel";
import { TaxProfilesPanel } from "@/components/organization/TaxProfilesPanel";
import { ReminderRulesPanel } from "@/components/organization/ReminderRulesPanel";

export default function OrganizationSettingsPage() {
  return (
    <Card variant="page" className="flex min-h-full flex-col gap-6">

      <div className="flex flex-col gap-3">
        <div>
          <Heading as="h3">General settings</Heading>
          <Body muted>Behavior and defaults — how the CRM operates for your team, not who you are.</Body>
        </div>
        <OrganizationSettingsPanel />
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-4">
        <div>
          <Heading as="h3">Tax profiles</Heading>
          <Body muted>Named tax rates your team can apply to quotes (e.g. GST 18%, VAT 20%, No Tax).</Body>
        </div>
        <TaxProfilesPanel />
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-4">
        <div>
          <Heading as="h3">Payment reminder cadence</Heading>
          <Body muted>When to email customers about upcoming or overdue payment milestones.</Body>
        </div>
        <ReminderRulesPanel />
      </div>
    </Card>
  );
}
