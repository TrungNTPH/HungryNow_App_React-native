import axiosClient from './axiosClient';
import { CategoryModel } from '../models/CategoryModel';
import { BaseResponse } from '../types/base-response';
import { FoodModel } from '../models/FoodModel';
import { ComboModel } from '../models/ComboModel';

export const categoryApi = {
  getCategories: async (): Promise<BaseResponse<CategoryModel[]>> => {
    return await axiosClient.get('/categories');
  },

  getFoodsAndCombosByCategory: async (
    categoryId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<BaseResponse<{ foods: FoodModel[]; combos: ComboModel[] }>> => {
    return await axiosClient.get(`/categories/${categoryId}/foods-combos`, {
      params: { page, limit },
    });
  },
};
