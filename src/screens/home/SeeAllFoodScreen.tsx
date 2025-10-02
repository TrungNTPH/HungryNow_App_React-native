import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  View,
  Platform,
} from 'react-native';
import { ContainerComponent, FoodItem, TextComponent } from '../../components';
import { appColors } from '../../constants';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppSelector } from '../../redux/hooks';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../redux/store';
import { navigateToItemDetail } from '../../utils/navigateToItemDetail';
import { showSuccess, showError } from '../../utils/toastMessages';

import {
  foodSelector,
  foodPaginationSelector,
  foodErrorSelector,
  foodSuccessSelector,
  clearFoodMessages,
} from '../../redux/reducer/foodReducer';
import {
  foodSizeSelector,
  foodSizeErrorSelector,
  foodSizeSuccessSelector,
  clearFoodSizeMessages,
} from '../../redux/reducer/foodSizeReducer';
import { fetchPaginatedFoodsThunk } from '../../redux/actions/foodActions';
import { fetchFoodSizesThunk } from '../../redux/actions/foodSizeAction';
import { avgStarsMapSelector } from '../../redux/reducer/ratingReducer';

import {
  favoriteSelector,
  favoriteErrorSelector,
  favoriteSuccessSelector,
  clearFavoriteMessages,
} from '../../redux/reducer/favoriteReducer';
import {
  addFavoriteThunk,
  removeFavoriteThunk,
  fetchFavoritesThunk,
} from '../../redux/actions/favoriteAction';
import { useFocusEffect } from '@react-navigation/native';
import { authSelector } from '../../redux/reducer/authReducer';
import { ModalNotification, LoadingModal } from '../../modals';

const SeeAllFoodsScreen = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const auth = useAppSelector(authSelector);

  const foods = useAppSelector(foodSelector);
  const foodError = useAppSelector(foodErrorSelector);
  const foodSuccessMessage = useAppSelector(foodSuccessSelector);

  const foodSizes = useAppSelector(foodSizeSelector);
  const foodSizeError = useAppSelector(foodSizeErrorSelector);
  const foodSizeSuccess = useAppSelector(foodSizeSuccessSelector);

  const avgStarsMap = useAppSelector(avgStarsMapSelector);

  const favorites = useAppSelector(favoriteSelector);
  const favoriteError = useAppSelector(favoriteErrorSelector);
  const favoriteSuccess = useAppSelector(favoriteSuccessSelector);

  const pagination = useAppSelector(foodPaginationSelector);

  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [pendingFavoriteAction, setPendingFavoriteAction] = useState<
    (() => void) | null
  >(null);

  const limit = 10;
  const totalPages = pagination?.totalPages ?? 1;
  const currentPage = pagination?.page ?? page;

  const loadData = useCallback(
    async (pageNumber: number, isRefresh = false) => {
      if (pageNumber < 1) return;
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setBusy(true);
      }
      setLoading(true);
      try {
        await Promise.all([
          dispatch(
            fetchPaginatedFoodsThunk({ page: pageNumber, limit }),
          ).unwrap(),
          dispatch(fetchFoodSizesThunk()).unwrap(),
          dispatch(fetchFavoritesThunk()).unwrap(),
        ]);
      } catch {
        showError('Failed to refresh Foods');
      } finally {
        setRefreshing(false);
        setBusy(false);
        setLoading(false);
      }
    },
    [dispatch],
  );

  useFocusEffect(
    useCallback(() => {
      loadData(page);
    }, [page, loadData]),
  );

  useEffect(() => {
    const errorMapping = [
      {
        label: 'Foods',
        hasError: !!foodError,
        clear: () => dispatch(clearFoodMessages()),
      },
      {
        label: 'Food Sizes',
        hasError: !!foodSizeError,
        clear: () => dispatch(clearFoodSizeMessages()),
      },
      {
        label: 'Favorites',
        hasError: !!favoriteError,
        clear: () => dispatch(clearFavoriteMessages()),
      },
    ];
    errorMapping.forEach(({ label, hasError, clear }) => {
      if (hasError && !refreshing) {
        showError(`Failed to fetch ${label}`);
        clear();
      }
    });
  }, [foodError, foodSizeError, favoriteError, refreshing, dispatch]);

  useEffect(() => {
    const successMapping = [
      {
        message: foodSuccessMessage,
        clear: () => dispatch(clearFoodMessages()),
      },
      {
        message: foodSizeSuccess,
        clear: () => dispatch(clearFoodSizeMessages()),
      },
      {
        message: favoriteSuccess,
        clear: () => dispatch(clearFavoriteMessages()),
      },
    ];
    successMapping.forEach(({ message, clear }) => {
      if (message && !refreshing) {
        showSuccess(message);
        clear();
      }
    });
  }, [
    foodSuccessMessage,
    foodSizeSuccess,
    favoriteSuccess,
    refreshing,
    dispatch,
  ]);

  const getPriceForFood = (foodId: string) => {
    const sizes = foodSizes.filter(s => s.foodId && s.foodId._id === foodId);
    return sizes.length > 0 ? Math.min(...sizes.map(s => s.price)) : 0;
  };

  const foodsWithMeta = useMemo(() => {
    return foods.map(food => {
      const price = getPriceForFood(food._id);
      const rating = avgStarsMap[food._id] || 0;
      const isFavorite = favorites.some(
        f =>
          f.itemType === 'Food' &&
          typeof f.itemId === 'object' &&
          '_id' in f.itemId &&
          f.itemId._id === food._id,
      );
      return {
        ...food,
        itemId: food._id,
        itemType: 'Food',
        price,
        rating,
        isFavorite,
      };
    });
  }, [foods, foodSizes, avgStarsMap, favorites]);

  const handleRefresh = async () => {
    await loadData(currentPage, true);
  };

  const checkLoginAndExecute = (action: () => void) => {
    if (!auth.accesstoken) {
      setPendingFavoriteAction(() => action);
      setLoginModalVisible(true);
      return;
    }
    action();
  };

  const handleAddFoodFavorite = async (foodId: string) => {
    const existing = favorites.find(
      f =>
        f.itemType === 'Food' &&
        typeof f.itemId === 'object' &&
        '_id' in f.itemId &&
        f.itemId._id === foodId,
    );
    try {
      setBusy(true);
      if (existing) {
        await dispatch(removeFavoriteThunk(existing._id)).unwrap();
      } else {
        await dispatch(
          addFavoriteThunk({ itemId: foodId, itemType: 'Food' }),
        ).unwrap();
      }
      await dispatch(fetchFavoritesThunk()).unwrap();
    } catch {
      showError('Failed to update favorites');
    } finally {
      setBusy(false);
    }
  };

  // Luôn hiển thị thanh phân trang nếu có pagination (kể cả 1 trang)
  const showPagination = !!pagination && typeof pagination.page === 'number';

  return (
    <ContainerComponent back title="All Foods">
      <View style={{ flex: 1, position: 'relative' }}>
        <FlatList
          data={foodsWithMeta}
          keyExtractor={item => item._id}
          numColumns={2}
          renderItem={({ item }) => (
            <FoodItem
              item={item}
              onPress={() =>
                navigateToItemDetail({
                  navigation,
                  item: foods.find(f => f._id === item._id),
                  itemType: 'Food',
                  foodSizes,
                  allItems: foods.map(food => {
                    const price = getPriceForFood(food._id);
                    const rating = avgStarsMap[food._id] || 0;
                    return { ...food, price, rating };
                  }),
                })
              }
              onAddFavorite={() =>
                checkLoginAndExecute(() => handleAddFoodFavorite(item._id))
              }
              isFavorite={item.isFavorite}
            />
          )}
          columnWrapperStyle={{
            justifyContent: 'space-between',
            paddingHorizontal: 15,
          }}
          contentContainerStyle={{
            paddingTop: 10,
            paddingBottom: showPagination ? 90 : 20,
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />

        {showPagination && (
          <View pointerEvents="box-none" style={styles.floatingPaginationWrap}>
            <View style={styles.floatingPaginationBar}>
              <TouchableOpacity
                disabled={currentPage <= 1}
                onPress={() => setPage(prev => Math.max(1, prev - 1))}
                style={[styles.pgBtn, currentPage <= 1 && { opacity: 0.45 }]}
                activeOpacity={0.9}
              >
                <Ionicons
                  name="chevron-back"
                  size={18}
                  color={currentPage <= 1 ? '#9CA3AF' : appColors.orange}
                />
              </TouchableOpacity>

              <TextComponent
                text={`Page ${currentPage} / ${totalPages}`}
                size={13}
                color="#6B7280"
              />

              <TouchableOpacity
                disabled={currentPage >= totalPages}
                onPress={() => setPage(prev => Math.min(totalPages, prev + 1))}
                style={[
                  styles.pgBtn,
                  currentPage >= totalPages && { opacity: 0.45 },
                ]}
                activeOpacity={0.9}
              >
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={
                    currentPage >= totalPages ? '#9CA3AF' : appColors.orange
                  }
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Login Modal */}
      <ModalNotification
        visible={loginModalVisible}
        onClose={() => setLoginModalVisible(false)}
        title="Notification"
        message="You need to log in to add items to your favorite."
        variant="warning"
        actions={[
          {
            label: 'Cancel',
            style: 'secondary',
            onPress: () => setLoginModalVisible(false),
          },
          {
            label: 'Log In',
            style: 'primary',
            onPress: () => {
              setLoginModalVisible(false);
              navigation.navigate('LoginScreen');
              if (pendingFavoriteAction) setPendingFavoriteAction(null);
            },
          },
        ]}
      />

      {/* Loading overlay */}
      <LoadingModal visible={loading || busy} />
    </ContainerComponent>
  );
};

export default SeeAllFoodsScreen;

const styles = StyleSheet.create({
  floatingPaginationWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Platform.select({ ios: 12, android: 12 }),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    zIndex: 50,
    elevation: 10,
  },
  floatingPaginationBar: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  pgBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF3E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
