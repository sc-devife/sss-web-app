import { backendJson } from "@/lib/backend";

export interface Address {
  uid: string;
  label: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  streetFirst: string;
  contactNumber: string | null;
  contactEmail: string | null;
}

export async function getAddresses(orgId: string): Promise<Address[]> {
  return backendJson<Address[]>(`/api/addresses/${orgId}`);
}
