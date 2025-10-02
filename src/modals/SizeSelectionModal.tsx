import React, { useState, useMemo } from 'react';
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
  sizes: { _id: string; sizeId: { name: string }; price: number }[];
  onSelect: (sizeId: string, quantity: number) => void;
  onClose: () => void;
  maxQuantity?: number;
  status?: 'available' | 'unavailable';
};

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(v, max));

const SizeSelectionModal: React.FC<Props> = ({
  visible,
  sizes,
  onSelect,
  onClose,
  maxQuantity,
  status = 'available',
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);

  const hardMax = useMemo(() => {
    return typeof maxQuantity === 'number' && maxQuantity >= 0
      ? maxQuantity
      : Number.POSITIVE_INFINITY;
  }, [maxQuantity]);

  const canAdd = useMemo(() => {
    return (
      status !== 'unavailable' &&
      !!selectedId &&
      quantity >= 1 &&
      quantity <= hardMax &&
      hardMax > 0
    );
  }, [status, selectedId, quantity, hardMax]);

  const selectedSize = sizes.find(size => size._id === selectedId);

  const handleAddToCart = () => {
    if (!canAdd || !selectedId) return;
    onSelect(selectedId, quantity);
    setQuantity(1);
  };

  const isQtyDecDisabled = quantity <= 1 || status === 'unavailable';
  const isQtyIncDisabled =
    quantity >= hardMax || status === 'unavailable' || hardMax === 0;
  const isSizesDisabled =
    status === 'unavailable' || hardMax === 0 || !Array.isArray(sizes);

  const increaseQuantity = () =>
    !isQtyIncDisabled && setQuantity(prev => clamp(prev + 1, 1, hardMax));

  const decreaseQuantity = () =>
    !isQtyDecDisabled && setQuantity(prev => clamp(prev - 1, 1, hardMax));

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
              {/* Drag handle */}
              <View style={styles.handle} />

              {/* Header */}
              <View style={styles.headerRow}>
                <TextComponent
                  text="Select Size & Quantity"
                  font="bold"
                  size={20}
                />
                {/* hiển thị tồn kho tổng */}
                {Number.isFinite(hardMax) && (
                  <View style={styles.stockPill}>
                    <TextComponent
                      text={`${hardMax} foods left`}
                      size={12}
                      color={appColors.orange}
                      font="bold"
                    />
                  </View>
                )}
              </View>

              {/* Quantity */}
              <View style={styles.section}>
                <TextComponent text="Quantity" font="medium" size={16} />
                <View style={styles.quantityWrapper}>
                  <TouchableOpacity
                    style={[
                      styles.quantityButton,
                      isQtyDecDisabled && styles.quantityButtonDisabled,
                    ]}
                    onPress={decreaseQuantity}
                    disabled={isQtyDecDisabled}
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
                      isQtyIncDisabled && styles.quantityButtonDisabled,
                    ]}
                    onPress={increaseQuantity}
                    disabled={isQtyIncDisabled}
                    activeOpacity={0.8}
                  >
                    <TextComponent text="+" size={22} />
                  </TouchableOpacity>
                </View>

                {/* Gợi ý khi hết hàng / ngừng bán */}
                {hardMax === 0 && (
                  <TextComponent
                    text="This food is currently out of stock."
                    size={12}
                    color="#999"
                    styles={{ marginTop: 6 }}
                  />
                )}
                {status === 'unavailable' && (
                  <TextComponent
                    text="This food is unavailable."
                    size={12}
                    color="#999"
                    styles={{ marginTop: 6 }}
                  />
                )}
              </View>

              {/* Price */}
              {selectedSize && (
                <TextComponent
                  text={`Total: ${(
                    selectedSize.price * quantity
                  ).toLocaleString()} VND`}
                  size={18}
                  font="bold"
                  styles={styles.priceText}
                />
              )}

              {/* Sizes */}
              <View style={styles.section}>
                <TextComponent text="Select a size" font="medium" size={16} />
                <View style={styles.sizeWrapper}>
                  {Array.isArray(sizes) && sizes.length > 0 ? (
                    sizes.map(size => {
                      const isSelected = selectedId === size._id;
                      const disabled = isSizesDisabled;
                      return (
                        <TouchableOpacity
                          key={size._id}
                          style={[
                            styles.sizeButton,
                            isSelected && styles.sizeButtonSelected,
                            disabled && styles.sizeButtonDisabled,
                          ]}
                          onPress={() => !disabled && setSelectedId(size._id)}
                          activeOpacity={0.9}
                          disabled={disabled}
                        >
                          <TextComponent
                            text={size.sizeId?.name || 'Unknown'}
                            size={16}
                            font="medium"
                            styles={{
                              color:
                                isSelected && !disabled
                                  ? '#fff'
                                  : appColors.darkText,
                            }}
                          />
                        </TouchableOpacity>
                      );
                    })
                  ) : (
                    <TextComponent text="No sizes available." />
                  )}
                </View>
              </View>

              {/* Add to cart button */}
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

export default SizeSelectionModal;

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
  section: {
    marginBottom: 16,
  },
  quantityWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
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
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  priceText: {
    marginBottom: 12,
    color: appColors.orange,
  },
  sizeWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
    justifyContent: 'space-between',
  },
  sizeButton: {
    width: 105,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: appColors.orange,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    elevation: 2,
  },
  sizeButtonSelected: {
    backgroundColor: appColors.orange,
    borderColor: appColors.orange,
  },
  sizeButtonDisabled: {
    opacity: 0.5,
  },
  addButton: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
});
