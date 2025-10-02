import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { appColors, appFonts } from '../../constants';
import {
  ButtonComponent,
  ContainerComponent,
  RowComponent,
  SectionComponent,
  SpaceComponent,
  TextComponent,
} from '../../components';
import { Clock } from 'iconsax-react-native';
import { LoadingModal } from '../../modals';
import { useAppDispatch } from '../../redux/hooks';
import {
  handleResendCodeThunk,
  verifyCodeThunk,
} from '../../redux/actions/authAction';
import { showError, showSuccess } from '../../utils/toastMessages';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../redux/store';

const Verification = ({ navigation, route }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const { email, password, type } = route.params;

  const [code, setCode] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(300);
  const [canResend, setCanResend] = useState(false);
  const [failCount, setFailCount] = useState(0);

  const ref1 = useRef<TextInput>(null);
  const ref2 = useRef<TextInput>(null);
  const ref3 = useRef<TextInput>(null);
  const ref4 = useRef<TextInput>(null);
  const refs = [ref1, ref2, ref3, ref4];

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (secondsLeft > 0) {
      timer = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanResend(true);
            showError(
              'Verification code has expired. Please request a new one.',
            );
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const handleVerify = useCallback(async () => {
    const fullCode = code.join('');
    if (fullCode.length < 4) {
      showError('Please enter the full 4-digit code.');
      return;
    }

    setIsLoading(true);
    const result = await dispatch(
      verifyCodeThunk({ email, password, code: fullCode, type }),
    );
    setIsLoading(false);

    if (verifyCodeThunk.fulfilled.match(result)) {
      showSuccess('Verification successful!');
      if (type === 'reset') {
        navigation.navigate('ResetPassword', { email });
      } else {
        navigation.navigate('LoginScreen');
      }
    } else {
      showError(result.payload || 'Invalid verification code.');
      setFailCount(prev => {
        const newFail = prev + 1;
        if (newFail >= 5) setCanResend(true);
        return newFail;
      });
    }
  }, [code, dispatch, email, password, type, navigation]);

  const handleResend = useCallback(async () => {
    if (!canResend) return;

    setIsLoading(true);
    const result = await dispatch(handleResendCodeThunk({ email, type }));
    setIsLoading(false);

    if (handleResendCodeThunk.fulfilled.match(result)) {
      showSuccess('A new code has been sent to your email.');
      setSecondsLeft(300);
      setCanResend(false);
      setFailCount(0);
      setCode(['', '', '', '']);
    } else {
      showError(result.payload || 'Failed to resend verification code.');
    }
  }, [canResend, dispatch, email, type]);

  const handleChange = useCallback((val: string, i: number) => {
    setCode(prev => {
      const newCode = [...prev];
      newCode[i] = val;
      return newCode;
    });

    if (val && i < 3) refs[i + 1].current?.focus();
    if (!val && i > 0) refs[i - 1].current?.focus();
  }, []);

  const formattedTime = useMemo(() => {
    const m = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
    const s = String(secondsLeft % 60).padStart(2, '0');
    return `${m}:${s}`;
  }, [secondsLeft]);

  return (
    <View style={{ flex: 1 }}>
      <ContainerComponent back isImageBackground isScroll>
        <SectionComponent>
          <TextComponent
            text="Email verification"
            size={30}
            font={appFonts.semiBold}
          />
          <SpaceComponent height={10} />
          <TextComponent
            text={`Enter the verification code\nwe sent to: ${email}`}
            size={14}
            color={appColors.gray}
          />
          <SpaceComponent height={30} />

          <RowComponent justify="space-around">
            {[0, 1, 2, 3].map(i => (
              <TextInput
                key={i}
                ref={refs[i]}
                keyboardType="number-pad"
                style={styles.input}
                maxLength={1}
                placeholder="-"
                value={code[i]}
                onChangeText={val => handleChange(val, i)}
                onKeyPress={({ nativeEvent }) => {
                  if (nativeEvent.key === 'Backspace' && i > 0 && !code[i]) {
                    refs[i - 1].current?.focus();
                  }
                }}
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

          {canResend && (
            <TouchableOpacity onPress={handleResend} style={{ marginTop: 12 }}>
              <TextComponent
                text="Resend Code"
                color={appColors.danger}
                size={14}
                styles={{ textAlign: 'center', marginBottom: 5 }}
              />
            </TouchableOpacity>
          )}

          <SectionComponent
            styles={{
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 20,
            }}
          >
            <ButtonComponent
              text="CONTINUE"
              type="primary"
              color={appColors.orange}
              styles={[{ width: 375 }]}
              onPress={handleVerify}
            />
          </SectionComponent>
        </SectionComponent>
      </ContainerComponent>

      <LoadingModal visible={isLoading} />
    </View>
  );
};

export default Verification;

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
