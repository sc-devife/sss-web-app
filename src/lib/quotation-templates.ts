import { backendJson } from "@/lib/backend";

export interface QuotationTemplate {
  uid: string;
  name: string;
  description: string | null;
  cloudinaryUrl: string;
  previewImageUrl: string | null;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string | null;
  /** Only on the response to an upload: problems found in the HTML (e.g. a hard-coded currency symbol). */
  warnings?: string[] | null;
}

export async function getQuotationTemplates(): Promise<QuotationTemplate[]> {
  return backendJson<QuotationTemplate[]>("/api/quotation-templates");
}
