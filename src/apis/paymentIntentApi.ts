import axiosClient from './axiosClient';
import { BaseResponse } from '../types/base-response';
import {
  CreateZaloPayIntentPayload,
  CreateZaloPayIntentData,
  GetPaymentIntentData,
} from '../models/PaymentIntentModel';

export const paymentIntentApi = {
  createZaloPayIntent: async (
    payload: CreateZaloPayIntentPayload,
  ): Promise<BaseResponse<CreateZaloPayIntentData>> => {
    return await axiosClient.post('/payment-intents/zalopay', payload);
  },

  getPaymentIntent: async (
    id: string,
  ): Promise<BaseResponse<GetPaymentIntentData>> => {
    return await axiosClient.get(`/payment-intents/${id}`);
  },

  cancelPaymentIntent: async (
    id: string,
  ): Promise<BaseResponse<{ intentId: string }>> => {
    return await axiosClient.post(`/payment-intents/${id}/cancel`);
  },
};

export const pickBestPaymentUrl = (d?: {
  deeplink?: string | null;
  orderUrl?: string | null;
}) => d?.deeplink || d?.orderUrl || null;
