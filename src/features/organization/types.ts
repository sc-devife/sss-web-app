import type { Organization } from "@/lib/organization";

export type { Organization };

export interface UpdateOrganizationPayload {
  uid: string;
  display_name: string;
  registered_name: string;
  support_ph_num: string;
  logo_file: string | null;
}
