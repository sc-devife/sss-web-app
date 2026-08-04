import { backendJson } from "@/lib/backend";
import type { IntegrationConnection } from "@/lib/integrations";

export interface WebhookEvent {
  seqp: number;
  platform: string | null;
  pageId: string | null;
  leadgenId: string | null;
  formId: string | null;
  adId: string | null;
  signatureValid: boolean;
  processingStatus: string;
  errorMessage: string | null;
  rawPayload: string;
  receivedAt: string;
}

export interface LeadImportAttempt {
  seqp: number;
  provider: string;
  leadgenId: string;
  formId: string | null;
  pageId: string | null;
  adId: string | null;
  campaignId: string | null;
  status: "success" | "failed" | "duplicate_matched";
  leadId: number | null;
  failureReason: string | null;
  retryCount: number;
  lastAttemptedAt: string;
  createdAt: string;
}

export interface FieldMapping {
  seqp: number;
  formId: string | null;
  metaFieldKey: string;
  crmField: string;
}

interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
}

export async function getLeadSources(): Promise<IntegrationConnection[]> {
  return backendJson<IntegrationConnection[]>("/api/lead-sources");
}

export async function getWebhookEvents(channelCode: string): Promise<Page<WebhookEvent>> {
  return backendJson<Page<WebhookEvent>>(`/api/lead-sources/${channelCode}/webhook-events`);
}

export async function getImportAttempts(channelCode: string): Promise<Page<LeadImportAttempt>> {
  return backendJson<Page<LeadImportAttempt>>(`/api/lead-sources/${channelCode}/import-attempts`);
}

export async function getFieldMappings(channelCode: string): Promise<FieldMapping[]> {
  return backendJson<FieldMapping[]>(`/api/lead-sources/${channelCode}/field-mappings`);
}
