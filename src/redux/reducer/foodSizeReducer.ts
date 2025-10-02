import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  fetchFoodSizesByFoodIdThunk,
  fetchFoodSizesThunk,
} from '../actions/foodSizeAction';
import { FoodSizeModel } from '../../models/FoodSizeModel';

interface FoodSizeState {
  foodSizes: FoodSizeModel[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: FoodSizeState = {
  foodSizes: [],
  loading: false,
  error: null,
  successMessage: null,
};

const foodSizeSlice = createSlice({
  name: 'foodSize',
  initialState,
  reducers: {
    clearFoodSizeMessages: state => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchFoodSizesThunk.pending, state => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(
        fetchFoodSizesThunk.fulfilled,
        (state, action: PayloadAction<FoodSizeModel[]>) => {
          state.loading = false;
          state.foodSizes = action.payload;
          state.successMessage = 'Loaded all food sizes successfully';
        },
      )
      .addCase(fetchFoodSizesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load food sizes';
      });

    builder
      .addCase(fetchFoodSizesByFoodIdThunk.pending, state => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(
        fetchFoodSizesByFoodIdThunk.fulfilled,
        (state, action: PayloadAction<FoodSizeModel[]>) => {
          state.loading = false;
          state.foodSizes = action.payload;
          state.successMessage = 'Loaded food sizes by food successfully';
        },
      )
      .addCase(fetchFoodSizesByFoodIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load food sizes by food';
      });
  },
});

export const { clearFoodSizeMessages } = foodSizeSlice.actions;
export const foodSizeReducer = foodSizeSlice.reducer;
export const foodSizeSelector = (state: { foodSize: FoodSizeState }) =>
  state.foodSize.foodSizes;
export const foodSizeLoadingSelector = (state: { foodSize: FoodSizeState }) =>
  state.foodSize.loading;
export const foodSizeErrorSelector = (state: { foodSize: FoodSizeState }) =>
  state.foodSize.error;
export const foodSizeSuccessSelector = (state: { foodSize: FoodSizeState }) =>
  state.foodSize.successMessage;
