import { backendJson } from "@/lib/backend";
import type { Escape } from "@/lib/escapes";
import type { PaymentMilestone } from "@/lib/payment-milestones";

export interface DashboardOrgMetrics {
  leadsInLast30Days: number;
  conversionRatePercent: number;
  escapesInProgress: number;
  revenuePipelineUsd: number;
}

// Leads have no per-user assignee (assignment happens once, on the Escape,
// at conversion time), so there is no "myOpenLeads" here.
export interface Dashboard {
  orgMetrics: DashboardOrgMetrics | null;
  myOpenEscapes: Escape[];
  myUpcomingPaymentMilestones: PaymentMilestone[];
}

export async function getDashboard(): Promise<Dashboard> {
  return backendJson<Dashboard>("/api/dashboard");
}
