import { Alert } from "sss-web-app";

export function Tones() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Alert tone="success" autoClose={false}>
        Quote sent to Sangmesh Rao for the Netravati escape.
      </Alert>
      <Alert tone="warning" autoClose={false}>
        Traveller passport details are missing for 2 travellers.
      </Alert>
      <Alert tone="danger" autoClose={false}>
        Payment failed for invoice INV-2044. Please retry.
      </Alert>
      <Alert tone="info" autoClose={false}>
        Itinerary PDF is being regenerated — this can take a minute.
      </Alert>
      <Alert tone="neutral" autoClose={false}>
        Lead was reassigned to Priya Nair.
      </Alert>
    </div>
  );
}
