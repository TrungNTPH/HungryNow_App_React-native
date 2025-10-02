import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import Entypo from 'react-native-vector-icons/Entypo';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import TextComponent from './TextComponent';
import { appColors, appFonts } from '../constants';
import { FoodModel } from '../models/FoodModel';

interface Props {
  item: FoodModel & {
    price: number;
    rating: number;
  };
  onPress?: () => void;
  onAddFavorite?: () => void;
  isFavorite?: boolean;
}

export const FoodItem = ({
  item,
  onPress,
  onAddFavorite,
  isFavorite,
}: Props) => {
  const hasImage = !!item?.image;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.imageWrap}>
        {hasImage ? (
          <Image source={{ uri: item.image }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Entypo name="image" size={22} color="#BDBDBD" />
          </View>
        )}

        {/* overlay: rating + heart */}
        <View style={styles.overlayRow}>
          <View style={styles.ratingPill}>
            <FontAwesome name="star" size={12} color={appColors.orange} />
            <TextComponent
              text={` ${item.rating.toFixed(1)}`}
              size={12}
              color="#222"
            />
          </View>

          <TouchableOpacity
            onPress={onAddFavorite}
            style={styles.heartBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.85}
          >
            <Entypo
              name={isFavorite ? 'heart' : 'heart-outlined'}
              size={18}
              color={appColors.danger}
            />
          </TouchableOpacity>
        </View>
      </View>

      <TextComponent
        text={item.name}
        size={14}
        font={appFonts.semiBold}
        numberOfLine={2}
        styles={styles.name}
      />

      <View style={styles.footerRow}>
        <TextComponent
          text={`${item.price.toLocaleString()} VND`}
          size={14}
          color={appColors.orange}
          font={appFonts.semiBold}
        />
        <View style={styles.tag}>
          <TextComponent text="Food" size={11} color="#2F7DD0" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  imageWrap: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    resizeMode: 'cover',
    backgroundColor: '#F5F5F5',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECECEC',
  },
  overlayRow: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  heartBtn: {
    backgroundColor: '#FFF',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  name: {
    marginTop: 8,
    color: '#222',
  },
  footerRow: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#EEF7FF',
    borderWidth: 1,
    borderColor: '#D6ECFF',
  },
});
