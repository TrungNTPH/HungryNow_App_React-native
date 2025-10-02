import { CategoryModel } from './CategoryModel';
export interface FoodModel {
  _id: string;
  name: string;
  description: string;
  image: string;
  quantity: number;
  status: 'available' | 'unavailable';
  categoryId: CategoryModel;
  createdAt: string;
  updatedAt: string;
}
