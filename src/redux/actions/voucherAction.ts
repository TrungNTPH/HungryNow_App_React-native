import { createAsyncThunk } from '@reduxjs/toolkit';
import { voucherApi } from '../../apis/voucherApi';
import { VoucherModel } from '../../models/VoucherModel';

const getErr = (err: any, fb: string) =>
  err?.response?.data?.message || err?.message || fb;

export const fetchVouchersThunk = createAsyncThunk<
  VoucherModel[],
  void,
  { rejectValue: string }
>('voucher/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const res = await voucherApi.getVouchers();
    return res.data;
  } catch (err: any) {
    return rejectWithValue(getErr(err, 'Failed to fetch vouchers'));
  }
});

type ApplyVoucherResult = {
  discount: number;
  type: VoucherModel['type'];
  remainingUsage: number | null;
};

type ApplyVoucherArgs = {
  idVoucher: string;
  totalOrderAmount: number;
  validateOnly?: boolean;
};

export const applyVoucherThunk = createAsyncThunk<
  ApplyVoucherResult,
  ApplyVoucherArgs,
  { rejectValue: string }
>('voucher/apply', async (args, { rejectWithValue }) => {
  try {
    const res = await voucherApi.applyVoucher(args);
    return res.data;
  } catch (err: any) {
    return rejectWithValue(getErr(err, 'Failed to apply voucher'));
  }
});
