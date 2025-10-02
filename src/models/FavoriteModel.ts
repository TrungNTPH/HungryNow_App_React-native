import { FoodModel } from './FoodModel';
import { ComboModel } from './ComboModel';
import { UserModel } from './UserModel';

export interface FavoriteModel {
  _id: string;
  userId: UserModel;
  itemId: FoodModel | ComboModel;
  itemType: 'Food' | 'Combo';
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}
