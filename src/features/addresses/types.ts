import type { Address, AddressType } from "@/lib/addresses";

export type { Address, AddressType };

export interface AddressPayload {
  label: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  streetFirst: string;
  contactNumber: string;
  contactEmail: string;
  addressTypes: AddressType[];
  gstin: string;
  tripDestination: string;
  primaryAddress: boolean;
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
