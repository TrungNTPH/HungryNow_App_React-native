import { createAsyncThunk } from '@reduxjs/toolkit';
import { cartApi } from '../../apis/cartApi';
import { CartModel } from '../../models/CartModel';
import { FoodSizeModel } from '../../models/FoodSizeModel';

export const fetchCartThunk = createAsyncThunk<
  CartModel[],
  void,
  { rejectValue: string }
>('cart/fetchCart', async (_, { rejectWithValue }) => {
  try {
    const res = await cartApi.getMyCarts();
    return res.data;
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.message || 'Failed to fetch cart items.',
    );
  }
});

export const addCartThunk = createAsyncThunk<
  CartModel,
  {
    itemId: string;
    itemType: 'Food' | 'Combo';
    quantity: number;
    foodSizeId?: string;
    note?: string;
  },
  { rejectValue: string }
>('cart/addCart', async (data, { rejectWithValue }) => {
  try {
    const res = await cartApi.addCart(data);
    return res.data;
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.message || 'Failed to add to cart.',
    );
  }
});

export const updateCartThunk = createAsyncThunk<
  CartModel,
  {
    id: string;
    quantity?: number;
    note?: string;
    foodSizeId?: string | FoodSizeModel;
  },
  { rejectValue: string }
>('cart/updateCart', async ({ id, ...rest }, { rejectWithValue }) => {
  try {
    const res = await cartApi.updateCart(id, rest);
    return res.data;
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.message || 'Failed to update cart item.',
    );
  }
});

export const deleteCartThunk = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>('cart/deleteCart', async (id, { rejectWithValue }) => {
  try {
    await cartApi.deleteCart(id);
    return id;
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.message || 'Failed to delete cart item.',
    );
  }
});
