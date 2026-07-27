import { backendJson } from "@/lib/backend";

export interface Organization {
  seqp: number;
  uid: string;
  registered_name: string;
  display_name: string;
  support_ph_num: string | null;
  country_code: string | null;
  default_currency_code: string | null;
  logo_file: string | null;
  status: "ACTIVE" | "SUSPENDED";
  created_at: string;
  updated_at: string;
}

export async function getMyOrganization(): Promise<Organization> {
  return backendJson<Organization>("/organizations/mine");
}
