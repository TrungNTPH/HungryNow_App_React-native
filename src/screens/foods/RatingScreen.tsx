import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  FlatList,
  Image,
  StyleSheet,
  ListRenderItem,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  ScrollView,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { fetchRatingsThunk } from '../../redux/actions/ratingAction';
import {
  ratingSelector,
  ratingLoadingSelector,
  ratingErrorSelector,
  ratingSuccessSelector,
  clearRatingMessages,
} from '../../redux/reducer/ratingReducer';
import { AppDispatch } from '../../redux/store';
import { RatingModel } from '../../models/RatingModel';
import {
  RowComponent,
  TextComponent,
  ContainerComponent,
  SectionComponent,
} from '../../components';
import { showError, showSuccess } from '../../utils/toastMessages';
import moment from 'moment';
import { appColors, appFonts } from '../../constants';
import { LoadingModal } from '../../modals';

type RootStackParamList = {
  RatingScreen: { itemId: string; itemType: 'Food' | 'Combo' };
};
type RatingRouteProp = RouteProp<RootStackParamList, 'RatingScreen'>;

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));
const fmtDate = (d?: string) => (d ? moment(d).format('DD/MM/YYYY') : '');

const RatingScreen: React.FC = () => {
  const route = useRoute<RatingRouteProp>();
  const { itemId, itemType } = route.params;
  const dispatch = useDispatch<AppDispatch>();

  const ratings = useSelector(ratingSelector);
  const loading = useSelector(ratingLoadingSelector);
  const error = useSelector(ratingErrorSelector);
  const successMessage = useSelector(ratingSuccessSelector);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedStar, setSelectedStar] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      try {
        await dispatch(fetchRatingsThunk({ itemId, itemType })).unwrap();
      } catch {
        showError('Failed to load ratings');
      } finally {
        setRefreshing(false);
      }
    },
    [dispatch, itemId, itemType],
  );

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  useEffect(() => {
    if (error && !refreshing) {
      showError('Failed to fetch ratings');
      dispatch(clearRatingMessages());
    }
  }, [error, refreshing, dispatch]);

  useEffect(() => {
    if (successMessage && !refreshing) {
      showSuccess(successMessage);
      dispatch(clearRatingMessages());
    }
  }, [successMessage, refreshing, dispatch]);

  const { total, counts } = useMemo(() => {
    const total = ratings.length;
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach(r => {
      const s = clamp(Number(r.stars) || 0, 0, 5);
      if (s >= 1 && s <= 5) counts[s] += 1;
    });
    return { total, counts };
  }, [ratings]);

  const filterRatings = useMemo(
    () =>
      selectedStar ? ratings.filter(r => r.stars === selectedStar) : ratings,
    [ratings, selectedStar],
  );

  const Stars = ({ value, size = 16 }: { value: number; size?: number }) => {
    const full = Math.floor(value);
    const half = value - full >= 0.5 ? 1 : 0;
    return (
      <RowComponent>
        {Array.from({ length: 5 }).map((_, i) => {
          const idx = i + 1;
          const name =
            idx <= full
              ? 'star'
              : idx === full + 1 && half
              ? 'star-half'
              : 'star-border';
          return (
            <MaterialIcons key={idx} name={name} size={size} color="#FFA500" />
          );
        })}
      </RowComponent>
    );
  };

  const FilterChips = () => {
    const chips = [
      { label: 'All', star: null as number | null },
      ...[5, 4, 3, 2, 1].map(s => ({ label: `${s}★`, star: s })),
    ];
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsBar}
      >
        {chips.map(c => {
          const active = selectedStar === c.star;
          const count =
            c.star === null
              ? total
              : counts[c.star as keyof typeof counts] || 0;
          return (
            <Pressable
              key={`${c.label}`}
              onPress={() => setSelectedStar(c.star)}
              style={({ pressed }) => [
                styles.chip,
                active && styles.chipActive,
                pressed && { opacity: 0.9 },
              ]}
              android_ripple={{ color: '#00000010', borderless: false }}
            >
              <TextComponent
                text={`${c.label}`}
                size={13}
                color={active ? appColors.orange : '#555'}
                font={active ? appFonts.semiBold : appFonts.regular}
              />
              <View
                style={[styles.countPill, active && styles.countPillActive]}
              >
                <TextComponent
                  text={`${count}`}
                  size={11}
                  color={active ? '#fff' : '#666'}
                />
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    );
  };

  const renderItem: ListRenderItem<RatingModel> = ({ item }) => {
    const score = clamp(Number(item.stars) || 0, 0, 5);
    const name = item.userId?.fullName || 'Anonymous';
    const avatar = item.userId?.image;
    const delivered = item.invoiceId?.deliveredAt;

    return (
      <Pressable
        style={({ pressed }) => [
          styles.card,
          pressed && { transform: [{ scale: 0.995 }] },
        ]}
        android_ripple={{ color: '#00000010' }}
      >
        <RowComponent styles={styles.headerRow}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <TextComponent
                text={name
                  .split(' ')
                  .map(s => s[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
                size={12}
                color="#444"
              />
            </View>
          )}

          <View style={{ flex: 1, marginLeft: 10 }}>
            <RowComponent
              justify="space-between"
              styles={{ alignItems: 'center' }}
            >
              <TextComponent
                text={name}
                size={14}
                font={appFonts.semiBold}
                color="#222"
              />
              {!!delivered && (
                <View style={styles.badge}>
                  <MaterialIcons
                    name="local-shipping"
                    size={12}
                    color="#2F7DD0"
                  />
                  <TextComponent
                    text={fmtDate(delivered)}
                    size={11}
                    color="#2F7DD0"
                    styles={{ marginLeft: 4 }}
                  />
                </View>
              )}
            </RowComponent>
            <RowComponent
              styles={{ marginTop: 4, alignItems: 'center', gap: 6 }}
            >
              <Stars value={score} />
              <View style={styles.scorePill}>
                <TextComponent text={score.toFixed(1)} size={11} color="#333" />
              </View>
            </RowComponent>
          </View>
        </RowComponent>

        {!!item.ratingMessage && (
          <TextComponent
            text={item.ratingMessage}
            size={13}
            color="#444"
            styles={{ marginTop: 6, lineHeight: 18 }}
          />
        )}

        {!!item.image && (
          <TouchableOpacity
            onPress={() => setSelectedImage(item.image || null)}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: item.image }}
              style={styles.reviewImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}

        {!!item.replyMessage && (
          <View style={styles.replyBox}>
            <TextComponent
              text="Reply from HungryNow"
              size={12}
              font={appFonts.semiBold}
              color="#333"
              styles={{ marginBottom: 4 }}
            />
            <TextComponent text={item.replyMessage} size={13} color="#555" />
          </View>
        )}
      </Pressable>
    );
  };

  const isBusyLoading = loading || refreshing;

  return (
    <ContainerComponent back title="Ratings" isScroll={false}>
      <SectionComponent styles={{ paddingTop: 6, paddingBottom: 0 }}>
        <FilterChips />
      </SectionComponent>

      <SectionComponent styles={{ paddingTop: 8 }}>
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color={appColors.orange} />
        ) : filterRatings.length === 0 ? (
          <View style={styles.emptyWrap}>
            <MaterialIcons name="rate-review" size={28} color="#C9C9C9" />
            <TextComponent
              text="No ratings yet."
              size={14}
              color="#999"
              styles={{ marginTop: 6 }}
            />
          </View>
        ) : (
          <FlatList
            data={filterRatings}
            keyExtractor={item => item._id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadData(true)}
              />
            }
          />
        )}
      </SectionComponent>

      <Modal
        visible={selectedImage !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <Pressable
          style={styles.previewModal}
          onPress={() => setSelectedImage(null)}
        >
          <Image
            source={{ uri: selectedImage || '' }}
            style={styles.previewImage}
            resizeMode="contain"
          />
        </Pressable>
      </Modal>

      {/* Loading overlay cho loading/refresh */}
      <LoadingModal visible={isBusyLoading} />
    </ContainerComponent>
  );
};

export default RatingScreen;

const styles = StyleSheet.create({
  listContent: { paddingHorizontal: 16, paddingBottom: 20 },
  chipsBar: { paddingHorizontal: 6, paddingBottom: 6, gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EDEDED',
    marginRight: 8,
  },
  chipActive: { backgroundColor: '#FFF7EE', borderColor: '#FFD9B8' },
  countPill: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#F3F3F3',
  },
  countPillActive: { backgroundColor: appColors.orange },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EEE',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  headerRow: { alignItems: 'center' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EDEDED',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  scorePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#FFF3E8',
    borderWidth: 1,
    borderColor: '#FFE1C8',
  },
  reviewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 10,
    backgroundColor: '#F5F5F5',
  },
  replyBox: {
    marginTop: 10,
    backgroundColor: '#F8FAFF',
    borderLeftWidth: 3,
    borderLeftColor: '#2F7DD0',
    padding: 10,
    borderRadius: 8,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  previewModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: { width: '100%', height: '100%' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#EEF7FF',
    borderWidth: 1,
    borderColor: '#D6ECFF',
    alignSelf: 'flex-start',
  },
});
