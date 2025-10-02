export type PaymentMethod = 'ZaloPay' | 'QRPay';

export type PaymentIntentStatus =
  | 'requires_action'
  | 'pending'
  | 'succeeded'
  | 'canceled'
  | 'expired';

export type ShippingStopRef = { stopId: string };

export interface PaymentIntentModel {
  _id: string;
  userId?: string;
  method: PaymentMethod;
  amount: number;
  status: PaymentIntentStatus;
  appTransId?: string | null;
  providerTransId?: string | null;
  orderUrl?: string | null;
  deeplink?: string | null;
  cartIds: string[];
  voucherId?: string | null;
  note?: string | null;
  invoiceId?: string | null;
  shippingFee?: number;
  shippingQuotationId?: string | null;
  shippingStops?: ShippingStopRef[];
  expiresAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateZaloPayIntentPayload {
  description: string;
  cartIds: string[];
  voucherId?: string;
  note?: string;
  shippingFee: number;
  shippingQuotationId: string;
  shippingStops: ShippingStopRef[];
  amount?: number;
}

export interface CreateZaloPayIntentData {
  intentId: string;
  appTransId: string;
  orderUrl?: string | null;
  deeplink?: string | null;
  status: PaymentIntentStatus;
  expiresAt: string;
}

export interface GetPaymentIntentData {
  intentId: string;
  status: PaymentIntentStatus;
  appTransId?: string | null;
  providerTransId?: string | null;
  orderUrl?: string | null;
  deeplink?: string | null;
  invoiceId?: string | null;
  expiresAt: string;
}
