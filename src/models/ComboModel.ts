import { CategoryModel } from './CategoryModel';
import { FoodModel } from './FoodModel';

export interface ComboFoodModel {
  foodId: FoodModel;
  quantity: number;
  _id: string;
}

export interface ComboModel {
  _id: string;
  name: string;
  categoryId: CategoryModel;
  price: number;
  description?: string;
  image?: string;
  foods: ComboFoodModel[];
  status: 'available' | 'unavailable';
  createdAt: string;
  updatedAt: string;
}
