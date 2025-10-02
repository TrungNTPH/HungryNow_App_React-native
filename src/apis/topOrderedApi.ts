import axiosClient from './axiosClient';
import { TopOrderedModel } from '../models/TopOrderedModel';
import { BaseResponse, PaginatedResponse } from '../types/base-response';

export const statisticApi = {
  getTopOrdered: async (
    type: 'Food' | 'Combo' | 'all' = 'all',
  ): Promise<BaseResponse<TopOrderedModel[]>> => {
    return await axiosClient.get('/statistics/top-ordered', {
      params: { type },
    });
  },

  getPaginatedTopOrdered: async (
    page: number,
    limit: number,
    type: 'Food' | 'Combo' | 'all' = 'all',
  ): Promise<PaginatedResponse<TopOrderedModel[]>> => {
    return await axiosClient.get('/statistics/top-ordered', {
      params: { page, limit, type },
    });
  },
};
