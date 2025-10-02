import axiosClient from './axiosClient';
import { ComboModel } from '../models/ComboModel';
import { BaseResponse, PaginatedResponse } from '../types/base-response';

export const comboApi = {
  getCombos: async (): Promise<BaseResponse<ComboModel[]>> => {
    return await axiosClient.get('/combos');
  },

  getPaginatedCombos: async (
    page: number,
    limit: number,
  ): Promise<PaginatedResponse<ComboModel[]>> => {
    return await axiosClient.get(`/combos?page=${page}&limit=${limit}`);
  },

  getComboByCategory: async (
    categoryId: string | null,
  ): Promise<BaseResponse<ComboModel[]>> => {
    const url = categoryId ? `/combos?categoryId=${categoryId}` : '/combos';
    return await axiosClient.get(url);
  },
};
