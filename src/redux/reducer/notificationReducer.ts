import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  fetchUserNotificationsThunk,
  markAsReadNotificationThunk,
} from '../actions/notificationAction';

export interface Notification {
  _id: string;
  title: string;
  message: string;
  userId: string;
  type: 'system' | 'personal';
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NotificationState {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: NotificationState = {
  notifications: [],
  loading: false,
  error: null,
  successMessage: null,
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    clearNotificationMessages: state => {
      state.error = null;
      state.successMessage = null;
    },
    addNotification(state, action: PayloadAction<Notification>) {
      state.notifications.unshift(action.payload);
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchUserNotificationsThunk.pending, state => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(fetchUserNotificationsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload.map((item: any) => ({
          _id: item._id,
          title: item.title,
          message: item.message,
          userId:
            typeof item.userId === 'string'
              ? item.userId
              : item.userId?._id || '',
          type: item.type || (!item.userId ? 'system' : 'personal'),
          isRead: item.status === 'read',
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        }));
        state.successMessage = 'Loaded notifications successfully';
      })
      .addCase(fetchUserNotificationsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load notifications';
      })
      .addCase(markAsReadNotificationThunk.pending, state => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(markAsReadNotificationThunk.fulfilled, (state, action) => {
        state.loading = false;
        const noti = state.notifications.find(n => n._id === action.payload);
        if (noti) noti.isRead = true;
        state.successMessage = 'Notification marked as read';
      })
      .addCase(markAsReadNotificationThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to mark notification as read';
      });
  },
});

export const { clearNotificationMessages, addNotification } =
  notificationSlice.actions;
export const notificationReducer = notificationSlice.reducer;
export const notificationSelector = (state: {
  notification: NotificationState;
}) => state.notification.notifications;
export const notificationLoadingSelector = (state: {
  notification: NotificationState;
}) => state.notification.loading;
export const notificationErrorSelector = (state: {
  notification: NotificationState;
}) => state.notification.error;
export const notificationSuccessSelector = (state: {
  notification: NotificationState;
}) => state.notification.successMessage;
