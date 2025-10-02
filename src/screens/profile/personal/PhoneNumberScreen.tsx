import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import {
  ContainerComponent,
  InputComponent,
  SectionComponent,
  ButtonComponent,
  SpaceComponent,
  TextComponent,
} from '../../../components';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import {
  userSelector,
  clearUserMessages,
} from '../../../redux/reducer/userReducer';
import { appColors } from '../../../constants';
import { fetchUserProfileThunk } from '../../../redux/actions/userAction';
import { getAuth, signInWithPhoneNumber } from '@react-native-firebase/auth';
import { showSuccess, showError } from '../../../utils/toastMessages';
import { useFocusEffect } from '@react-navigation/native';

const PhoneNumberScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const { profile, error, successMessage } = useAppSelector(userSelector);

  const [phone, setPhone] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      try {
        await dispatch(fetchUserProfileThunk()).unwrap();
      } catch {
        showError('Failed to refresh profile.');
      } finally {
        setRefreshing(false);
      }
    },
    [dispatch],
  );

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  useEffect(() => {
    if (!refreshing) {
      if (profile?.phoneNumber) {
        setPhone(profile.phoneNumber);
      } else {
        showError('You have not set a phone number yet.');
      }
    }
  }, [profile, refreshing]);

  useEffect(() => {
    const errorMapping = [
      {
        label: 'profile',
        hasError: !!error,
        clear: () => dispatch(clearUserMessages()),
      },
    ];

    errorMapping.forEach(({ label, hasError, clear }) => {
      if (hasError && !refreshing) {
        showError(`Failed to load ${label}.`);
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

  const isValidPhone = (value: string) => /^\+?\d{9,15}$/.test(value);

  const handleSave = useCallback(async () => {
    if (!phone.trim()) {
      showError('Please enter your phone number.');
      return;
    }

    if (!isValidPhone(phone)) {
      showError('Invalid phone format.');
      return;
    }

    if (phone === profile?.phoneNumber) {
      showError('You entered the same phone number.');
      return;
    }

    try {
      const confirmation = await signInWithPhoneNumber(getAuth(), phone);

      if (!confirmation?.verificationId) {
        showError('Verification failed.');
        return;
      }

      navigation.navigate('PhoneVerificationScreen', {
        verificationId: confirmation.verificationId,
        confirmResult: confirmation,
        phoneNumber: phone,
      });
    } catch {
      showError('Failed to send verification code.');
    }
  }, [phone, profile?.phoneNumber, navigation]);

  return (
    <ContainerComponent title="Phone Number" back>
      <ScrollView
        contentContainerStyle={{ paddingTop: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
          />
        }
        keyboardShouldPersistTaps="handled"
      >
        <SectionComponent>
          <TextComponent text="Enter new phone number" />
          <SpaceComponent height={8} />
          <InputComponent value={phone} onChange={setPhone} />
          <ButtonComponent
            text="Save"
            onPress={handleSave}
            type="primary"
            color={appColors.orange}
            styles={{ width: '100%', marginTop: 12 }}
          />
        </SectionComponent>
      </ScrollView>
    </ContainerComponent>
  );
};

export default PhoneNumberScreen;
