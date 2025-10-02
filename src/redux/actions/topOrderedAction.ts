import { createAsyncThunk } from '@reduxjs/toolkit';
import { statisticApi } from '../../apis/topOrderedApi';
import { TopOrderedModel } from '../../models/TopOrderedModel';
import { Pagination } from '../../types/base-response';

export interface FetchTopOrderedParams {
  page: number;
  limit: number;
  type?: 'Food' | 'Combo' | 'all';
}

export interface FetchTopOrderedResult {
  data: TopOrderedModel[];
  pagination: Pagination;
}

export const fetchTopOrderedThunk = createAsyncThunk<
  TopOrderedModel[],
  { type?: 'Food' | 'Combo' | 'all' },
  { rejectValue: string }
>(
  'topOrdered/fetchTopOrderedAll',
  async ({ type = 'all' }, { rejectWithValue }) => {
    try {
      const res = await statisticApi.getTopOrdered(type);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error.message || 'Failed to fetch top ordered items (all)',
      );
    }
  },
);

export const fetchPaginatedTopOrdered = createAsyncThunk<
  FetchTopOrderedResult,
  FetchTopOrderedParams,
  { rejectValue: string }
>(
  'topOrdered/fetchTopOrderedItems',
  async ({ page, limit, type = 'all' }, { rejectWithValue }) => {
    try {
      const res = await statisticApi.getPaginatedTopOrdered(page, limit, type);
      return {
        data: res.data,
        pagination: res.pagination,
      };
    } catch (error: any) {
      return rejectWithValue(
        error.message || 'Failed to fetch top ordered items',
      );
    }
  },
);
