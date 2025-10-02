import { createAsyncThunk } from '@reduxjs/toolkit';
import { UserModel } from '../../models/UserModel';
import { userApi } from '../../apis/userApi';

export const fetchUserProfileThunk = createAsyncThunk<
  UserModel,
  void,
  { rejectValue: string }
>('users/fetchProfile', async (_, { rejectWithValue }) => {
  try {
    const res = await userApi.getProfile();
    return res.data;
  } catch (err: any) {
    return rejectWithValue(err.message || 'Failed to fetch profile');
  }
});

export const updateUserProfileThunk = createAsyncThunk<
  UserModel,
  Partial<UserModel>,
  { rejectValue: string }
>('users/updateProfile', async (updatedData, { rejectWithValue }) => {
  try {
    const res = await userApi.updateProfile(updatedData);
    return res.data;
  } catch (err: any) {
    return rejectWithValue(err.message || 'Failed to update profile');
  }
});

export const changePasswordThunk = createAsyncThunk<
  string,
  { currentPassword: string; newPassword: string },
  { rejectValue: string }
>('users/changePassword', async (data, { rejectWithValue }) => {
  try {
    const res = await userApi.changePassword(data);
    return res.message;
  } catch (err: any) {
    return rejectWithValue(err.message || 'Failed to change password');
  }
});

export const confirmPhoneVerificationThunk = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>('users/verifyPhone', async (idToken, { rejectWithValue }) => {
  try {
    const res = await userApi.confirmPhoneVerification(idToken);
    return res.message;
  } catch (err: any) {
    return rejectWithValue(
      err.message || 'Failed to confirm phone verification',
    );
  }
});
