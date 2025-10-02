import axiosClient from './axiosClient';
import { FavoriteModel } from '../models/FavoriteModel';
import { BaseResponse } from '../types/base-response';

export const favoriteApi = {
  addFavorite: async (data: {
    itemId: string;
    itemType: 'Food' | 'Combo';
  }): Promise<BaseResponse<FavoriteModel>> => {
    return await axiosClient.post('/favorites', data);
  },

  deleteFavorite: async (id: string): Promise<BaseResponse<null>> => {
    return await axiosClient.delete(`/favorites/${id}`);
  },

  getMyFavorites: async (): Promise<BaseResponse<FavoriteModel[]>> => {
    return await axiosClient.get('/favorites/my-favorites');
  },
};
