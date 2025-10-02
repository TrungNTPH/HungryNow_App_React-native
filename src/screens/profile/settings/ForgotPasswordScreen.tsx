import { StyleSheet, View } from 'react-native';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ButtonComponent,
  ContainerComponent,
  InputComponent,
  SectionComponent,
  SpaceComponent,
  TextComponent,
} from '../../../components';
import { appColors, appFonts } from '../../../constants';
import { Sms } from 'iconsax-react-native';
import { LoadingModal } from '../../../modals';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import {
  authSelector,
  clearAuthMessages,
} from '../../../redux/reducer/authReducer';
import { handleSendResetCodeThunk } from '../../../redux/actions/authAction';
import { showError, showSuccess } from '../../../utils/toastMessages';

const ForgotPasswordScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const { loading, error, successMessage } = useAppSelector(authSelector);
  const [email, setEmail] = useState('');

  const handleContinue = useCallback(async () => {
    if (!email) {
      showError('Please enter your email.');
      return;
    }

    try {
      await dispatch(handleSendResetCodeThunk({ email, navigation })).unwrap();
      showSuccess('Reset code sent to your email.');
      navigation.navigate('VerificationScreen', { email, type: 'reset' });
    } catch (err: any) {
      showError(typeof err === 'string' ? err : 'Failed to send reset code.');
    }
  }, [email, dispatch, navigation]);

  useEffect(() => {
    if (error) showError(error);
    if (successMessage) showSuccess(successMessage);
  }, [error, successMessage]);

  useEffect(() => {
    return () => {
      dispatch(clearAuthMessages());
    };
  }, [dispatch]);

  return (
    <View style={{ flex: 1 }}>
      <ContainerComponent back isImageBackground isScroll>
        <SectionComponent>
          <TextComponent
            text="Forgot password?"
            size={30}
            font={appFonts.semiBold}
          />
          <SpaceComponent height={10} />
          <TextComponent
            text={`Enter your email address and we’ll send you\na confirmation code to reset your password.`}
            size={14}
            color={appColors.gray}
          />
          <SpaceComponent height={30} />
          <TextComponent text="Email" size={16} font={appFonts.regular} />
          <SpaceComponent height={10} />
          <InputComponent
            value={email}
            placeholder="Email"
            onChange={val => setEmail(val)}
            allowClear
            affix={<Sms size={22} color={appColors.gray} />}
          />

          <SectionComponent
            styles={{
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 10,
            }}
          >
            <ButtonComponent
              text="CONTINUE"
              type="primary"
              color={appColors.orange}
              styles={{ width: 375 }}
              onPress={handleContinue}
            />
          </SectionComponent>
        </SectionComponent>
      </ContainerComponent>

      <LoadingModal visible={loading} />
    </View>
  );
};

export default ForgotPasswordScreen;

const styles = StyleSheet.create({});
