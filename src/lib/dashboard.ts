import { backendJson } from "@/lib/backend";
import type { Lead } from "@/lib/leads";
import type { Trip } from "@/lib/trips";
import type { PaymentMilestone } from "@/lib/payment-milestones";

export interface DashboardOrgMetrics {
  leadsInLast30Days: number;
  conversionRatePercent: number;
  tripsInProgress: number;
  revenuePipelineUsd: number;
}

export interface Dashboard {
  orgMetrics: DashboardOrgMetrics | null;
  myOpenLeads: Lead[];
  myOpenTrips: Trip[];
  myUpcomingPaymentMilestones: PaymentMilestone[];
}

export async function getDashboard(): Promise<Dashboard> {
  return backendJson<Dashboard>("/api/dashboard");
}
