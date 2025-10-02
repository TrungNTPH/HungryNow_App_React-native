import { useEffect } from 'react';
import { useAppSelector } from '../redux/hooks';
import { userApi } from '../apis/userApi';
import { getApp } from '@react-native-firebase/app';
import {
  getMessaging,
  getToken,
  onTokenRefresh,
  requestPermission,
} from '@react-native-firebase/messaging';

const updateServerFcmToken = async (token: string | null) => {
  if (typeof token === 'string' && token.trim() !== '') {
    try {
      await userApi.updateProfile({ fcmToken: token });
      console.log('FCM token updated on server:', token);
    } catch (err) {
      console.error('FCM updateProfile error:', err);
    }
  }
};

export const useUpdateFcmToken = () => {
  const { accesstoken } = useAppSelector(state => state.auth);

  useEffect(() => {
    if (!accesstoken) return;

    (async () => {
      try {
        const app = getApp();
        const messaging = getMessaging(app);

        await requestPermission(messaging);

        const token = await getToken(messaging);
        // await messaging.subscribeToTopic('all');
        await updateServerFcmToken(token);
      } catch (err) {
        console.error('Error getting FCM token:', err);
      }
    })();
  }, [accesstoken]);

  useEffect(() => {
    if (!accesstoken) return;

    const app = getApp();
    const messaging = getMessaging(app);

    const unsubscribe = onTokenRefresh(messaging, async token => {
      await updateServerFcmToken(token);
    });

    return unsubscribe;
  }, [accesstoken]);
};
