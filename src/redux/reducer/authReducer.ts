import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  handleLoginThunk,
  handleRegisterThunk,
  handleSendResetCodeThunk,
  verifyCodeThunk,
  resetPasswordThunk,
  handleResendCodeThunk,
} from '../actions/authAction';
import { UserRole } from '../../models/UserModel';

interface AuthState {
  id: string;
  email: string;
  role: UserRole;
  accesstoken: string;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: AuthState = {
  id: '',
  email: '',
  role: 'user',
  accesstoken: '',
  loading: false,
  error: null,
  successMessage: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    addAuth: (state, action: PayloadAction<AuthState>) => {
      return {
        ...action.payload,
        loading: false,
        error: null,
        successMessage: null,
      };
    },
    removeAuth: () => initialState,
    clearAuthMessages: state => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(handleLoginThunk.pending, state => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(handleLoginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = 'Logged in successfully';
        state.id = action.payload.id;
        state.email = action.payload.email;
        state.role = action.payload.role;
        state.accesstoken = action.payload.accesstoken;
      })
      .addCase(handleLoginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Login failed';
      })
      .addCase(handleRegisterThunk.pending, state => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(handleRegisterThunk.fulfilled, state => {
        state.loading = false;
        state.successMessage = 'Verification code sent successfully';
      })
      .addCase(handleRegisterThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Registration failed';
      })
      .addCase(handleSendResetCodeThunk.pending, state => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(handleSendResetCodeThunk.fulfilled, state => {
        state.loading = false;
        state.successMessage = 'Reset code sent successfully';
      })
      .addCase(handleSendResetCodeThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to send reset code';
      })
      .addCase(handleResendCodeThunk.pending, state => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(handleResendCodeThunk.fulfilled, state => {
        state.loading = false;
        state.successMessage = 'Verification code resent successfully';
      })
      .addCase(handleResendCodeThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to resend code';
      })
      .addCase(verifyCodeThunk.pending, state => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(verifyCodeThunk.fulfilled, state => {
        state.loading = false;
        state.successMessage = 'Account verified successfully';
      })
      .addCase(verifyCodeThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Verification failed';
      })
      .addCase(resetPasswordThunk.pending, state => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(resetPasswordThunk.fulfilled, state => {
        state.loading = false;
        state.successMessage = 'Password reset successfully';
      })
      .addCase(resetPasswordThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to reset password';
      });
  },
});

export const { addAuth, removeAuth, clearAuthMessages } = authSlice.actions;
export const authReducer = authSlice.reducer;
export const authSelector = (state: { auth: AuthState }) => state.auth;
export const authLoadingSelector = (state: { auth: AuthState }) =>
  state.auth.loading;
export const authErrorSelector = (state: { auth: AuthState }) =>
  state.auth.error;
export const authSuccessSelector = (state: { auth: AuthState }) =>
  state.auth.successMessage;
