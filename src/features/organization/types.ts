import type { Organization, LogoShape } from "@/lib/organization";

export type { Organization, LogoShape };

export interface UpdateOrganizationPayload {
  uid: string;
  display_name: string;
  registered_name: string;
  support_ph_num: string;
  logo_file: string | null;
  logo_shape: LogoShape;
}
