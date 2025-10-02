import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SizeModel } from '../../models/SizeModel';
import { fetchSizesThunk, fetchSizeByIdThunk } from '../actions/sizeAction';

interface SizeState {
  sizes: SizeModel[];
  selectedSize: SizeModel | null;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: SizeState = {
  sizes: [],
  selectedSize: null,
  loading: false,
  error: null,
  successMessage: null,
};

const sizeSlice = createSlice({
  name: 'size',
  initialState,
  reducers: {
    clearSizeMessages: state => {
      state.error = null;
      state.successMessage = null;
    },
    clearSelectedSize: state => {
      state.selectedSize = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchSizesThunk.pending, state => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(
        fetchSizesThunk.fulfilled,
        (state, action: PayloadAction<SizeModel[]>) => {
          state.loading = false;
          state.sizes = action.payload;
          state.successMessage = 'Loaded sizes successfully';
        },
      )
      .addCase(fetchSizesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Failed to load sizes';
        state.sizes = [];
      });
    builder
      .addCase(fetchSizeByIdThunk.pending, state => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(
        fetchSizeByIdThunk.fulfilled,
        (state, action: PayloadAction<SizeModel>) => {
          state.loading = false;
          state.selectedSize = action.payload;
          state.successMessage = 'Loaded size successfully';
        },
      )
      .addCase(fetchSizeByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || 'Failed to load size detail';
      });
  },
});

export const { clearSizeMessages, clearSelectedSize } = sizeSlice.actions;
export const sizeReducer = sizeSlice.reducer;
export const sizesSelector = (state: { size: SizeState }) => state.size.sizes;
export const selectedSizeSelector = (state: { size: SizeState }) =>
  state.size.selectedSize;
export const sizeLoadingSelector = (state: { size: SizeState }) =>
  state.size.loading;
export const sizeErrorSelector = (state: { size: SizeState }) =>
  state.size.error;
export const sizeSuccessSelector = (state: { size: SizeState }) =>
  state.size.successMessage;
