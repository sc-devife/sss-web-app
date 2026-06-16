import { createAsyncThunk } from "@reduxjs/toolkit";
import escapePointsApi from "../../../api/escapePointsApi";
import AppToast from "../../../services/toastService";
import App from "../../../app/App";

export const getAllEscapePoints = createAsyncThunk(
  "escapePoints/getAllEscapePoints",
  async (_, { rejectWithValue }) => {
    try {
      const response = await escapePointsApi.getEscapePoints();
      console.log("Escape Points:", response.data);
      return response;
    } catch (error) {
      AppToast.showError("Error fetching escape points");
      return rejectWithValue(error || "Something went wrong");
    }
  },
);

export const createEscapePoint = createAsyncThunk(
  "escapePoints/createEscapePoint",
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await escapePointsApi.createEscapePoint(data);
      AppToast.showSuccess("Escape Point created successfully");
      return response;
    } catch (error) {
      AppToast.showError("Error creating escape point");
      return rejectWithValue(error || "Something went wrong");
    }
  },
);
