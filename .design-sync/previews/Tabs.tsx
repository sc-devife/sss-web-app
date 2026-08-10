import { Tabs, Card, Body, Heading, Badge } from "sss-web-app";

export function EscapeDetail() {
  return (
    <Tabs
      tabs={[
        { id: "planning", label: "Planning" },
        { id: "activity", label: "Activity" },
        { id: "history", label: "History" },
      ]}
      defaultTab="planning"
    >
      {(activeTab) =>
        activeTab === "planning" ? (
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <Heading as="h3">Coorg escape</Heading>
                <Body muted>2 travellers · 3 days · Madikeri, Karnataka</Body>
              </div>
              <Badge tone="warning">Planning</Badge>
            </div>
          </Card>
        ) : activeTab === "activity" ? (
          <Body muted>No recent activity yet.</Body>
        ) : (
          <Body muted>Created by Sangmesh Rao on Aug 3, 2026</Body>
        )
      }
    </Tabs>
  );
}

export function ActivityTabActive() {
  return (
    <Tabs
      tabs={[
        { id: "planning", label: "Planning" },
        { id: "activity", label: "Activity" },
        { id: "history", label: "History" },
      ]}
      defaultTab="activity"
    >
      {() => (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Body>Quote sent to traveller — Aug 9, 2026</Body>
          <Body muted>Follow-up call scheduled for Aug 12, 2026</Body>
        </div>
      )}
    </Tabs>
  );
}
