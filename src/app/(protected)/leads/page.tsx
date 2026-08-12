import { Card } from "@/components/ui/Card";
import { LeadsPanel } from "@/components/leads/LeadsPanel";
import { getOrgUsers } from "@/lib/users";
import { getEscapePoints } from "@/lib/escape-points";

// Leads themselves now load client-side (LeadsPanel dispatches fetchLeads()
// on mount, via the leads Redux slice) — users/escapePoints stay
// server-fetched props since they're reference data from other modules not
// yet migrated, per the Stage 2 pilot scope (Leads only).
export default async function Page() {
  const [users, escapePoints] = await Promise.all([getOrgUsers(), getEscapePoints()]);

  return (
    <Card variant="page" className="flex min-h-full flex-col gap-5">
      <LeadsPanel users={users} escapePoints={escapePoints} />
    </Card>
  );
}
