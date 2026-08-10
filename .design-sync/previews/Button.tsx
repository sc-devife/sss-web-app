import { Button } from "sss-web-app";

export function Variants() {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <Button variant="primary">Save changes</Button>
      <Button variant="secondary">Cancel</Button>
      <Button variant="ghost">Skip</Button>
      <Button variant="danger">Delete escape</Button>
    </div>
  );
}

export function Sizes() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
    </div>
  );
}

export function LoadingAndDisabled() {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <Button loading loadingText="Saving…">
        Save changes
      </Button>
      <Button disabled>Unavailable</Button>
    </div>
  );
}
