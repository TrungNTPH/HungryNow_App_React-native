import { createAsyncThunk } from '@reduxjs/toolkit';
import { sizeApi } from '../../apis/sizeApi';
import { SizeModel } from '../../models/SizeModel';

export const fetchSizesThunk = createAsyncThunk<
  SizeModel[],
  void,
  { rejectValue: string }
>('size/fetchSizes', async (_, { rejectWithValue }) => {
  try {
    const res = await sizeApi.getSizes();
    return res.data;
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.message || 'Failed to fetch sizes.',
    );
  }
});

export const fetchSizeByIdThunk = createAsyncThunk<
  SizeModel,
  string,
  { rejectValue: string }
>('size/fetchSizeById', async (id, { rejectWithValue }) => {
  try {
    const res = await sizeApi.getSizeById(id);
    return res.data;
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.message || 'Failed to fetch size detail.',
    );
  }
});
