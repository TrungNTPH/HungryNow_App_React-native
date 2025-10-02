import { createAsyncThunk } from '@reduxjs/toolkit';
import { invoiceApi } from '../../apis/invoiceApi';
import {
  HydratedInvoiceModel,
  NonZaloPayMethod,
  PaymentMethod,
  ShippingStopRef,
} from '../../models/InvoiceModel';

const getErrMsg = (err: any, fallback: string) =>
  err?.response?.data?.message || err?.message || fallback;

export const fetchMyInvoicesThunk = createAsyncThunk<
  HydratedInvoiceModel[],
  void,
  { rejectValue: string }
>('invoices/fetchMyInvoices', async (_, { rejectWithValue }) => {
  try {
    const res = await invoiceApi.getMyInvoices();
    return res.data;
  } catch (err: any) {
    return rejectWithValue(getErrMsg(err, 'Failed to fetch invoices'));
  }
});

export const fetchInvoiceByIdThunk = createAsyncThunk<
  HydratedInvoiceModel,
  string,
  { rejectValue: string }
>('invoices/fetchById', async (invoiceId, { rejectWithValue }) => {
  try {
    const res = await invoiceApi.getInvoiceById(invoiceId);
    return res.data;
  } catch (err: any) {
    return rejectWithValue(getErrMsg(err, 'Failed to fetch invoice details'));
  }
});

export const addInvoiceThunk = createAsyncThunk<
  { invoice: HydratedInvoiceModel },
  {
    cartIds: string[];
    paymentMethod: NonZaloPayMethod;
    voucherId?: string;
    paymentRef?: string | null;
    shippingFee: number;
    note?: string;
    shippingQuotationId: string;
    shippingStops: ShippingStopRef[];
  },
  { rejectValue: string }
>('invoices/create', async (payload, { rejectWithValue }) => {
  try {
    if ((payload as any).paymentMethod === 'ZaloPay') {
      throw new Error('Use ZaloPay Payment Intent flow instead of /invoices.');
    }
    const res = await invoiceApi.addInvoice(payload);
    return res.data;
  } catch (err: any) {
    return rejectWithValue(getErrMsg(err, 'Failed to create invoice'));
  }
});

export const updateInvoicePaymentStatusThunk = createAsyncThunk<
  HydratedInvoiceModel,
  string,
  { rejectValue: string }
>('invoices/updatePaymentStatus', async (invoiceId, { rejectWithValue }) => {
  try {
    const res = await invoiceApi.updatePaymentStatus(invoiceId);
    return res.data;
  } catch (err: any) {
    return rejectWithValue(getErrMsg(err, 'Failed to update payment status'));
  }
});

export const cancelInvoiceThunk = createAsyncThunk<
  HydratedInvoiceModel,
  string,
  { rejectValue: string }
>('invoices/cancel', async (invoiceId, { rejectWithValue }) => {
  try {
    const res = await invoiceApi.cancelInvoice(invoiceId);
    return res.data;
  } catch (err: any) {
    return rejectWithValue(getErrMsg(err, 'Failed to cancel invoice'));
  }
});
