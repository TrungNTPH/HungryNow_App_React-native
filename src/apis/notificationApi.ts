import axiosClient from './axiosClient';
import { BaseResponse } from '../types/base-response';
import { NotificationModel } from '../models/NotificationModel';

export const notificationApi = {
  getAllUserNotifications: async (): Promise<
    BaseResponse<NotificationModel[]>
  > => {
    return await axiosClient.get('/notifications/user/all');
  },

  markAsRead: async (notificationId: string): Promise<BaseResponse<null>> => {
    return await axiosClient.put(`/notifications/read/${notificationId}`);
  },

  getNotificationUser: async (): Promise<BaseResponse<NotificationModel[]>> => {
    return await axiosClient.get('/notifications/notification-user');
  },
};
