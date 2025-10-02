import axiosClient from './axiosClient';
import { BaseResponse } from '../types/base-response';
import { SizeModel } from '../models/SizeModel';

export const sizeApi = {
  getSizes: async (): Promise<BaseResponse<SizeModel[]>> => {
    return await axiosClient.get('/sizes');
  },

  getSizeById: async (id: string): Promise<BaseResponse<SizeModel>> => {
    return await axiosClient.get(`/sizes/${id}`);
  },
};
