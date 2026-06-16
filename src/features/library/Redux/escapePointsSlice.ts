import { createSlice } from "@reduxjs/toolkit";
import { createEscapePoint, getAllEscapePoints } from "./escapePointsThunk";

interface EscapePoint {
  id: number;
  name: string;
}
interface EscapePointsState {
  getAllEscapePointsData: EscapePoint[];
  getAllEscapePointsLoading: boolean;
  getAllEscapePointsError: string | null;

  createEscapePointData: EscapePoint | null;
  createEscapePointLoading: boolean;
  createEscapePointError: string | null;
}

const initialState: EscapePointsState = {
  getAllEscapePointsData: [],
  getAllEscapePointsLoading: false,
  getAllEscapePointsError: null,

  createEscapePointData: null,
  createEscapePointLoading: false,
  createEscapePointError: null,
};

const escapePointsSlice = createSlice({
  name: "escapePoints",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getAllEscapePoints.pending, (state) => {
        state.getAllEscapePointsLoading = true;
        state.getAllEscapePointsError = null;
      })
      .addCase(getAllEscapePoints.fulfilled, (state, action) => {
        state.getAllEscapePointsLoading = false;
        state.getAllEscapePointsData = action.payload.data;
      })
      .addCase(getAllEscapePoints.rejected, (state, action) => {
        state.getAllEscapePointsLoading = false;
        state.getAllEscapePointsError =
          action.error.message || "Something went wrong";
      })

      .addCase(createEscapePoint.pending, (state) => {
        state.createEscapePointLoading = true;
        state.createEscapePointError = null;
      })
      .addCase(createEscapePoint.fulfilled, (state, action) => {
        state.createEscapePointLoading = false;
        state.createEscapePointData = action.payload.data;
      })
      .addCase(createEscapePoint.rejected, (state, action) => {
        state.createEscapePointLoading = false;
        state.createEscapePointError =
          action.error.message || "Something went wrong";
      });
  },
});

export default escapePointsSlice.reducer;
