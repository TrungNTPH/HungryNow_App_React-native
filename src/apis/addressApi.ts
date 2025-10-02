import axiosClient from './axiosClient';
import { BaseResponse } from '../types/base-response';
import { AddressData, AddressModel } from '../models/AddressModel';

export const addressApi = {
  getAddresses: async (): Promise<BaseResponse<AddressModel[]>> => {
    return await axiosClient.get('/addresses');
  },

  addAddress: async (
    data: AddressData,
  ): Promise<BaseResponse<AddressModel>> => {
    return await axiosClient.post('/addresses', data);
  },

  updateAddress: async (
    id: string,
    data: Partial<AddressData>,
  ): Promise<BaseResponse<AddressModel>> => {
    return await axiosClient.put(`/addresses/${id}`, data);
  },

  deleteAddress: async (id: string): Promise<BaseResponse<null>> => {
    return await axiosClient.delete(`/addresses/${id}`);
  },
};
