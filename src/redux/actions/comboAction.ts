import { createAsyncThunk } from '@reduxjs/toolkit';
import { comboApi } from '../../apis/comboApi';
import { ComboModel } from '../../models/ComboModel';

export const fetchCombosThunk = createAsyncThunk<
  ComboModel[],
  void,
  { rejectValue: string }
>('combo/fetchAllCombos', async (_, { rejectWithValue }) => {
  try {
    const res = await comboApi.getCombos();
    return res.data;
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to fetch combos');
  }
});

export const fetchPaginatedCombosThunk = createAsyncThunk<
  { data: ComboModel[]; pagination: any },
  { page: number; limit: number },
  { rejectValue: string }
>(
  'combo/fetchPaginatedCombos',
  async ({ page, limit }, { rejectWithValue }) => {
    try {
      const res = await comboApi.getPaginatedCombos(page, limit);
      return {
        data: res.data,
        pagination: res.pagination,
      };
    } catch (error: any) {
      return rejectWithValue(
        error.message || 'Failed to fetch paginated combos',
      );
    }
  },
);

export const fetchCombosByCategoryThunk = createAsyncThunk<
  ComboModel[],
  string | null,
  { rejectValue: string }
>('combo/fetchCombosByCategory', async (categoryId, { rejectWithValue }) => {
  try {
    const res = await comboApi.getComboByCategory(categoryId);
    return res.data;
  } catch (error: any) {
    return rejectWithValue(
      error.message || 'Failed to fetch combos by category',
    );
  }
});
