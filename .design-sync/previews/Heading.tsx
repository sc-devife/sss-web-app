import { Heading } from "sss-web-app";

export function Sizes() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Heading as="h1">Escape details</Heading>
      <Heading as="h2">Traveller information</Heading>
      <Heading as="h3">Itinerary schedule</Heading>
      <Heading as="h4">Assignment</Heading>
    </div>
  );
}
