import { getApp } from '@react-native-firebase/app';
import {
  getMessaging,
  onMessage,
  setBackgroundMessageHandler,
} from '@react-native-firebase/messaging';
import { userApi } from '../apis/userApi';
import { showInfo } from './toastMessages';

const messaging = getMessaging(getApp());

export const getFcmToken = async (): Promise<string | null> => {
  try {
    return await messaging.getToken();
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

export const listenForNotifications = () => {
  const unsubscribe = onMessage(messaging, async remoteMessage => {
    console.log('Foreground message:', remoteMessage);
    const notification = remoteMessage.notification;
    if (notification) {
      const title = notification.title || 'Notification';
      const body = notification.body || 'You have new notifications';
      showInfo(title, body);
    }

    const fcmToken = remoteMessage?.data?.fcmToken;
    if (typeof fcmToken === 'string') {
      await userApi.updateProfile({ fcmToken });
    }
  });
  return unsubscribe;
};

setBackgroundMessageHandler(messaging, async remoteMessage => {
  console.log('Background message:', remoteMessage);
  const fcmToken = remoteMessage?.data?.fcmToken;
  if (typeof fcmToken === 'string') {
    await userApi.updateProfile({ fcmToken });
  }
});
