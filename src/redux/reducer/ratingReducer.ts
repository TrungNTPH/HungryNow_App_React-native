import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RatingModel, PendingRatingModel } from '../../models/RatingModel';
import {
  fetchRatingsThunk,
  fetchAverageStarsThunk,
  fetchAllFoodAvgStarsThunk,
  fetchAllComboAvgStarsThunk,
  fetchPendingRatingsThunk,
  addRatingThunk,
} from '../actions/ratingAction';

interface RatingState {
  ratings: RatingModel[];
  pendingRatings: PendingRatingModel[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  avgStarsMap: Record<string, number>;
  totalRatingsMap: Record<string, number>;
}

const initialState: RatingState = {
  ratings: [],
  pendingRatings: [],
  loading: false,
  error: null,
  successMessage: null,
  avgStarsMap: {},
  totalRatingsMap: {},
};

const ratingSlice = createSlice({
  name: 'rating',
  initialState,
  reducers: {
    setRatings(state, action: PayloadAction<RatingModel[]>) {
      state.ratings = action.payload;
    },
    clearRatingMessages(state) {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: builder => {
    builder.addCase(addRatingThunk.pending, state => {
      state.loading = true;
      state.successMessage = null;
      state.error = null;
    });

    builder.addCase(addRatingThunk.fulfilled, (state, action) => {
      state.loading = false;
      const newRating = action.payload.rating;

      const existingIndex = state.ratings.findIndex(
        r =>
          (typeof r.itemId === 'object' ? r.itemId._id : r.itemId) ===
            (typeof newRating.itemId === 'object'
              ? newRating.itemId._id
              : newRating.itemId) &&
          (typeof r.invoiceId === 'object' ? r.invoiceId._id : r.invoiceId) ===
            (typeof newRating.invoiceId === 'object'
              ? newRating.invoiceId._id
              : newRating.invoiceId),
      );

      if (existingIndex >= 0) {
        state.ratings[existingIndex] = newRating;
        state.successMessage = 'Rating updated successfully';
      } else {
        state.ratings.unshift(newRating);
        state.successMessage = 'Rating submitted successfully';
      }
      const { average } = action.payload;
      const itemId =
        typeof newRating.itemId === 'object'
          ? newRating.itemId._id
          : newRating.itemId;

      state.avgStarsMap[itemId] = average.averageStars;
      state.totalRatingsMap[itemId] = average.totalRatings;
    });

    builder.addCase(addRatingThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || 'Failed to submit rating';
    });
    builder.addCase(fetchRatingsThunk.pending, state => {
      state.loading = true;
      state.error = null;
      state.successMessage = null;
    });

    builder.addCase(
      fetchRatingsThunk.fulfilled,
      (state, action: PayloadAction<RatingModel[]>) => {
        state.loading = false;
        state.ratings = action.payload;
        state.successMessage = 'Loaded ratings successfully';
      },
    );
    builder.addCase(fetchRatingsThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || 'Failed to load ratings';
    });
    builder.addCase(fetchAverageStarsThunk.fulfilled, (state, action) => {
      const { itemId, avgStars, totalRatings } = action.payload;
      state.avgStarsMap[itemId] = avgStars;
      state.totalRatingsMap[itemId] = totalRatings;
    });
    builder.addCase(fetchAllFoodAvgStarsThunk.fulfilled, (state, action) => {
      action.payload.forEach(({ itemId, avgStars, totalRatings }) => {
        state.avgStarsMap[itemId] = avgStars;
        state.totalRatingsMap[itemId] = totalRatings;
      });
      state.successMessage = 'Loaded average stars for foods successfully';
    });

    builder.addCase(fetchAllFoodAvgStarsThunk.rejected, (state, action) => {
      state.error = action.payload || 'Failed to load average stars for foods';
    });
    builder.addCase(fetchAllComboAvgStarsThunk.fulfilled, (state, action) => {
      action.payload.forEach(({ itemId, avgStars, totalRatings }) => {
        state.avgStarsMap[itemId] = avgStars;
        state.totalRatingsMap[itemId] = totalRatings;
      });
      state.successMessage = 'Loaded average stars for combos successfully';
    });

    builder.addCase(fetchAllComboAvgStarsThunk.rejected, (state, action) => {
      state.error = action.payload || 'Failed to load average stars for combos';
    });
    builder.addCase(fetchPendingRatingsThunk.pending, state => {
      state.loading = true;
      state.error = null;
      state.successMessage = null;
    });

    builder.addCase(
      fetchPendingRatingsThunk.fulfilled,
      (state, action: PayloadAction<PendingRatingModel[]>) => {
        state.loading = false;
        state.pendingRatings = action.payload;
        state.successMessage = 'Loaded pending ratings successfully';
      },
    );

    builder.addCase(fetchPendingRatingsThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || 'Failed to load pending ratings';
    });
  },
});

export const { setRatings, clearRatingMessages } = ratingSlice.actions;
export const ratingReducer = ratingSlice.reducer;
export const ratingSelector = (state: { rating: RatingState }) =>
  state.rating.ratings;
export const ratingLoadingSelector = (state: { rating: RatingState }) =>
  state.rating.loading;
export const ratingErrorSelector = (state: { rating: RatingState }) =>
  state.rating.error;
export const ratingSuccessSelector = (state: { rating: RatingState }) =>
  state.rating.successMessage;
export const avgStarsMapSelector = (state: { rating: RatingState }) =>
  state.rating.avgStarsMap;
export const totalRatingsSelector = (state: { rating: RatingState }) =>
  state.rating.totalRatingsMap;
export const pendingRatingsSelector = (state: { rating: RatingState }) =>
  state.rating.pendingRatings;
