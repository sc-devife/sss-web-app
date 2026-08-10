import { DataTable, Badge, Button } from "sss-web-app";

interface LeadRow {
  id: string;
  name: string;
  escapePoint: string;
  status: "Converted" | "New" | "Contacted";
  assignedTo: string;
}

const rows: LeadRow[] = [
  { id: "1", name: "Sanat", escapePoint: "Crrog", status: "Converted", assignedTo: "Admin User" },
  { id: "2", name: "Sangmesh", escapePoint: "Netravati", status: "Converted", assignedTo: "Admin User" },
  { id: "3", name: "Priya Sharma", escapePoint: "Coorg", status: "New", assignedTo: "Unassigned" },
];

const toneFor: Record<LeadRow["status"], "success" | "neutral" | "warning"> = {
  Converted: "success",
  New: "neutral",
  Contacted: "warning",
};

export function LeadsList() {
  return (
    <DataTable<LeadRow>
      columns={[
        { key: "name", header: "Name", render: (r) => r.name, sortValue: (r) => r.name, filterValue: (r) => r.name },
        { key: "escapePoint", header: "Escape Point", render: (r) => r.escapePoint },
        { key: "status", header: "Status", render: (r) => <Badge tone={toneFor[r.status]}>{r.status}</Badge> },
        { key: "assignedTo", header: "Assigned to", render: (r) => r.assignedTo },
      ]}
      rows={rows}
      rowKey={(r) => r.id}
      searchPlaceholder="Search leads…"
      actions={() => (
        <Button variant="secondary" size="sm">
          View
        </Button>
      )}
    />
  );
}
