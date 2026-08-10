import { Card, Heading, Body, Badge } from "sss-web-app";

export function Default() {
  return (
    <Card>
      <Heading as="h3">Crrog escape</Heading>
      <Body muted>2 travellers · 3 days · Madikeri, Karnataka</Body>
    </Card>
  );
}

export function Elevated() {
  return (
    <Card variant="elevated">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <Heading as="h3">Netravati escape</Heading>
          <Body muted>Sangmesh Rao · Sep 5–7, 2026</Body>
        </div>
        <Badge tone="warning">Planning</Badge>
      </div>
    </Card>
  );
}
