import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { foodSelector } from '../../redux/reducer/foodReducer';
import { comboSelector } from '../../redux/reducer/comboReducer';
import {
  categoryErrorSelector,
  categoryLoadingSelector,
  categorySelector,
} from '../../redux/reducer/categoryReducer';
import {
  fetchCategoriesThunk,
  fetchFoodsAndCombosByCategoryThunk,
} from '../../redux/actions/categoryActions';
import { FoodModel } from '../../models/FoodModel';
import { ComboModel } from '../../models/ComboModel';
import { AppDispatch } from '../../redux/store';
import { CategoryItem, ContainerComponent } from '../../components';

const CategoryScreen = () => {
  const dispatch = useDispatch<AppDispatch>();

  const categories = useSelector(categorySelector);
  const foods = useSelector(foodSelector);
  const combos = useSelector(comboSelector);
  const loading = useSelector(categoryLoadingSelector);
  const error = useSelector(categoryErrorSelector);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    dispatch(fetchCategoriesThunk());
  }, [dispatch]);

  useEffect(() => {
    if (selectedCategoryId) {
      dispatch(
        fetchFoodsAndCombosByCategoryThunk({
          categoryId: selectedCategoryId,
          page: 1,
          limit: 20,
        }),
      );
    }
  }, [selectedCategoryId, dispatch]);

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <ContainerComponent title="All items" back>
      <CategoryItem
        selectedCategoryId={selectedCategoryId}
        setSelectedCategoryId={setSelectedCategoryId}
      />

      {selectedCategoryId && (
        <View style={styles.foodsCombosContainer}>
          <Text style={styles.title}>Foods</Text>
          <FlatList
            data={foods}
            keyExtractor={item => item._id}
            renderItem={({ item }: { item: FoodModel }) => (
              <View style={styles.item}>
                <Text>{item.name}</Text>
              </View>
            )}
          />

          <Text style={styles.title}>Combos</Text>
          <FlatList
            data={combos}
            keyExtractor={item => item._id}
            renderItem={({ item }: { item: ComboModel }) => (
              <View style={styles.item}>
                <Text>{item.name}</Text>
              </View>
            )}
          />
        </View>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}
    </ContainerComponent>
  );
};

export default CategoryScreen;

const styles = StyleSheet.create({
  foodsCombosContainer: {
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  item: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
});
