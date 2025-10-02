import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  getLalamoveMarketsThunk,
  getLalamoveCitiesThunk,
  calculateLalamoveFeeThunk,
  createLalamoveOrderThunk,
  getLalamoveOrderDetailThunk,
  getLalamoveDriverLocationThunk,
} from '../actions/lalamoveAction';
import {
  LalamoveFeeResponse,
  LalamoveOrderResponse,
  LalamoveMarket,
  City,
  LalamoveOrderDetail,
} from '../../types/lalamove';

interface LalamoveState {
  markets: LalamoveMarket[];
  cities: City[];
  quotation: LalamoveFeeResponse | null;
  order: LalamoveOrderResponse | null;
  orderDetail: LalamoveOrderDetail | null;
  driverShareLink: string | null;

  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: LalamoveState = {
  markets: [],
  cities: [],
  quotation: null,
  order: null,
  orderDetail: null,
  driverShareLink: null,

  loading: false,
  error: null,
  successMessage: null,
};

const lalamoveSlice = createSlice({
  name: 'lalamove',
  initialState,
  reducers: {
    clearLalamoveMessages: state => {
      state.error = null;
      state.successMessage = null;
    },
    clearQuotation: state => {
      state.quotation = null;
    },
    clearOrder: state => {
      state.order = null;
    },
    clearOrderDetail: state => {
      state.orderDetail = null;
    },
    clearDriverShareLink: state => {
      state.driverShareLink = null;
    },
    clearMeta: state => {
      state.markets = [];
      state.cities = [];
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getLalamoveMarketsThunk.pending, state => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(
        getLalamoveMarketsThunk.fulfilled,
        (state, action: PayloadAction<LalamoveMarket[]>) => {
          state.loading = false;
          state.markets = action.payload;
          state.successMessage = 'Loaded Lalamove markets successfully';
        },
      )
      .addCase(getLalamoveMarketsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Failed to load markets';
      });

    builder
      .addCase(getLalamoveCitiesThunk.pending, state => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(
        getLalamoveCitiesThunk.fulfilled,
        (state, action: PayloadAction<City[]>) => {
          state.loading = false;
          state.cities = action.payload;
          state.successMessage = 'Loaded Lalamove cities successfully';
        },
      )
      .addCase(getLalamoveCitiesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Failed to load cities';
      });

    builder
      .addCase(calculateLalamoveFeeThunk.pending, state => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(
        calculateLalamoveFeeThunk.fulfilled,
        (state, action: PayloadAction<LalamoveFeeResponse>) => {
          state.loading = false;
          state.quotation = action.payload;
          state.successMessage = 'Calculated Lalamove fee successfully';
        },
      )
      .addCase(calculateLalamoveFeeThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || 'Failed to calculate Lalamove fee';
      });

    builder
      .addCase(createLalamoveOrderThunk.pending, state => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(
        createLalamoveOrderThunk.fulfilled,
        (state, action: PayloadAction<LalamoveOrderResponse>) => {
          state.loading = false;
          state.order = action.payload;
          state.successMessage = 'Created Lalamove order successfully';
        },
      )
      .addCase(createLalamoveOrderThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || 'Failed to create Lalamove order';
      });

    builder
      .addCase(getLalamoveOrderDetailThunk.pending, state => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
        state.orderDetail = null;
      })
      .addCase(
        getLalamoveOrderDetailThunk.fulfilled,
        (state, action: PayloadAction<LalamoveOrderDetail>) => {
          state.loading = false;
          state.orderDetail = action.payload;
          state.successMessage = 'Fetched Lalamove order detail';
        },
      )
      .addCase(getLalamoveOrderDetailThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || 'Failed to fetch order detail';
      });

    builder
      .addCase(getLalamoveDriverLocationThunk.pending, state => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
        state.driverShareLink = null;
      })
      .addCase(
        getLalamoveDriverLocationThunk.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.loading = false;
          state.driverShareLink = action.payload;
          state.successMessage = 'Fetched driver location link';
        },
      )
      .addCase(getLalamoveDriverLocationThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || 'Failed to fetch driver location';
      });
  },
});

export const {
  clearLalamoveMessages,
  clearQuotation,
  clearOrder,
  clearOrderDetail,
  clearDriverShareLink,
  clearMeta,
} = lalamoveSlice.actions;

export const lalamoveReducer = lalamoveSlice.reducer;
type Root = { lalamove: LalamoveState };
export const lalamoveLoadingSelector = (s: Root) => s.lalamove.loading;
export const lalamoveErrorSelector = (s: Root) => s.lalamove.error;
export const lalamoveSuccessSelector = (s: Root) => s.lalamove.successMessage;
export const lalamoveMarketsSelector = (s: Root) => s.lalamove.markets;
export const lalamoveCitiesSelector = (s: Root) => s.lalamove.cities;
export const lalamoveQuotationSelector = (s: Root) => s.lalamove.quotation;
export const lalamoveOrderSelector = (s: Root) => s.lalamove.order;
export const lalamoveOrderDetailSelector = (s: Root) => s.lalamove.orderDetail;
export const lalamoveDriverShareLinkSelector = (s: Root) =>
  s.lalamove.driverShareLink;
