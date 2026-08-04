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
  orgId: number;
  payload: AddressPayload;
}

export interface UpdateAddressPayload {
  orgId: number;
  addressId: number;
  payload: AddressPayload;
}

export interface DeleteAddressPayload {
  orgId: number;
  addressId: number;
}
