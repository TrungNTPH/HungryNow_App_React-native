import { configureStore } from '@reduxjs/toolkit';
import { authReducer } from './reducer/authReducer';
import { foodReducer } from './reducer/foodReducer';
import { foodSizeReducer } from './reducer/foodSizeReducer';
import { categoryReducer } from './reducer/categoryReducer';
import { cartReducer } from './reducer/cartReducer';
import { userReducer } from './reducer/userReducer';
import { addressReducer } from './reducer/addressReducer';
import { comboReducer } from './reducer/comboReducer';
import { topOrderedReducer } from './reducer/topOrderedReducer';
import { voucherReducer } from './reducer/voucherReducer';
import { favoriteReducer } from './reducer/favoriteReducer';
import { ratingReducer } from './reducer/ratingReducer';
import { notificationReducer } from './reducer/notificationReducer';
import { invoiceReducer } from './reducer/invoiceReducer';
import { sizeReducer } from './reducer/sizeReducer';
import { paymentIntentReducer } from './reducer/paymentIntentReducer';
import { lalamoveReducer } from './reducer/lalamoveReducer';
import chatAIReducer from './reducer/chatAIReducer';

const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    address: addressReducer,
    food: foodReducer,
    foodSize: foodSizeReducer,
    combo: comboReducer,
    category: categoryReducer,
    cart: cartReducer,
    topOrdered: topOrderedReducer,
    voucher: voucherReducer,
    favorite: favoriteReducer,
    rating: ratingReducer,
    notification: notificationReducer,
    invoice: invoiceReducer,
    size: sizeReducer,
    paymentIntent: paymentIntentReducer,
    lalamove: lalamoveReducer,
    chatAI: chatAIReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
