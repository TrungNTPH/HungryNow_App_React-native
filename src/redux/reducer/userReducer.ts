import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  fetchUserProfileThunk,
  updateUserProfileThunk,
  changePasswordThunk,
  confirmPhoneVerificationThunk,
} from '../actions/userAction';
import { UserModel } from '../../models/UserModel';

interface UserState {
  profile: UserModel | null;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: UserState = {
  profile: null,
  loading: false,
  error: null,
  successMessage: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearUser: state => {
      state.profile = null;
    },
    clearUserMessages: state => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchUserProfileThunk.pending, state => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(
        fetchUserProfileThunk.fulfilled,
        (state, action: PayloadAction<UserModel>) => {
          state.loading = false;
          state.profile = action.payload;
          state.successMessage = 'Loaded user profile successfully';
        },
      )
      .addCase(fetchUserProfileThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load user profile';
      });
    builder
      .addCase(updateUserProfileThunk.pending, state => {
        state.loading = true;
        state.successMessage = null;
      })
      .addCase(
        updateUserProfileThunk.fulfilled,
        (state, action: PayloadAction<UserModel>) => {
          state.loading = false;
          state.profile = action.payload;
          state.successMessage = 'Profile updated successfully';
        },
      )
      .addCase(updateUserProfileThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update profile';
      });
    builder
      .addCase(changePasswordThunk.pending, state => {
        state.loading = true;
        state.successMessage = null;
      })
      .addCase(
        changePasswordThunk.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.loading = false;
          state.successMessage =
            action.payload || 'Password changed successfully';
        },
      )
      .addCase(changePasswordThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to change password';
      });
    builder
      .addCase(confirmPhoneVerificationThunk.pending, state => {
        state.loading = true;
        state.successMessage = null;
      })
      .addCase(
        confirmPhoneVerificationThunk.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.loading = false;
          state.successMessage =
            action.payload || 'Phone verified successfully';
          if (state.profile) {
            state.profile.isPhoneVerified = true;
          }
        },
      )
      .addCase(confirmPhoneVerificationThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to verify phone';
      });
  },
});

export const { clearUser, clearUserMessages } = userSlice.actions;
export const userReducer = userSlice.reducer;
export const userSelector = (state: { user: UserState }) => state.user;
