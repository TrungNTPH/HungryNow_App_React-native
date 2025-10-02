export type CategoryLite = { _id: string; name: string };

export type SearchFoodItem = {
  _id: string;
  type: 'Food';
  name: string;
  description?: string;
  image?: string;
  status: 'available' | 'unavailable';
  createdAt: string;
  category: CategoryLite | null;
  size: { _id: string } | null;
  price: number | null;
  avgStars: number;
  totalRatings: number;
};

export type SearchComboItem = {
  _id: string;
  type: 'Combo';
  name: string;
  description?: string;
  image?: string;
  status: 'available' | 'unavailable';
  createdAt: string;
  category: CategoryLite | null;
  size: null;
  price: number;
  avgStars: number;
  totalRatings: number;
};

export type SearchItem = SearchFoodItem | SearchComboItem;
