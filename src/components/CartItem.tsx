import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { View, Image, StyleSheet, Pressable } from 'react-native';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import CheckBox from '@react-native-community/checkbox';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import debounce from 'lodash.debounce';

import { HydratedCartModel } from '../models/CartModel';
import TextComponent from './TextComponent';
import InputComponent from './InputComponent';
import { appColors, appFonts } from '../constants';

type Props = {
  item: HydratedCartModel;
  onIncrease: () => void;
  onDecrease: () => void;
  onDelete: () => void;
  onToggleSelect: (value: boolean) => void;
  onNoteChange: (note: string) => void;
  onPress?: () => void;
};

const ACTION_WIDTH = 88;

const CartItem: React.FC<Props> = ({
  item,
  onIncrease,
  onDecrease,
  onDelete,
  onToggleSelect,
  onNoteChange,
  onPress,
}) => {
  const isFood = item.itemType === 'Food';
  const isCombo = item.itemType === 'Combo';
  const swipeRef = useRef<Swipeable>(null);

  const sizeLabel = isFood && item.size?.name ? item.size.name : undefined;

  const unitPrice = useMemo(() => {
    if (isCombo && 'price' in item.itemId) return item.itemId.price || 0;
    if (isFood && typeof item.foodSizeId === 'object')
      return item.foodSizeId?.price || 0;
    return 0;
  }, [isCombo, isFood, item]);

  const subtotal = unitPrice * (item.quantity || 0);
  const [localNote, setLocalNote] = useState(item.note || '');

  useEffect(() => {
    setLocalNote(item.note || '');
  }, [item.note]);

  const debouncedNoteUpdate = useMemo(
    () =>
      debounce((note: string) => {
        onNoteChange(note);
      }, 500),
    [onNoteChange],
  );

  useEffect(() => {
    return () => debouncedNoteUpdate.cancel();
  }, [debouncedNoteUpdate]);

  const handleNoteInput = (text: string) => {
    setLocalNote(text);
    debouncedNoteUpdate(text);
  };

  const hasImage = !!item?.itemId?.image;

  const renderRightActions = () => (
    <View style={styles.actionsWrap}>
      <RectButton
        style={styles.deleteAction}
        rippleColor="rgba(255,255,255,0.2)"
        onPress={() => {
          swipeRef.current?.close();
          onDelete();
        }}
      >
        <MaterialCommunityIcons
          name="trash-can-outline"
          size={22}
          color="#FF3B30"
        />
        <TextComponent
          text="Delete"
          size={12}
          color="#FF3B30"
          styles={{ marginTop: 4 }}
        />
      </RectButton>
    </View>
  );

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={2}
      rightThreshold={ACTION_WIDTH / 2}
      containerStyle={styles.swipeContainer}
      childrenContainerStyle={{ borderRadius: 14 }}
    >
      <Pressable
        onPress={onPress}
        android_ripple={{ color: '#00000010' }}
        style={({ pressed }) => [
          styles.card,
          pressed && { transform: [{ scale: 0.995 }] },
        ]}
      >
        <CheckBox
          value={!!item.selected}
          onValueChange={onToggleSelect}
          tintColors={{ true: appColors.orange, false: '#ccc' }}
          style={styles.checkbox}
        />

        {hasImage ? (
          <Image source={{ uri: item.itemId.image }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <MaterialCommunityIcons
              name="image-outline"
              size={22}
              color="#BDBDBD"
            />
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <TextComponent
              text={item.itemId?.name || 'Unnamed'}
              size={15}
              font={appFonts.semiBold}
              styles={styles.name}
            />
            {isCombo ? (
              <View
                style={[
                  styles.chip,
                  { backgroundColor: '#F2EEFF', borderColor: '#E4DCFF' },
                ]}
              >
                <TextComponent text="Combo" size={11} color="#6E56CF" />
              </View>
            ) : null}
            {!!sizeLabel && (
              <View
                style={[
                  styles.chip,
                  { backgroundColor: '#EEF7FF', borderColor: '#D6ECFF' },
                ]}
              >
                <TextComponent text={sizeLabel} size={11} color="#2F7DD0" />
              </View>
            )}
          </View>

          <View style={styles.priceRow}>
            <View style={styles.pricePill}>
              <TextComponent
                text={`${unitPrice.toLocaleString()} VND`}
                size={12}
                color={appColors.orange}
                font={appFonts.semiBold}
              />
            </View>
            <TextComponent
              text={`Subtotal: ${subtotal.toLocaleString()} VND`}
              size={12}
              color="#666"
              styles={{ marginLeft: 8 }}
            />
          </View>

          <InputComponent
            value={localNote}
            onChange={handleNoteInput}
            placeholder="Add note (e.g. No onion...)"
            allowClear
            styles={styles.noteInput}
            textStyles={{ fontSize: 13 }}
          />

          <View style={styles.stepperRow}>
            <Pressable
              onPress={onDecrease}
              disabled={item.quantity <= 1}
              style={({ pressed }) => [
                styles.stepBtn,
                item.quantity <= 1 && styles.stepBtnDisabled,
                pressed && item.quantity > 1 && { opacity: 0.85 },
              ]}
              android_ripple={{ color: '#00000010', borderless: true }}
              accessibilityLabel="Decrease quantity"
            >
              <Ionicons
                name="remove"
                size={16}
                color={item.quantity <= 1 ? '#BDBDBD' : '#333'}
              />
            </Pressable>

            <TextComponent
              text={`${item.quantity}`}
              size={14}
              font={appFonts.semiBold}
              styles={styles.qtyText}
            />

            <Pressable
              onPress={onIncrease}
              style={({ pressed }) => [
                styles.stepBtn,
                pressed && { opacity: 0.85 },
              ]}
              android_ripple={{ color: '#00000010', borderless: true }}
              accessibilityLabel="Increase quantity"
            >
              <Ionicons name="add" size={16} color="#333" />
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Swipeable>
  );
};

export default memo(CartItem);

const styles = StyleSheet.create({
  swipeContainer: {
    marginVertical: 6,
    borderRadius: 14,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 14,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  checkbox: {
    marginRight: 8,
    marginTop: 4,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 12,
    resizeMode: 'cover',
    marginRight: 10,
    backgroundColor: '#F5F5F5',
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECECEC',
  },
  content: {
    flex: 1,
    paddingRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    color: '#222',
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  pricePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FFF3E8',
    borderWidth: 1,
    borderColor: '#FFE1C8',
  },
  noteInput: {
    marginTop: 8,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  stepBtnDisabled: {
    opacity: 0.5,
  },
  qtyText: {
    minWidth: 28,
    textAlign: 'center',
  },
  actionsWrap: {
    width: ACTION_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteAction: {
    width: ACTION_WIDTH,
    height: '100%',
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
