import { backendJson } from "@/lib/backend";

export interface IntegrationConnection {
  channelCode: string;
  label: string;
  available: boolean;
  status: string;
  autoCreateLeads: boolean | null;
  lastSyncedAt: string | null;
}

export async function getIntegrations(): Promise<IntegrationConnection[]> {
  return backendJson<IntegrationConnection[]>("/api/integrations");
}
