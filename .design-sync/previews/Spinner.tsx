import { Spinner } from "sss-web-app";

export function Sizes() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <Spinner size="sm" />
      <Spinner size="md" />
      <Spinner size="lg" />
    </div>
  );
}

export function OnPrimary() {
  return (
    <div
      className="bg-primary text-primary-foreground"
      style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 6 }}
    >
      <Spinner size="sm" tone="current" />
      <span style={{ fontSize: 14, fontWeight: 500 }}>Sending quote…</span>
    </div>
  );
}
