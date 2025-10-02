import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from 'react';
import {
  View,
  Image,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {
  ButtonComponent,
  ContainerComponent,
  RowComponent,
  SectionComponent,
  TextComponent,
} from '../../components';
import { navigateToItemDetail } from '../../utils/navigateToItemDetail';
import { showSuccess, showError } from '../../utils/toastMessages';
import { useAppSelector } from '../../redux/hooks';
import {
  foodErrorSelector,
  foodSuccessSelector,
  clearFoodMessages,
} from '../../redux/reducer/foodReducer';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../redux/store';
import {
  avgStarsMapSelector,
  totalRatingsSelector,
  ratingSelector,
  ratingLoadingSelector,
} from '../../redux/reducer/ratingReducer';
import {
  fetchRatingsThunk,
  fetchAverageStarsThunk,
} from '../../redux/actions/ratingAction';
import RatingItemComponent from '../../components/RatingItemComponent';
import { addCartThunk, fetchCartThunk } from '../../redux/actions/cartAction';
import {
  ModalNotification,
  SizeSelectionModal,
  LoadingModal,
} from '../../modals';
import { foodSizeSelector } from '../../redux/reducer/foodSizeReducer';
import { fetchFoodSizesByFoodIdThunk } from '../../redux/actions/foodSizeAction';
import { useFocusEffect } from '@react-navigation/native';
import { appColors, appFonts } from '../../constants';
import { authSelector } from '../../redux/reducer/authReducer';
import { searchFoodsAndCombosThunk } from '../../redux/actions/foodActions';

const fmt = (v: number) => `${(v || 0).toLocaleString()} VND`;

const FoodDetailScreen = ({ navigation, route }: any) => {
  const { food, suggestedFoods } = route.params;
  const dispatch = useDispatch<AppDispatch>();
  const auth = useAppSelector(authSelector);

  const foodError = useAppSelector(foodErrorSelector);
  const foodSuccessMessage = useAppSelector(foodSuccessSelector);
  const sizes = useAppSelector(foodSizeSelector);

  const avgStarsMap = useAppSelector(avgStarsMapSelector);
  const totalRatingsMap = useAppSelector(totalRatingsSelector);
  const avgRating = avgStarsMap?.[food._id] || 0;
  const totalRatings = totalRatingsMap?.[food._id] || 0;

  const ratings = useAppSelector(ratingSelector);
  const isRatingLoading = useAppSelector(ratingLoadingSelector);

  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [pendingCartAction, setPendingCartAction] = useState<
    (() => void) | null
  >(null);

  const isDiscontinued = food?.status === 'unavailable';

  const [liveQty, setLiveQty] = useState<number>(food.quantity ?? 0);
  useEffect(() => {
    setLiveQty(food.quantity ?? 0);
  }, [food?._id]);

  const [extraSuggests, setExtraSuggests] = useState<any[]>([]);
  const [isSuggestLoading, setSuggestLoading] = useState(false);

  const filteredSuggestedFoods = useMemo(() => {
    const base = (suggestedFoods || []).filter(
      (item: { _id: any }) => item._id !== food._id,
    );
    const more = (extraSuggests || []).filter(
      (item: { _id: any }) => item._id !== food._id,
    );
    const seen = new Set<string>();
    const merged: any[] = [];
    [...base, ...more].forEach((it: any) => {
      const id = it?._id ?? it?.id;
      if (!id) return;
      if (!seen.has(id)) {
        seen.add(id);
        merged.push(it);
      }
    });
    return merged;
  }, [suggestedFoods, extraSuggests, food._id]);

  const flatListRef = useRef<FlatList>(null);
  const [sizeModalVisible, setSizeModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setBusy(true);
      }
      try {
        await Promise.all([
          dispatch(
            fetchRatingsThunk({ itemId: food._id, itemType: 'Food' }),
          ).unwrap(),
          dispatch(
            fetchAverageStarsThunk({ itemId: food._id, itemType: 'Food' }),
          ).unwrap(),
        ]);
      } catch {
        showError('Failed to refresh food details.');
      } finally {
        setRefreshing(false);
        setBusy(false);
      }
    },
    [dispatch, food._id],
  );

  useFocusEffect(
    useCallback(() => {
      if (food?._id) loadData();
    }, [loadData]),
  );

  useEffect(() => {
    if (foodError && !refreshing) {
      showError('Failed to fetch Food Details');
      dispatch(clearFoodMessages());
    }
  }, [foodError, refreshing, dispatch]);

  useEffect(() => {
    if (foodSuccessMessage && !refreshing) {
      showSuccess(foodSuccessMessage);
      dispatch(clearFoodMessages());
    }
  }, [foodSuccessMessage, refreshing, dispatch]);

  const fetchExtraSuggests = useCallback(async () => {
    try {
      setSuggestLoading(true);
      const categoryId =
        typeof food?.categoryId === 'string'
          ? food.categoryId
          : food?.categoryId?._id;
      const params: any = { type: 'Food', page: 1, limit: 12 };
      if (categoryId) params.categoryId = categoryId;

      const res: any = await dispatch(
        searchFoodsAndCombosThunk(params),
      ).unwrap();
      const items: any[] = Array.isArray(res)
        ? res
        : Array.isArray(res?.items)
          ? res.items
          : res?.data || [];
      const cleaned = items
        .map((r: any) => ({
          ...(r?.itemId ?? r),
          itemType: 'Food',
          price: Number(r?.price ?? r?.itemId?.price ?? 0),
        }))
        .filter((x: any) => x?._id && x._id !== food._id);
      setExtraSuggests(cleaned);
    } catch {
    } finally {
      setSuggestLoading(false);
    }
  }, [dispatch, food]);

  useEffect(() => {
    if ((suggestedFoods?.length || 0) < 4) {
      fetchExtraSuggests();
    } else {
      setExtraSuggests([]);
    }
  }, [suggestedFoods, fetchExtraSuggests]);

  const handleAddToCart = useCallback(
    async (action: () => void) => {
      if (!auth.accesstoken) {
        setPendingCartAction(() => action);
        setLoginModalVisible(true);
        return;
      }
      if (isDiscontinued) {
        return showError('This food is discontinued.');
      }
      if ((liveQty ?? 0) <= 0) {
        return showError('This food is out of stock.');
      }

      action();

      try {
        const res = await dispatch(
          fetchFoodSizesByFoodIdThunk(food._id),
        ).unwrap();
        if (!res || res.length === 0) {
          showError('No size found for this food.');
          return;
        }

        if (res.length === 1) {
          setBusy(true);
          const onlySizeId = res[0]._id;
          await dispatch(
            addCartThunk({
              itemId: food._id,
              itemType: 'Food',
              quantity: 1,
              foodSizeId: onlySizeId,
            }),
          ).unwrap();
          await dispatch(fetchCartThunk());
          showSuccess(`${food.name} has been added to your cart.`);
          setBusy(false);
        } else {
          setSizeModalVisible(true);
        }
      } catch (err: any) {
        showError(err || 'Unable to add this item to your cart.');
      } finally {
        setBusy(false);
      }
    },
    [auth.accesstoken, dispatch, food._id, food.name, liveQty, isDiscontinued],
  );

  const handleSizeSelect = useCallback(
    async (sizeId: string, quantity: number) => {
      setSizeModalVisible(false);
      try {
        setBusy(true);
        await dispatch(
          addCartThunk({
            itemId: food._id,
            itemType: 'Food',
            quantity,
            foodSizeId: sizeId,
          }),
        ).unwrap();
        await dispatch(fetchCartThunk());
        showSuccess(`${food.name} has been added to your cart.`);
      } catch (err: any) {
        showError(err || 'Unable to add this item to your cart.');
      } finally {
        setBusy(false);
      }
    },
    [dispatch, food._id, food.name],
  );

  const starStats = useMemo(() => {
    const buckets: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach(r => {
      const s = Math.round(Number(r.stars) || 0);
      if (s >= 1 && s <= 5) buckets[s] += 1;
    });
    return [5, 4, 3, 2, 1].map(star => {
      const count = buckets[star] || 0;
      const percent = totalRatings ? (count / totalRatings) * 100 : 0;
      return { star, count, percent };
    });
  }, [ratings, totalRatings]);

  const isBusyLoading =
    refreshing || isRatingLoading || isSuggestLoading || busy;

  return (
    <ContainerComponent back title="About this menu">
      <FlatList
        ref={flatListRef}
        ListHeaderComponent={
          <>
            {/* Hero */}
            <View style={styles.heroWrap}>
              <Image
                source={{ uri: food.image }}
                style={styles.hero}
                resizeMode="cover"
              />
              <View style={styles.heroOverlay} />
              <View style={styles.heroTopChips}>
                <View style={[styles.badge, { backgroundColor: '#00000066' }]}>
                  <MaterialIcons name="star" size={14} color="#FFD166" />
                  <TextComponent
                    text={`${avgRating.toFixed(
                      1,
                    )} • ${totalRatings.toLocaleString()} reviews`}
                    size={12}
                    color="#fff"
                    styles={{ marginLeft: 6 }}
                  />
                </View>
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: '#FFF3E8',
                      borderWidth: 1,
                      borderColor: '#FFE1C8',
                    },
                  ]}
                >
                  <TextComponent
                    text={fmt(food.price)}
                    size={12}
                    color={appColors.orange}
                    font={appFonts.semiBold}
                  />
                </View>
              </View>

              {/* Badge Discontinued */}
              {isDiscontinued && (
                <View style={styles.discontinuedRibbon}>
                  <TextComponent
                    text="Discontinued"
                    size={12}
                    color="#fff"
                    font={appFonts.semiBold}
                    styles={{ textAlign: 'center' }}
                  />
                </View>
              )}

              <View style={styles.heroBottom}>
                <TextComponent
                  text={food.name}
                  size={20}
                  font={appFonts.semiBold}
                  color="#fff"
                />
              </View>
            </View>

            {/* Content */}
            <SectionComponent styles={styles.content}>
              {/* Price & rating row */}
              <RowComponent justify="space-between" styles={styles.infoRow}>
                <View style={styles.pricePill}>
                  <TextComponent
                    text={fmt(food.price)}
                    size={14}
                    color={appColors.orange}
                    font={appFonts.semiBold}
                  />
                </View>

                <RowComponent>
                  <MaterialIcons name="star" size={18} color="#FFA500" />
                  <TextComponent
                    text={avgRating.toFixed(1)}
                    size={14}
                    color="#555"
                    styles={{ marginLeft: 4 }}
                  />
                </RowComponent>
              </RowComponent>

              {/* Description */}
              <TextComponent
                text="Description"
                size={16}
                font={appFonts.semiBold}
              />
              <TextComponent
                text={food.description || 'No description available.'}
                size={14}
                color="#666"
                styles={{ lineHeight: 20, marginTop: 6 }}
              />

              {/* Rating Stats */}
              <View style={styles.ratingStatsBox}>
                <View style={styles.ratingStatsLeft}>
                  <TextComponent
                    text={avgRating.toFixed(1)}
                    size={36}
                    font={appFonts.bold}
                    color={appColors.orange}
                    styles={{ lineHeight: 42 }}
                  />
                  <RowComponent styles={{ marginTop: 4, alignItems: 'center' }}>
                    <MaterialIcons name="star" size={18} color="#FFA500" />
                    <TextComponent
                      text={` ${totalRatings.toLocaleString()} ratings`}
                      size={12}
                      color="#666"
                      styles={{ marginLeft: 4 }}
                    />
                  </RowComponent>
                </View>

                <View style={styles.ratingStatsRight}>
                  {starStats.map(({ star, count, percent }) => (
                    <RowComponent
                      key={star}
                      styles={{ alignItems: 'center', marginBottom: 6 }}
                    >
                      <TextComponent
                        text={`${star}`}
                        size={12}
                        styles={{ width: 18, textAlign: 'right' }}
                      />
                      <MaterialIcons
                        name="star"
                        size={12}
                        color="#FFA500"
                        style={{ marginLeft: 2, marginRight: 6 }}
                      />
                      <View style={styles.progressBarBg}>
                        <View
                          style={[
                            styles.progressBarFill,
                            { width: `${percent}%` },
                          ]}
                        />
                      </View>
                      <TextComponent
                        text={`${count}`}
                        size={12}
                        color={appColors.orange}
                        styles={{
                          width: 32,
                          textAlign: 'right',
                          marginLeft: 6,
                        }}
                      />
                      <TextComponent
                        text={`${Math.round(percent)}%`}
                        size={11}
                        color="#888"
                        styles={{ marginLeft: 6, width: 40, textAlign: 'left' }}
                      />
                    </RowComponent>
                  ))}
                </View>
              </View>

              {/* Suggested */}
              <TextComponent
                text="Recommended For You"
                size={16}
                font={appFonts.medium}
                styles={{ marginVertical: 10 }}
              />
              <FlatList
                data={filteredSuggestedFoods}
                keyExtractor={(item, index) => `Food-${item._id || index}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 16 }}
                renderItem={({ item }) => {
                  const star = (avgStarsMap[item._id] || 0).toFixed(1);
                  return (
                    <TouchableOpacity
                      onPress={() => {
                        navigateToItemDetail({
                          navigation,
                          item,
                          itemType: 'Food',
                          foodSizes: [],
                          allItems: filteredSuggestedFoods,
                        });
                        flatListRef.current?.scrollToOffset({
                          offset: 0,
                          animated: true,
                        });
                      }}
                      style={styles.suggestCard}
                      activeOpacity={0.9}
                    >
                      <Image
                        source={{ uri: item.image }}
                        style={styles.suggestImage}
                      />
                      <View style={styles.suggestOverlay} />
                      <View style={styles.suggestContent}>
                        <TextComponent
                          text={item.name}
                          numberOfLine={1}
                          size={13}
                          font={appFonts.semiBold}
                          color="#fff"
                        />
                        <RowComponent
                          styles={{ alignItems: 'center', marginTop: 4 }}
                        >
                          <View style={styles.suggestPill}>
                            <MaterialIcons
                              name="star"
                              size={12}
                              color="#FFD166"
                            />
                            <TextComponent
                              text={star}
                              size={11}
                              color="#333"
                              styles={{ marginLeft: 4 }}
                            />
                          </View>
                          <View style={[styles.suggestPill, { marginLeft: 8 }]}>
                            <TextComponent
                              text={fmt(item.price)}
                              size={11}
                              color="#333"
                            />
                          </View>
                        </RowComponent>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />

              <TextComponent
                text={`${avgRating.toFixed(
                  1,
                )} ⭐ Food ratings (${totalRatings.toLocaleString()} reviews)`}
                size={16}
                font={appFonts.medium}
                styles={{ marginTop: 18 }}
              />
            </SectionComponent>
          </>
        }
        data={ratings}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <RatingItemComponent
            item={{
              id: item._id,
              username: item.userId?.fullName || 'User',
              rating: item.stars,
              comment: item.ratingMessage,
              image: item.image,
              userAvatar: item.userId?.image,
            }}
            onPress={() =>
              navigation.navigate('RatingScreen', {
                itemId: food._id,
                itemType: 'Food',
              })
            }
          />
        )}
        ListEmptyComponent={
          isRatingLoading ? null : (
            <TextComponent
              text="No reviews available for this item."
              size={14}
              color="#999"
              styles={{ textAlign: 'center', marginTop: 14 }}
            />
          )
        }
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
          />
        }
      />

      {/* Sticky CTA */}
      <View style={[styles.footer, isBusyLoading && { opacity: 0.97 }]}>
        <View style={{ flex: 1 }}>
          <TextComponent
            text={food.name}
            numberOfLine={1}
            size={13}
            color="#666"
          />
          <TextComponent
            text={fmt(food.price)}
            size={15}
            font={appFonts.semiBold}
            color={appColors.orange}
          />
        </View>
        <ButtonComponent
          text={
            isDiscontinued
              ? 'Discontinued'
              : liveQty > 0
              ? busy
                ? 'Processing…'
                : 'Add to Cart'
              : 'Out of Stock'
          }
          icon={
            <MaterialIcons name="add-shopping-cart" size={18} color="#fff" />
          }
          iconFlex="left"
          type="primary"
          styles={[
            styles.addBtn,
            (liveQty <= 0 || isDiscontinued) && { backgroundColor: '#ccc' },
            busy && { opacity: 0.7 },
          ]}
          textStyles={{ fontWeight: 'bold', fontSize: 15 }}
          onPress={
            busy || isDiscontinued || liveQty <= 0
              ? undefined
              : () => handleAddToCart(() => {})
          }
          disable={busy || isDiscontinued || liveQty <= 0}
        />
      </View>

      <SizeSelectionModal
        visible={sizeModalVisible}
        sizes={sizes}
        maxQuantity={liveQty}
        status={isDiscontinued ? 'unavailable' : 'available'}
        onSelect={handleSizeSelect}
        onClose={() => setSizeModalVisible(false)}
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
              if (pendingCartAction) setPendingCartAction(null);
            },
          },
        ]}
      />

      {/* Loading modal: refresh / rating / gợi ý / fetch size / thêm giỏ */}
      <LoadingModal visible={isBusyLoading} />
    </ContainerComponent>
  );
};

export default FoodDetailScreen;

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 120 },
  heroWrap: {
    width: '92%',
    height: 220,
    alignSelf: 'center',
    marginTop: 14,
    marginBottom: 10,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    backgroundColor: '#F5F5F5',
  },
  hero: { width: '100%', height: '100%' },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  heroTopChips: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  discontinuedRibbon: {
    position: 'absolute',
    top: 12,
    right: -30,
    backgroundColor: '#9E9E9E',
    paddingVertical: 4,
    paddingHorizontal: 60,
    transform: [{ rotate: '30deg' }],
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  heroBottom: { position: 'absolute', bottom: 10, left: 12, right: 12 },
  content: { paddingHorizontal: 16 },
  infoRow: { marginBottom: 14 },
  pricePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFF3E8',
    borderWidth: 1,
    borderColor: '#FFE1C8',
  },
  ratingStatsBox: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    marginVertical: 14,
  },
  ratingStatsLeft: {
    width: 92,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#eee',
    paddingRight: 10,
  },
  ratingStatsRight: { flex: 1, paddingLeft: 12, justifyContent: 'center' },
  progressBarBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#eee',
    overflow: 'hidden',
  },
  progressBarFill: { height: 8, borderRadius: 4, backgroundColor: '#FFB300' },
  suggestCard: {
    width: 160,
    height: 140,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#EDEDED',
  },
  suggestImage: { width: '100%', height: '100%' },
  suggestOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  suggestContent: { position: 'absolute', left: 8, right: 8, bottom: 8 },
  suggestPill: {
    backgroundColor: '#FFF',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  footer: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 150,
    backgroundColor: '#FF7F00',
  },
});
