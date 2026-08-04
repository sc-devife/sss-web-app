import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

// Replaces SidebarProvider's React Context. collapsed = desktop
// expanded/icon-only mode (persisted to localStorage, same as before);
// mobileOpen = mobile drawer visibility. activeModal is a generic slot for
// cross-component modal state going forward (Stage 1 doesn't migrate any
// existing modal onto it yet — Modal components still manage their own
// local open/close state, this is just available for later stages).
interface UiState {
  collapsed: boolean;
  mobileOpen: boolean;
  activeModal: string | null;
}

const initialState: UiState = {
  collapsed: false,
  mobileOpen: false,
  activeModal: null,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setCollapsed(state, action: PayloadAction<boolean>) {
      state.collapsed = action.payload;
    },
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

export const { setCollapsed, setMobileOpen, toggleMobile, closeMobile, openModal, closeModal } = uiSlice.actions;
export default uiSlice.reducer;
