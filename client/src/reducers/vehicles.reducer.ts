import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { VehiclesState, Vehicle } from "../types/vehicle";
import {
  getAllVehicles,
  getVehicleById,
  searchVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  uploadVehicleDocument,
  deleteVehicleDocument,
} from "../actions/vehicles.actions";

const initialState: VehiclesState = {
  vehicles: [],
  isLoading: false,
  error: undefined,
  selectedVehicleId: undefined,
  totalPages: 0,
  currentPage: 1,
};

const vehiclesSlice = createSlice({
  name: "vehicles",
  initialState,
  reducers: {
    setSelectedVehicle: (state, action: PayloadAction<string | undefined>) => {
      state.selectedVehicleId = action.payload;
    },
    clearError: (state) => {
      state.error = undefined;
    },
  },
  extraReducers: (builder) => {
    // ─── Get all vehicles ──────────────────────────────
    builder
      .addCase(getAllVehicles.pending, (state) => {
        state.isLoading = true;
        state.error = undefined;
      })
      .addCase(
        getAllVehicles.fulfilled,
        (state, action: PayloadAction<Vehicle[]>) => {
          state.isLoading = false;
          state.vehicles = action.payload;
        },
      )
      .addCase(getAllVehicles.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ─── Get vehicle by ID ────────────────────────────
    builder
      .addCase(getVehicleById.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(
        getVehicleById.fulfilled,
        (state, action: PayloadAction<Vehicle>) => {
          state.isLoading = false;
          const index = state.vehicles.findIndex(
            (v) => v._id === action.payload._id,
          );
          if (index !== -1) {
            state.vehicles[index] = action.payload;
          } else {
            state.vehicles.push(action.payload);
          }
        },
      )
      .addCase(getVehicleById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ─── Search vehicles ──────────────────────────────
    builder
      .addCase(searchVehicles.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(
        searchVehicles.fulfilled,
        (state, action: PayloadAction<Vehicle[]>) => {
          state.isLoading = false;
          state.vehicles = action.payload;
        },
      )
      .addCase(searchVehicles.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ─── Create vehicle ────────────────────────────────
    builder
      .addCase(createVehicle.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(
        createVehicle.fulfilled,
        (state, action: PayloadAction<Vehicle>) => {
          state.isLoading = false;
          state.vehicles.unshift(action.payload);
        },
      )
      .addCase(createVehicle.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ─── Update vehicle ────────────────────────────────
    builder
      .addCase(updateVehicle.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(
        updateVehicle.fulfilled,
        (state, action: PayloadAction<Vehicle>) => {
          state.isLoading = false;
          const index = state.vehicles.findIndex(
            (v) => v._id === action.payload._id,
          );
          if (index !== -1) {
            state.vehicles[index] = action.payload;
          }
        },
      )
      .addCase(updateVehicle.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ─── Delete vehicle ────────────────────────────────
    builder
      .addCase(deleteVehicle.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(
        deleteVehicle.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.isLoading = false;
          state.vehicles = state.vehicles.filter(
            (v) => v._id !== action.payload,
          );
        },
      )
      .addCase(deleteVehicle.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ─── Upload document ───────────────────────────────
    builder
      .addCase(uploadVehicleDocument.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(
        uploadVehicleDocument.fulfilled,
        (state, action: PayloadAction<Vehicle>) => {
          state.isLoading = false;
          const index = state.vehicles.findIndex(
            (v) => v._id === action.payload._id,
          );
          if (index !== -1) {
            state.vehicles[index] = action.payload;
          }
        },
      )
      .addCase(uploadVehicleDocument.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ─── Delete document ───────────────────────────────
    builder
      .addCase(deleteVehicleDocument.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(
        deleteVehicleDocument.fulfilled,
        (state, action: PayloadAction<Vehicle>) => {
          state.isLoading = false;
          const index = state.vehicles.findIndex(
            (v) => v._id === action.payload._id,
          );
          if (index !== -1) {
            state.vehicles[index] = action.payload;
          }
        },
      )
      .addCase(deleteVehicleDocument.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSelectedVehicle, clearError } = vehiclesSlice.actions;
export default vehiclesSlice.reducer;
