import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../redux/store';
import {
  fetchFavoritesThunk,
  removeFavoriteThunk,
} from '../redux/actions/favoriteAction';
import { fetchCombosThunk } from '../redux/actions/comboAction';
import { fetchFoodsThunk } from '../redux/actions/foodActions';
import { fetchFoodSizesThunk } from '../redux/actions/foodSizeAction';
import { FavoriteModel } from '../models/FavoriteModel';
import { navigateToItemDetail } from '../utils/navigateToItemDetail';
import {
  ButtonComponent,
  ContainerComponent,
  FavoriteItem,
  SectionComponent,
  TextComponent,
} from '../components';
import { showSuccess, showError } from '../utils/toastMessages';
import { useAppSelector } from '../redux/hooks';
import { avgStarsMapSelector } from '../redux/reducer/ratingReducer';
import { comboSelector } from '../redux/reducer/comboReducer';
import { foodSelector } from '../redux/reducer/foodReducer';
import { foodSizeSelector } from '../redux/reducer/foodSizeReducer';
import {
  clearFavoriteMessages,
  favoriteErrorSelector,
  favoriteSuccessSelector,
  favoriteSelector,
  favoriteLoadingSelector,
} from '../redux/reducer/favoriteReducer';
import { useFocusEffect } from '@react-navigation/native';
import { LoadingModal, ModalNotification } from '../modals';

const FavoriteScreen = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();

  const favorite = useSelector(favoriteSelector);
  const favoritError = useSelector(favoriteErrorSelector);
  const favoritErrorSuccessMessage = useSelector(favoriteSuccessSelector);
  const loading = useSelector(favoriteLoadingSelector);

  const combos = useSelector(comboSelector);
  const foods = useSelector(foodSelector);
  const foodSizes = useSelector(foodSizeSelector);
  const avgStarsMap = useAppSelector(avgStarsMapSelector);

  const [refreshing, setRefreshing] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteName, setPendingDeleteName] = useState<
    string | undefined
  >(undefined);

  const loadData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setPageLoading(true);
      try {
        await Promise.all([
          dispatch(fetchFavoritesThunk()).unwrap(),
          dispatch(fetchCombosThunk()).unwrap(),
          dispatch(fetchFoodsThunk()).unwrap(),
          dispatch(fetchFoodSizesThunk()).unwrap(),
        ]);
      } catch {
        showError('Failed to refresh favorites');
      } finally {
        if (isRefresh) setRefreshing(false);
        setPageLoading(false);
      }
    },
    [dispatch],
  );

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  useEffect(() => {
    const errorMapping = [
      {
        label: 'Favorites',
        hasError: !!favoritError,
        clear: () => dispatch(clearFavoriteMessages()),
      },
    ];

    const successMapping = [
      {
        message: favoritErrorSuccessMessage,
        clear: () => dispatch(clearFavoriteMessages()),
      },
    ];

    errorMapping.forEach(({ label, hasError, clear }) => {
      if (hasError && !refreshing) {
        showError(`Failed to fetch ${label}`);
        clear();
      }
    });

    successMapping.forEach(({ message, clear }) => {
      if (message && !refreshing) {
        showSuccess(message);
        clear();
      }
    });
  }, [favoritError, favoritErrorSuccessMessage, refreshing, dispatch]);

  const openRemoveConfirm = useCallback((favoriteId: string, name?: string) => {
    setPendingDeleteId(favoriteId);
    setPendingDeleteName(name);
    setConfirmVisible(true);
  }, []);

  const handleConfirmRemove = useCallback(async () => {
    if (!pendingDeleteId) return;
    try {
      await dispatch(removeFavoriteThunk(pendingDeleteId)).unwrap();
      await dispatch(fetchFavoritesThunk()).unwrap();
      showSuccess('Item removed from favorites');
      setConfirmVisible(false);
      setPendingDeleteId(null);
      setPendingDeleteName(undefined);
    } catch {
      showError('Failed to remove favorite');
    }
  }, [dispatch, pendingDeleteId]);

  const enrichedFavorites = useMemo(() => {
    return favorite.map(item => {
      const { itemId, itemType } = item;

      if (!itemId || typeof itemId !== 'object') return item;

      const id = (itemId as any)._id;
      const rating = avgStarsMap?.[id] || 0;

      if (itemType === 'Food') {
        const matchedSizes = foodSizes.filter(
          size => size.foodId?._id === (itemId as any)._id,
        );

        const price =
          matchedSizes.length > 0
            ? Math.min(...matchedSizes.map(s => s.price))
            : 0;

        return {
          ...item,
          itemId: {
            ...(itemId as any),
            price,
            rating,
            itemType,
          },
        } as FavoriteModel;
      }

      return {
        ...item,
        itemId: {
          ...(itemId as any),
          rating,
          itemType,
        },
      } as FavoriteModel;
    });
  }, [favorite, foodSizes, avgStarsMap]);

  const handlePressItem = useCallback(
    (item: FavoriteModel) => {
      const { itemId, itemType } = item;
      if (!itemId) return;

      const allItems = itemType === 'Food' ? foods : combos;

      navigateToItemDetail({
        navigation,
        item: itemId,
        itemType,
        foodSizes,
        allItems,
      });
    },
    [foods, combos, foodSizes, navigation],
  );

  const renderItem = ({ item }: { item: FavoriteModel }) => {
    const { itemId } = item;

    if (!itemId || typeof itemId !== 'object' || !('name' in itemId))
      return null;

    const price = 'price' in itemId ? (itemId as any).price : 0;
    const name = (itemId as any).name as string;

    return (
      <FavoriteItem
        name={name}
        price={price}
        imageUrl={(itemId as any).image || ''}
        onDelete={() => openRemoveConfirm(item._id, name)}
        onPress={() => handlePressItem(item)}
      />
    );
  };

  return (
    <ContainerComponent title="Favorite" isScroll={false}>
      {!refreshing && enrichedFavorites.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadData(true)}
            />
          }
        >
          <View style={styles.circleBackground}>
            <View style={styles.circleLarge} />
            <View style={styles.circleMedium} />
            <View style={styles.circleSmall} />
            <View style={styles.searchIcon}>
              <MaterialIcons name="search" size={30} color="#fff" />
            </View>
          </View>
          <TextComponent text="No Favorites Yet" styles={styles.emptyTitle} />
          <TextComponent
            text="It looks like you haven’t added any favorites yet."
            styles={styles.emptyText}
          />
          <ButtonComponent
            text="Find Foods"
            type="primary"
            color="#FF7F00"
            onPress={() => navigation.navigate('Home')}
            styles={styles.findButton}
            textStyles={styles.findButtonText}
          />
        </ScrollView>
      ) : (
        <SectionComponent>
          <FlatList
            data={enrichedFavorites}
            keyExtractor={item => item._id}
            renderItem={renderItem}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadData(true)}
              />
            }
          />
        </SectionComponent>
      )}

      {/* Confirm remove favorite */}
      <ModalNotification
        visible={confirmVisible}
        onClose={() => {
          setConfirmVisible(false);
          setPendingDeleteId(null);
          setPendingDeleteName(undefined);
        }}
        title="Remove from favorites?"
        subtitle={pendingDeleteName}
        message="Do you really want to remove this item from your favorites?"
        variant="warning"
        actions={[
          { label: 'Cancel', style: 'secondary' },
          { label: 'Remove', style: 'danger', onPress: handleConfirmRemove },
        ]}
        accessibilityLabel="Remove favorite confirmation"
      />

      {/* Loading overlay during refresh/remove */}
      <LoadingModal visible={loading || refreshing} />
    </ContainerComponent>
  );
};

export default FavoriteScreen;

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBackground: {
    position: 'relative',
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFA50033',
    position: 'absolute',
  },
  circleMedium: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFA50055',
    position: 'absolute',
    left: 30,
    top: 10,
  },
  circleSmall: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFA50099',
    position: 'absolute',
    right: 20,
    bottom: 10,
  },
  searchIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF7F00',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  findButton: {
    backgroundColor: '#FF7F00',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  findButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
