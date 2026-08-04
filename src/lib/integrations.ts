import { backendJson } from "@/lib/backend";

export interface IntegrationConnection {
  channelCode: string;
  label: string;
  available: boolean;
  status: string;
  autoCreateLeads: boolean | null;
  lastSyncedAt: string | null;
  // Meta (facebook/instagram) only — null for other channels.
  platform: string | null;
  pageId: string | null;
  igAccountId: string | null;
  pageName: string | null;
  tokenLastVerifiedAt: string | null;
}

export async function getIntegrations(): Promise<IntegrationConnection[]> {
  return backendJson<IntegrationConnection[]>("/api/integrations");
}
