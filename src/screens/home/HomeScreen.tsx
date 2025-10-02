import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  ComboItem,
  ContainerComponent,
  FeaturedFoodItem,
  FoodItem,
  RowComponent,
  SectionComponent,
  TextComponent,
} from '../../components';
import { appColors, appFonts, appInfors } from '../../constants';
import { navigateToItemDetail } from '../../utils/navigateToItemDetail';
import { showError, showSuccess } from '../../utils/toastMessages';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { fetchFoodsThunk } from '../../redux/actions/foodActions';
import { fetchFoodSizesThunk } from '../../redux/actions/foodSizeAction';
import { fetchCombosThunk } from '../../redux/actions/comboAction';
import { fetchTopOrderedThunk } from '../../redux/actions/topOrderedAction';
import {
  comboSelector,
  comboSuccessSelector,
  comboErrorSelector,
  clearComboMessages,
} from '../../redux/reducer/comboReducer';
import {
  foodErrorSelector,
  foodSuccessSelector,
  clearFoodMessages,
  foodSelector,
} from '../../redux/reducer/foodReducer';
import {
  foodSizeErrorSelector,
  foodSizeSuccessSelector,
  clearFoodSizeMessages,
  foodSizeSelector,
} from '../../redux/reducer/foodSizeReducer';
import {
  topOrderedErrorSelector,
  topOrderedSuccessSelector,
  clearTopOrderedMessages,
  topOrderedSelector,
} from '../../redux/reducer/topOrderedReducer';
import {
  avgStarsMapSelector,
  clearRatingMessages,
  ratingErrorSelector,
  ratingSuccessSelector,
} from '../../redux/reducer/ratingReducer';
import {
  fetchAllComboAvgStarsThunk,
  fetchAllFoodAvgStarsThunk,
} from '../../redux/actions/ratingAction';
import {
  clearFavoriteMessages,
  favoriteErrorSelector,
  favoriteSelector,
  favoriteSuccessSelector,
} from '../../redux/reducer/favoriteReducer';
import {
  addFavoriteThunk,
  fetchFavoritesThunk,
  removeFavoriteThunk,
} from '../../redux/actions/favoriteAction';
import { useFocusEffect } from '@react-navigation/native';
import { authSelector } from '../../redux/reducer/authReducer';
import { ModalNotification, LoadingModal } from '../../modals';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../redux/store';

const HomeScreen = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const auth = useAppSelector(authSelector);

  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const featuredListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const foods = useAppSelector(foodSelector);
  const foodSizes = useAppSelector(foodSizeSelector);
  const combos = useAppSelector(comboSelector);
  const topOrdered = useAppSelector(topOrderedSelector);
  const favorites = useAppSelector(favoriteSelector);
  const avgStarsMap = useAppSelector(avgStarsMapSelector);

  const foodError = useAppSelector(foodErrorSelector);
  const foodSizeError = useAppSelector(foodSizeErrorSelector);
  const comboError = useAppSelector(comboErrorSelector);
  const topOrderedError = useAppSelector(topOrderedErrorSelector);
  const ratingError = useAppSelector(ratingErrorSelector);
  const favoriteError = useAppSelector(favoriteErrorSelector);

  const foodSuccessMessage = useAppSelector(foodSuccessSelector);
  const foodSizeSuccessMessage = useAppSelector(foodSizeSuccessSelector);
  const comboSuccessMessage = useAppSelector(comboSuccessSelector);
  const topOrderedSuccessMessage = useAppSelector(topOrderedSuccessSelector);
  const ratingSuccessMessage = useAppSelector(ratingSuccessSelector);
  const favoriteSuccessMessage = useAppSelector(favoriteSuccessSelector);

  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [pendingFavoriteAction, setPendingFavoriteAction] = useState<
    (() => void) | null
  >(null);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setBusy(true);
    }
    try {
      await Promise.all([
        dispatch(fetchFoodsThunk()).unwrap(),
        dispatch(fetchFoodSizesThunk()).unwrap(),
        dispatch(fetchCombosThunk()).unwrap(),
        dispatch(fetchTopOrderedThunk({ type: 'all' })).unwrap(),
        dispatch(fetchAllFoodAvgStarsThunk()).unwrap(),
        dispatch(fetchFavoritesThunk()).unwrap(),
        dispatch(fetchAllComboAvgStarsThunk()).unwrap(),
      ]);
    } catch {
      showError('Failed to refresh Home');
    } finally {
      setRefreshing(false);
      setBusy(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
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
        label: 'Combos',
        hasError: !!comboError,
        clear: () => dispatch(clearComboMessages()),
      },
      {
        label: 'Featured',
        hasError: !!topOrderedError,
        clear: () => dispatch(clearTopOrderedMessages()),
      },
      {
        label: 'Ratings',
        hasError: !!ratingError,
        clear: () => dispatch(clearRatingMessages()),
      },
      {
        label: 'Favorites',
        hasError: !!favoriteError,
        clear: () => dispatch(clearFavoriteMessages()),
      },
    ];
    errorMapping.forEach(({ label, hasError, clear }) => {
      if (hasError && !refreshing) {
        showError(`Failed to load ${label}`);
        clear();
      }
    });
  }, [
    foodError,
    foodSizeError,
    comboError,
    topOrderedError,
    ratingError,
    favoriteError,
    refreshing,
  ]);

  useEffect(() => {
    const successMapping = [
      {
        message: foodSuccessMessage,
        clear: () => dispatch(clearFoodMessages()),
      },
      {
        message: foodSizeSuccessMessage,
        clear: () => dispatch(clearFoodSizeMessages()),
      },
      {
        message: comboSuccessMessage,
        clear: () => dispatch(clearComboMessages()),
      },
      {
        message: topOrderedSuccessMessage,
        clear: () => dispatch(clearTopOrderedMessages()),
      },
      {
        message: ratingSuccessMessage,
        clear: () => dispatch(clearRatingMessages()),
      },
      {
        message: favoriteSuccessMessage,
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
    foodSizeSuccessMessage,
    comboSuccessMessage,
    topOrderedSuccessMessage,
    ratingSuccessMessage,
    favoriteSuccessMessage,
    refreshing,
  ]);

  const foodsWithPrice = useMemo(() => {
    return foods.map(food => {
      const matchedSizes = foodSizes.filter(
        f => f.foodId && f.foodId._id === food._id,
      );
      const minPrice = matchedSizes.length
        ? Math.min(...matchedSizes.map(s => s.price))
        : 0;
      return { ...food, price: minPrice, rating: avgStarsMap[food._id] || 0 };
    });
  }, [foods, foodSizes, avgStarsMap]);

  const combosWithRating = useMemo(() => {
    return combos.map(combo => ({
      ...combo,
      rating: avgStarsMap[combo._id] || 0,
    }));
  }, [combos, avgStarsMap]);

  const featuredWithPrice = useMemo(() => {
    return topOrdered.map(item => {
      const typedItem = item.itemId;
      const itemType = item.itemType;
      console.log('itemType', itemType, typedItem);
      let price = 0;
      if (itemType === 'Food') {
        const matchedSizes = foodSizes.filter(
          f => f.foodId && f.foodId._id === typedItem._id,
        );
        if (matchedSizes.length > 0)
          price = Math.min(...matchedSizes.map(s => s.price));
      } else if (
        typedItem &&
        typeof typedItem === 'object' &&
        'price' in typedItem
      ) {
        price = typedItem.price;
      }
      return {
        ...item,
        itemId: typedItem,
        itemType,
        name: typedItem.name,
        image: typedItem.image,
        price,
        rating: avgStarsMap[typedItem._id] || 0,
      };
    });
  }, [topOrdered, foodSizes, avgStarsMap]);

  const checkLoginAndExecute = (action: () => void) => {
    if (!auth.accesstoken) {
      setPendingFavoriteAction(() => action);
      setLoginModalVisible(true);
      return;
    }
    action();
  };

  const handleAddFoodFavorite = async (itemId: string) => {
    const existing = favorites.find(
      f =>
        f.itemType === 'Food' && '_id' in f.itemId && f.itemId._id === itemId,
    );
    try {
      setBusy(true);
      if (existing) {
        await dispatch(removeFavoriteThunk(existing._id)).unwrap();
      } else {
        await dispatch(addFavoriteThunk({ itemId, itemType: 'Food' })).unwrap();
      }
      await dispatch(fetchFavoritesThunk());
    } catch {
      showError('Failed to update favorites.');
    } finally {
      setBusy(false);
    }
  };

  const handleAddComboFavorite = async (comboId: string) => {
    const existing = favorites.find(
      f =>
        f.itemType === 'Combo' && '_id' in f.itemId && f.itemId._id === comboId,
    );
    try {
      setBusy(true);
      if (existing) {
        await dispatch(removeFavoriteThunk(existing._id)).unwrap();
      } else {
        await dispatch(
          addFavoriteThunk({ itemId: comboId, itemType: 'Combo' }),
        ).unwrap();
      }
      await dispatch(fetchFavoritesThunk());
    } catch {
      showError('Failed to update favorites.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const featuredData = featuredWithPrice.slice(0, 8);
    const maxIndex = featuredData.length - 1;
    if (maxIndex <= 0) return;
    const interval = setInterval(() => {
      setCurrentIndex(prevIndex => {
        const nextIndex = prevIndex + 1 > maxIndex ? 0 : prevIndex + 1;
        featuredListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        return nextIndex;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [featuredWithPrice]);

  const renderHeader = () => (
    <SectionComponent styles={{ paddingHorizontal: 0 }}>
      <Image
        source={require('../../assets/images/banner.png')}
        style={styles.banner}
      />

      <View style={styles.bannerOverlay} />

      <View style={styles.headerContent}>
        <TextComponent
          text="HungryNow"
          size={22}
          font={appFonts.bold}
          color={appColors.white}
        />
        <TextComponent
          text="Fast & Tasty at your door"
          size={12}
          color="rgba(255,255,255,0.85)"
        />
      </View>

      <RowComponent styles={styles.headerIcons}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate('SearchScreen')}
          activeOpacity={0.9}
        >
          <Feather name="search" size={18} color={appColors.white} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate('NotificationScreen')}
          activeOpacity={0.85}
        >
          <Ionicons
            name="notifications-outline"
            size={20}
            color={appColors.white}
          />
        </TouchableOpacity>
      </RowComponent>
    </SectionComponent>
  );

  const isBusyLoading = refreshing || busy;

  return (
    <ContainerComponent>
      <View>{renderHeader()}</View>

      <FlatList
        data={foodsWithPrice.slice(0, 8)}
        numColumns={2}
        keyExtractor={item => `Food-${item._id}`}
        columnWrapperStyle={styles.foodRow}
        renderItem={({ item }) => (

          <FoodItem
            item={item}
            onPress={() =>
              navigateToItemDetail({
                navigation,
                item,
                itemType: 'Food',
                foodSizes,
                allItems: foodsWithPrice,
              })
            }
            onAddFavorite={() =>
              checkLoginAndExecute(() => handleAddFoodFavorite(item._id))
            }
            isFavorite={favorites.some(
              f =>
                f.itemType === 'Food' &&
                'itemId' in f &&
                f.itemId._id === item._id,
            )}
          />
        )}
        ListHeaderComponent={
          <>
            {/* Featured */}
            {featuredWithPrice.length > 0 && (
              <SectionComponent styles={{ paddingHorizontal: 16 }}>
                <RowComponent
                  justify="space-between"
                  styles={{ marginBottom: 10 }}
                >
                  <TextComponent
                    text="Featured"
                    size={18}
                    font={appFonts.bold}
                  />
                  <TouchableOpacity
                    onPress={() => navigation.navigate('SeeAllFeaturedScreen')}
                  >
                    <TextComponent
                      text="See all"
                      color={appColors.orange}
                      size={14}
                    />
                  </TouchableOpacity>
                </RowComponent>

                <FlatList
                  ref={featuredListRef}
                  horizontal
                  data={featuredWithPrice.slice(0, 8)}
                  keyExtractor={(item, index) =>
                    `${item.itemType}-${item.itemId._id || index}`
                  }
                  renderItem={({ item }) => (
                    <FeaturedFoodItem
                      item={{
                        image: item.image,
                        name: item.name,
                        itemType: item.itemType,
                        rating: item.rating,
                        price: item.price,
                      }}
                      onPress={() => {
                        const filteredItems = featuredWithPrice.filter(
                          f =>
                            f.itemType === item.itemType &&
                            f.itemId._id !== item.itemId._id,
                        );
                        navigateToItemDetail({
                          navigation,
                          item,
                          itemType: item.itemType,
                          foodSizes,
                          allItems: filteredItems,
                        });
                      }}
                      isFavorite={favorites.some(
                        f =>
                          f.itemType === item.itemType &&
                          f.itemId._id === item.itemId._id,
                      )}
                      onAddFavorite={() => {
                        if (item.itemType === 'Food') {
                          checkLoginAndExecute(() =>
                            handleAddFoodFavorite(item.itemId._id),
                          );
                        } else if (item.itemType === 'Combo') {
                          checkLoginAndExecute(() =>
                            handleAddComboFavorite(item.itemId._id),
                          );
                        }
                      }}
                    />
                  )}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 10 }}
                />
              </SectionComponent>
            )}

            {/* Combos */}
            {combosWithRating.length > 0 && (
              <SectionComponent styles={{ paddingHorizontal: 16 }}>
                <RowComponent
                  justify="space-between"
                  styles={{ marginBottom: 10 }}
                >
                  <TextComponent text="Combos" size={18} font={appFonts.bold} />
                  <TouchableOpacity
                    onPress={() => navigation.navigate('SeeAllComboScreen')}
                  >
                    <TextComponent
                      text="See all"
                      color={appColors.orange}
                      size={14}
                    />
                  </TouchableOpacity>
                </RowComponent>

                <FlatList
                  data={combosWithRating.slice(0, 8)}
                  keyExtractor={item => `Combo-${item._id}`}
                  numColumns={2}
                  columnWrapperStyle={{ justifyContent: 'space-between' }}
                  renderItem={({ item }) => (
                    <ComboItem
                      item={item}
                      onPress={() =>
                        navigateToItemDetail({
                          navigation,
                          item,
                          itemType: 'Combo',
                          foodSizes,
                          allItems: combosWithRating,
                        })
                      }
                      onAddFavorite={() =>
                        checkLoginAndExecute(() =>
                          handleAddComboFavorite(item._id),
                        )
                      }
                      isFavorite={favorites.some(
                        f =>
                          f.itemType === 'Combo' &&
                          'itemId' in f &&
                          f.itemId._id === item._id,
                      )}
                    />
                  )}
                />
              </SectionComponent>
            )}

            {/* Foods */}
            {foodsWithPrice.length > 0 && (
              <RowComponent
                justify="space-between"
                styles={{ marginHorizontal: 16, marginBottom: 16 }}
              >
                <TextComponent text="Foods" size={18} font={appFonts.bold} />
                <TouchableOpacity
                  onPress={() => navigation.navigate('SeeAllFoodScreen')}
                >
                  <TextComponent
                    text="See all"
                    color={appColors.orange}
                    size={14}
                  />
                </TouchableOpacity>
              </RowComponent>
            )}
          </>
        }
        contentContainerStyle={styles.foodList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadData} />
        }
      />

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

      {/* Loading overlay cho refresh & favorite actions */}
      <LoadingModal visible={isBusyLoading} />
    </ContainerComponent>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  banner: { width: appInfors.sizes.WIDTH, height: 270, resizeMode: 'cover' },
  bannerOverlay: {
    height: 270,
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  headerContent: {
    position: 'absolute',
    left: 16,
    bottom: 58,
  },
  quickChips: {
    position: 'absolute',
    left: 16,
    bottom: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  headerIcons: {
    position: 'absolute',
    right: 20,
    top: 20,
    flexDirection: 'row',
    gap: 16,
    marginTop: 20,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    borderWidth: 1,
    borderRadius: 20,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(17,24,39,0.35)',
  },
  overlayText: { position: 'absolute', top: 160, left: 20 },
  foodRow: { justifyContent: 'space-between', paddingHorizontal: 10 },
  foodList: { paddingBottom: 16 },
});