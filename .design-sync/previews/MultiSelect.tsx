import { MultiSelect } from "sss-web-app";

export function EscapePoints() {
  return (
    <MultiSelect
      label="Escape Points"
      options={[
        { value: "coorg", label: "Coorg" },
        { value: "chikmagalur", label: "Chikmagalur" },
        { value: "wayanad", label: "Wayanad" },
        { value: "gokarna", label: "Gokarna" },
        { value: "ooty", label: "Ooty" },
      ]}
      value={["coorg", "chikmagalur"]}
      onChange={() => {}}
    />
  );
}

export function WithError() {
  return (
    <MultiSelect
      label="Traveller types"
      options={[
        { value: "couple", label: "Couple" },
        { value: "family", label: "Family" },
        { value: "solo", label: "Solo" },
        { value: "group", label: "Group" },
        { value: "corporate", label: "Corporate" },
      ]}
      value={[]}
      onChange={() => {}}
      error="Select at least one traveller type"
    />
  );
}
