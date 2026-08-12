import { backendJson } from "@/lib/backend";

export type LogoShape = "round" | "square" | "rectangle";

export interface Organization {
  seqp: number;
  uid: string;
  registered_name: string;
  display_name: string;
  org_code: string | null;
  support_ph_num: string | null;
  country_code: string | null;
  default_currency_code: string | null;
  logo_file: string | null;
  logo_shape: LogoShape;
  status: "ACTIVE" | "SUSPENDED";
  quote_template_id: string | null;
  invoice_template_id: string | null;
  auto_assign_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export async function getMyOrganization(): Promise<Organization> {
  return backendJson<Organization>("/organizations/mine");
}
