import { createAsyncThunk } from '@reduxjs/toolkit';
import { categoryApi } from '../../apis/categoryApi';
import { CategoryModel } from '../../models/CategoryModel';
import { FoodModel } from '../../models/FoodModel';
import { ComboModel } from '../../models/ComboModel';

export const fetchCategoriesThunk = createAsyncThunk<
  CategoryModel[],
  void,
  { rejectValue: string }
>('category/fetchAllCategories', async (_, { rejectWithValue }) => {
  try {
    const res = await categoryApi.getCategories();
    if (!res.data) throw new Error('Data not found');
    return res.data;
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to fetch categories');
  }
});

export const fetchFoodsAndCombosByCategoryThunk = createAsyncThunk<
  { foods: FoodModel[]; combos: ComboModel[] },
  { categoryId: string; page: number; limit: number },
  { rejectValue: string }
>(
  'category/fetchFoodsAndCombosByCategory',
  async ({ categoryId, page, limit }, { rejectWithValue }) => {
    try {
      const res = await categoryApi.getFoodsAndCombosByCategory(
        categoryId,
        page,
        limit,
      );
      if (!res.data) throw new Error('Data not found');
      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error.message || 'Failed to fetch foods and combos',
      );
    }
  },
);
