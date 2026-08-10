import { Select } from "sss-web-app";

export function Default() {
  return (
    <Select
      label="Escape status"
      placeholder="Choose a status"
      options={[
        { value: "planning", label: "Planning" },
        { value: "confirmed", label: "Confirmed" },
        { value: "completed", label: "Completed" },
        { value: "cancelled", label: "Cancelled" },
      ]}
    />
  );
}

export function WithError() {
  return (
    <Select
      label="Destination"
      placeholder="Select a destination"
      error="Please select a destination"
      required
      options={[
        { value: "coorg", label: "Coorg, Karnataka" },
        { value: "goa", label: "Goa" },
        { value: "manali", label: "Manali, Himachal Pradesh" },
      ]}
    />
  );
}
