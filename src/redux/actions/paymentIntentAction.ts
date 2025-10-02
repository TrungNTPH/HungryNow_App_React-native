import { createAsyncThunk } from '@reduxjs/toolkit';
import { paymentIntentApi } from '../../apis/paymentIntentApi';
import {
  CreateZaloPayIntentPayload,
  CreateZaloPayIntentData,
  GetPaymentIntentData,
} from '../../models/PaymentIntentModel';

export const createZaloPayIntentThunk = createAsyncThunk<
  CreateZaloPayIntentData,
  CreateZaloPayIntentPayload,
  { rejectValue: string }
>('paymentIntent/createZaloPay', async (payload, { rejectWithValue }) => {
  try {
    const res = await paymentIntentApi.createZaloPayIntent(payload);
    return res.data;
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.message ||
        err?.message ||
        'Failed to create payment intent.',
    );
  }
});

export const getPaymentIntentThunk = createAsyncThunk<
  GetPaymentIntentData,
  string,
  { rejectValue: string }
>('paymentIntent/getById', async (intentId, { rejectWithValue }) => {
  try {
    const res = await paymentIntentApi.getPaymentIntent(intentId);
    return res.data;
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.message ||
        err?.message ||
        'Failed to get payment intent.',
    );
  }
});

export const cancelPaymentIntentThunk = createAsyncThunk<
  { intentId: string },
  string,
  { rejectValue: string }
>('paymentIntent/cancel', async (intentId, { rejectWithValue }) => {
  try {
    const res = await paymentIntentApi.cancelPaymentIntent(intentId);
    return res.data;
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.message ||
        err?.message ||
        'Failed to cancel payment intent.',
    );
  }
});

export const pollPaymentIntentThunk = createAsyncThunk<
  GetPaymentIntentData,
  { intentId: string; intervalMs?: number; maxAttempts?: number },
  { rejectValue: string }
>(
  'paymentIntent/poll',
  async (
    { intentId, intervalMs = 2000, maxAttempts = 60 },
    { rejectWithValue },
  ) => {
    try {
      let attempts = 0;

      while (attempts < maxAttempts) {
        const res = await paymentIntentApi.getPaymentIntent(intentId);
        const data = res.data;

        if (
          data.status === 'succeeded' ||
          data.status === 'canceled' ||
          data.status === 'expired'
        ) {
          return data;
        }

        await new Promise(resolve => setTimeout(resolve, intervalMs));
        attempts += 1;
      }

      throw new Error('Payment is still pending. Please try again.');
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to poll payment intent.',
      );
    }
  },
);
