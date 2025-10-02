import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FavoriteModel } from '../../models/FavoriteModel';
import {
  fetchFavoritesThunk,
  addFavoriteThunk,
  removeFavoriteThunk,
} from '../actions/favoriteAction';

interface FavoriteState {
  items: FavoriteModel[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: FavoriteState = {
  items: [],
  loading: false,
  error: null,
  successMessage: null,
};

const favoriteSlice = createSlice({
  name: 'favorite',
  initialState,
  reducers: {
    clearFavoriteMessages: state => {
      state.error = null;
      state.successMessage = null;
    },
    resetFavorites: state => {
      state.items = [];
      state.loading = false;
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchFavoritesThunk.pending, state => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(addFavoriteThunk.pending, state => {
        state.loading = true;
        state.successMessage = null;
      })
      .addCase(
        addFavoriteThunk.fulfilled,
        (state, action: PayloadAction<FavoriteModel>) => {
          state.loading = false;
          const index = state.items.findIndex(
            f => f._id === action.payload._id,
          );
          if (index >= 0) {
            state.items[index] = action.payload;
            state.successMessage = 'Updated favorite successfully';
          } else {
            state.items.unshift(action.payload);
            state.successMessage = 'Added to favorites';
          }
        },
      )
      .addCase(
        addFavoriteThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading = false;
          state.error = action.payload || 'Failed to add favorite';
        },
      )
      .addCase(removeFavoriteThunk.pending, state => {
        state.loading = true;
        state.successMessage = null;
      })
      .addCase(
        removeFavoriteThunk.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.loading = false;
          state.items = state.items.filter(f => f._id !== action.payload);
          state.successMessage = 'Removed from favorites';
        },
      )
      .addCase(
        removeFavoriteThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading = false;
          state.error = action.payload || 'Failed to remove favorite';
        },
      )
      .addCase(
        fetchFavoritesThunk.fulfilled,
        (state, action: PayloadAction<FavoriteModel[]>) => {
          state.loading = false;
          state.items = action.payload;
          state.successMessage = 'Loaded favorites successfully';
        },
      )
      .addCase(
        fetchFavoritesThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading = false;
          state.error = action.payload || 'Failed to fetch favorites';
        },
      );
  },
});

export const { clearFavoriteMessages, resetFavorites } = favoriteSlice.actions;
export const favoriteReducer = favoriteSlice.reducer;
export const favoriteSelector = (state: { favorite: FavoriteState }) =>
  state.favorite.items;
export const favoriteLoadingSelector = (state: { favorite: FavoriteState }) =>
  state.favorite.loading;
export const favoriteErrorSelector = (state: { favorite: FavoriteState }) =>
  state.favorite.error;
export const favoriteSuccessSelector = (state: { favorite: FavoriteState }) =>
  state.favorite.successMessage;
