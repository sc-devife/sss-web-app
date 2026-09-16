// Fixed list — not org-editable master data like Escape Point, so no
// onCreateOption/library fetch, just a static options array. Shared between
// Lead intake (LeadFormModal) and per-agent assignment settings
// (AgentAssignmentSettingsPanel), which is why it lives here rather than
// inline in either component.
export const LANGUAGE_OPTIONS = [
  "English", "Hindi", "Assamese", "Bengali", "Bodo", "Dogri", "Gujarati", "Kannada", "Kashmiri", "Konkani",
  "Maithili", "Malayalam", "Manipuri", "Marathi", "Nepali", "Odia", "Punjabi", "Sanskrit", "Santali", "Sindhi",
  "Tamil", "Telugu", "Urdu",
].map((name) => ({ value: name, label: name }));
