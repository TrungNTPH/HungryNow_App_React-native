import { FoodModel } from './FoodModel';
import { ComboModel } from './ComboModel';
import { UserModel } from './UserModel';
import { InvoiceModel } from './InvoiceModel';

export interface RatingModel {
  _id: string;
  userId: UserModel;
  itemId: FoodModel | ComboModel;
  itemType: 'Food' | 'Combo';
  invoiceId: InvoiceModel;
  stars: number;
  ratingTitle: string;
  ratingMessage: string;
  replyMessage?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PendingRatingModel {
  itemId: FoodModel | ComboModel;
  type: 'Food' | 'Combo';
  invoiceId: InvoiceModel;
  name?: string;
  description?: string;
  image?: string;
  price?: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  deliveredAt?: string;
}

export interface CreateRatingPayload {
  invoiceId: InvoiceModel;
  itemId: FoodModel | ComboModel;
  itemType: 'Food' | 'Combo';
  stars: number;
  ratingTitle?: string;
  ratingMessage?: string;
  image?: string;
}
