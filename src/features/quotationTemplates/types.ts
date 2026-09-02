import type { QuotationTemplate } from "@/lib/quotation-templates";

export type { QuotationTemplate };

export interface CreateQuotationTemplatePayload {
  name: string;
  description: string;
  file: File;
  previewImage: File | null;
}

export interface UpdateQuotationTemplatePayload {
  uid: string;
  name?: string;
  description?: string;
  isActive?: boolean;
  file?: File | null;
  previewImage?: File | null;
}
