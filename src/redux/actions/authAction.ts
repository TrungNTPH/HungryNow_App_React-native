import { createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Validate } from '../../utils/validate';
import { UserModel } from '../../models/UserModel';
import { authApi } from '../../apis/authApi';
import { setToken } from '../../utils/authToken';

interface AuthPayload {
  id: string;
  email: string;
  role: UserModel['role'];
  accesstoken: string;
}

interface AuthPayload {
  id: string;
  email: string;
  role: UserModel['role'];
  accesstoken: string;
}

export const handleLoginThunk = createAsyncThunk<
  AuthPayload,
  { email: string; password: string },
  { rejectValue: string }
>('auth/login', async ({ email, password }, { rejectWithValue }) => {
  if (!email || !password) return rejectWithValue('Please fill in all fields!');
  if (!Validate.email(email)) return rejectWithValue('Email is not correct!');

  try {
    const res = await authApi.login({ email, password });
    const token = res.data.token;
    const user = res.data.user;

    const authPayload: AuthPayload = {
      id: user._id || '',
      email: user.email,
      role: user.role,
      accesstoken: token,
    };

    await AsyncStorage.setItem('auth', JSON.stringify(authPayload));
    setToken(token);
    return authPayload;
  } catch (err: any) {
    return rejectWithValue(err?.message || 'Wrong email or password.');
  }
});

export const handleRegisterThunk = createAsyncThunk<
  void,
  { email: string; password: string; navigation: any },
  { rejectValue: string }
>(
  'auth/register',
  async ({ email, password, navigation }, { rejectWithValue }) => {
    try {
      await authApi.sendVerificationCode(email, 'register');
      navigation.navigate('Verification', {
        email,
        password,
        type: 'register',
      });
    } catch (err: any) {
      return rejectWithValue(
        err.message || 'Failed to send verification code.',
      );
    }
  },
);

export const handleResendCodeThunk = createAsyncThunk<
  void,
  { email: string; type: 'register' | 'reset' },
  { rejectValue: string }
>(
  'auth/resendVerificationCode',
  async ({ email, type }, { rejectWithValue }) => {
    try {
      await authApi.sendVerificationCode(email, type);
    } catch (err: any) {
      return rejectWithValue(
        err.message || 'Failed to resend verification code.',
      );
    }
  },
);

export const handleSendResetCodeThunk = createAsyncThunk<
  void,
  { email: string; navigation: any },
  { rejectValue: string }
>('auth/sendResetCode', async ({ email, navigation }, { rejectWithValue }) => {
  if (!Validate.email(email)) {
    return rejectWithValue('Invalid email format.');
  }

  try {
    await authApi.sendVerificationCode(email, 'reset');
  } catch (err: any) {
    return rejectWithValue(err.message || 'Failed to send reset code.');
  }
});

export const verifyCodeThunk = createAsyncThunk<
  void,
  {
    email: string;
    password?: string;
    code: string;
    type: 'register' | 'reset';
  },
  { rejectValue: string }
>(
  'auth/verifyCode',
  async ({ email, password, code, type }, { rejectWithValue }) => {
    if (code.length !== 4) {
      return rejectWithValue('Please enter the 4-digit code.');
    }

    try {
      await authApi.confirmCode(email, code);

      if (type === 'register') {
        if (!password)
          return rejectWithValue('Missing password for registration.');
        await authApi.register({ email, password });
      }
    } catch (err: any) {
      return rejectWithValue(err.message || 'Verification failed.');
    }
  },
);

export const resetPasswordThunk = createAsyncThunk<
  void,
  {
    email: string;
    password: string;
    confirmPassword: string;
    onSuccess: () => void;
  },
  { rejectValue: string }
>(
  'auth/resetPassword',
  async (
    { email, password, confirmPassword, onSuccess },
    { rejectWithValue },
  ) => {
    if (!password || !confirmPassword) {
      return rejectWithValue('Please fill in all fields.');
    }
    if (password !== confirmPassword) {
      return rejectWithValue('Passwords do not match.');
    }

    try {
      await authApi.resetPassword(email, password);
      onSuccess();
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to reset password.');
    }
  },
);
