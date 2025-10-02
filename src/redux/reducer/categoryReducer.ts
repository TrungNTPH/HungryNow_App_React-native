import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  fetchCategoriesThunk,
  fetchFoodsAndCombosByCategoryThunk,
} from '../actions/categoryActions';
import { CategoryModel } from '../../models/CategoryModel';
import { FoodModel } from '../../models/FoodModel';
import { ComboModel } from '../../models/ComboModel';

interface CategoryState {
  categories: CategoryModel[];
  foods: FoodModel[];
  combos: ComboModel[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: CategoryState = {
  categories: [],
  foods: [],
  combos: [],
  loading: false,
  error: null,
  successMessage: null,
};

const categorySlice = createSlice({
  name: 'category',
  initialState,
  reducers: {
    clearCategoryMessages: state => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchCategoriesThunk.pending, state => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(
        fetchCategoriesThunk.fulfilled,
        (state, action: PayloadAction<CategoryModel[]>) => {
          state.loading = false;
          state.categories = action.payload;
          state.successMessage = 'Loaded categories successfully';
        },
      )
      .addCase(fetchCategoriesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load categories';
      })
      .addCase(fetchFoodsAndCombosByCategoryThunk.pending, state => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(
        fetchFoodsAndCombosByCategoryThunk.fulfilled,
        (
          state,
          action: PayloadAction<{ foods: FoodModel[]; combos: ComboModel[] }>,
        ) => {
          state.loading = false;
          state.foods = action.payload.foods;
          state.combos = action.payload.combos;
          state.successMessage = 'Loaded foods and combos successfully';
        },
      )
      .addCase(fetchFoodsAndCombosByCategoryThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load foods and combos';
      });
  },
});

export const { clearCategoryMessages } = categorySlice.actions;
export const categoryReducer = categorySlice.reducer;
export const categorySelector = (state: { category: CategoryState }) =>
  state.category.categories;
export const categoryLoadingSelector = (state: { category: CategoryState }) =>
  state.category.loading;
export const categoryErrorSelector = (state: { category: CategoryState }) =>
  state.category.error;
export const categorySuccessSelector = (state: { category: CategoryState }) =>
  state.category.successMessage;
