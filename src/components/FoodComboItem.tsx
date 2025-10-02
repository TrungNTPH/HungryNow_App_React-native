import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity } from 'react-native';
import TextComponent from './TextComponent';
import { appColors } from '../constants';
import Icon from 'react-native-vector-icons/Entypo';

interface FoodComboItemProps {
  item: {
    name: string;
    image?: string;
    rating: number;
    price: number;
    itemId: string;
    itemType: 'Food' | 'Combo';
  };
  onPress: () => void;
  onAddFavorite?: () => void;
  isFavorite: boolean;
}

const FoodComboItem = ({
  item,
  onPress,
  isFavorite,
  onAddFavorite,
}: FoodComboItemProps) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <Image source={{ uri: item.image || '' }} style={styles.image} />

      <TouchableOpacity style={styles.heartIcon} onPress={onAddFavorite}>
        <Icon
          name={isFavorite ? 'heart' : 'heart-outlined'}
          size={20}
          color={appColors.danger}
        />
      </TouchableOpacity>

      <TextComponent text={item.name} size={14} styles={styles.name} />

      <View style={styles.row}>
        <Icon name="star" size={12} color={appColors.orange} />
        <TextComponent text={` ${item.rating.toFixed(1)}`} size={12} />
      </View>

      <TextComponent
        text={`${item.price?.toLocaleString?.() || 0} VND`}
        size={14}
        color={appColors.orange}
        font="bold"
        styles={styles.price}
      />
    </TouchableOpacity>
  );
};

export default FoodComboItem;

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: appColors.white,
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  heartIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: appColors.white,
    borderRadius: 16,
    padding: 6,
    elevation: 2,
    margin: 4,
  },
  name: {
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  price: {
    marginTop: 6,
  },
});
