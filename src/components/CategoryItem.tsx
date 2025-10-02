import React from 'react';
import {
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  View,
} from 'react-native';
import { useAppSelector } from '../redux/hooks';
import { categorySelector } from '../redux/reducer/categoryReducer';
import { appColors, appFonts } from '../constants';
import TextComponent from './TextComponent';
import SectionComponent from './SectionComponent';

interface Props {
  selectedCategoryId: string | null;
  setSelectedCategoryId: (id: string | null) => void;
}

const CategoryItem = ({ selectedCategoryId, setSelectedCategoryId }: Props) => {
  const categories = useAppSelector(categorySelector);

  // Kiểm tra nếu categories là một mảng và không rỗng
  if (!Array.isArray(categories) || categories.length === 0) {
    return <TextComponent text="No categories available" />;
  }

  const renderItem = ({ item }: any) => {
    const isActive = item._id === selectedCategoryId;
    return (
      <TouchableOpacity
        onPress={() => setSelectedCategoryId(isActive ? null : item._id)}
        style={[styles.itemContainer, isActive && styles.activeContainer]}
        activeOpacity={0.8}
      >
        <Image source={{ uri: item.image }} style={styles.icon} />
        <TextComponent
          text={item.name}
          size={13}
          color={isActive ? appColors.white : appColors.text}
          font={isActive ? '600' : undefined}
          styles={{ fontFamily: appFonts.regular }}
        />
      </TouchableOpacity>
    );
  };

  return (
    <SectionComponent styles={{ paddingHorizontal: 0 }}>
      <FlatList
        horizontal
        data={categories}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 10 }}
      />
    </SectionComponent>
  );
};

export default CategoryItem;

const styles = StyleSheet.create({
  itemContainer: {
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
  sectionTitle: {
    marginLeft: 26,
    marginTop: 20,
    marginHorizontal: 16,
    marginVertical: 10,
  },
});
