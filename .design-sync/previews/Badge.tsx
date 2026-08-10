import { Badge } from "sss-web-app";
import { IoCheckmarkCircle, IoWarning } from "react-icons/io5";

export function Tones() {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <Badge tone="neutral">Draft</Badge>
      <Badge tone="success">Confirmed</Badge>
      <Badge tone="warning">Pending</Badge>
      <Badge tone="danger">Cancelled</Badge>
    </div>
  );
}

export function WithIcon() {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <Badge tone="success" icon={IoCheckmarkCircle}>
        Verified
      </Badge>
      <Badge tone="warning" icon={IoWarning}>
        Needs attention
      </Badge>
    </div>
  );
}
