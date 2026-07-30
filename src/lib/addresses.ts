import { backendJson } from "@/lib/backend";

export interface Address {
  id: number;
  label: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  streetFirst: string;
  contactNumber: string | null;
  contactEmail: string | null;
}

export async function getAddresses(orgId: number): Promise<Address[]> {
  return backendJson<Address[]>(`/api/addresses/${orgId}`);
}
