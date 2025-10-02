import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AddressModel } from '../../models/AddressModel';
import {
  fetchAddressesThunk,
  addAddressThunk,
  deleteAddressThunk,
  updateAddressThunk,
} from '../actions/addressAction';

interface AddressState {
  addresses: AddressModel[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: AddressState = {
  addresses: [],
  loading: false,
  error: null,
  successMessage: null,
};

const addressSlice = createSlice({
  name: 'address',
  initialState,
  reducers: {
    clearAddressMessages: state => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchAddressesThunk.pending, state => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(
        fetchAddressesThunk.fulfilled,
        (state, action: PayloadAction<AddressModel[]>) => {
          state.loading = false;
          state.addresses = action.payload;
          state.successMessage = 'Loaded addresses successfully';
        },
      )
      .addCase(
        fetchAddressesThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading = false;
          state.error = action.payload || 'Failed to load addresses';
        },
      )
      .addCase(addAddressThunk.pending, state => {
        state.loading = true;
        state.successMessage = null;
      })
      .addCase(
        addAddressThunk.fulfilled,
        (state, action: PayloadAction<AddressModel>) => {
          state.loading = false;
          if (action.payload.isDefault) {
            state.addresses = state.addresses.map(addr => ({
              ...addr,
              isDefault: false,
            }));
          }
          state.addresses.push(action.payload);
          state.successMessage = 'Address added successfully';
        },
      )
      .addCase(
        addAddressThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading = false;
          state.error = action.payload || 'Failed to add address';
        },
      )
      .addCase(deleteAddressThunk.pending, state => {
        state.loading = true;
        state.successMessage = null;
      })
      .addCase(
        deleteAddressThunk.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.loading = false;
          state.addresses = state.addresses.filter(
            addr => addr._id !== action.payload,
          );
          state.successMessage = 'Address removed successfully';
        },
      )
      .addCase(
        deleteAddressThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading = false;
          state.error = action.payload || 'Failed to remove address';
        },
      )
      .addCase(updateAddressThunk.pending, state => {
        state.loading = true;
        state.successMessage = null;
      })
      .addCase(
        updateAddressThunk.fulfilled,
        (state, action: PayloadAction<AddressModel>) => {
          state.loading = false;
          const updatedAddress = action.payload;
          if (updatedAddress.isDefault) {
            state.addresses = state.addresses.map(addr =>
              addr._id === updatedAddress._id
                ? updatedAddress
                : { ...addr, isDefault: false },
            );
          } else {
            state.addresses = state.addresses.map(addr =>
              addr._id === updatedAddress._id ? updatedAddress : addr,
            );
          }
          state.successMessage = 'Address updated successfully';
        },
      )
      .addCase(
        updateAddressThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading = false;
          state.error = action.payload || 'Failed to update address';
        },
      );
  },
});

export const { clearAddressMessages } = addressSlice.actions;
export const addressReducer = addressSlice.reducer;
export const addressSelector = (state: { address: AddressState }) =>
  state.address.addresses;
export const addressLoadingSelector = (state: { address: AddressState }) =>
  state.address.loading;
export const addressErrorSelector = (state: { address: AddressState }) =>
  state.address.error;
export const addressSuccessSelector = (state: { address: AddressState }) =>
  state.address.successMessage;
