import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { HydratedInvoiceModel } from '../../models/InvoiceModel';
import {
  fetchMyInvoicesThunk,
  fetchInvoiceByIdThunk,
  addInvoiceThunk,
  updateInvoicePaymentStatusThunk,
  cancelInvoiceThunk,
} from '../actions/invoiceAction';

interface InvoiceState {
  items: HydratedInvoiceModel[];
  selectedInvoice: HydratedInvoiceModel | null;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: InvoiceState = {
  items: [],
  selectedInvoice: null,
  loading: false,
  error: null,
  successMessage: null,
};

const upsertInvoice = (
  list: HydratedInvoiceModel[],
  inv: HydratedInvoiceModel,
) => {
  const idx = list.findIndex(i => i._id === inv._id);
  if (idx >= 0) list[idx] = inv;
  else list.unshift(inv);
};

const invoiceSlice = createSlice({
  name: 'invoice',
  initialState,
  reducers: {
    clearInvoiceMessages: state => {
      state.error = null;
      state.successMessage = null;
    },
    clearSelectedInvoice: state => {
      state.selectedInvoice = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchMyInvoicesThunk.pending, state => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(
        fetchMyInvoicesThunk.fulfilled,
        (state, action: PayloadAction<HydratedInvoiceModel[]>) => {
          state.loading = false;
          state.items = action.payload;
          state.successMessage = 'Loaded invoices successfully';
        },
      )
      .addCase(fetchMyInvoicesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load invoices';
      });
    builder
      .addCase(fetchInvoiceByIdThunk.pending, state => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(
        fetchInvoiceByIdThunk.fulfilled,
        (state, action: PayloadAction<HydratedInvoiceModel>) => {
          state.loading = false;
          state.selectedInvoice = action.payload;
          upsertInvoice(state.items, action.payload);
          state.successMessage = 'Loaded invoice details successfully';
        },
      )
      .addCase(fetchInvoiceByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load invoice details';
      });
    builder
      .addCase(addInvoiceThunk.pending, state => {
        state.loading = true;
        state.successMessage = null;
      })
      .addCase(
        addInvoiceThunk.fulfilled,
        (state, action: PayloadAction<{ invoice: HydratedInvoiceModel }>) => {
          state.loading = false;
          upsertInvoice(state.items, action.payload.invoice);
          state.successMessage = 'Created invoice successfully';
        },
      )
      .addCase(addInvoiceThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create invoice';
      });
    builder
      .addCase(updateInvoicePaymentStatusThunk.pending, state => {
        state.loading = true;
        state.successMessage = null;
      })
      .addCase(
        updateInvoicePaymentStatusThunk.fulfilled,
        (state, action: PayloadAction<HydratedInvoiceModel>) => {
          state.loading = false;
          upsertInvoice(state.items, action.payload);
          if (state.selectedInvoice?._id === action.payload._id) {
            state.selectedInvoice = action.payload;
          }
          state.successMessage = 'Updated payment status';
        },
      )
      .addCase(updateInvoicePaymentStatusThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update payment status';
      });

    builder
      .addCase(cancelInvoiceThunk.pending, state => {
        state.loading = true;
        state.successMessage = null;
      })
      .addCase(
        cancelInvoiceThunk.fulfilled,
        (state, action: PayloadAction<HydratedInvoiceModel>) => {
          state.loading = false;
          upsertInvoice(state.items, action.payload);
          if (state.selectedInvoice?._id === action.payload._id) {
            state.selectedInvoice = action.payload;
          }
          state.successMessage = 'Cancelled invoice successfully';
        },
      )
      .addCase(cancelInvoiceThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to cancel invoice';
      });
  },
});

export const { clearInvoiceMessages, clearSelectedInvoice } =
  invoiceSlice.actions;
export const invoiceReducer = invoiceSlice.reducer;
export const invoiceItemsSelector = (state: { invoice: InvoiceState }) =>
  state.invoice.items;
export const invoiceLoadingSelector = (state: { invoice: InvoiceState }) =>
  state.invoice.loading;
export const invoiceErrorSelector = (state: { invoice: InvoiceState }) =>
  state.invoice.error;
export const invoiceSuccessSelector = (state: { invoice: InvoiceState }) =>
  state.invoice.successMessage;
export const selectedInvoiceSelector = (state: { invoice: InvoiceState }) =>
  state.invoice.selectedInvoice;
