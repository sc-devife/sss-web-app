"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Heading, Body, Caption } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import { formatDisplayDate } from "@/lib/date";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchDashboard } from "@/features/dashboard/dashboardThunks";
import { selectDashboard, selectDashboardStatus, selectDashboardError } from "@/features/dashboard/dashboardSelectors";

export function DashboardPanel() {
  const dispatch = useAppDispatch();
  const dashboard = useAppSelector(selectDashboard);
  const status = useAppSelector(selectDashboardStatus);
  const error = useAppSelector(selectDashboardError);

  useEffect(() => {
    dispatch(fetchDashboard());
  }, [dispatch]);

  if (status === "loading" && !dashboard) {
    return <LoadingState label="Loading dashboard…" />;
  }

  if (status === "failed" || !dashboard) {
    return <Body className="text-danger">{error ?? "Failed to load dashboard"}</Body>;
  }

  return (
    <div className="flex flex-col gap-8">
      {dashboard.orgMetrics && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <Caption>Leads in (last 30 days)</Caption>
            <Body className="text-2xl font-semibold text-foreground">{dashboard.orgMetrics.leadsInLast30Days}</Body>
          </Card>
          <Card>
            <Caption>Conversion rate</Caption>
            <Body className="text-2xl font-semibold text-foreground">{dashboard.orgMetrics.conversionRatePercent.toFixed(1)}%</Body>
          </Card>
          <Card>
            <Caption>Escapes in progress</Caption>
            <Body className="text-2xl font-semibold text-foreground">{dashboard.orgMetrics.escapesInProgress}</Body>
          </Card>
          <Card>
            <Caption>Revenue pipeline (outstanding)</Caption>
            <Body className="text-2xl font-semibold text-foreground">${dashboard.orgMetrics.revenuePipelineUsd.toFixed(2)}</Body>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <Heading as="h3">My escapes</Heading>
          {dashboard.myOpenEscapes.length === 0 && <Body muted>No open escapes assigned to you.</Body>}
          {dashboard.myOpenEscapes.map((escape) => (
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
        </div>

        <div className="flex flex-col gap-3">
          <Heading as="h3">Upcoming payments</Heading>
          {dashboard.myUpcomingPaymentMilestones.length === 0 && <Body muted>No upcoming payment milestones.</Body>}
          {dashboard.myUpcomingPaymentMilestones.map((milestone) => (
            <Card key={milestone.uid} className="flex items-center justify-between">
              <div>
                <Body className="font-medium">{milestone.label}</Body>
                <Caption>Due {formatDisplayDate(milestone.dueDate)}</Caption>
              </div>
              <div className="text-right">
                <Badge tone={milestone.status === "overdue" ? "danger" : milestone.status === "partially_paid" ? "warning" : "neutral"}>
                  {milestone.status}
                </Badge>
                <Caption>${(milestone.amountUsd - milestone.amountPaidUsd).toFixed(2)} remaining</Caption>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
