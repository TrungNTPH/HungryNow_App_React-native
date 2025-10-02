import { createAsyncThunk } from '@reduxjs/toolkit';
import { AddressData, AddressModel } from '../../models/AddressModel';
import { addressApi } from '../../apis/addressApi';

export const fetchAddressesThunk = createAsyncThunk<
  AddressModel[],
  void,
  { rejectValue: string }
>('addresses/fetch', async (_, { rejectWithValue }) => {
  try {
    const res = await addressApi.getAddresses();
    return res.data;
  } catch (err: any) {
    return rejectWithValue(err.message || 'Failed to fetch addresses');
  }
});

export const addAddressThunk = createAsyncThunk<
  AddressModel,
  AddressData,
  { rejectValue: string }
>('addresses/add', async (addressData, { rejectWithValue }) => {
  try {
    const res = await addressApi.addAddress(addressData);
    return res.data;
  } catch (err: any) {
    return rejectWithValue(err.message || 'Failed to add address');
  }
});

export const deleteAddressThunk = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>('addresses/delete', async (id, { rejectWithValue }) => {
  try {
    await addressApi.deleteAddress(id);
    return id;
  } catch (err: any) {
    return rejectWithValue(err.message || 'Failed to delete address');
  }
});

export const updateAddressThunk = createAsyncThunk<
  AddressModel,
  { id: string; data: Partial<AddressData> },
  { rejectValue: string }
>('addresses/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await addressApi.updateAddress(id, data);
    return res.data;
  } catch (err: any) {
    return rejectWithValue(err.message || 'Failed to update address');
  }
});
