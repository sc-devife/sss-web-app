import type { InvoiceTemplate } from "@/lib/invoice-templates";

export type { InvoiceTemplate };

export interface SetDefaultInvoiceTemplatePayload {
  templateId: string;
}
