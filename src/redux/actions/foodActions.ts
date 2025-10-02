import { createAsyncThunk } from '@reduxjs/toolkit';
import { foodApi } from '../../apis/foodApi';
import { FoodModel } from '../../models/FoodModel';
import { SearchItem } from '../../models/SearchModel';

const getErrorMessage = (error: any, fallback: string) =>
  error?.response?.data?.message || error?.message || fallback;

export const fetchFoodsThunk = createAsyncThunk<
  FoodModel[],
  void,
  { rejectValue: string }
>('food/fetchAllFoods', async (_, { rejectWithValue }) => {
  try {
    const res = await foodApi.getFoods();
    return res.data;
  } catch (error: any) {
    return rejectWithValue(getErrorMessage(error, 'Failed to fetch foods'));
  }
});

export const fetchFoodsByCategoryThunk = createAsyncThunk<
  FoodModel[],
  string | null,
  { rejectValue: string }
>('food/fetchFoodsByCategory', async (categoryId, { rejectWithValue }) => {
  try {
    const res = await foodApi.getFoodsByCategory(categoryId);
    return res.data;
  } catch (error: any) {
    return rejectWithValue(
      getErrorMessage(error, 'Failed to fetch foods by category'),
    );
  }
});

export const fetchPaginatedFoodsThunk = createAsyncThunk<
  { data: FoodModel[]; pagination: any },
  { page: number; limit: number },
  { rejectValue: string }
>('food/fetchPaginatedFoods', async ({ page, limit }, { rejectWithValue }) => {
  try {
    const res = await foodApi.getPaginatedFoods(page, limit);
    return { data: res.data, pagination: res.pagination };
  } catch (error: any) {
    return rejectWithValue(
      getErrorMessage(error, 'Failed to fetch paginated foods'),
    );
  }
});

export const searchFoodsAndCombosThunk = createAsyncThunk<
  { data: SearchItem[]; pagination: any },
  {
    name?: string;
    categoryId?: string;
    sizeId?: string;
    minStars?: number;
    status?: 'available' | 'unavailable';
    type?: 'Food' | 'Combo' | 'All';
    sort?:
      | '-createdAt'
      | 'createdAt'
      | '-rating'
      | 'rating'
      | '-price'
      | 'price';
    page?: number;
    limit?: number;
  },
  { rejectValue: string }
>('food/searchFoodsAndCombos', async (params, { rejectWithValue }) => {
  try {
    const res = await foodApi.searchFoodsAndCombos(params);
    return { data: res.data, pagination: res.pagination };
  } catch (error: any) {
    return rejectWithValue(getErrorMessage(error, 'Failed to search items'));
  }
});
