import { backendJson } from "@/lib/backend";
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

// Deliberately not the full Escape type — the backend sends a lightweight
// card shape (a single resolved cover image, not every image on every
// linked escape point) since this is a small dashboard summary, not the
// full escape detail. See DashboardEscapeSummaryDTO.
export interface DashboardEscapeSummary {
  uid: string;
  leadName: string | null;
  escapePointNames: string[];
  status: string;
  imageUrl: string | null;
}

// Leads have no per-user assignee (assignment happens once, on the Escape,
// at conversion time), so there is no "myOpenLeads" here.
export interface Dashboard {
  orgMetrics: DashboardOrgMetrics | null;
  // The 3 most recently created, newest first — see DashboardServiceImpl.
  myOpenEscapes: DashboardEscapeSummary[];
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
