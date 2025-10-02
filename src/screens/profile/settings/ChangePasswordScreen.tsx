import { StyleSheet, TouchableOpacity } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import {
  ButtonComponent,
  ContainerComponent,
  InputComponent,
  SectionComponent,
  SpaceComponent,
  TextComponent,
} from '../../../components';
import { appColors, appFonts } from '../../../constants';
import { Lock } from 'iconsax-react-native';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { changePasswordThunk } from '../../../redux/actions/userAction';
import {
  userSelector,
  clearUserMessages,
} from '../../../redux/reducer/userReducer';
import { showSuccess, showError } from '../../../utils/toastMessages';

const ChangePasswordScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const { error, successMessage } = useAppSelector(userSelector);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const handleChangePassword = useCallback(async () => {
    if (!currentPassword || !newPassword) {
      showError('Please enter both current and new passwords.');
      return;
    }
    setRefreshing(true);
    try {
      await dispatch(
        changePasswordThunk({ currentPassword, newPassword }),
      ).unwrap();
      navigation.goBack();
    } catch {
      showError('Failed to change your password.');
    } finally {
      setRefreshing(false);
    }
  }, [currentPassword, newPassword, dispatch, navigation]);

  useEffect(() => {
    const errorMapping = [
      {
        hasError: !!error,
        clear: () => dispatch(clearUserMessages()),
        message: 'Failed to update password.',
      },
    ];

    errorMapping.forEach(({ hasError, clear, message }) => {
      if (hasError && !refreshing) {
        showError(message);
        clear();
      }
    });
  }, [error, refreshing]);

  useEffect(() => {
    const successMapping = [
      {
        message: successMessage,
        clear: () => dispatch(clearUserMessages()),
      },
    ];

    successMapping.forEach(({ message, clear }) => {
      if (message && !refreshing) {
        showSuccess(message);
        clear();
      }
    });
  }, [successMessage, refreshing]);

  return (
    <ContainerComponent back isImageBackground isScroll>
      <SectionComponent>
        <TextComponent
          text="Change password"
          size={30}
          font={appFonts.semiBold}
        />
        <SpaceComponent height={10} />
        <TextComponent
          text="Enter your current and new password to update it"
          size={14}
          color={appColors.gray}
        />
        <SpaceComponent height={30} />

        <TextComponent
          text="Current password"
          size={16}
          font={appFonts.regular}
        />
        <SpaceComponent height={10} />
        <InputComponent
          value={currentPassword}
          placeholder="Current password"
          onChange={val => setCurrentPassword(val)}
          isPassword
          allowClear
          affix={<Lock size={22} color={appColors.gray} />}
        />

        <TextComponent text="New password" size={16} font={appFonts.regular} />
        <SpaceComponent height={10} />
        <InputComponent
          value={newPassword}
          placeholder="New password"
          onChange={val => setNewPassword(val)}
          isPassword
          allowClear
          affix={<Lock size={22} color={appColors.gray} />}
        />

        <TouchableOpacity
          style={{ alignSelf: 'flex-end', marginTop: -10 }}
          onPress={() => navigation.navigate('ForgotPasswordScreen')}
        >
          <TextComponent
            text="Forgot password?"
            size={14}
            font={appFonts.regular}
            color={appColors.orange}
          />
        </TouchableOpacity>

        <SectionComponent
          styles={{
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 20,
          }}
        >
          <ButtonComponent
            text="CHANGE PASSWORD"
            type="primary"
            color={appColors.orange}
            styles={{ width: 375 }}
            onPress={handleChangePassword}
          />
        </SectionComponent>
      </SectionComponent>
    </ContainerComponent>
  );
};

export default ChangePasswordScreen;

const styles = StyleSheet.create({});
