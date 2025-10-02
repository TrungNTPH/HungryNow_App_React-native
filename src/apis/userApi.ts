import axiosClient from './axiosClient';
import { UserModel } from '../models/UserModel';
import { BaseResponse } from '../types/base-response';

export const userApi = {
  getProfile: async (): Promise<BaseResponse<UserModel>> => {
    return await axiosClient.get('/users/profile');
  },

  updateProfile: async (
    data: Partial<UserModel>,
  ): Promise<BaseResponse<UserModel>> => {
    return await axiosClient.put('/users/profile', data);
  },

  confirmPhoneVerification: async (
    idToken: string,
  ): Promise<BaseResponse<null>> => {
    return await axiosClient.post('/users/verify-phone', { idToken });
  },

  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<BaseResponse<null>> => {
    return await axiosClient.put('/users/change-password', data);
  },
};
