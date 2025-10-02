import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  ContainerComponent,
  SectionComponent,
  TextComponent,
  RowComponent,
  SpaceComponent,
  ButtonComponent,
} from '../../../components';
import { Clock } from 'iconsax-react-native';
import { appColors, appFonts } from '../../../constants';
import auth from '@react-native-firebase/auth';
import { useAppDispatch } from '../../../redux/hooks';
import {
  confirmPhoneVerificationThunk,
  fetchUserProfileThunk,
} from '../../../redux/actions/userAction';
import { LoadingModal } from '../../../modals';
import { showError, showSuccess } from '../../../utils/toastMessages';

const PhoneVerificationScreen = ({ route, navigation }: any) => {
  const { verificationId } = route.params;
  const dispatch = useAppDispatch();

  const [code, setCode] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(300);

  const refs = useRef<TextInput[]>([]);

  useEffect(() => {
    if (!verificationId) {
      showError('Verification ID is missing.');
      navigation.goBack();
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          showError('The verification code has expired.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = useCallback(
    (val: string, i: number) => {
      const clean = val.replace(/[^0-9]/g, '');
      const newCode = [...code];

      if (clean.length > 1) {
        clean
          .split('')
          .slice(0, 4)
          .forEach((digit, idx) => {
            newCode[idx] = digit;
          });
        setCode(newCode);
        refs.current[clean.length - 1]?.focus();
        return;
      }

      newCode[i] = clean;
      setCode(newCode);

      if (clean && i < 3) refs.current[i + 1]?.focus();
      if (!clean && i > 0) refs.current[i - 1]?.focus();
    },
    [code],
  );

  const handleVerify = useCallback(async () => {
    const fullCode = code.join('');
    if (fullCode.length < 4) {
      showError('Please enter all 4 digits.');
      return;
    }

    try {
      setLoading(true);
      const credential = auth.PhoneAuthProvider.credential(
        verificationId,
        fullCode,
      );
      await auth().signInWithCredential(credential);

      const idToken = await auth().currentUser?.getIdToken(true);
      if (!idToken) throw new Error('Unable to get Firebase ID token');

      await dispatch(confirmPhoneVerificationThunk(idToken)).unwrap();
      await dispatch(fetchUserProfileThunk()).unwrap();

      showSuccess('Phone number verified successfully.');
      navigation.navigate('PersonalDataScreen');
    } catch {
      showError('Phone verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [code, verificationId, dispatch, navigation]);

  const formattedTime = useMemo(() => {
    const m = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
    const s = String(secondsLeft % 60).padStart(2, '0');
    return `${m}:${s}`;
  }, [secondsLeft]);

  return (
    <ContainerComponent back title="Verify Phone" isScroll>
      <LoadingModal visible={loading} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <SectionComponent>
          <TextComponent
            text="Enter the 4-digit code sent to your phone"
            size={16}
          />
          <SpaceComponent height={30} />

          <RowComponent justify="space-around">
            {Array.from({ length: 4 }).map((_, i) => (
              <TextInput
                key={i}
                ref={ref => {
                  refs.current[i] = ref!;
                }}
                keyboardType="number-pad"
                style={styles.input}
                maxLength={1}
                value={code[i]}
                onChangeText={val => handleChange(val, i)}
              />
            ))}
          </RowComponent>

          <RowComponent justify="center" styles={{ marginTop: 20 }}>
            <Clock size={20} color={appColors.gray} />
            <TextComponent
              text={` ${formattedTime}`}
              color={appColors.gray}
              size={14}
              font={appFonts.regular}
              styles={{ marginLeft: 8 }}
            />
          </RowComponent>

          <ButtonComponent
            text="VERIFY"
            onPress={handleVerify}
            type="primary"
            color={appColors.orange}
            styles={{ marginTop: 30, width: '100%' }}
          />
        </SectionComponent>
      </KeyboardAvoidingView>
    </ContainerComponent>
  );
};

export default PhoneVerificationScreen;

const styles = StyleSheet.create({
  input: {
    height: 55,
    width: 55,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: appColors.gray,
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 24,
    fontFamily: appFonts.bold,
    textAlign: 'center',
  },
});
