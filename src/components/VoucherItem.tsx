import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { VoucherModel } from '../models/VoucherModel';
import TextComponent from './TextComponent';

type Props = {
  item: VoucherModel;
  onApply?: () => void;
  onPress?: () => void;
};

const formatVND = (n: number | undefined | null) =>
  Number(n ?? 0).toLocaleString('en-US');

const VoucherItem: React.FC<Props> = ({ item, onApply, onPress }) => {
  const renderDescription = () => {
    if (item.description) return item.description;

    const dv = Number(item.discountValue ?? 0);
    const cap =
      item.discountMaxValue === null || item.discountMaxValue === undefined
        ? null
        : Number(item.discountMaxValue);

    switch (item.type) {
      case 'percentage': {
        const capText = cap != null ? ` • max ${formatVND(cap)} VND` : '';
        return `Discount ${dv}%${capText}`;
      }
      case 'fixed':
        return `Discount ₫${formatVND(dv)}`;
      case 'freeShipping':
        return 'Free Shipping';
      case 'firstOrder':
        return 'First Order Offer';
      case 'special':
        return 'Special Offer';
      default:
        return 'Applicable Voucher';
    }
  };

  const formattedDate = new Date(item.expirationDate).toLocaleDateString(
    'en-GB',
  );

  const hasCap =
    item.type === 'percentage' &&
    item.discountMaxValue !== undefined &&
    item.discountMaxValue !== null;

  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <View style={styles.imageWrapper}>
        <Image
          source={
            item.type === 'freeShipping'
              ? require('../assets/images/logoVoucher2.png')
              : require('../assets/images/logoVoucher1.png')
          }
          style={styles.image}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.textContainer}>
          {item.isForLoyalCustomer && (
            <Image
              source={require('../assets/images/diamond-icon.png')}
              style={styles.diamondIcon}
            />
          )}
          <TextComponent text={item.title} styles={styles.title} />
          <TextComponent
            text={renderDescription()}
            styles={styles.description}
          />
          {item.remainingUsage != null && (
            <TextComponent
              text={`${item.remainingUsage} uses remaining`}
              styles={styles.description}
            />
          )}
          {item.minimumOrderValue != null && (
            <TextComponent
              text={`Min Order: ${formatVND(item.minimumOrderValue)} VND`}
              styles={styles.description}
            />
          )}
          {item.maxOrderValue != null && (
            <TextComponent
              text={`Max Order: ${formatVND(item.maxOrderValue)} VND`}
              styles={styles.description}
            />
          )}
          {hasCap && (
            <TextComponent
              text={`Max Discount: ${formatVND(
                item.discountMaxValue as number,
              )} VND`}
              styles={styles.description}
            />
          )}
          <TextComponent
            text={`Expiry: ${formattedDate}`}
            styles={styles.expiration}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={onApply}>
          <TextComponent text="Apply Now" styles={styles.buttonText} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default VoucherItem;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 14,
    overflow: 'hidden',
    borderLeftWidth: 5,
    borderLeftColor: '#FF8500',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  imageWrapper: {
    position: 'relative',
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: 90,
    backgroundColor: '#FFF8F0',
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
    resizeMode: 'contain',
  },
  diamondIcon: {
    position: 'absolute',
    right: 6,
    width: 25,
    height: 25,
  },
  content: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    justifyContent: 'space-between',
  },
  textContainer: {
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
    color: '#222',
    flexWrap: 'wrap',
    maxWidth: '80%',
  },
  description: {
    fontSize: 12,
    color: '#555',
  },
  expiration: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  button: {
    alignSelf: 'flex-end',
    marginTop: 10,
    backgroundColor: '#FF8500',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
});
