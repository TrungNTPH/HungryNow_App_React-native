import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { VoucherModel } from '../../models/VoucherModel';
import {
  fetchVouchersThunk,
  applyVoucherThunk,
} from '../actions/voucherAction';

interface VoucherState {
  items: VoucherModel[];
  applied: {
    discount: number;
    type: VoucherModel['type'];
    remainingUsage: number | null;
  } | null;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: VoucherState = {
  items: [],
  applied: null,
  loading: false,
  error: null,
  successMessage: null,
};

const upsertVoucher = (list: VoucherModel[], v: VoucherModel) => {
  const idx = list.findIndex(x => x._id === v._id);
  if (idx >= 0) list[idx] = v;
  else list.unshift(v);
};

const voucherSlice = createSlice({
  name: 'voucher',
  initialState,
  reducers: {
    clearAppliedVoucher(state) {
      state.applied = null;
    },
    clearVoucherMessages(state) {
      state.error = null;
      state.successMessage = null;
    },
    addVoucher(state, action: PayloadAction<VoucherModel>) {
      upsertVoucher(state.items, action.payload);
    },
    removeVoucher(state, action: PayloadAction<string>) {
      state.items = state.items.filter(v => v._id !== action.payload);
    },
    setVouchers(state, action: PayloadAction<VoucherModel[]>) {
      state.items = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchVouchersThunk.pending, state => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(
        fetchVouchersThunk.fulfilled,
        (state, action: PayloadAction<VoucherModel[]>) => {
          state.loading = false;
          state.items = action.payload;
          state.successMessage = 'Loaded vouchers successfully';
        },
      )
      .addCase(fetchVouchersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load vouchers';
      });
    builder
      .addCase(applyVoucherThunk.pending, state => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(
        applyVoucherThunk.fulfilled,
        (
          state,
          action: PayloadAction<{
            discount: number;
            type: VoucherModel['type'];
            remainingUsage: number | null;
          }>,
        ) => {
          state.loading = false;
          state.applied = action.payload;
          state.successMessage = 'Applied voucher successfully';
        },
      )
      .addCase(applyVoucherThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to apply voucher';
      });
  },
});

export const {
  clearAppliedVoucher,
  clearVoucherMessages,
  addVoucher,
  removeVoucher,
  setVouchers,
} = voucherSlice.actions;

export const voucherReducer = voucherSlice.reducer;

// selectors
export const voucherSelector = (state: { voucher: VoucherState }) =>
  state.voucher;
export const voucherLoadingSelector = (state: { voucher: VoucherState }) =>
  state.voucher.loading;
export const voucherErrorSelector = (state: { voucher: VoucherState }) =>
  state.voucher.error;
export const voucherSuccessSelector = (state: { voucher: VoucherState }) =>
  state.voucher.successMessage;
export const appliedVoucherSelector = (state: { voucher: VoucherState }) =>
  state.voucher.applied;
