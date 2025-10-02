import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import {
  ButtonComponent,
  ContainerComponent,
  InputComponent,
  RowComponent,
  SectionComponent,
  SocialComponent,
  SpaceComponent,
  TextComponent,
} from '../../components';
import { appColors, appFonts } from '../../constants';
import { Lock, Sms } from 'iconsax-react-native';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { Validate } from '../../utils/validate';
import { LoadingModal } from '../../modals';
import { handleLoginThunk } from '../../redux/actions/authAction';
import {
  authSelector,
  clearAuthMessages,
} from '../../redux/reducer/authReducer';
import { showError, showSuccess } from '../../utils/toastMessages';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../redux/store';

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('truongvx2305@gmail.com');
  const [password, setPassword] = useState('Vxt@zz23052005');
  const dispatch = useDispatch<AppDispatch>();

  const { loading, error, accesstoken } = useAppSelector(authSelector);

  const handleLogin = useCallback(() => {
    if (!email || !password) {
      showError('Please fill in all required fields.');
      return;
    }

    if (!Validate.email(email)) {
      showError('Invalid email format.');
      return;
    }

    dispatch(handleLoginThunk({ email, password }));
  }, [dispatch, email, password]);

  useEffect(() => {
    if (accesstoken) {
      showSuccess('Logged in successfully.');
      navigation.reset({
        index: 0,
        routes: [{ name: 'TabNavigator' }],
      });
    }
  }, [accesstoken, navigation]);

  useEffect(() => {
    if (error) {
      showError('Incorrect email or password.');
      dispatch(clearAuthMessages());
    }
  }, [error, dispatch]);

  return (
    <View style={{ flex: 1 }}>
      <ContainerComponent isImageBackground isScroll>
        <SectionComponent>
          <SpaceComponent height={50} />
          <TextComponent
            text={`Login to your\naccount.`}
            size={30}
            font={appFonts.semiBold}
          />
          <SpaceComponent height={10} />
          <TextComponent
            text={`Please sign in to your account`}
            size={14}
            color={appColors.gray}
          />
          <SpaceComponent height={30} />

          <TextComponent text="Email" size={16} font={appFonts.regular} />
          <SpaceComponent height={10} />
          <InputComponent
            value={email}
            placeholder="Email"
            onChange={setEmail}
            allowClear
            affix={<Sms size={22} color={appColors.gray} />}
          />

          <SpaceComponent height={10} />
          <TextComponent
            text="Password"
            size={16}
            font={appFonts.regular}
            styles={{ marginBottom: 10 }}
          />
          <InputComponent
            value={password}
            placeholder="Password"
            onChange={setPassword}
            isPassword
            allowClear
            affix={<Lock size={22} color={appColors.gray} />}
          />

          <RowComponent justify="flex-end" styles={{ marginTop: -10 }}>
            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <TextComponent
                text="Forgot password?"
                size={14}
                font={appFonts.regular}
                color={appColors.orange}
              />
            </TouchableOpacity>
          </RowComponent>

          <SectionComponent
            styles={{
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 20,
            }}
          >
            <ButtonComponent
              text="LOGIN"
              type="primary"
              color={appColors.orange}
              styles={{ width: 375 }}
              onPress={handleLogin}
            />
          </SectionComponent>

          <SpaceComponent height={16} />
          <SocialComponent />
          <SpaceComponent height={16} />

          <RowComponent justify="center">
            <TextComponent text={`Don't have an account?`} />
            <TouchableOpacity
              onPress={() => navigation.navigate('RegisterScreen')}
            >
              <TextComponent
                text=" Register"
                color={appColors.orange}
                font={appFonts.semiBold}
              />
            </TouchableOpacity>
          </RowComponent>
        </SectionComponent>
      </ContainerComponent>

      <LoadingModal visible={loading} />
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({});
