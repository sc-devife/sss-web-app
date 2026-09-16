import { Card } from "@/components/ui/Card";
import { LeadsPanel } from "@/components/leads/LeadsPanel";
import { getEscapePoints } from "@/lib/escape-points";

// Leads themselves now load client-side (LeadsPanel dispatches fetchLeads()
// on mount, via the leads Redux slice) — escapePoints stays a server-fetched
// prop since it's reference data from another module not yet migrated.
// Leads are auto-assigned at intake and displayed read-only here (see
// assignedToUserName on Lead) — reassignment has no UI yet, so this page
// still doesn't need the org's user list.
export default async function Page() {
  const escapePoints = await getEscapePoints();

  return (
    <Card variant="page" className="flex min-h-full flex-col gap-5">
      <LeadsPanel escapePoints={escapePoints} />
    </Card>
  );
}
