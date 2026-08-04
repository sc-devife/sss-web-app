import type { InvoiceTemplate } from "@/lib/invoice-templates";

export type { InvoiceTemplate };

export interface SetDefaultInvoiceTemplatePayload {
  organizationUid: string;
  templateId: string;
}
