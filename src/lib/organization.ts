import { backendJson } from "@/lib/backend";

export type LogoShape = "round" | "square" | "rectangle";

export interface OrganizationSettings {
  auto_assign_enabled: boolean;
  default_currency_code: string | null;
  quote_template_id: string | null;
  invoice_template_id: string | null;
  timezone: string;
  default_locale: string;
  default_payment_terms_days: number | null;
  brand_primary_color: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Organization {
  seqp: number;
  uid: string;
  registered_name: string;
  display_name: string;
  org_code: string | null;
  support_ph_num: string | null;
  country_code: string | null;
  logo_file: string | null;
  logo_shape: LogoShape;
  status: "ACTIVE" | "SUSPENDED";
  pan: string | null;
  legal_entity_type: string | null;
  cin: string | null;
  business_email: string | null;
  website_url: string | null;
  whatsapp_number: string | null;
  tagline: string | null;
  about_text: string | null;
  industry_accreditation: string | null;
  created_at: string;
  updated_at: string;
  settings: OrganizationSettings | null;
}

export async function getMyOrganization(): Promise<Organization> {
  return backendJson<Organization>("/organizations/mine");
}
