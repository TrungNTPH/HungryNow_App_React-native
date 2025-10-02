import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  createZaloPayIntentThunk,
  getPaymentIntentThunk,
  cancelPaymentIntentThunk,
  pollPaymentIntentThunk,
} from '../actions/paymentIntentAction';
import {
  CreateZaloPayIntentData,
  GetPaymentIntentData,
} from '../../models/PaymentIntentModel';

type IntentData = GetPaymentIntentData | null;

interface PaymentIntentState {
  current: IntentData;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: PaymentIntentState = {
  current: null,
  loading: false,
  error: null,
  successMessage: null,
};

const paymentIntentSlice = createSlice({
  name: 'paymentIntent',
  initialState,
  reducers: {
    clearPaymentIntentMessages: state => {
      state.error = null;
      state.successMessage = null;
    },
    clearPaymentIntent: state => {
      state.current = null;
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(createZaloPayIntentThunk.pending, state => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(
        createZaloPayIntentThunk.fulfilled,
        (state, action: PayloadAction<CreateZaloPayIntentData>) => {
          state.loading = false;
          state.current = {
            intentId: action.payload.intentId,
            status: action.payload.status,
            appTransId: action.payload.appTransId,
            providerTransId: null,
            orderUrl: action.payload.orderUrl || null,
            deeplink: action.payload.deeplink || null,
            invoiceId: null,
            expiresAt: action.payload.expiresAt,
          };
          state.successMessage = 'Created payment intent successfully';
        },
      )
      .addCase(createZaloPayIntentThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create payment intent';
      });
    builder
      .addCase(getPaymentIntentThunk.pending, state => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(
        getPaymentIntentThunk.fulfilled,
        (state, action: PayloadAction<GetPaymentIntentData>) => {
          state.loading = false;
          state.current = action.payload;
          state.successMessage = 'Loaded payment intent successfully';
        },
      )
      .addCase(getPaymentIntentThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load payment intent';
      });
    builder
      .addCase(cancelPaymentIntentThunk.pending, state => {
        state.loading = true;
        state.successMessage = null;
      })
      .addCase(
        cancelPaymentIntentThunk.fulfilled,
        (state, action: PayloadAction<{ intentId: string }>) => {
          state.loading = false;
          if (
            state.current &&
            state.current.intentId === action.payload.intentId
          ) {
            state.current = { ...state.current, status: 'canceled' };
          }
          state.successMessage = 'Canceled payment intent successfully';
        },
      )
      .addCase(cancelPaymentIntentThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to cancel payment intent';
      });
    builder
      .addCase(pollPaymentIntentThunk.pending, state => {
        state.loading = true;
        state.successMessage = null;
      })
      .addCase(
        pollPaymentIntentThunk.fulfilled,
        (state, action: PayloadAction<GetPaymentIntentData>) => {
          state.loading = false;
          state.current = action.payload;
          state.successMessage = 'Payment status updated';
        },
      )
      .addCase(pollPaymentIntentThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to poll payment status';
      });
  },
});

export const { clearPaymentIntentMessages, clearPaymentIntent } =
  paymentIntentSlice.actions;
export const paymentIntentReducer = paymentIntentSlice.reducer;
export const paymentIntentSelector = (state: {
  paymentIntent: PaymentIntentState;
}) => state.paymentIntent.current;
export const paymentIntentLoadingSelector = (state: {
  paymentIntent: PaymentIntentState;
}) => state.paymentIntent.loading;
export const paymentIntentErrorSelector = (state: {
  paymentIntent: PaymentIntentState;
}) => state.paymentIntent.error;
export const paymentIntentSuccessSelector = (state: {
  paymentIntent: PaymentIntentState;
}) => state.paymentIntent.successMessage;
