import { createAsyncThunk } from '@reduxjs/toolkit';
import { lalamoveApi } from '../../apis/lalamoveApi';
import {
  LalamoveFeeResponse,
  LalamoveCreateOrderBody,
  LalamoveOrderResponse,
  LalamoveQuoteBody,
  LalamoveStop,
  LalamoveMarket,
  City,
  buildLalamoveQuoteBody,
  LalamoveOrderDetail,
} from '../../types/lalamove';

const getErrMsg = (err: any, fallback: string) =>
  err?.response?.data?.message || err?.message || fallback;

export const getLalamoveMarketsThunk = createAsyncThunk<
  LalamoveMarket[],
  void,
  { rejectValue: string }
>('lalamove/getMarkets', async (_, { rejectWithValue }) => {
  try {
    const res = await lalamoveApi.getMarkets();
    return res.data;
  } catch (err: any) {
    return rejectWithValue(getErrMsg(err, 'Failed to fetch markets'));
  }
});

export const getLalamoveCitiesThunk = createAsyncThunk<
  City[],
  void,
  { rejectValue: string }
>('lalamove/getCities', async (_, { rejectWithValue }) => {
  try {
    const res = await lalamoveApi.getCities();
    return res.data;
  } catch (err: any) {
    return rejectWithValue(getErrMsg(err, 'Failed to fetch cities'));
  }
});

export const calculateLalamoveFeeThunk = createAsyncThunk<
  LalamoveFeeResponse,
  {
    address: string;
    lat: number | string;
    lng: number | string;
    quantity?: number;
  },
  { rejectValue: string }
>('lalamove/calculateFee', async (payload, { rejectWithValue }) => {
  try {
    const dropoff: LalamoveStop = {
      coordinates: { lat: payload.lat, lng: payload.lng },
      address: payload.address,
    };
    const body: LalamoveQuoteBody = buildLalamoveQuoteBody({
      dropoff,
      quantity: payload.quantity,
    });

    const res = await lalamoveApi.createQuotation(body);
    return res.data;
  } catch (err: any) {
    return rejectWithValue(getErrMsg(err, 'Failed to calculate fee'));
  }
});

export const createLalamoveOrderThunk = createAsyncThunk<
  LalamoveOrderResponse,
  LalamoveCreateOrderBody,
  { rejectValue: string }
>('lalamove/createOrder', async (payload, { rejectWithValue }) => {
  try {
    const res = await lalamoveApi.createOrder(payload);
    return res.data;
  } catch (err: any) {
    return rejectWithValue(getErrMsg(err, 'Failed to create order'));
  }
});

export const getLalamoveDriverLocationThunk = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>('lalamove/getDriverLocation', async (orderId, { rejectWithValue }) => {
  try {
    const shareLink = await lalamoveApi.getDriverShareLink(orderId);
    if (!shareLink) {
      return rejectWithValue('Driver location not found.');
    }
    return shareLink;
  } catch (err: any) {
    return rejectWithValue(getErrMsg(err, 'Failed to fetch driver location'));
  }
});

export const getLalamoveOrderDetailThunk = createAsyncThunk<
  LalamoveOrderDetail,
  string,
  { rejectValue: string }
>('lalamove/getOrderDetail', async (orderId, { rejectWithValue }) => {
  try {
    const res = await lalamoveApi.getOrderDetail(orderId);
    return res.data;
  } catch (err: any) {
    return rejectWithValue(getErrMsg(err, 'Failed to fetch order detail'));
  }
});
