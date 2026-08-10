import { Caption } from "sss-web-app";

export function Default() {
  return (
    <div style={{ display: "flex", gap: 16 }}>
      <Caption>Travel date</Caption>
      <Caption>Origin city</Caption>
      <Caption>Budget</Caption>
    </div>
  );
}
