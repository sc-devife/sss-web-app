import { backendJson } from "@/lib/backend";

export interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  accentColor: string;
}

export async function getInvoiceTemplates(): Promise<InvoiceTemplate[]> {
  return backendJson<InvoiceTemplate[]>("/api/invoice-templates");
}
