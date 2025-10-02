import axiosClient from './axiosClient';
import { BaseResponse } from '../types/base-response';
import { ApplyVoucherPayload, VoucherModel } from '../models/VoucherModel';

export const voucherApi = {
  getVouchers: async (): Promise<BaseResponse<VoucherModel[]>> => {
    return await axiosClient.get('/vouchers');
  },

  getVoucherById: async (id: string): Promise<BaseResponse<VoucherModel>> => {
    return await axiosClient.get(`/vouchers/${id}`);
  },

  applyVoucher: async (
    payload: ApplyVoucherPayload,
  ): Promise<
    BaseResponse<{
      discount: number;
      type: VoucherModel['type'];
      remainingUsage: number | null;
    }>
  > => {
    return await axiosClient.post('/vouchers/apply', payload);
  },

  getUserVouchers: async (
    params?: any,
  ): Promise<BaseResponse<VoucherModel[]>> => {
    return await axiosClient.get('/vouchers/voucher-user', { params });
  },
};
