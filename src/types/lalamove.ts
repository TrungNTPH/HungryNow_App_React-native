export type LalamoveMarket = {
  code: string;
  name: string;
};

export type City = {
  id: string;
  name: string;
};

export type LalamoveCoordinates = {
  lat: string | number;
  lng: string | number;
};

export type LalamoveQuotedStop = {
  stopId: string;
  coordinates: LalamoveCoordinates;
  address?: string;
};

type MoneyLike =
  | string
  | number
  | { amount: string | number; currency?: string };

export type LalamovePriceBreakdown = {
  base?: MoneyLike;
  surcharge?: MoneyLike;
  totalBeforeOptimization?: MoneyLike;
  totalExcludePriorityFee?: MoneyLike;
  total?: MoneyLike;
  currency?: string;
};

export type LalamoveDistance = {
  value: string;
  unit: 'METER' | 'KM' | string;
};

export interface LalamoveFeeResponse {
  quotationId: string;
  scheduleAt: string | null;
  expiresAt: string;
  serviceType: string;
  language: string;
  stops: LalamoveQuotedStop[];
  isRouteOptimized?: boolean;
  priceBreakdown?: LalamovePriceBreakdown;
  distance?: LalamoveDistance;
}

export interface LalamoveOrderResponse {
  orderId: string;
  quotationId: string;
  status:
    | 'ASSIGNING'
    | 'ON_GOING'
    | 'COMPLETED'
    | 'CANCELED'
    | 'CANCELLED'
    | string;
  createdAt: string;
  shareLink?: string;
}

export interface LalamoveOrderDetail extends LalamoveOrderResponse {
  driverId?: string;
  drivers?: Array<{ driverId: string }>;
  assignedDriverId?: string;
}

export type LalamoveStop = {
  coordinates: { lat: string | number; lng: string | number };
  address: string;
};

export type LalamoveQuoteBody = {
  data: {
    serviceType: 'MOTORCYCLE';
    language: 'vi_VN';
    stops: LalamoveStop[];
    item: {
      quantity: string;
      weight: 'LESS_THAN_1KG';
      categories: Array<'FOOD_DELIVERY'>;
    };
  };
};

export type LalamoveOrderStopRef = { stopId: string; address?: string };

export interface LalamoveCreateOrderBody {
  quotationId: string;
  stops: LalamoveOrderStopRef[];
  sender: { name: string; phone: string };
  recipients: Array<{ name: string; phone: string; remarks?: string }>;
  isPODEnabled?: boolean;
  partner?: Record<string, any>;
  metadata?: Record<string, any>;
}

export function mapStopsForOrder(
  stops: LalamoveQuotedStop[],
): LalamoveOrderStopRef[] {
  return stops.map(s => ({ stopId: s.stopId, address: s.address }));
}

export const PICKUP_FIXED: LalamoveStop = {
  coordinates: {
    lat: '21.035093',
    lng: '105.747132',
  },
  address: 'Trường Cao đẳng FPT Polytechnic, Trịnh Văn Bô, Nam Từ Liêm, Hà Nội',
} as const;

export function buildLalamoveQuoteBody(params: {
  dropoff: LalamoveStop;
  quantity?: number;
}): LalamoveQuoteBody {
  const qty = String(params.quantity ?? 1);
  return {
    data: {
      serviceType: 'MOTORCYCLE',
      language: 'vi_VN',
      stops: [PICKUP_FIXED, params.dropoff],
      item: {
        quantity: qty,
        weight: 'LESS_THAN_1KG',
        categories: ['FOOD_DELIVERY'],
      },
    },
  };
}
