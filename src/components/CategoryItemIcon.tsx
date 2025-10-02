import React from 'react';
import { TouchableOpacity, Image, StyleSheet } from 'react-native';
import { appColors } from '../constants';

interface Props {
  isActive?: boolean;
  onPress?: () => void;
  image: string;
}

export const CategoryItemIcon = ({
  isActive = false,
  onPress,
  image,
}: Props) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.container, isActive && styles.activeContainer]}
      activeOpacity={0.8}
    >
      <Image source={{ uri: image }} style={styles.icon} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginHorizontal: 10,
    padding: 10,
    borderRadius: 10,
    marginRight: 30,
  },
  activeContainer: {
    backgroundColor: appColors.orange,
  },
  icon: {
    width: 32,
    height: 32,
    marginBottom: 6,
    resizeMode: 'contain',
  },
});
