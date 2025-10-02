import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { appColors } from '../constants';
import { TextComponent } from '../components';

type Props = {
  visible: boolean;
  price: number;
  onSelect: (quantity: number) => void;
  onClose: () => void;
  maxQuantity?: number;
  status?: 'available' | 'unavailable';
};

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(v, max));

const QuantitySelectionModal: React.FC<Props> = ({
  visible,
  price,
  onSelect,
  onClose,
  maxQuantity,
  status = 'available',
}) => {
  const [quantity, setQuantity] = useState<number>(1);

  const hardMax = useMemo(() => {
    return typeof maxQuantity === 'number' && maxQuantity >= 0
      ? maxQuantity
      : Number.POSITIVE_INFINITY;
  }, [maxQuantity]);

  const canAdd = useMemo(() => {
    return (
      status !== 'unavailable' &&
      quantity >= 1 &&
      quantity <= hardMax &&
      hardMax > 0
    );
  }, [quantity, hardMax, status]);

  const increaseQuantity = () =>
    setQuantity(prev => clamp(prev + 1, 1, hardMax));
  const decreaseQuantity = () =>
    setQuantity(prev => clamp(prev - 1, 1, hardMax));

  const handleAddToCart = () => {
    if (!canAdd) return;
    onSelect(quantity);
    setQuantity(1);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.container}>
              <View style={styles.handle} />

              <View style={styles.headerRow}>
                <TextComponent text="Select Quantity" font="bold" size={20} />
                {Number.isFinite(hardMax) && (
                  <View style={styles.stockPill}>
                    <TextComponent
                      text={`${hardMax} combos left`}
                      size={12}
                      color={appColors.orange}
                      font="bold"
                    />
                  </View>
                )}
              </View>

              <View style={styles.section}>
                <TextComponent text="Quantity" font="medium" size={16} />
                <View style={styles.quantityWrapper}>
                  <TouchableOpacity
                    style={[
                      styles.quantityButton,
                      (quantity <= 1 || status === 'unavailable') &&
                        styles.quantityButtonDisabled,
                    ]}
                    onPress={decreaseQuantity}
                    disabled={quantity <= 1 || status === 'unavailable'}
                    activeOpacity={0.8}
                  >
                    <TextComponent text="−" size={22} />
                  </TouchableOpacity>

                  <TextComponent
                    text={String(quantity)}
                    size={18}
                    font="bold"
                    styles={{ marginHorizontal: 16 }}
                  />

                  <TouchableOpacity
                    style={[
                      styles.quantityButton,
                      (quantity >= hardMax || status === 'unavailable') &&
                        styles.quantityButtonDisabled,
                    ]}
                    onPress={increaseQuantity}
                    disabled={quantity >= hardMax || status === 'unavailable'}
                    activeOpacity={0.8}
                  >
                    <TextComponent text="+" size={22} />
                  </TouchableOpacity>
                </View>

                {hardMax === 0 && (
                  <TextComponent
                    text="This combo is currently out of stock."
                    size={12}
                    color="#999"
                    styles={{ marginTop: 6 }}
                  />
                )}
                {status === 'unavailable' && (
                  <TextComponent
                    text="This combo is discontinued."
                    size={12}
                    color="#999"
                    styles={{ marginTop: 6 }}
                  />
                )}
              </View>

              <TextComponent
                text={`Total: ${(price * quantity).toLocaleString()} VND`}
                size={18}
                font="bold"
                styles={styles.priceText}
              />

              <TouchableOpacity
                style={[
                  styles.addButton,
                  { backgroundColor: canAdd ? appColors.orange : '#ccc' },
                ]}
                onPress={handleAddToCart}
                disabled={!canAdd}
                activeOpacity={0.9}
              >
                <TextComponent
                  text={
                    status === 'unavailable'
                      ? 'Discontinued'
                      : hardMax === 0
                      ? 'Out of stock'
                      : 'Add to cart'
                  }
                  size={16}
                  color="#fff"
                  font="bold"
                />
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default QuantitySelectionModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  container: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  stockPill: {
    backgroundColor: '#FFF3E8',
    borderWidth: 1,
    borderColor: '#FFE1C8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  section: { marginBottom: 16 },
  quantityWrapper: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  quantityButton: {
    borderWidth: 1,
    borderColor: appColors.orange,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quantityButtonDisabled: { opacity: 0.5 },
  priceText: { marginBottom: 12, color: appColors.orange },
  addButton: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
});