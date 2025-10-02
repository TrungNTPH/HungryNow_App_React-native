import axiosClient from './axiosClient';
import { BaseResponse } from '../types/base-response';
import {
  LalamoveMarket,
  City,
  LalamoveQuoteBody,
  LalamoveFeeResponse,
  LalamoveCreateOrderBody,
  LalamoveOrderResponse,
  LalamoveOrderDetail,
} from '../types/lalamove';

export const lalamoveApi = {
  getMarkets: async (): Promise<BaseResponse<LalamoveMarket[]>> => {
    const raw: BaseResponse<any> = await axiosClient.get('/lalamove/markets');
    const normalized = (raw?.data?.data ?? raw?.data) as LalamoveMarket[];
    return { ...raw, data: normalized };
  },

  getCities: async (): Promise<BaseResponse<City[]>> => {
    const raw: BaseResponse<any> = await axiosClient.get('/lalamove/cities');
    const normalized = (raw?.data?.data ?? raw?.data) as City[];
    return { ...raw, data: normalized };
  },

  createQuotation: async (
    payload: LalamoveQuoteBody,
  ): Promise<BaseResponse<LalamoveFeeResponse>> => {
    const raw: BaseResponse<any> = await axiosClient.post(
      '/lalamove/quotations',
      payload,
    );
    const normalized = (raw?.data?.data ?? raw?.data) as LalamoveFeeResponse;
    return { ...raw, data: normalized };
  },

  createOrder: async (
    payload: LalamoveCreateOrderBody,
  ): Promise<BaseResponse<LalamoveOrderResponse>> => {
    const raw: BaseResponse<any> = await axiosClient.post(
      '/lalamove/orders',
      payload,
    );
    const normalized = (raw?.data?.data ?? raw?.data) as LalamoveOrderResponse;
    return { ...raw, data: normalized };
  },

  getOrderDetail: async (
    orderId: string,
  ): Promise<BaseResponse<LalamoveOrderDetail>> => {
    const raw: BaseResponse<any> = await axiosClient.get(
      `/lalamove/orders/${orderId}`,
    );
    const normalized = (raw?.data?.data ?? raw?.data) as LalamoveOrderDetail;
    return { ...raw, data: normalized };
  },

  getDriverShareLink: async (orderId: string): Promise<string | null> => {
    try {
      const resp = await lalamoveApi.getOrderDetail(orderId);
      return resp?.data?.shareLink ?? null;
    } catch (error) {
      console.error('Failed to fetch driver share link:', error);
      throw error;
    }
  },
};
