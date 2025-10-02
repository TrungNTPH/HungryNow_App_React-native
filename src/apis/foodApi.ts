import axiosClient from './axiosClient';
import { FoodModel } from '../models/FoodModel';
import { BaseResponse, PaginatedResponse } from '../types/base-response';
import { SearchItem } from '../models/SearchModel';

export const foodApi = {
  getFoods: async (): Promise<BaseResponse<FoodModel[]>> => {
    return await axiosClient.get('/foods');
  },

  getFoodsByCategory: async (
    categoryId: string | null,
  ): Promise<BaseResponse<FoodModel[]>> => {
    const url = categoryId ? `/foods?categoryId=${categoryId}` : '/foods';
    return await axiosClient.get(url);
  },

  getPaginatedFoods: async (
    page: number,
    limit: number,
  ): Promise<PaginatedResponse<FoodModel[]>> => {
    return await axiosClient.get(`/foods?page=${page}&limit=${limit}`);
  },

  searchFoodsAndCombos: async (params: {
    name?: string;
    categoryId?: string;
    sizeId?: string;
    minStars?: number;
    status?: 'available' | 'unavailable';
    type?: 'Food' | 'Combo' | 'All';
    sort?:
      | '-createdAt'
      | 'createdAt'
      | '-rating'
      | 'rating'
      | '-price'
      | 'price';
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<SearchItem[]>> => {
    return await axiosClient.get('/foods/search', { params });
  },
};
