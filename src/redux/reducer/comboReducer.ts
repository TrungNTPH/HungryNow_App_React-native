import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  fetchCombosThunk,
  fetchCombosByCategoryThunk,
  fetchPaginatedCombosThunk,
} from '../actions/comboAction';
import { ComboModel } from '../../models/ComboModel';

interface ComboState {
  combos: ComboModel[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const initialState: ComboState = {
  combos: [],
  loading: false,
  error: null,
  successMessage: null,
  pagination: undefined,
};

const comboSlice = createSlice({
  name: 'combo',
  initialState,
  reducers: {
    clearComboMessages(state) {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchCombosThunk.pending, state => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(
        fetchCombosThunk.fulfilled,
        (state, action: PayloadAction<ComboModel[]>) => {
          state.loading = false;
          state.combos = action.payload;
          state.successMessage = 'Loaded combos successfully';
        },
      )
      .addCase(fetchCombosThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load combos';
      })
      .addCase(fetchCombosByCategoryThunk.pending, state => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(
        fetchCombosByCategoryThunk.fulfilled,
        (state, action: PayloadAction<ComboModel[]>) => {
          state.loading = false;
          state.combos = action.payload;
          state.successMessage = 'Loaded combos by category successfully';
        },
      )
      .addCase(fetchCombosByCategoryThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load combos by category';
      })
      .addCase(fetchPaginatedCombosThunk.pending, state => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(fetchPaginatedCombosThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.combos = action.payload.data;
        state.pagination = action.payload.pagination;
        state.successMessage = 'Loaded paginated combos successfully';
      })
      .addCase(fetchPaginatedCombosThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load paginated combos';
      });

  },
});

export const { clearComboMessages } = comboSlice.actions;
export const comboReducer = comboSlice.reducer;
export const comboSelector = (state: { combo: ComboState }) =>
  state.combo.combos;
export const comboLoadingSelector = (state: { combo: ComboState }) =>
  state.combo.loading;
export const comboErrorSelector = (state: { combo: ComboState }) =>
  state.combo.error;
export const comboSuccessSelector = (state: { combo: ComboState }) =>
  state.combo.successMessage;
export const comboPaginationSelector = (state: { combo: ComboState }) =>
  state.combo.pagination;
