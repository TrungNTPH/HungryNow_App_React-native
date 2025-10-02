import { ComboModel } from './ComboModel';
import { FoodModel } from './FoodModel';
import { FoodSizeModel } from './FoodSizeModel';
import { UserModel } from './UserModel';
import { VoucherModel } from './VoucherModel';

export interface InvoiceItem {
  itemId: FoodModel | ComboModel;
  itemType: 'Food' | 'Combo';
  foodSizeId?: FoodSizeModel;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export type PaymentMethod = 'COD' | 'QRPay' | 'ZaloPay';
export type NonZaloPayMethod = Exclude<PaymentMethod, 'ZaloPay'>;
export type PaymentStatus = 'paid' | 'pending';

export interface Payment {
  method: PaymentMethod;
  status: PaymentStatus;
  paymentDate: string | null;
  reference?: string | null;
  providerTransId?: string | null;
}

export interface AddressSnapshot {
  label: string;
  addressDetail: string;
  latitude?: number;
  longitude?: number;
  contactName?: string;
  contactPhone?: string;
}

export type TrackingStatus =
  | 'pending'
  | 'processing'
  | 'shipping'
  | 'delivered'
  | 'canceled';

export interface Tracking {
  status: TrackingStatus;
  updatedAt?: string;
}

export type ShippingStopRef = { stopId: string };

export type InvoiceStatus = TrackingStatus;

export type RefundStatus = 'none' | 'processing' | 'succeeded' | 'failed';
export type DeliveryCancelStatus =
  | 'none'
  | 'processing'
  | 'succeeded'
  | 'failed';

export interface InvoiceModel {
  _id: string;
  userId: UserModel;
  items: InvoiceItem[];
  total: number;
  payment: Payment;
  voucherId?: VoucherModel | null;
  discountAmount?: number;
  note?: string;
  shippingAddress: AddressSnapshot;
  shippingFee: number;
  shippingQuotationId?: string | null;
  shippingStops?: ShippingStopRef[];
  deliveryId?: string | null;
  deliveryCancelAttempted?: boolean;
  deliveryCancelStatus?: DeliveryCancelStatus;
  deliveryCanceledAt?: string | null;
  deliveryRequestId?: string | null;
  status: InvoiceStatus;
  isRefunded: boolean;
  refundStatus: RefundStatus;
  refundedAt?: string | null;
  refundRequestId?: string | null;
  refundGatewayId?: string | null;
  refundRequestedAt?: string | null;
  refundErrorCode?: string;
  refundErrorMessage?: string;

  invoiceDate: string;
  shippedAt?: string;
  deliveredAt?: string;

  trackingHistory: Tracking[];

  createdAt: string;
  updatedAt: string;
}

export interface HydratedInvoiceItem extends InvoiceItem {
  size?: { name: string; price: number };
}

export interface HydratedInvoiceModel extends InvoiceModel {
  items: HydratedInvoiceItem[];
}

export const isRefundProcessing = (inv: InvoiceModel) =>
  inv.status === 'canceled' &&
  inv.payment?.method === 'ZaloPay' &&
  inv.payment?.status === 'paid' &&
  (inv.refundStatus === 'processing' ||
    (inv.refundStatus === 'none' && !!inv.refundRequestId));

export const isDeliveryCancelProcessing = (inv: InvoiceModel) =>
  !!inv.deliveryId &&
  (inv.deliveryCancelStatus === 'processing' ||
    (inv.deliveryCancelAttempted && inv.deliveryCancelStatus === 'none'));

export type CancelCounterKey =
  | 'perDay'
  | 'per7Days'
  | 'per30Days'
  | 'perMonth'
  | 'perYear';
export type CancelCounts = Partial<Record<CancelCounterKey, number>>;

export interface CancelWarn {
  key: CancelCounterKey;
  count: number;
  limit: number;
}

export interface CancelPolicyResult {
  breached: boolean;
  breachedKeys: CancelCounterKey[];
  counts: CancelCounts;
  warns: CancelWarn[];
}
