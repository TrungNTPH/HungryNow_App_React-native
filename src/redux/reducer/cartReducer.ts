import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CartModel } from '../../models/CartModel';
import {
  fetchCartThunk,
  addCartThunk,
  updateCartThunk,
  deleteCartThunk,
} from '../actions/cartAction';

interface CartState {
  items: CartModel[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: CartState = {
  items: [],
  loading: false,
  error: null,
  successMessage: null,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearCartMessages: state => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchCartThunk.pending, state => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(
        fetchCartThunk.fulfilled,
        (state, action: PayloadAction<CartModel[]>) => {
          state.loading = false;
          state.items = action.payload;
          state.successMessage = 'Loaded cart successfully';
        },
      )
      .addCase(fetchCartThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load cart';
      })

      .addCase(addCartThunk.pending, state => {
        state.loading = true;
        state.successMessage = null;
      })
      .addCase(
        addCartThunk.fulfilled,
        (state, action: PayloadAction<CartModel>) => {
          state.loading = false;
          const index = state.items.findIndex(
            i => i._id === action.payload._id,
          );
          if (index >= 0) {
            state.items[index] = action.payload;
            state.successMessage = 'Cart item updated successfully';
          } else {
            state.items.unshift(action.payload);
            state.successMessage = 'Item added to cart successfully';
          }
        },
      )
      .addCase(addCartThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to add item to cart';
      })

      .addCase(updateCartThunk.pending, state => {
        state.loading = true;
        state.successMessage = null;
      })
      .addCase(
        updateCartThunk.fulfilled,
        (state, action: PayloadAction<CartModel>) => {
          state.loading = false;
          const index = state.items.findIndex(
            i => i._id === action.payload._id,
          );
          if (index !== -1) {
            state.items[index] = action.payload;
            state.successMessage = 'Cart updated successfully';
          }
        },
      )
      .addCase(updateCartThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update cart';
      })

      .addCase(deleteCartThunk.pending, state => {
        state.loading = true;
        state.successMessage = null;
      })
      .addCase(
        deleteCartThunk.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.loading = false;
          state.items = state.items.filter(i => i._id !== action.payload);
          state.successMessage = 'Item removed from cart successfully';
        },
      )
      .addCase(deleteCartThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to remove item from cart';
      });
  },
});

export const { clearCartMessages } = cartSlice.actions;
export const cartReducer = cartSlice.reducer;
export const cartSelector = (state: { cart: CartState }) => state.cart.items;
export const cartLoadingSelector = (state: { cart: CartState }) =>
  state.cart.loading;
export const cartErrorSelector = (state: { cart: CartState }) =>
  state.cart.error;
export const cartSuccessSelector = (state: { cart: CartState }) =>
  state.cart.successMessage;
