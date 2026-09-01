import { backendJson } from "@/lib/backend";
import type { Escape } from "@/lib/escapes";
import type { PaymentMilestone } from "@/lib/payment-milestones";

export interface StatusCount {
  status: string;
  count: number;
}

export interface NameCount {
  name: string;
  count: number;
}

export interface PaymentStatusBreakdown {
  status: string;
  count: number;
  totalInr: number;
  paidInr: number;
}

export interface QuoteAnalytics {
  totalQuotes: number;
  acceptedQuotes: number;
  rejectedQuotes: number;
  acceptanceRatePercent: number;
  averageQuoteValueInr: number;
  totalQuoteValueInr: number;
  statusBreakdown: StatusCount[];
}

export interface DashboardOrgMetrics {
  leadsInLast30Days: number;
  conversionRatePercent: number;
  escapesInProgress: number;
  revenuePipelineInr: number;

  // Only present for genuine period-flow metrics — see DashboardServiceImpl.
  previousPeriodLeadsCount: number;
  previousPeriodRevenueCollectedInr: number;

  revenueCollectedInr: number;
  overduePaymentsCount: number;
  overduePaymentsAmountInr: number;
  totalRevenueInr: number;

  leadFunnel: StatusCount[];
  leadSourceBreakdown: NameCount[];
  escapePipeline: StatusCount[];
  topEscapePoints: NameCount[];
  paymentBreakdown: PaymentStatusBreakdown[];
  quoteAnalytics: QuoteAnalytics;
}

// Leads have no per-user assignee (assignment happens once, on the Escape,
// at conversion time), so there is no "myOpenLeads" here.
export interface Dashboard {
  orgMetrics: DashboardOrgMetrics | null;
  myOpenEscapes: Escape[];
  myUpcomingPaymentMilestones: PaymentMilestone[];
}

export type LeadsTrendPeriod = "7d" | "30d" | "90d" | "12m";

export interface LeadsTrendPoint {
  date: string;
  count: number;
}

export async function getDashboard(): Promise<Dashboard> {
  return backendJson<Dashboard>("/api/dashboard");
}
