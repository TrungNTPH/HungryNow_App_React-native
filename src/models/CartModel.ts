import { ComboModel } from './ComboModel';
import { FoodModel } from './FoodModel';
import { FoodSizeModel } from './FoodSizeModel';
import { UserModel } from './UserModel';

export interface CartModel {
  _id: string;
  userId: UserModel;
  itemType: 'Food' | 'Combo';
  itemId: FoodModel | ComboModel;
  foodSizeId?: FoodSizeModel;
  quantity: number;
  note?: string;
  selected?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HydratedCartModel extends CartModel {
  size?: {
    name: string;
    price: number;
  };
  selected?: boolean;
}
