import { Heading, Body } from "@/components/ui/Typography";
import { TaxProfilesPanel } from "@/components/organization/TaxProfilesPanel";
import { ReminderRulesPanel } from "@/components/organization/ReminderRulesPanel";
import { getTaxProfiles } from "@/lib/tax-profiles";
import { getReminderRules } from "@/lib/reminder-rules";

export default async function OrganizationSettingsPage() {
  const [taxProfiles, reminderRules] = await Promise.all([getTaxProfiles(), getReminderRules()]);

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <Heading as="h2">Settings</Heading>

      <div className="flex flex-col gap-3">
        <Heading as="h3">Tax profiles</Heading>
        <Body muted>Named tax rates your team can apply to quotes (e.g. GST 18%, VAT 20%, No Tax).</Body>
        <TaxProfilesPanel initialProfiles={taxProfiles} />
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-8">
        <Heading as="h3">Payment reminder cadence</Heading>
        <Body muted>When to email customers about upcoming or overdue payment milestones.</Body>
        <ReminderRulesPanel initialRules={reminderRules} />
      </div>
    </div>
  );
}
