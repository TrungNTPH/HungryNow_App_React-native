import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import {
  ContainerComponent,
  TextComponent,
  AllFeaturedFoodItem,
} from '../../components';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../redux/store';
import { useAppSelector } from '../../redux/hooks';
import { navigateToItemDetail } from '../../utils/navigateToItemDetail';
import { showSuccess, showError } from '../../utils/toastMessages';
import { fetchFoodSizesThunk } from '../../redux/actions/foodSizeAction';
import { fetchPaginatedTopOrdered } from '../../redux/actions/topOrderedAction';
import {
  topOrderedSelector,
  topOrderedPaginationSelector,
  topOrderedErrorSelector,
  topOrderedSuccessSelector,
  clearTopOrderedMessages,
} from '../../redux/reducer/topOrderedReducer';
import {
  foodSizeSelector,
  foodSizeErrorSelector,
  foodSizeSuccessSelector,
  clearFoodSizeMessages,
} from '../../redux/reducer/foodSizeReducer';
import { appColors } from '../../constants';
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

const SeeAllFeaturedScreen = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const auth = useAppSelector(authSelector);

  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [pendingFavoriteAction, setPendingFavoriteAction] = useState<
    (() => void) | null
  >(null);

  const topOrdered = useAppSelector(topOrderedSelector);
  const pagination = useAppSelector(topOrderedPaginationSelector);
  const foodSizes = useAppSelector(foodSizeSelector);
  const avgStarsMap = useAppSelector(avgStarsMapSelector);
  const favorites = useAppSelector(favoriteSelector);

  const topOrderedError = useAppSelector(topOrderedErrorSelector);
  const topOrderedSuccess = useAppSelector(topOrderedSuccessSelector);
  const foodSizeError = useAppSelector(foodSizeErrorSelector);
  const foodSizeSuccess = useAppSelector(foodSizeSuccessSelector);
  const favoriteError = useAppSelector(favoriteErrorSelector);
  const favoriteSuccess = useAppSelector(favoriteSuccessSelector);

  const limit = 10;
  const totalPages = pagination?.totalPages || 1;
  const currentPage = pagination?.page || page;

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
            fetchPaginatedTopOrdered({ page: pageNumber, limit, type: 'all' }),
          ).unwrap(),
          dispatch(fetchFoodSizesThunk()).unwrap(),
          dispatch(fetchFavoritesThunk()).unwrap(),
        ]);
      } catch {
        showError('Failed to load featured items');
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
        label: 'Featured',
        hasError: !!topOrderedError,
        clear: () => dispatch(clearTopOrderedMessages()),
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
  }, [topOrderedError, foodSizeError, favoriteError, refreshing, dispatch]);

  useEffect(() => {
    const successMapping = [
      {
        message: topOrderedSuccess,
        clear: () => dispatch(clearTopOrderedMessages()),
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
    topOrderedSuccess,
    foodSizeSuccess,
    favoriteSuccess,
    refreshing,
    dispatch,
  ]);

  const featuredWithMeta = useMemo(() => {
    return topOrdered.map(item => {
      const typedItem = item.itemId;
      const itemType = item.itemType;
      let price = 0;

      if (itemType === 'Food') {
        const matchedSizes = foodSizes.filter(
          f => f.foodId && f.foodId._id === typedItem._id,
        );
        if (matchedSizes.length > 0) {
          price = Math.min(...matchedSizes.map(s => s.price));
        }
      } else if ('price' in typedItem) {
        price = typedItem.price;
      }

      const itemId = typedItem._id;
      const rating = avgStarsMap[itemId] || 0;
      const isFavorite = favorites.some(
        f =>
          f.itemType === itemType &&
          typeof f.itemId === 'object' &&
          f.itemId._id === itemId,
      );

      return {
        ...item,
        itemId,
        name: typedItem.name,
        image: typedItem.image,
        itemType,
        price,
        rating,
        isFavorite,
      };
    });
  }, [topOrdered, foodSizes, avgStarsMap, favorites]);

  const checkLoginAndExecute = (action: () => void) => {
    if (!auth.accesstoken) {
      setPendingFavoriteAction(() => action);
      setLoginModalVisible(true);
      return;
    }
    action();
  };

  const handleAddComboAndFoodFavorite = async (
    itemId: string,
    itemType: 'Food' | 'Combo',
  ) => {
    const existing = favorites.find(
      f =>
        f.itemType === itemType &&
        typeof f.itemId === 'object' &&
        f.itemId._id === itemId,
    );
    try {
      setBusy(true);
      if (existing) {
        await dispatch(removeFavoriteThunk(existing._id)).unwrap();
      } else {
        await dispatch(addFavoriteThunk({ itemId, itemType })).unwrap();
      }
      await dispatch(fetchFavoritesThunk()).unwrap();
    } catch {
      showError('Failed to update favorites');
    } finally {
      setBusy(false);
    }
  };

  const hasPagination = totalPages > 1;

  return (
    <ContainerComponent back title="All Featured">
      <View style={{ flex: 1, position: 'relative' }}>
        <FlatList
          data={featuredWithMeta}
          keyExtractor={item => `${item.itemType}-${item.itemId}`}
          numColumns={2}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: hasPagination ? 90 : 20 },
          ]}
          columnWrapperStyle={styles.column}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadData(currentPage, true)}
            />
          }
          renderItem={({ item }) => (
            <AllFeaturedFoodItem
              item={{
                itemId: item.itemId,
                name: item.name,
                image: item.image,
                rating: item.rating,
                price: item.price,
                itemType: item.itemType,
              }}
              isFavorite={item.isFavorite}
              onAddFavorite={() =>
                checkLoginAndExecute(() =>
                  handleAddComboAndFoodFavorite(item.itemId, item.itemType),
                )
              }
              onPress={() => {
                const rawItem = topOrdered.find(
                  i =>
                    i.itemType === item.itemType &&
                    i.itemId &&
                    i.itemId._id === item.itemId,
                )?.itemId;

                const filteredItems = featuredWithMeta
                  .filter(
                    f =>
                      f.itemId !== item.itemId && f.itemType === item.itemType,
                  )
                  .map(f => {
                    const original = topOrdered.find(
                      o =>
                        o.itemId &&
                        o.itemId._id === f.itemId &&
                        o.itemType === f.itemType,
                    )?.itemId;
                    return { ...original, price: f.price, rating: f.rating };
                  });

                navigateToItemDetail({
                  navigation,
                  item: rawItem,
                  itemType: item.itemType,
                  foodSizes,
                  allItems: filteredItems,
                });
              }}
            />
          )}
        />

        {/* Floating Pagination Bar */}
        {hasPagination && (
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

export default SeeAllFeaturedScreen;

const styles = StyleSheet.create({
  content: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  column: {
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
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
