import React, { useState } from 'react';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { authApi } from '../apis/authApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { addAuth } from '../redux/reducer/authReducer';
import SectionComponent from './SectionComponent';
import TextComponent from './TextComponent';
import { appColors, appFonts } from '../constants';
import SpaceComponent from './SpaceComponent';
import RowComponent from './RowComponent';
import ButtonComponent from './ButtonComponent';
import { Facebook, Google } from '../assets/svgs';
import { LoadingModal } from '../modals';
import { Alert } from 'react-native';

GoogleSignin.configure({
  webClientId:
    '657868242549-dopk4kksoq1n0p39a1q2vakofm80p7r9.apps.googleusercontent.com',
  offlineAccess: true,
});

const SocialComponent = () => {
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();

  const handleLoginWithGoogle = async () => {
    setIsLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const user = (userInfo as any).user;

      const res = await authApi.loginWithGoogle(user);
      const authData = res.data;

      await AsyncStorage.setItem('auth', JSON.stringify(authData));
      dispatch(addAuth(authData));
    } catch (err: any) {
      let message = err?.message || 'Unexpected error';
      if (err.code === statusCodes.SIGN_IN_CANCELLED)
        message = 'Sign in was cancelled';
      else if (err.code === statusCodes.IN_PROGRESS)
        message = 'Sign in is in progress';
      else if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE)
        message = 'Play services not available';

      Alert.alert('Google Login Failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginWithFacebook = async () => {
    Alert.alert('Facebook Login', 'Coming soon...');
  };

  return (
    <SectionComponent>
      <TextComponent
        styles={{ textAlign: 'center' }}
        text="Or login with"
        color={appColors.gray}
        size={16}
        font={appFonts.medium}
      />
      <SpaceComponent height={32} />

      <RowComponent justify="center">
        <ButtonComponent
          type="primary"
          onPress={handleLoginWithGoogle}
          color={appColors.white}
          textColor={appColors.text}
          text=""
          textFont={appFonts.regular}
          iconFlex="right"
          icon={<Google />}
          styles={{ flex: 1 }}
        />
        <ButtonComponent
          type="primary"
          onPress={handleLoginWithFacebook}
          color={appColors.white}
          textColor={appColors.text}
          text=""
          textFont={appFonts.regular}
          iconFlex="left"
          icon={<Facebook />}
          styles={{ flex: 1 }}
        />
      </RowComponent>
      <LoadingModal visible={isLoading} />
    </SectionComponent>
  );
};

export default SocialComponent;
