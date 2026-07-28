import { Card } from "@/components/ui/Card";
import { Heading, Body } from "@/components/ui/Typography";
import { Badge } from "@/components/ui/Badge";
import { OrganizationForm } from "@/components/organization/OrganizationForm";
import { TaxProfilesPanel } from "@/components/organization/TaxProfilesPanel";
import { ReminderRulesPanel } from "@/components/organization/ReminderRulesPanel";
import { getMyOrganization } from "@/lib/organization";
import { getTaxProfiles } from "@/lib/tax-profiles";
import { getReminderRules } from "@/lib/reminder-rules";

export default async function OrganizationProfilePage() {
  const [organization, taxProfiles, reminderRules] = await Promise.all([
    getMyOrganization(),
    getTaxProfiles(),
    getReminderRules(),
  ]);

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <Heading as="h2">Organization Profile</Heading>
        <Badge tone={organization.status === "ACTIVE" ? "success" : "warning"}>{organization.status}</Badge>
      </div>
      <Body muted>Basic details for {organization.display_name}. Visible to everyone in your organization, editable by Admins.</Body>

      <Card>
        <OrganizationForm organization={organization} />
      </Card>

      <div className="flex flex-col gap-3">
        <Heading as="h3">Tax profiles</Heading>
        <Body muted>Named tax rates your team can apply to quotes (e.g. GST 18%, VAT 20%, No Tax).</Body>
        <TaxProfilesPanel initialProfiles={taxProfiles} />
      </div>

      <div className="flex flex-col gap-3">
        <Heading as="h3">Payment reminder cadence</Heading>
        <Body muted>When to email customers about upcoming or overdue payment milestones.</Body>
        <ReminderRulesPanel initialRules={reminderRules} />
      </div>
    </div>
  );
}
