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
import { handleRegisterThunk } from '../../redux/actions/authAction';
import { authSelector } from '../../redux/reducer/authReducer';
import { showError } from '../../utils/toastMessages';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../redux/store';

const RegisterScreen = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useAppSelector(authSelector);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChecked, setIsChecked] = useState(false);

  const handleRegister = useCallback(async () => {
    if (!email || !password || !confirmPassword) {
      return showError('Please fill in all required fields.');
    }

    if (!Validate.email(email)) {
      return showError('Invalid email format.');
    }

    if (!Validate.password(password)) {
      return showError(
        'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.',
      );
    }

    if (password !== confirmPassword) {
      return showError('Passwords do not match.');
    }

    if (!isChecked) {
      return showError(
        'Please agree to the Terms of Service and Privacy Policy.',
      );
    }

    dispatch(handleRegisterThunk({ email, password, navigation }));
  }, [dispatch, email, password, confirmPassword, isChecked, navigation]);

  useEffect(() => {
    if (error) {
      showError(error);
    }
  }, [error]);

  const openLegal = (initialTab: 'terms' | 'privacy') => {
    navigation.navigate('TermsPolicyScreen', { initialTab });
  };

  return (
    <View style={{ flex: 1 }}>
      <ContainerComponent isImageBackground isScroll>
        <SectionComponent>
          <SpaceComponent height={50} />
          <TextComponent
            text={`Create your new\naccount.`}
            size={30}
            font={appFonts.semiBold}
          />
          <SpaceComponent height={10} />
          <TextComponent
            text={`Create an account to start looking for the food\nyou like`}
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
          <SpaceComponent height={10} />
          <TextComponent
            text="Confirm Password"
            size={16}
            font={appFonts.regular}
            styles={{ marginBottom: 10 }}
          />
          <InputComponent
            value={confirmPassword}
            placeholder="Confirm Password"
            onChange={setConfirmPassword}
            isPassword
            allowClear
            affix={<Lock size={22} color={appColors.gray} />}
          />

          <RowComponent
            justify="flex-start"
            styles={{ marginTop: -10, flexWrap: 'wrap' }}
          >
            <TouchableOpacity
              onPress={() => setIsChecked(prev => !prev)}
              style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 10,
                backgroundColor: isChecked ? appColors.orange : 'transparent',
                borderWidth: 2,
                borderColor: appColors.orange,
              }}
            >
              {isChecked && (
                <TextComponent
                  text="✓"
                  color={appColors.white}
                  size={12}
                  font={appFonts.bold}
                />
              )}
            </TouchableOpacity>

            <TextComponent text="I agree with" />
            <TouchableOpacity onPress={() => openLegal('terms')}>
              <TextComponent
                text=" Terms of Service"
                color={appColors.orange}
                font={appFonts.semiBold}
              />
            </TouchableOpacity>
            <TextComponent text=" and" />
            <TouchableOpacity onPress={() => openLegal('privacy')}>
              <TextComponent
                text=" Privacy Policy "
                color={appColors.orange}
                font={appFonts.semiBold}
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
              text="REGISTER"
              type="primary"
              color={appColors.orange}
              styles={{ width: 375 }}
              onPress={handleRegister}
            />
          </SectionComponent>

          <SpaceComponent height={16} />
          <SocialComponent />
          <SpaceComponent height={16} />

          <RowComponent justify="center">
            <TextComponent text={`Already have an account?`} />
            <TouchableOpacity
              onPress={() => navigation.navigate('LoginScreen')}
            >
              <TextComponent
                text=" Login"
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

export default RegisterScreen;

const styles = StyleSheet.create({});
