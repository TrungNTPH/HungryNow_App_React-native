import axiosClient from './axiosClient';
import { BaseResponse } from '../types/base-response';
import {
  CancelPolicyResult,
  HydratedInvoiceModel,
  NonZaloPayMethod,
  PaymentMethod,
  ShippingStopRef,
} from '../models/InvoiceModel';

export const invoiceApi = {
  addInvoice: async (payload: {
    cartIds: string[];
    paymentMethod: NonZaloPayMethod;
    voucherId?: string;
    note?: string;
    paymentRef?: string | null;
    shippingFee: number;
    shippingQuotationId: string;
    shippingStops: ShippingStopRef[];
  }): Promise<BaseResponse<{ invoice: HydratedInvoiceModel }>> => {
    return await axiosClient.post('/invoices', payload);
  },

  getMyInvoices: async (): Promise<BaseResponse<HydratedInvoiceModel[]>> => {
    return await axiosClient.get('/invoices/my-invoices');
  },

  getInvoiceById: async (
    id: string,
  ): Promise<BaseResponse<HydratedInvoiceModel>> => {
    return await axiosClient.get(`/invoices/${id}`);
  },

  updatePaymentStatus: async (
    id: string,
  ): Promise<BaseResponse<HydratedInvoiceModel>> => {
    return await axiosClient.patch(`/invoices/payment/${id}`);
  },

  cancelInvoice: async (
    id: string,
  ): Promise<
    BaseResponse<HydratedInvoiceModel> & { cancelPolicy?: CancelPolicyResult }
  > => {
    return await axiosClient.patch(`/invoices/cancel/${id}`);
  },
};
