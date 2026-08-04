import type { RootState } from "@/store/store";

export const selectAddresses = (state: RootState) => state.addresses.items;
export const selectAddressesStatus = (state: RootState) => state.addresses.status;
export const selectAddressesError = (state: RootState) => state.addresses.error;
export const selectAddressSaveStatus = (state: RootState) => state.addresses.saveStatus;
export const selectAddressSaveError = (state: RootState) => state.addresses.saveError;
export const selectAddressUpdateStatus = (state: RootState) => state.addresses.updateStatus;
export const selectAddressUpdateError = (state: RootState) => state.addresses.updateError;
export const selectAddressDeleteStatus = (state: RootState) => state.addresses.deleteStatus;
export const selectAddressDeleteError = (state: RootState) => state.addresses.deleteError;
