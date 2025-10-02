import axiosClient from './axiosClient';
import { FoodSizeModel } from '../models/FoodSizeModel';
import { BaseResponse } from '../types/base-response';

export const foodSizeApi = {
  getFoodSizes: async (): Promise<BaseResponse<FoodSizeModel[]>> => {
    return await axiosClient.get('/food-sizes?limit=1000');
  },

  getFoodSizesByFoodId: async (
    foodId: string,
  ): Promise<BaseResponse<FoodSizeModel[]>> => {
    return await axiosClient.get('/food-sizes', {
      params: { foodId },
    });
  },
};
