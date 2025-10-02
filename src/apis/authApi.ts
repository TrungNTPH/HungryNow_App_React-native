import axiosClient from './axiosClient';
import { BaseResponse } from '../types/base-response';
import { UserModel } from '../models/UserModel';

interface LoginResponse {
  token: string;
  user: Pick<UserModel, '_id' | 'email' | 'fullName' | 'role'>;
}

export const authApi = {
  login: async (data: {
    email: string;
    password: string;
  }): Promise<BaseResponse<LoginResponse>> => {
    return await axiosClient.post('/auth/login', data);
  },

  register: async (data: {
    email: string;
    password: string;
  }): Promise<BaseResponse<null>> => {
    return await axiosClient.post('/auth/register', data);
  },

  sendVerificationCode: async (
    email: string,
    type: 'register' | 'reset',
  ): Promise<BaseResponse<null>> => {
    return await axiosClient.post('/auth/verify-email', { email, type });
  },

  confirmCode: async (
    email: string,
    code: string,
  ): Promise<BaseResponse<null>> => {
    return await axiosClient.post('/auth/verify-code', { email, code });
  },

  resetPassword: async (
    email: string,
    newPassword: string,
  ): Promise<BaseResponse<null>> => {
    return await axiosClient.post('/auth/reset-password', {
      email,
      newPassword,
    });
  },

  loginWithGoogle: async (data: {
    idToken: string;
  }): Promise<BaseResponse<LoginResponse>> => {
    return await axiosClient.post('/auth/login-google', data);
  },

  loginWithFacebook: async (data: {
    idToken: string;
  }): Promise<BaseResponse<LoginResponse>> => {
    return await axiosClient.post('/auth/login-facebook', data);
  },
};
