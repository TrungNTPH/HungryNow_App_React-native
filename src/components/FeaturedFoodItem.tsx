import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import TextComponent from './TextComponent';
import { appColors, appFonts } from '../constants';

type FeaturedType = 'Food' | 'Combo';

interface FeaturedFoodItemProps {
  item: {
    itemType: FeaturedType;
    image?: string;
    name: string;
    rating?: number;
    price?: number;
  };
  onPress: () => void;
  onAddFavorite: () => void;
  isFavorite: boolean;
}

const FeaturedFoodItem: React.FC<FeaturedFoodItemProps> = ({
  item,
  onPress,
  onAddFavorite,
  isFavorite,
}) => {
  const hasImage = !!item?.image;
  const rating = Number.isFinite(item?.rating) ? Number(item?.rating) : 0;
  const price = Number.isFinite(item?.price) ? Number(item?.price) : 0;

  const isFood = item.itemType === 'Food';
  const tagStyle = isFood ? styles.tagFood : styles.tagCombo;
  const tagColor = isFood ? '#2F7DD0' : '#6E56CF';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      {/* Image + overlays */}
      <View style={styles.imageWrap}>
        {hasImage ? (
          <Image source={{ uri: item.image }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Ionicons name="image" size={20} color="#BDBDBD" />
          </View>
        )}

        {/* Top overlay: rating + heart */}
        <View style={styles.overlayTop}>
          <View style={styles.ratingPill}>
            <Ionicons name="star" size={12} color={appColors.orange} />
            <TextComponent
              text={` ${rating.toFixed(1)}`}
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
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={18}
              color={appColors.danger}
            />
          </TouchableOpacity>
        </View>

        {/* Bottom overlay: type */}
        <View style={[styles.typeTag, tagStyle]}>
          <TextComponent text={item.itemType} size={11} color={tagColor} />
        </View>
      </View>

      {/* Name */}
      <TextComponent
        text={item.name}
        size={14}
        font={appFonts.semiBold}
        numberOfLine={2}
        styles={styles.name}
      />

      {/* Price only (no type here to avoid overflow) */}
      <View style={styles.footerRow}>
        <TextComponent
          text={`${price.toLocaleString()} VND`}
          size={14}
          color={appColors.orange}
          font={appFonts.semiBold}
          numberOfLine={1}
        />
      </View>
    </TouchableOpacity>
  );
};

export default FeaturedFoodItem;

const styles = StyleSheet.create({
  card: {
    width: 156,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 10,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  imageWrap: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 112,
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

  overlayTop: {
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
  typeTag: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: '#FFF',
  },
  tagFood: {
    backgroundColor: '#EEF7FF',
    borderColor: '#D6ECFF',
  },
  tagCombo: {
    backgroundColor: '#F2EEFF',
    borderColor: '#E4DCFF',
  },
  name: {
    marginTop: 8,
    color: '#222',
  },
  footerRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
