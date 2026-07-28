import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Heading, Body, Caption } from "@/components/ui/Typography";
import { getDashboard } from "@/lib/dashboard";

const TERMINAL_LEAD_STATUSES = ["Unqualified", "Lost", "Duplicate", "Converted"];

export default async function DashboardPage() {
  const dashboard = await getDashboard();

  return (
    <div className="flex flex-col gap-8">
      <Heading as="h2">Dashboard</Heading>

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
            <Caption>Trips in progress</Caption>
            <Body className="text-2xl font-semibold text-foreground">{dashboard.orgMetrics.tripsInProgress}</Body>
          </Card>
          <Card>
            <Caption>Revenue pipeline (outstanding)</Caption>
            <Body className="text-2xl font-semibold text-foreground">${dashboard.orgMetrics.revenuePipelineUsd.toFixed(2)}</Body>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-3">
          <Heading as="h3">My leads</Heading>
          {dashboard.myOpenLeads.length === 0 && <Body muted>No open leads assigned to you.</Body>}
          {dashboard.myOpenLeads.map((lead) => (
            <Card key={lead.seqp} className="flex items-center justify-between">
              <div>
                <Body className="font-medium">{lead.name}</Body>
                <Caption>{lead.destination || "No destination set"}</Caption>
              </div>
              <div className="flex items-center gap-1">
                {lead.isPriority && <Badge tone="warning">Priority</Badge>}
                <Badge tone={TERMINAL_LEAD_STATUSES.includes(lead.status) ? "success" : "neutral"}>{lead.status}</Badge>
              </div>
            </Card>
          ))}
          <Link href="/leads" className="text-sm text-primary hover:underline">View all leads →</Link>
        </div>

        <div className="flex flex-col gap-3">
          <Heading as="h3">My trips</Heading>
          {dashboard.myOpenTrips.length === 0 && <Body muted>No open trips assigned to you.</Body>}
          {dashboard.myOpenTrips.map((trip) => (
            <Link key={trip.seqp} href={`/trips/${trip.seqp}`}>
              <Card className="flex items-center justify-between hover:border-primary">
                <div>
                  <Body className="font-medium">{trip.lead?.name ?? `Trip #${trip.seqp}`}</Body>
                  <Caption>{trip.destinations.map((d) => d.name).join(", ") || "No destinations set"}</Caption>
                </div>
                <Badge tone="neutral">{trip.status}</Badge>
              </Card>
            </Link>
          ))}
          <Link href="/trips" className="text-sm text-primary hover:underline">View all trips →</Link>
        </div>

        <div className="flex flex-col gap-3">
          <Heading as="h3">Upcoming payments</Heading>
          {dashboard.myUpcomingPaymentMilestones.length === 0 && <Body muted>No upcoming payment milestones.</Body>}
          {dashboard.myUpcomingPaymentMilestones.map((milestone) => (
            <Card key={milestone.uid} className="flex items-center justify-between">
              <div>
                <Body className="font-medium">{milestone.label}</Body>
                <Caption>Due {milestone.dueDate}</Caption>
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
