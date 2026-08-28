import { backendJson } from "@/lib/backend";

export type AddressType = "CONTACT" | "BILLING";

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
  addressTypes: AddressType[] | null;
  gstin: string | null;
  tripDestination: string | null;
  primaryAddress: boolean | null;
}

export async function getAddresses(orgId: string): Promise<Address[]> {
  return backendJson<Address[]>(`/api/addresses/${orgId}`);
}
