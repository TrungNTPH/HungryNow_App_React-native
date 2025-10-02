import { StyleSheet, View } from 'react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ButtonComponent,
  ContainerComponent,
  InputComponent,
  SectionComponent,
  SpaceComponent,
  TextComponent,
} from '../../../components';
import { Lock } from 'iconsax-react-native';
import { appColors, appFonts } from '../../../constants';
import { LoadingModal, ResetpasswordModal } from '../../../modals';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import {
  clearAuthMessages,
  authSelector,
} from '../../../redux/reducer/authReducer';
import { resetPasswordThunk } from '../../../redux/actions/authAction';
import { showError, showSuccess } from '../../../utils/toastMessages';

const ResetPasswordScreen = ({ navigation, route }: any) => {
  const { email } = route.params;
  const dispatch = useAppDispatch();
  const { loading, error, successMessage } = useAppSelector(authSelector);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showModal, setShowModal] = useState(false);

  const handleResetPassword = useCallback(() => {
    if (!password || !confirmPassword) {
      return showError('Please fill in all fields.');
    }

    if (password !== confirmPassword) {
      return showError('Passwords do not match.');
    }

    dispatch(
      resetPasswordThunk({
        email,
        password,
        confirmPassword,
        onSuccess: () => {
          showSuccess('Your password has been reset successfully.');
          setShowModal(true);
        },
      }),
    );
  }, [dispatch, email, password, confirmPassword]);

  useEffect(() => {
    if (error) {
      showError(error);
    }

    if (successMessage === 'Reset password successful') {
      setShowModal(true);
    }
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
            text="Reset Password"
            size={30}
            font={appFonts.semiBold}
          />
          <SpaceComponent height={10} />
          <TextComponent
            text="Your new password must be different from the\npreviously used password."
            size={14}
            color={appColors.gray}
          />
          <SpaceComponent height={30} />

          <TextComponent
            text="Password"
            size={16}
            font={appFonts.regular}
            styles={[{ marginBottom: 10 }]}
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
            styles={[{ marginBottom: 10 }]}
          />
          <InputComponent
            value={confirmPassword}
            placeholder="Confirm Password"
            onChange={setConfirmPassword}
            isPassword
            allowClear
            affix={<Lock size={22} color={appColors.gray} />}
          />

          <SectionComponent
            styles={{
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 10,
            }}
          >
            <ButtonComponent
              text="RESET PASSWORD"
              type="primary"
              color={appColors.orange}
              styles={[{ width: 375 }]}
              onPress={handleResetPassword}
            />
          </SectionComponent>
        </SectionComponent>
      </ContainerComponent>

      <ResetpasswordModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onNavigate={() => {
          setShowModal(false);
          navigation.navigate('TabNavigator', {
            screen: 'Profile',
          });
        }}
      />

      <LoadingModal visible={loading} />
    </View>
  );
};

export default ResetPasswordScreen;

const styles = StyleSheet.create({});
