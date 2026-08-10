import type { Address } from "@/lib/addresses";

export type { Address };

export interface AddressPayload {
  label: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  streetFirst: string;
  contactNumber: string;
  contactEmail: string;
}

export interface CreateAddressPayload {
  orgId: string;
  payload: AddressPayload;
}

export interface UpdateAddressPayload {
  orgId: string;
  addressId: string;
  payload: AddressPayload;
}

export interface DeleteAddressPayload {
  orgId: string;
  addressId: string;
}
