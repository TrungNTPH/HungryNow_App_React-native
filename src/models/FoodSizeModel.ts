import { FoodModel } from './FoodModel';
import { SizeModel } from './SizeModel';

export interface FoodSizeModel {
  _id: string;
  foodId: FoodModel;
  sizeId: SizeModel;
  price: number;
  createdAt: string;
  updatedAt: string;
}
