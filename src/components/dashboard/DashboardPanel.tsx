"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Heading, Body, Caption } from "@/components/ui/Typography";
import { formatDisplayDate } from "@/lib/date";
import { formatInr, formatInrCompact } from "@/lib/currency";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchDashboard, fetchLeadsTrend } from "@/features/dashboard/dashboardThunks";
import {
  selectDashboard,
  selectDashboardStatus,
  selectDashboardError,
  selectLeadsTrend,
  selectLeadsTrendPeriod,
  selectLeadsTrendStatus,
} from "@/features/dashboard/dashboardSelectors";
import type { LeadsTrendPeriod } from "@/features/dashboard/types";
import { KpiCard, type KpiTrend } from "@/components/dashboard/charts/KpiCard";
import { ChartCard } from "@/components/dashboard/charts/ChartCard";
import { DonutChart } from "@/components/dashboard/charts/DonutChart";
import { HorizontalBarChart } from "@/components/dashboard/charts/HorizontalBarChart";
import { TrendLineChart } from "@/components/dashboard/charts/TrendLineChart";
import { PeriodSelector } from "@/components/dashboard/charts/PeriodSelector";
import { colorForIndex, colorForStatus, humanizeStatus } from "@/components/dashboard/charts/chartColors";
import type { Escape } from "@/lib/escapes";
import type { PaymentMilestone } from "@/lib/payment-milestones";

// Only a genuine previous-period baseline produces a trend arrow — a zero
// baseline would force either a hidden division or a fabricated "100%",
// both of which the dashboard spec explicitly rules out ("do not invent
// percentage changes").
function trendFor(current: number, previous: number): KpiTrend | null {
  if (!previous) return null;
  const percent = ((current - previous) / previous) * 100;
  return { direction: percent >= 0 ? "up" : "down", percent: Math.abs(percent) };
}

// "2026-08-20" -> "20 Aug", "2026-08" -> "Aug 2026" — the trend endpoint's
// bucket key length tells us which granularity it used.
function formatTrendDate(date: string): string {
  if (date.length === 7) {
    const [y, m] = date.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} variant="elevated" className="h-24 animate-pulse bg-muted/40">{null}</Card>
        ))}
      </div>
      {Array.from({ length: 2 }).map((_, row) => (
        <div key={row} className="grid grid-cols-1 gap-2 lg:grid-cols-2">
          <Card variant="elevated" className="h-72 animate-pulse bg-muted/40">{null}</Card>
          <Card variant="elevated" className="h-72 animate-pulse bg-muted/40">{null}</Card>
        </div>
      ))}
    </div>
  );
}

// Preserved exactly as it was before this dashboard redesign — rendered
// both as Row 5's second column (when org metrics are available) and as
// the whole page's content for callers without organizations.read, who
// only ever saw this section anyway.
function MyEscapes({
  escapes,
}: {
  escapes: Escape[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <Card variant="elevated" className="flex flex-col gap-2">
        <Heading as="h4">My escapes</Heading>
        {escapes.length === 0 && <Body muted>No open escapes assigned to you.</Body>}
        {escapes.map((escape) => (
          <Link key={escape.uid} href={`/escapes/${escape.uid}`}>
            <Card className="flex items-center justify-between hover:border-primary">
              <div>
                <Body className="font-medium">{escape.lead?.name ?? `Escape #${escape.uid}`}</Body>
                <Caption>{escape.escapePoints.map((d) => d.name).join(", ") || "No escape points set"}</Caption>
              </div>
              <Badge tone="neutral">{escape.status}</Badge>
            </Card>
          </Link>
        ))}
        <Link href="/escapes" className="text-sm text-primary hover:underline">View all escapes →</Link>
      </Card>

    </div>
  );
}

function MyUpcomingPayments({ milestones }: { milestones: PaymentMilestone[] }) {
  return (
    <Card variant="elevated" className="flex flex-col gap-3">
      <Heading as="h4">Upcoming payments</Heading>
      {milestones.length === 0 && <Body muted>No upcoming payment milestones.</Body>}
      {milestones.map((milestone) => (
        <Card key={milestone.uid} className="flex items-center justify-between">
          <div>
            <Body className="font-medium">{milestone.label}</Body>
            <Caption>Due {formatDisplayDate(milestone.dueDate)}</Caption>
          </div>
          <div className="text-right">
            <Badge tone={milestone.status === "overdue" ? "danger" : milestone.status === "partially_paid" ? "warning" : "neutral"}>
              {milestone.status}
            </Badge>
            <Caption>₹{(milestone.amountInr - milestone.amountPaidInr).toFixed(2)} remaining</Caption>
          </div>
        </Card>
      ))}
    </Card>
  );
}

export function DashboardPanel() {
  const dispatch = useAppDispatch();
  const dashboard = useAppSelector(selectDashboard);
  const status = useAppSelector(selectDashboardStatus);
  const error = useAppSelector(selectDashboardError);
  const leadsTrend = useAppSelector(selectLeadsTrend);
  const leadsTrendPeriod = useAppSelector(selectLeadsTrendPeriod);
  const leadsTrendStatus = useAppSelector(selectLeadsTrendStatus);

  useEffect(() => {
    dispatch(fetchDashboard());
    dispatch(fetchLeadsTrend("30d"));
  }, [dispatch]);

  function handlePeriodChange(period: LeadsTrendPeriod) {
    dispatch(fetchLeadsTrend(period));
  }

  if (status === "loading" && !dashboard) {
    return <DashboardSkeleton />;
  }

  if (status === "failed" || !dashboard) {
    return <Body className="text-danger">{error ?? "Failed to load dashboard"}</Body>;
  }

  const metrics = dashboard.orgMetrics;
  const leadsTrendEmpty = leadsTrendStatus === "succeeded" && leadsTrend.every((p) => p.count === 0);

  return (
    <div className="flex flex-col gap-2">
      {metrics && (
        <>
          {/* Row 1: KPI cards */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <KpiCard
              label="New Leads (30d)"
              value={metrics.leadsInLast30Days}
              trend={trendFor(metrics.leadsInLast30Days, metrics.previousPeriodLeadsCount)}
            />
            <KpiCard label="Conversion Rate" value={`${metrics.conversionRatePercent.toFixed(1)}%`} />
            <KpiCard label="Active Escapes" value={metrics.escapesInProgress} />
            <KpiCard label="Revenue Pipeline" value={formatInrCompact(metrics.revenuePipelineInr)} />
            <KpiCard
              label="Revenue Collected"
              value={formatInrCompact(metrics.revenueCollectedInr)}
              trend={trendFor(metrics.revenueCollectedInr, metrics.previousPeriodRevenueCollectedInr)}
            />
            <KpiCard
              label="Overdue Payments"
              value={metrics.overduePaymentsCount}
              icon={metrics.overduePaymentsCount > 0 ? <Badge tone="danger">{formatInrCompact(metrics.overduePaymentsAmountInr)}</Badge> : undefined}
            />
          </div>

          {/* Row 2: Revenue & Payments | Lead Funnel */}
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
            <ChartCard title="Revenue & Payments" isEmpty={metrics.paymentBreakdown.every((p) => p.count === 0)} emptyMessage="No payment milestones yet.">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <DonutChart
                    data={metrics.paymentBreakdown
                      .filter((p) => p.count > 0)
                      .map((p, i) => ({ name: humanizeStatus(p.status), value: p.count, color: colorForStatus(p.status, i) }))}
                    valueFormatter={(v) => `${v} milestone${v === 1 ? "" : "s"}`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 sm:w-48 sm:shrink-0">
                  <div>
                    <Caption>Total Revenue</Caption>
                    <Body className="font-semibold">{formatInr(metrics.totalRevenueInr)}</Body>
                  </div>
                  <div>
                    <Caption>Collected</Caption>
                    <Body className="font-semibold text-success">{formatInr(metrics.revenueCollectedInr)}</Body>
                  </div>
                  <div>
                    <Caption>Outstanding</Caption>
                    <Body className="font-semibold">{formatInr(metrics.revenuePipelineInr)}</Body>
                  </div>
                  <div>
                    <Caption>Overdue</Caption>
                    <Body className="font-semibold text-danger">{formatInr(metrics.overduePaymentsAmountInr)}</Body>
                  </div>
                </div>
              </div>
            </ChartCard>

            <ChartCard title="Lead Funnel" isEmpty={metrics.leadFunnel.every((s) => s.count === 0)} emptyMessage="No leads yet.">
              <HorizontalBarChart
                data={metrics.leadFunnel.map((s, i) => ({ label: s.status, value: s.count, color: colorForStatus(s.status, i) }))}
              />
            </ChartCard>
          </div>

          {/* Row 3: Leads Trend | Lead Source */}
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
            <ChartCard
              title="Leads Trend"
              headerRight={<PeriodSelector value={leadsTrendPeriod} onChange={handlePeriodChange} />}
              isEmpty={leadsTrendEmpty}
              emptyMessage="No leads in this period."
            >
              <TrendLineChart data={leadsTrend.map((p) => ({ date: p.date, value: p.count }))} dateFormatter={formatTrendDate} />
            </ChartCard>

            <ChartCard title="Lead Source" isEmpty={metrics.leadSourceBreakdown.length === 0}>
              <DonutChart
                data={metrics.leadSourceBreakdown.map((s, i) => ({ name: s.name, value: s.count, color: colorForIndex(i) }))}
                valueFormatter={(v) => `${v} lead${v === 1 ? "" : "s"}`}
              />
            </ChartCard>
          </div>

          {/* Row 4: Escape Pipeline | Top Escape Points */}
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
            <ChartCard title="Escape Pipeline" isEmpty={metrics.escapePipeline.every((s) => s.count === 0)} emptyMessage="No escapes yet.">
              <HorizontalBarChart
                data={metrics.escapePipeline.map((s, i) => ({ label: s.status, value: s.count, color: colorForStatus(s.status, i) }))}
              />
            </ChartCard>

            <ChartCard
              title="Top Escape Points"
              subtitle="Ranked by active escapes"
              isEmpty={metrics.topEscapePoints.length === 0}
              emptyMessage="No active escapes yet."
            >
              <HorizontalBarChart
                data={metrics.topEscapePoints.map((d, i) => ({ label: d.name, value: d.count, color: colorForIndex(i) }))}
              />
            </ChartCard>
          </div>

          {/* Row 5: Quote Analytics | My escapes & upcoming payments */}
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
            <ChartCard
              title="Quote Analytics"
              isEmpty={metrics.quoteAnalytics.totalQuotes === 0}
              emptyMessage="No quotes yet."
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <DonutChart
                    data={metrics.quoteAnalytics.statusBreakdown
                      .filter((s) => s.count > 0)
                      .map((s, i) => ({ name: humanizeStatus(s.status), value: s.count, color: colorForStatus(s.status, i) }))}
                    valueFormatter={(v) => `${v} quote${v === 1 ? "" : "s"}`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 sm:w-48 sm:shrink-0">
                  <div>
                    <Caption>Total Quotes</Caption>
                    <Body className="font-semibold">{metrics.quoteAnalytics.totalQuotes}</Body>
                  </div>
                  <div>
                    <Caption>Acceptance Rate</Caption>
                    <Body className="font-semibold">{metrics.quoteAnalytics.acceptanceRatePercent.toFixed(1)}%</Body>
                  </div>
                  <div>
                    <Caption>Avg Quote Value</Caption>
                    <Body className="font-semibold">{formatInr(metrics.quoteAnalytics.averageQuoteValueInr)}</Body>
                  </div>
                  <div>
                    <Caption>Total Quote Value</Caption>
                    <Body className="font-semibold">{formatInr(metrics.quoteAnalytics.totalQuoteValueInr)}</Body>
                  </div>
                </div>
              </div>
            </ChartCard>

            <MyEscapes escapes={dashboard.myOpenEscapes} />
          </div>

          <div className="flex flex-col gap-3">
            <MyUpcomingPayments milestones={dashboard.myUpcomingPaymentMilestones} />
          </div>
        </>
      )}

      {!metrics && (
        <MyEscapes escapes={dashboard.myOpenEscapes} />

      )}
    </div>
  );
}
