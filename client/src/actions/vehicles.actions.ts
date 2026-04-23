import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import type { Vehicle, VehicleForm } from "../types/vehicle";

// ─── Helper: Clean empty strings to null ─────────────
function cleanVehicleData(data: VehicleForm | Partial<VehicleForm>) {
  return Object.entries(data).reduce(
    (acc, [key, value]) => ({
      ...acc,
      [key]: value === "" ? null : value,
    }),
    {} as VehicleForm | Partial<VehicleForm>,
  );
}

// ─── Fetch all vehicles ──────────────────────────────
export const getAllVehicles = createAsyncThunk(
  "vehicles/getAllVehicles",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get("/api/vehicles", {
        withCredentials: true,
      });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          error.response?.data?.message || "Error fetching vehicles",
        );
      }
      return rejectWithValue("Unknown error occurred");
    }
  },
);

// ─── Fetch vehicle by ID ────────────────────────────
export const getVehicleById = createAsyncThunk(
  "vehicles/getVehicleById",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/vehicles/${id}`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          error.response?.data?.message || "Error fetching vehicle",
        );
      }
      return rejectWithValue("Unknown error occurred");
    }
  },
);

// ─── Search vehicles ────────────────────────────────
export const searchVehicles = createAsyncThunk(
  "vehicles/searchVehicles",
  async (
    params: {
      q?: string;
      marque?: string;
      modele?: string;
      assignedTo?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.q) queryParams.append("q", params.q);
      if (params.marque) queryParams.append("marque", params.marque);
      if (params.modele) queryParams.append("modele", params.modele);
      if (params.assignedTo)
        queryParams.append("assignedTo", params.assignedTo);

      const response = await axios.get(
        `/api/vehicles/search?${queryParams.toString()}`,
        { withCredentials: true },
      );
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          error.response?.data?.message || "Error searching vehicles",
        );
      }
      return rejectWithValue("Unknown error occurred");
    }
  },
);

// ─── Create vehicle ────────────────────────────────
export const createVehicle = createAsyncThunk(
  "vehicles/createVehicle",
  async (vehicleData: VehicleForm, { rejectWithValue }) => {
    try {
      const cleanedData = cleanVehicleData(vehicleData);
      const response = await axios.post("/api/vehicles", cleanedData, {
        withCredentials: true,
      });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          error.response?.data?.message || "Error creating vehicle",
        );
      }
      return rejectWithValue("Unknown error occurred");
    }
  },
);

// ─── Update vehicle ────────────────────────────────
export const updateVehicle = createAsyncThunk(
  "vehicles/updateVehicle",
  async (
    { id, data }: { id: string; data: Partial<VehicleForm> },
    { rejectWithValue },
  ) => {
    try {
      const cleanedData = cleanVehicleData(data);
      const response = await axios.put(`/api/vehicles/${id}`, cleanedData, {
        withCredentials: true,
      });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          error.response?.data?.message || "Error updating vehicle",
        );
      }
      return rejectWithValue("Unknown error occurred");
    }
  },
);

// ─── Delete vehicle ────────────────────────────────
export const deleteVehicle = createAsyncThunk(
  "vehicles/deleteVehicle",
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/vehicles/${id}`, { withCredentials: true });
      return id;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          error.response?.data?.message || "Error deleting vehicle",
        );
      }
      return rejectWithValue("Unknown error occurred");
    }
  },
);

// ─── Upload document ───────────────────────────────
export const uploadVehicleDocument = createAsyncThunk(
  "vehicles/uploadDocument",
  async (
    { id, formData }: { id: string; formData: FormData },
    { rejectWithValue },
  ) => {
    try {
      const response = await axios.post(
        `/api/vehicles/${id}/documents`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        },
      );
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          error.response?.data?.message || "Error uploading document",
        );
      }
      return rejectWithValue("Unknown error occurred");
    }
  },
);

// ─── Delete document ───────────────────────────────
export const deleteVehicleDocument = createAsyncThunk(
  "vehicles/deleteDocument",
  async (
    { vehicleId, docId }: { vehicleId: string; docId: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await axios.delete(
        `/api/vehicles/${vehicleId}/documents/${docId}`,
        { withCredentials: true },
      );
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          error.response?.data?.message || "Error deleting document",
        );
      }
      return rejectWithValue("Unknown error occurred");
    }
  },
);
