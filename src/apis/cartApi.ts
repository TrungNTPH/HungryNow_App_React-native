import axiosClient from './axiosClient';
import { CartModel } from '../models/CartModel';
import { BaseResponse } from '../types/base-response';

export const cartApi = {
  addCart: async (data: {
    itemId: string;
    itemType: 'Food' | 'Combo';
    quantity: number;
    foodSizeId?: string;
    note?: string;
  }): Promise<BaseResponse<CartModel>> => {
    return await axiosClient.post('/carts', data);
  },

  deleteCart: async (id: string): Promise<BaseResponse<null>> => {
    return await axiosClient.delete(`/carts/${id}`);
  },

  getMyCarts: async (): Promise<BaseResponse<CartModel[]>> => {
    return await axiosClient.get('/carts/my-carts');
  },

  updateCart: async (
    id: string,
    data: {
      quantity?: number;
      note?: string;
      foodSizeId?: string | { _id: string };
    },
  ): Promise<BaseResponse<CartModel>> => {
    const payload = {
      ...data,
      foodSizeId:
        typeof data.foodSizeId === 'object' && data.foodSizeId !== null
          ? data.foodSizeId._id
          : data.foodSizeId || undefined,
    };

    return await axiosClient.put(`/carts/${id}`, payload);
  },
};
