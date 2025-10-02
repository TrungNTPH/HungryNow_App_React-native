import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  fetchFoodsThunk,
  fetchFoodsByCategoryThunk,
  fetchPaginatedFoodsThunk,
  searchFoodsAndCombosThunk,
} from '../actions/foodActions';
import { fetchAverageStarsThunk } from '../actions/ratingAction';
import { FoodModel } from '../../models/FoodModel';
import { SearchItem } from '../../models/SearchModel';

interface FoodState {
  foods: FoodModel[];
  selectedFood: FoodModel | null;
  searchResults: SearchItem[];
  searchPagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };

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

const initialState: FoodState = {
  foods: [],
  selectedFood: null,

  searchResults: [],
  searchPagination: undefined,

  loading: false,
  error: null,
  successMessage: null,
  pagination: undefined,
};

const foodSlice = createSlice({
  name: 'food',
  initialState,
  reducers: {
    clearFoodMessages(state) {
      state.error = null;
      state.successMessage = null;
    },
    clearSelectedFood(state) {
      state.selectedFood = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchFoodsThunk.pending, state => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(
        fetchFoodsThunk.fulfilled,
        (state, action: PayloadAction<FoodModel[]>) => {
          state.loading = false;
          state.foods = action.payload;
          state.successMessage = 'Loaded foods successfully';
        },
      )
      .addCase(fetchFoodsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Failed to load foods';
      })
      .addCase(fetchFoodsByCategoryThunk.pending, state => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(
        fetchFoodsByCategoryThunk.fulfilled,
        (state, action: PayloadAction<FoodModel[]>) => {
          state.loading = false;
          state.foods = action.payload;
          state.successMessage = 'Loaded foods by category successfully';
        },
      )
      .addCase(fetchFoodsByCategoryThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || 'Failed to load foods by category';
      })
      .addCase(fetchPaginatedFoodsThunk.pending, state => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(fetchPaginatedFoodsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.foods = action.payload.data;
        state.pagination = action.payload.pagination;
        state.successMessage = 'Loaded paginated foods successfully';
      })
      .addCase(fetchPaginatedFoodsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || 'Failed to load paginated foods';
      })
      .addCase(searchFoodsAndCombosThunk.pending, state => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(
        searchFoodsAndCombosThunk.fulfilled,
        (
          state,
          action: PayloadAction<{
            data: SearchItem[];
            pagination: FoodState['searchPagination'];
          }>,
        ) => {
          state.loading = false;
          state.searchResults = action.payload.data;
          state.searchPagination = action.payload.pagination;
          state.successMessage = 'Loaded search results successfully';
        },
      )
      .addCase(searchFoodsAndCombosThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || 'Failed to load search results';
      })
      .addCase(fetchAverageStarsThunk.fulfilled, (state, action) => {
        const { itemId, avgStars } = action.payload as {
          itemId: string;
          avgStars: number;
        };

        const food = state.foods.find(f => f._id === itemId);
        if (food) (food as any).avgStars = avgStars;

        const searchItem = state.searchResults.find(i => i._id === itemId);
        if (searchItem) (searchItem as any).avgStars = avgStars;
      });
  },
});

export const { clearFoodMessages, clearSelectedFood } = foodSlice.actions;
export const foodReducer = foodSlice.reducer;
export const foodSelector = (state: { food: FoodState }) => state.food.foods;
export const selectedFoodSelector = (state: { food: FoodState }) =>
  state.food.selectedFood;
export const foodLoadingSelector = (state: { food: FoodState }) =>
  state.food.loading;
export const foodErrorSelector = (state: { food: FoodState }) =>
  state.food.error;
export const foodSuccessSelector = (state: { food: FoodState }) =>
  state.food.successMessage;
export const foodPaginationSelector = (state: { food: FoodState }) =>
  state.food.pagination;
export const searchResultsSelector = (state: { food: FoodState }) =>
  state.food.searchResults;
export const searchPaginationSelector = (state: { food: FoodState }) =>
  state.food.searchPagination;
