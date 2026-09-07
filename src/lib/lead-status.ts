// Mirrors backend LeadStatus (com.sss.app.entity.lead.LeadStatus) — keep in
// sync if that ever changes. Same "shared constant, single source of truth"
// pattern as lib/escape-status.ts.
export const LEAD_STATUS_ORDER = [
  "New",
  "Contacted",
  "Qualified",
  "Converted",
  "Unqualified",
  "Lost",
  "Duplicate",
] as const;
