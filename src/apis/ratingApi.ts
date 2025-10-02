import axiosClient from './axiosClient';
import { BaseResponse } from '../types/base-response';
import {
  CreateRatingPayload,
  PendingRatingModel,
  RatingModel,
} from '../models/RatingModel';
import { FoodModel } from '../models/FoodModel';
import { ComboModel } from '../models/ComboModel';

interface AvgRatingResponse {
  item: FoodModel | ComboModel;
  avgStars: number;
  totalRatings: number;
}

export const ratingApi = {
  addRating: async (
    body: CreateRatingPayload,
  ): Promise<
    BaseResponse<{
      rating: RatingModel;
      average: {
        averageStars: number;
        totalRatings: number;
      };
    }>
  > => {
    return await axiosClient.post('/ratings', body);
  },

  getRatings: async (params: {
    itemId: string;
    itemType: 'Food' | 'Combo';
    stars?: number;
  }): Promise<BaseResponse<RatingModel[]>> => {
    const query = new URLSearchParams({
      itemId: params.itemId,
      itemType: params.itemType,
    });

    if (params.stars !== undefined) {
      query.append('stars', params.stars.toString());
    }

    return await axiosClient.get(`/ratings?${query.toString()}`);
  },

  getAverageStars: async (params: {
    itemId: string;
    itemType: 'Food' | 'Combo';
  }): Promise<{
    success: boolean;
    data: {
      average: number;
      total: number;
    };
  }> => {
    const query = new URLSearchParams({
      itemId: params.itemId,
      itemType: params.itemType,
    });

    return await axiosClient.get(`/ratings/average?${query.toString()}`);
  },

  getAllFoodAvgStars: async (): Promise<BaseResponse<AvgRatingResponse[]>> => {
    return await axiosClient.get('/statistics/average-stars?type=Food');
  },

  getAllComboAvgStars: async (): Promise<BaseResponse<AvgRatingResponse[]>> => {
    return await axiosClient.get('/statistics/average-stars?type=Combo');
  },

  getPendingRatings: async (): Promise<BaseResponse<PendingRatingModel[]>> => {
    return await axiosClient.get('/ratings/pending-ratings');
  },
};
