export interface ApplyVoucherPayload {
  idVoucher: string;
  totalOrderAmount: number;
  validateOnly?: boolean;
}
export interface VoucherModel {
  _id: string;
  title: string;
  description?: string;
  expirationDate: string;
  isForLoyalCustomer?: boolean;
  type: 'percentage' | 'fixed' | 'freeShipping' | 'firstOrder' | 'special';
  discountValue: number;
  discountMaxValue?: number | null;
  minimumOrderValue?: number;
  maxOrderValue?: number;
  maxUsagePerUser?: number;
  totalUsageLimit?: number;
  image?: string;
  selected?: boolean;
  createdAt?: string;
  updatedAt?: string;

  usedCount?: number;
  remainingUsage?: number | null;
}
