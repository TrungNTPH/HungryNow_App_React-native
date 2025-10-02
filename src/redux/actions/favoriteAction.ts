import { createAsyncThunk } from '@reduxjs/toolkit';
import { favoriteApi } from '../../apis/favoriteApi';
import { FavoriteModel } from '../../models/FavoriteModel';

export const addFavoriteThunk = createAsyncThunk<
  FavoriteModel,
  { itemId: string; itemType: 'Food' | 'Combo' },
  { rejectValue: string }
>('favorite/addFavorite', async (data, thunkAPI) => {
  try {
    const res = await favoriteApi.addFavorite(data);
    return res.data;
  } catch (err: any) {
    return thunkAPI.rejectWithValue('Failed to add favorite');
  }
});

export const removeFavoriteThunk = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>('favorite/removeFavorite', async (favoriteId, thunkAPI) => {
  try {
    await favoriteApi.deleteFavorite(favoriteId);
    return favoriteId;
  } catch (err: any) {
    return thunkAPI.rejectWithValue('Failed to remove favorite');
  }
});

export const fetchFavoritesThunk = createAsyncThunk<
  FavoriteModel[],
  void,
  { rejectValue: string }
>('favorite/fetchFavorites', async (_, thunkAPI) => {
  try {
    const res = await favoriteApi.getMyFavorites();
    return res.data;
  } catch (err: any) {
    return thunkAPI.rejectWithValue(
      err.response?.data?.message || 'Failed to fetch favorites',
    );
  }
});
