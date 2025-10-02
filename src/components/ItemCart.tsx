import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity } from 'react-native';
import CheckBox from '@react-native-community/checkbox';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { CartItem } from '../models/CartModel';
import TextComponent from './TextComponent';

type Props = {
  item: CartItem;
  onIncrease: () => void;
  onDecrease: () => void;
  onDelete: () => void;
  onToggleSelect: (value: boolean) => void;
};

const ItemCartComponent: React.FC<Props> = ({
  item,
  onIncrease,
  onDecrease,
  onDelete,
  onToggleSelect,
}) => {
  return (
    <View style={styles.container}>
      <CheckBox
        value={!!item.selected}
        onValueChange={onToggleSelect}
        tintColors={{ true: '#FF8500', false: '#ccc' }}
        style={styles.checkbox}
      />

      <Image source={{ uri: item.itemId.image }} style={styles.image} />

      <View style={styles.infoContainer}>
        <TextComponent text={item.itemId.name} styles={styles.name} />

        <View style={styles.controls}>
          <TouchableOpacity onPress={onDecrease}>
            <Ionicons
              name="remove-circle-outline"
              size={20}
              color={item.quantity === 1 ? 'gray' : 'black'}
            />
          </TouchableOpacity>

          <TextComponent
            text={item.quantity.toString()}
            styles={styles.quantity}
          />

          <TouchableOpacity onPress={onIncrease}>
            <Ionicons name="add-circle-outline" size={20} color="black" />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
        <MaterialCommunityIcons
          name="trash-can-outline"
          size={24}
          color="red"
        />
      </TouchableOpacity>
    </View>
  );
};

export default ItemCartComponent;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  checkbox: {
    marginRight: 16,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 10,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  price: {
    color: '#FF8500',
    fontSize: 16,
    fontWeight: '700',
    marginVertical: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  quantity: {
    marginHorizontal: 10,
    fontSize: 16,
  },
  deleteButton: {
    marginLeft: 10,
  },
});