import { createAsyncThunk } from '@reduxjs/toolkit';
import { foodSizeApi } from '../../apis/foodSizeApi';
import { FoodSizeModel } from '../../models/FoodSizeModel';

export const fetchFoodSizesThunk = createAsyncThunk<
  FoodSizeModel[],
  void,
  { rejectValue: string }
>('foodSize/fetchFoodSizes', async (_, { rejectWithValue }) => {
  try {
    const res = await foodSizeApi.getFoodSizes();
    return res.data;
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to fetch food sizes');
  }
});

export const fetchFoodSizesByFoodIdThunk = createAsyncThunk<
  FoodSizeModel[],
  string,
  { rejectValue: string }
>('foodSize/fetchByFoodId', async (foodId, { rejectWithValue }) => {
  try {
    const res = await foodSizeApi.getFoodSizesByFoodId(foodId);
    return res.data;
  } catch (error: any) {
    return rejectWithValue(
      error.message || 'Failed to fetch food sizes by foodId',
    );
  }
});
