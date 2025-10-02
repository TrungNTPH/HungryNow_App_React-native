import { NavigationProp } from '@react-navigation/native';
import { FoodSizeModel } from '../models/FoodSizeModel';

const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

export const navigateToItemDetail = ({
  navigation,
  item,
  itemType,
  foodSizes,
  allItems,
}: {
  navigation: NavigationProp<any>;
  item: any;
  itemType: 'Food' | 'Combo';
  foodSizes: FoodSizeModel[];
  allItems: any[];
}) => {
  const isFood = itemType === 'Food';

  const screen = isFood ? 'FoodDetailScreen' : 'ComboDetailScreen';
  const key = isFood ? 'food' : 'combo';
  const suggestionKey = isFood ? 'suggestedFoods' : 'suggestedCombos';

  const clonedItem = deepClone(item);

  const rawItem =
    clonedItem &&
    typeof clonedItem === 'object' &&
    clonedItem.itemId &&
    typeof clonedItem.itemId === 'object'
      ? clonedItem.itemId
      : clonedItem;

  const matchedSizes = isFood
    ? foodSizes.filter(size => size?.foodId?._id === rawItem._id)
    : [];

  const price = isFood
    ? matchedSizes.length > 0
      ? Math.min(...matchedSizes.map(s => s.price))
      : rawItem.price ?? clonedItem.price ?? 0
    : rawItem.price ?? clonedItem.price ?? 0;

  const detailItem = {
    ...clonedItem,
    ...rawItem,
    itemType: clonedItem.itemType ?? itemType,
    price,
    rating: rawItem.rating ?? clonedItem.rating ?? 4.5,
  };

  const suggestions = allItems
    .map(i => deepClone(i))
    .filter(i => {
      const rawI = i.itemId ?? i;
      return rawI._id !== rawItem._id;
    })
    .map(i => {
      const rawI = i.itemId ?? i;

      let suggestionPrice;
      if ((i.itemType ?? itemType) === 'Food') {
        const sizes = foodSizes.filter(s => s?.foodId?._id === rawI._id);
        suggestionPrice =
          sizes.length > 0
            ? Math.min(...sizes.map(s => s.price))
            : rawI.price ?? i.price ?? 0;
      } else {
        suggestionPrice = rawI.price ?? i.price ?? 0;
      }

      return {
        ...i,
        ...rawI,
        itemType: i.itemType ?? itemType,
        price: suggestionPrice,
        rating: rawI.rating ?? i.rating ?? 4.5,
        _normId: rawI?._id ?? i?._id ?? null,
      };
    });

  const seen = new Set<string | null>();
  const uniqueSuggestions = suggestions.filter(s => {
    if (seen.has(s._normId)) return false;
    seen.add(s._normId);
    return true;
  });

  const swappedSuggestions = [
    { ...detailItem, _normId: detailItem._id + '_swap' },
    ...uniqueSuggestions,
  ];

  navigation.navigate(screen, {
    [key]: detailItem,
    [suggestionKey]: swappedSuggestions,
  });
};
