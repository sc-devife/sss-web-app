import { backendJson } from "@/lib/backend";
import type { Lead } from "@/lib/leads";
import type { Escape } from "@/lib/escapes";
import type { PaymentMilestone } from "@/lib/payment-milestones";

export interface DashboardOrgMetrics {
  leadsInLast30Days: number;
  conversionRatePercent: number;
  escapesInProgress: number;
  revenuePipelineUsd: number;
}

export interface Dashboard {
  orgMetrics: DashboardOrgMetrics | null;
  myOpenLeads: Lead[];
  myOpenEscapes: Escape[];
  myUpcomingPaymentMilestones: PaymentMilestone[];
}

export async function getDashboard(): Promise<Dashboard> {
  return backendJson<Dashboard>("/api/dashboard");
}
