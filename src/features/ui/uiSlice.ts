import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

// Replaces SidebarProvider's React Context. mobileOpen = mobile drawer
// visibility (also doubles as the desktop overlay panel's mobile role —
// Sidebar.tsx owns its own local `expanded` state for the desktop peek
// panel, not persisted here, since it's a transient overlay rather than a
// permanent layout mode). activeModal is a generic slot for cross-component
// modal state going forward (Stage 1 doesn't migrate any existing modal onto
// it yet — Modal components still manage their own local open/close state,
// this is just available for later stages).
interface UiState {
  mobileOpen: boolean;
  activeModal: string | null;
}

const initialState: UiState = {
  mobileOpen: false,
  activeModal: null,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setMobileOpen(state, action: PayloadAction<boolean>) {
      state.mobileOpen = action.payload;
    },
    toggleMobile(state) {
      state.mobileOpen = !state.mobileOpen;
    },
    closeMobile(state) {
      state.mobileOpen = false;
    },
    openModal(state, action: PayloadAction<string>) {
      state.activeModal = action.payload;
    },
    closeModal(state) {
      state.activeModal = null;
    },
  },
});

export const { setMobileOpen, toggleMobile, closeMobile, openModal, closeModal } = uiSlice.actions;
export default uiSlice.reducer;
