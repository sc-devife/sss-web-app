import { LeadsPanel } from "@/components/leads/LeadsPanel";
import { getOrgUsers } from "@/lib/users";
import { getDestinations } from "@/lib/destinations";

// Leads themselves now load client-side (LeadsPanel dispatches fetchLeads()
// on mount, via the leads Redux slice) — users/destinations stay
// server-fetched props since they're reference data from other modules not
// yet migrated, per the Stage 2 pilot scope (Leads only).
export default async function Page() {
  const [users, destinations] = await Promise.all([getOrgUsers(), getDestinations()]);

  return (
    <div className="flex flex-col gap-5">
      <LeadsPanel users={users} destinations={destinations} />
    </div>
  );
}
