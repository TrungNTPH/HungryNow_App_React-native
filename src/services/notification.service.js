import messaging from '@react-native-firebase/messaging';
import { useEffect } from 'react';
import { showInfo } from '../utils/toastMessages';

export const useFirebaseNotification = () => {
  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      const title = remoteMessage.notification?.title || 'Notification title';
      const body = remoteMessage.notification?.body || 'Notification message';
      showInfo(title, body);
    });
    return unsubscribe;
  }, []);
};
