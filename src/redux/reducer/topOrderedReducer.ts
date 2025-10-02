import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  fetchTopOrderedThunk,
  fetchPaginatedTopOrdered,
  FetchTopOrderedResult,
} from '../actions/topOrderedAction';
import { TopOrderedModel } from '../../models/TopOrderedModel';
import { Pagination } from '../../types/base-response';

interface TopOrderedState {
  topOrdered: TopOrderedModel[];
  pagination: Pagination | null;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: TopOrderedState = {
  topOrdered: [],
  pagination: null,
  loading: false,
  error: null,
  successMessage: null,
};

const topOrderedSlice = createSlice({
  name: 'topOrdered',
  initialState,
  reducers: {
    clearTopOrderedMessages: state => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchTopOrderedThunk.pending, state => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(
        fetchTopOrderedThunk.fulfilled,
        (state, action: PayloadAction<TopOrderedModel[]>) => {
          state.loading = false;
          state.topOrdered = action.payload;
          state.pagination = null;
          state.successMessage = 'Loaded top ordered items successfully';
        },
      )
      .addCase(fetchTopOrderedThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load top ordered items';
      });
    builder
      .addCase(fetchPaginatedTopOrdered.pending, state => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(
        fetchPaginatedTopOrdered.fulfilled,
        (state, action: PayloadAction<FetchTopOrderedResult>) => {
          state.loading = false;
          state.topOrdered = action.payload.data;
          state.pagination = action.payload.pagination;
          state.successMessage =
            'Loaded paginated top ordered items successfully';
        },
      )
      .addCase(fetchPaginatedTopOrdered.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || 'Failed to load paginated top ordered items';
      });
  },
});

export const { clearTopOrderedMessages } = topOrderedSlice.actions;
export const topOrderedReducer = topOrderedSlice.reducer;
export const topOrderedSelector = (state: { topOrdered: TopOrderedState }) =>
  state.topOrdered.topOrdered;
export const topOrderedPaginationSelector = (state: {
  topOrdered: TopOrderedState;
}) => state.topOrdered.pagination;
export const topOrderedLoadingSelector = (state: {
  topOrdered: TopOrderedState;
}) => state.topOrdered.loading;
export const topOrderedErrorSelector = (state: {
  topOrdered: TopOrderedState;
}) => state.topOrdered.error;
export const topOrderedSuccessSelector = (state: {
  topOrdered: TopOrderedState;
}) => state.topOrdered.successMessage;
