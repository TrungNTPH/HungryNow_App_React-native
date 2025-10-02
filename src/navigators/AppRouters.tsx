import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addAuth, authSelector } from '../redux/reducer/authReducer';
import MainNavigator from './MainNavigator';
import { setToken } from '../utils/authToken';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SplashScreen } from '../screens';
import StartupNavigator from './StartupNavigator ';
import { useUpdateFcmToken } from '../utils/useUpdateFcmToken';
import { listenForNotifications } from '../utils/fcm';

const AppRouters = () => {
  const [isCheckingLogin, setIsCheckingLogin] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const auth = useSelector(authSelector);
  const dispatch = useDispatch();

  useUpdateFcmToken();

  useEffect(() => {
    const unsubscribe = listenForNotifications();

    const init = async () => {
      const res = await AsyncStorage.getItem('auth');
      if (res) {
        const parsed = JSON.parse(res);
        dispatch(addAuth(parsed));
        setToken(parsed.accesstoken);
        setShowOnboarding(false);
      } else {
        const onboarded = await AsyncStorage.getItem('hasOnboarded');
        setShowOnboarding(!res && onboarded !== 'true');
      }
      setIsCheckingLogin(false);
    };
    init();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [dispatch]);

  const onFinishOnboarding = async () => {
    await AsyncStorage.setItem('hasOnboarded', 'true');
    setShowOnboarding(false);
  };

  if (isCheckingLogin) {
    return <SplashScreen />;
  }

  if (showOnboarding) {
    return <StartupNavigator onFinishOnboarding={onFinishOnboarding} />;
  }

  return <MainNavigator />;
};

export default AppRouters;
