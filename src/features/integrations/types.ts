import type { IntegrationConnection } from "@/lib/integrations";
import type { WebhookEvent, LeadImportAttempt, FieldMapping } from "@/lib/leadSources";

export type { IntegrationConnection, WebhookEvent, LeadImportAttempt, FieldMapping };

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
}

export interface ConnectIntegrationPayload {
  channelCode: string;
  body: {
    autoCreateLeads: boolean;
    secret?: string;
    accessToken?: string;
    pageId?: string;
    igAccountId?: string;
    pageName?: string;
  };
}

export interface SaveFieldMappingPayload {
  channelCode: string;
  formId: string | null;
  metaFieldKey: string;
  crmField: string;
}
