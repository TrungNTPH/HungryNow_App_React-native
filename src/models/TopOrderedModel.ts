import { ComboModel } from './ComboModel';
import { FoodModel } from './FoodModel';

export interface TopOrderedModel {
  itemType: 'Food' | 'Combo';
  itemId: FoodModel | ComboModel;
  name?: string;
  image?: string;
  price?: number;
  totalQuantity: number;
}
