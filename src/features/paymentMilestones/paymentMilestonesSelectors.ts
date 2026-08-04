import type { RootState } from "@/store/store";

export const selectPaymentMilestones = (state: RootState) => state.paymentMilestones.items;
export const selectPaymentMilestonesStatus = (state: RootState) => state.paymentMilestones.status;
export const selectPaymentMilestonesError = (state: RootState) => state.paymentMilestones.error;
export const selectPaymentMilestoneSaveStatus = (state: RootState) => state.paymentMilestones.saveStatus;
export const selectPaymentMilestoneSaveError = (state: RootState) => state.paymentMilestones.saveError;
