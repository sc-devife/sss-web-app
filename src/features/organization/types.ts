import type { Organization, OrganizationSettings, LogoShape } from "@/lib/organization";

export type { Organization, OrganizationSettings, LogoShape };

export interface UpdateOrganizationSettingsPayload {
  auto_assign_enabled?: boolean;
  default_currency_code?: string;
  quote_template_id?: string | null;
  invoice_template_id?: string | null;
  timezone?: string;
  default_locale?: string;
  default_payment_terms_days?: number;
  brand_primary_color?: string;
}

export interface UpdateOrganizationPayload {
  uid: string;
  display_name?: string;
  registered_name?: string;
  support_ph_num?: string;
  logo_file?: string | null;
  logo_shape?: LogoShape;
  country_code?: string;
  pan?: string;
  legal_entity_type?: string;
  cin?: string;
  business_email?: string;
  website_url?: string;
  whatsapp_number?: string;
  tagline?: string;
  about_text?: string;
  industry_accreditation?: string;
}
