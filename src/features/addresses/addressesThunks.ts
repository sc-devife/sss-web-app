import { createAsyncThunk } from "@reduxjs/toolkit";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import type {
  Address,
  CreateAddressPayload,
  UpdateAddressPayload,
  DeleteAddressPayload,
} from "@/features/addresses/types";

export const fetchAddresses = createAsyncThunk<Address[], string, { rejectValue: string }>(
  "addresses/fetchAddresses",
  async (orgId, { rejectWithValue }) => {
    try {
      const res = await clientApi.get<Address[]>(`/addresses/${orgId}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load addresses"));
    }
  },
);

export const createAddress = createAsyncThunk<void, CreateAddressPayload, { rejectValue: string }>(
  "addresses/createAddress",
  async ({ orgId, payload }, { rejectWithValue }) => {
    try {
      await clientApi.post("/addresses", { orgId, ...payload });
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to add address"));
    }
  },
);

export const updateAddress = createAsyncThunk<void, UpdateAddressPayload, { rejectValue: string }>(
  "addresses/updateAddress",
  async ({ orgId, addressId, payload }, { rejectWithValue }) => {
    try {
      await clientApi.put("/addresses", { orgId, addressId, ...payload });
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to update address"));
    }
  },
);

export const deleteAddress = createAsyncThunk<void, DeleteAddressPayload, { rejectValue: string }>(
  "addresses/deleteAddress",
  async ({ orgId, addressId }, { rejectWithValue }) => {
    try {
      await clientApi.delete("/addresses", { data: { orgId, addressId } });
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to delete address"));
    }
  },
);
