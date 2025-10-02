import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  CreateRatingPayload,
  PendingRatingModel,
  RatingModel,
} from '../../models/RatingModel';
import { ratingApi } from '../../apis/ratingApi';

interface AvgStarsPayload {
  itemId: string;
  avgStars: number;
  totalRatings: number;
}

export const addRatingThunk = createAsyncThunk<
  {
    rating: RatingModel;
    average: {
      averageStars: number;
      totalRatings: number;
    };
  },
  CreateRatingPayload,
  { rejectValue: string }
>('rating/addRating', async (payload, thunkAPI) => {
  try {
    const res = await ratingApi.addRating(payload);
    return res.data;
  } catch (err: any) {
    return thunkAPI.rejectWithValue('Failed to add rating');
  }
});
export const fetchRatingsThunk = createAsyncThunk<
  RatingModel[],
  { itemId: string; itemType: 'Food' | 'Combo'; stars?: number },
  { rejectValue: string }
>('rating/fetchRatings', async ({ itemId, itemType, stars }, thunkAPI) => {
  try {
    const res = await ratingApi.getRatings({ itemId, itemType, stars });
    return res.data;
  } catch (err: any) {
    return thunkAPI.rejectWithValue('Failed to fetch ratings');
  }
});

export const fetchAverageStarsThunk = createAsyncThunk<
  { itemId: string; avgStars: number; totalRatings: number },
  { itemId: string; itemType: 'Food' | 'Combo' },
  { rejectValue: string }
>('rating/fetchAverageStars', async ({ itemId, itemType }, thunkAPI) => {
  try {
    const res = await ratingApi.getAverageStars({ itemId, itemType });
    return {
      itemId,
      avgStars: res.data.average,
      totalRatings: res.data.total,
    };
  } catch (err: any) {
    return thunkAPI.rejectWithValue('Failed to fetch average rating');
  }
});

export const fetchAllFoodAvgStarsThunk = createAsyncThunk<
  AvgStarsPayload[],
  void,
  { rejectValue: string }
>('rating/fetchAllFoodAvgStars', async (_, thunkAPI) => {
  try {
    const res = await ratingApi.getAllFoodAvgStars();
    return res.data.map(item => ({
      itemId: item.item._id,
      avgStars: item.avgStars,
      totalRatings: item.totalRatings,
    }));
  } catch (err: any) {
    return thunkAPI.rejectWithValue('Failed to fetch food avg stars');
  }
});

export const fetchAllComboAvgStarsThunk = createAsyncThunk<
  AvgStarsPayload[],
  void,
  { rejectValue: string }
>('rating/fetchAllComboAvgStars', async (_, thunkAPI) => {
  try {
    const res = await ratingApi.getAllComboAvgStars();
    return res.data.map(item => ({
      itemId: item.item._id,
      avgStars: item.avgStars,
      totalRatings: item.totalRatings,
    }));
  } catch (err: any) {
    return thunkAPI.rejectWithValue('Failed to fetch combo avg stars');
  }
});

export const fetchPendingRatingsThunk = createAsyncThunk<
  PendingRatingModel[],
  void,
  { rejectValue: string }
>('rating/fetchPendingRatings', async (_, thunkAPI) => {
  try {
    const res = await ratingApi.getPendingRatings();
    return res.data;
  } catch (err: any) {
    return thunkAPI.rejectWithValue('Failed to fetch pending ratings');
  }
});
