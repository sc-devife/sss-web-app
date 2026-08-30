// Recharts needs real CSS color values (not Tailwind class names) for its
// fill/stroke props — `hsl(var(--x))` works directly since these are plain
// CSS color functions, so charts stay on the app's existing design tokens
// (globals.css) instead of a separate hardcoded palette.
export const TONE_COLORS = {
  primary: "hsl(var(--primary))",
  success: "hsl(var(--success))",
  warning: "hsl(var(--warning))",
  danger: "hsl(var(--danger))",
  neutral: "hsl(var(--muted-foreground))",
} as const;

// Semantic status → color, reused across the Lead Funnel, Escape Pipeline,
// Payment breakdown, and Quote status charts so the same status always
// reads the same color everywhere on the dashboard.
export const STATUS_COLORS: Record<string, string> = {
  // Lead funnel
  New: TONE_COLORS.neutral,
  Contacted: TONE_COLORS.primary,
  Qualified: TONE_COLORS.primary,
  Converted: TONE_COLORS.success,
  Unqualified: TONE_COLORS.danger,
  Lost: TONE_COLORS.danger,
  Duplicate: TONE_COLORS.warning,
  // Payment milestones
  pending: TONE_COLORS.neutral,
  unverified: TONE_COLORS.warning,
  partially_paid: TONE_COLORS.warning,
  paid: TONE_COLORS.success,
  overdue: TONE_COLORS.danger,
  // Quotes
  draft: TONE_COLORS.neutral,
  sent: TONE_COLORS.warning,
  accepted: TONE_COLORS.success,
  rejected: TONE_COLORS.danger,
  superseded: TONE_COLORS.neutral,
};

// Fallback categorical palette for breakdowns with no inherent status
// meaning (Lead Source, Top Escape Points) — built from the same tokens
// rather than a new hardcoded set of hex colors.
export const CATEGORICAL_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--warning))",
  "hsl(var(--success))",
  "hsl(var(--danger))",
  "hsl(var(--muted-foreground))",
];

export function colorForStatus(status: string, index: number): string {
  return STATUS_COLORS[status] ?? CATEGORICAL_COLORS[index % CATEGORICAL_COLORS.length];
}

export function colorForIndex(index: number): string {
  return CATEGORICAL_COLORS[index % CATEGORICAL_COLORS.length];
}

// "partially_paid" -> "Partially Paid", "New" stays "New".
export function humanizeStatus(status: string): string {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
