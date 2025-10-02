import { createAsyncThunk } from '@reduxjs/toolkit';
import { NotificationModel } from '../../models/NotificationModel';
import { notificationApi } from '../../apis/notificationApi';

export const fetchUserNotificationsThunk = createAsyncThunk<
  NotificationModel[],
  void,
  { rejectValue: string }
>('notification/fetchUserNotifications', async (_, { rejectWithValue }) => {
  try {
    const res = await notificationApi.getNotificationUser();
    return res.data;
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.message || 'Failed to load notifications.',
    );
  }
});

export const markAsReadNotificationThunk = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>('notification/markAsRead', async (notificationId, { rejectWithValue }) => {
  try {
    await notificationApi.markAsRead(notificationId);
    return notificationId;
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.message || 'Failed to mark as read.',
    );
  }
});
