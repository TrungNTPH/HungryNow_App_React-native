import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  Text,
  FlatList,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import Entypo from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCategoriesThunk } from '../../redux/actions/categoryActions';
import { RootState, AppDispatch } from '../../redux/store';
import { searchFoodsAndCombosThunk } from '../../redux/actions/foodActions';
import {
  ContainerComponent,
  RowComponent,
  TextComponent,
  AllFeaturedFoodItem,
} from '../../components';
import { appColors } from '../../constants';
import { useAppSelector } from '../../redux/hooks';
import { foodSizeSelector } from '../../redux/reducer/foodSizeReducer';
import { navigateToItemDetail } from '../../utils/navigateToItemDetail';
import { authSelector } from '../../redux/reducer/authReducer';
import { favoriteSelector } from '../../redux/reducer/favoriteReducer';
import {
  addFavoriteThunk,
  removeFavoriteThunk,
  fetchFavoritesThunk,
} from '../../redux/actions/favoriteAction';
import { ModalNotification, LoadingModal } from '../../modals';
import { showError } from '../../utils/toastMessages';
import {
  foodErrorSelector,
  foodLoadingSelector,
  searchPaginationSelector,
  searchResultsSelector,
} from '../../redux/reducer/foodReducer';
import { categorySelector } from '../../redux/reducer/categoryReducer';

type FeaturedType = 'Food' | 'Combo';
type SearchType = 'All' | 'Food' | 'Combo';
const DEBOUNCE_MS = 280;

const omit = <T extends object>(obj: T, keys: (keyof T)[]) => {
  const c = { ...(obj as any) };
  keys.forEach(k => {
    if (k in c) delete c[k];
  });
  return c as T;
};

const SearchScreen = ({ navigation }: any) => {
  const [searchText, setSearchText] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchModalVisible, setSearchModalVisible] = useState(false);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [filterType, setFilterType] = useState<SearchType>('All');

  const dispatch = useDispatch<AppDispatch>();
  const categories = useSelector(categorySelector);

  const loading = useSelector(foodLoadingSelector);
  const error = useSelector(foodErrorSelector);
  const results = useSelector(searchResultsSelector);
  const pagination = useSelector(searchPaginationSelector);

  const foodSizes = useAppSelector(foodSizeSelector);

  const auth = useAppSelector(authSelector);
  const favorites = useAppSelector(favoriteSelector);

  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [pendingFavoriteAction, setPendingFavoriteAction] = useState<
    (() => void) | null
  >(null);
  const [busy, setBusy] = useState(false);

  const getQueryParams = useCallback(
    (
      overrides?: Partial<{
        page: number;
        limit: number;
        name: string | undefined;
        categoryId: string | undefined;
        minStars: number | undefined;
        type: SearchType | undefined;
      }>,
    ) => {
      const base = {
        name: searchText.trim() || undefined,
        categoryId: selectedCategoryId || undefined,
        minStars: selectedRating || undefined,
        page: 1,
        limit: 10,
        type: filterType,
      };
      return { ...base, ...(overrides || {}) };
    },
    [searchText, selectedCategoryId, selectedRating, filterType],
  );

  const performSearch = useCallback(
    (params: any) => {
      dispatch(searchFoodsAndCombosThunk(params));
    },
    [dispatch],
  );

  useEffect(() => {
    dispatch(fetchCategoriesThunk());
    dispatch(fetchFavoritesThunk());
    (async () => {
      const stored = await AsyncStorage.getItem('recentSearches');
      if (stored) setRecentSearches(JSON.parse(stored).slice(0, 6));
    })();
  }, [dispatch]);

  useEffect(() => {
    performSearch(getQueryParams({ page: 1 }));
  }, []);

  const saveSearch = async (term: string) => {
    const val = term.trim();
    if (!val) return;
    const updated = [val, ...recentSearches.filter(t => t !== val)].slice(0, 6);
    setRecentSearches(updated);
    await AsyncStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const clearAllRecent = async () => {
    setRecentSearches([]);
    await AsyncStorage.setItem('recentSearches', JSON.stringify([]));
  };

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const onChangeText = (text: string) => {
    setSearchText(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      performSearch(
        getQueryParams({ name: text.trim() || undefined, page: 1 }),
      );
    }, DEBOUNCE_MS);
  };

  const confirmAndCloseModal = async (page = 1) => {
    const trimmed = searchText.trim();
    if (trimmed) await saveSearch(trimmed);
    performSearch(getQueryParams({ page }));
    setSearchModalVisible(false);
  };

  const handleRemove = async (item: string) => {
    const filtered = recentSearches.filter(i => i !== item);
    setRecentSearches(filtered);
    await AsyncStorage.setItem('recentSearches', JSON.stringify(filtered));
  };

  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (filterType !== 'All') c++;
    if (selectedCategoryId) c++;
    if (selectedRating) c++;
    return c;
  }, [filterType, selectedCategoryId, selectedRating]);

  const searchWithMeta = useMemo(() => {
    return (results || []).map((r: any) => {
      const itemType: FeaturedType =
        String(r?.type).toLowerCase() === 'combo' ? 'Combo' : 'Food';
      const itemId = r?._id;
      const price = Number(r?.price ?? 0);
      const rating = Number(r?.avgStars ?? 0);
      const rawClean = omit(r || {}, ['type']);
      const isFavorite = favorites.some(
        f =>
          f.itemType === itemType &&
          typeof f.itemId === 'object' &&
          f.itemId?._id === itemId,
      );
      return {
        itemId,
        itemType,
        name: r?.name || '',
        image: r?.image,
        price,
        rating,
        rawItem: rawClean,
        isFavorite,
      };
    });
  }, [results, favorites]);

  const quickSuggestions = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const list = (searchWithMeta || []).filter(it =>
      !q ? true : (it.name || '').toLowerCase().includes(q),
    );
    return list.slice(0, 5);
  }, [searchWithMeta, searchText]);

  const filteredHistory = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return recentSearches;
    return recentSearches.filter(s => s.toLowerCase().includes(q));
  }, [recentSearches, searchText]);

  const checkLoginAndExecute = (action: () => void) => {
    if (!auth.accesstoken) {
      setPendingFavoriteAction(() => action);
      setLoginModalVisible(true);
      return;
    }
    action();
  };

  const handleToggleFavorite = async (
    itemId: string,
    itemType: 'Food' | 'Combo',
  ) => {
    try {
      setBusy(true);
      const existing = favorites.find(
        f =>
          f.itemType === itemType &&
          typeof f.itemId === 'object' &&
          f.itemId?._id === itemId,
      );
      if (existing) {
        await dispatch(removeFavoriteThunk(existing._id)).unwrap();
      } else {
        await dispatch(addFavoriteThunk({ itemId, itemType })).unwrap();
      }
      await dispatch(fetchFavoritesThunk());
    } catch {
      showError('Failed to update favorites');
    } finally {
      setBusy(false);
    }
  };

  const goToDetail = useCallback(
    (itemMeta: {
      itemId: string;
      itemType: FeaturedType;
      name: string;
      price: number;
      rating: number;
      rawItem: any;
    }) => {
      const localSuggest = (searchWithMeta || [])
        .filter(
          x => x.itemType === itemMeta.itemType && x.itemId !== itemMeta.itemId,
        )
        .map(x => {
          const raw = omit(x.rawItem, ['type']);
          return { ...raw, price: x.price, rating: x.rating };
        });

      const suggestSeed = {
        itemType: itemMeta.itemType as FeaturedType,
        categoryId:
          selectedCategoryId ||
          (itemMeta.rawItem?.categoryId as string | undefined),
        minStars: selectedRating || undefined,
        excludeId: itemMeta.itemId,
        limit: 10,
      };

      navigateToItemDetail({
        navigation,
        item: itemMeta.rawItem,
        itemType: itemMeta.itemType,
        foodSizes,
        allItems: localSuggest,
        suggest: localSuggest,
        suggestSeed,
        from: 'SearchScreen',
      } as any);
    },
    [navigation, foodSizes, searchWithMeta, selectedCategoryId, selectedRating],
  );

  const renderItem = ({ item }: { item: any }) => {
    return (
      <AllFeaturedFoodItem
        item={{
          itemId: item.itemId,
          itemType: item.itemType,
          name: item.name,
          image: item.image,
          price: item.price,
          rating: item.rating,
        }}
        isFavorite={item.isFavorite}
        onAddFavorite={() =>
          checkLoginAndExecute(() =>
            handleToggleFavorite(item.itemId, item.itemType),
          )
        }
        onPress={() => goToDetail(item)}
      />
    );
  };

  const renderHeader = () => (
    <View style={styles.headerWrap}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setSearchModalVisible(true)}
        style={styles.searchBar}
      >
        <Icon
          name="search"
          size={20}
          color="#9CA3AF"
          style={{ marginRight: 8 }}
        />
        <Text style={{ color: '#9CA3AF', flex: 1 }}>
          {searchText ? searchText : 'Search foods, combos…'}
        </Text>
        {activeFilterCount > 0 && (
          <View
            style={[
              styles.iconBtn,
              { backgroundColor: '#FFF3E8', marginLeft: 6 },
            ]}
          >
            <Feather name="sliders" size={20} color={appColors.orange} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{activeFilterCount}</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* status row */}
      <RowComponent
        justify="space-between"
        styles={{ marginTop: 8, marginBottom: 6 }}
      >
        <TextComponent
          text={
            pagination?.total
              ? `${pagination.total} results`
              : loading
              ? 'Searching…'
              : '—'
          }
          size={12}
          color="#6B7280"
        />
        {loading && <ActivityIndicator size="small" color={appColors.orange} />}
      </RowComponent>

      {error && (
        <TextComponent
          text={error}
          color="red"
          styles={{ textAlign: 'left', marginBottom: 4 }}
        />
      )}
    </View>
  );

  const emptyComponent = () =>
    !loading ? (
      <View style={styles.emptyWrap}>
        <Icon name="fast-food-outline" size={34} color="#9CA3AF" />
        <Text style={styles.emptyText}>No items match your filters.</Text>
        <TouchableOpacity
          onPress={() => {
            setSearchText('');
            setFilterType('All');
            setSelectedCategoryId('');
            setSelectedRating(0);
            performSearch(
              getQueryParams({ name: undefined, type: 'All', page: 1 }),
            );
          }}
          style={styles.emptyBtn}
          activeOpacity={0.9}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>
            Reset Filters
          </Text>
        </TouchableOpacity>
      </View>
    ) : null;

  const hasPagination =
    !!pagination &&
    typeof pagination.page === 'number' &&
    pagination.totalPages > 1;

  const isBusyLoading = loading || busy;

  return (
    <ContainerComponent title="Search Food" back>
      <FlatList
        data={searchWithMeta}
        renderItem={renderItem}
        keyExtractor={(item: any, index) =>
          `${item.itemType}-${item?.itemId ?? index}`
        }
        numColumns={2}
        columnWrapperStyle={{
          justifyContent: 'space-between',
          paddingHorizontal: 16,
        }}
        contentContainerStyle={{ paddingBottom: hasPagination ? 90 : 24 }}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={emptyComponent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />

      <Modal visible={searchModalVisible} animationType="fade" transparent>
        <View style={styles.fullOverlay}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setSearchModalVisible(false)}
          />
          <View style={styles.searchSheet}>
            {/* Header của modal */}
            <View style={styles.modalHeader}>
              <View
                style={[
                  styles.searchBar,
                  { marginTop: 0, marginBottom: 0, flex: 1 },
                ]}
              >
                <Icon
                  name="search"
                  size={20}
                  color="#9CA3AF"
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  autoFocus
                  placeholder="Search foods, combos…"
                  placeholderTextColor="#9CA3AF"
                  style={styles.searchInput}
                  value={searchText}
                  onChangeText={onChangeText}
                  returnKeyType="search"
                  onSubmitEditing={() => confirmAndCloseModal(1)}
                  autoCorrect={false}
                  autoCapitalize="none"
                  clearButtonMode="while-editing"
                />
                {!!searchText && (
                  <TouchableOpacity
                    onPress={() => {
                      setSearchText('');
                      performSearch(
                        getQueryParams({ name: undefined, page: 1 }),
                      );
                    }}
                    style={styles.iconBtn}
                    activeOpacity={0.8}
                  >
                    <Entypo name="cross" size={18} color="#6B7280" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => {}}
                  style={[
                    styles.iconBtn,
                    { marginLeft: 6, backgroundColor: '#FFF3E8' },
                  ]}
                  activeOpacity={0.9}
                >
                  <Feather name="sliders" size={20} color={appColors.orange} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => setSearchModalVisible(false)}
                style={styles.closeBtn}
              >
                <Icon name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingBottom: 10,
              }}
            >
              <Text style={styles.label}>Type</Text>
              <View style={styles.chipsWrap}>
                {(['All', 'Food', 'Combo'] as SearchType[]).map(t => {
                  const selected = filterType === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      onPress={() => setFilterType(t)}
                      style={[styles.chip, selected && styles.chipSelected]}
                      activeOpacity={0.9}
                    >
                      <Text style={{ color: selected ? '#fff' : '#374151' }}>
                        {t}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.label}>Category</Text>
              <View style={styles.chipsWrap}>
                <TouchableOpacity
                  onPress={() => setSelectedCategoryId('')}
                  style={[
                    styles.chip,
                    !selectedCategoryId && styles.chipSelected,
                  ]}
                  activeOpacity={0.9}
                >
                  <Text
                    style={{ color: !selectedCategoryId ? '#fff' : '#374151' }}
                  >
                    All
                  </Text>
                </TouchableOpacity>
                {categories.map(cat => {
                  const selected = selectedCategoryId === cat._id;
                  return (
                    <TouchableOpacity
                      key={cat._id}
                      onPress={() => setSelectedCategoryId(cat._id)}
                      style={[styles.chip, selected && styles.chipSelected]}
                      activeOpacity={0.9}
                    >
                      <Text style={{ color: selected ? '#fff' : '#374151' }}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.label}>Rating</Text>
              <View style={[styles.chipsWrap, { marginBottom: 2 }]}>
                <TouchableOpacity
                  onPress={() => setSelectedRating(0)}
                  style={[
                    styles.starChip,
                    selectedRating === 0 && styles.starChipSelected,
                  ]}
                  activeOpacity={0.9}
                >
                  <Text
                    style={{
                      color:
                        selectedRating === 0 ? appColors.orange : '#374151',
                    }}
                  >
                    All
                  </Text>
                </TouchableOpacity>
                {[1, 2, 3, 4, 5].map(star => {
                  const selected = selectedRating === star;
                  return (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setSelectedRating(star)}
                      style={[
                        styles.starChip,
                        selected && styles.starChipSelected,
                      ]}
                      activeOpacity={0.9}
                    >
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Icon
                          key={i}
                          name="star"
                          size={18}
                          color={i < star ? '#F59E0B' : '#E5E7EB'}
                          style={{ marginRight: 2 }}
                        />
                      ))}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* History & Suggestions */}
              <RowComponent
                justify="space-between"
                styles={{ marginTop: 10, marginBottom: 6 }}
              >
                <TextComponent
                  text="Recent searches"
                  size={12}
                  color="#6B7280"
                />
                {recentSearches.length > 0 && (
                  <TouchableOpacity onPress={clearAllRecent}>
                    <TextComponent
                      text="Clear all"
                      size={12}
                      color={appColors.orange}
                    />
                  </TouchableOpacity>
                )}
              </RowComponent>
              {filteredHistory.length > 0 ? (
                filteredHistory.map((s, idx) => (
                  <TouchableOpacity
                    key={`${s}-${idx}`}
                    style={styles.rowItem}
                    onPress={async () => {
                      setSearchText(s);
                      await saveSearch(s);
                      performSearch(getQueryParams({ name: s, page: 1 }));
                      setSearchModalVisible(false);
                    }}
                    activeOpacity={0.9}
                  >
                    <Feather name="clock" size={16} color="#9CA3AF" />
                    <Text style={styles.rowText}>{s}</Text>
                    <TouchableOpacity
                      onPress={() => handleRemove(s)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      style={{ marginLeft: 'auto' }}
                    >
                      <Entypo name="cross" size={16} color="#9CA3AF" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.muted}>No recent searches</Text>
              )}

              <View style={styles.divider} />

              <Text style={[styles.sectionTitle]}>Suggestions</Text>
              {quickSuggestions.length > 0 ? (
                quickSuggestions.map(item => (
                  <TouchableOpacity
                    key={`${item.itemType}-${item.itemId}`}
                    style={styles.rowItem}
                    onPress={async () => {
                      await saveSearch(item.name);
                      performSearch(
                        getQueryParams({ name: item.name, page: 1 }),
                      );
                      setSearchModalVisible(false);
                    }}
                    activeOpacity={0.9}
                  >
                    <Feather name="search" size={16} color="#9CA3AF" />
                    <Text style={styles.rowText} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.suggestionMeta}>
                      {item.itemType} • {item.price ? `${item.price}` : '—'}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.muted}>
                  {searchText.trim()
                    ? 'No matches yet'
                    : 'Start typing to see suggestions'}
                </Text>
              )}
            </ScrollView>

            {/* Footer trong modal: Reset / Apply */}
            <View style={styles.sheetFooter}>
              <TouchableOpacity
                style={[styles.footerBtn, styles.resetBtn]}
                onPress={() => {
                  setFilterType('All');
                  setSelectedCategoryId('');
                  setSelectedRating(0);
                  setSearchText('');
                }}
                activeOpacity={0.9}
              >
                <TextComponent text="Reset" color={appColors.orange} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.footerBtn, styles.applyBtn]}
                onPress={() => confirmAndCloseModal(1)}
                activeOpacity={0.9}
              >
                <TextComponent text="Apply" color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Floating Pagination Bar */}
      {hasPagination && (
        <View pointerEvents="box-none" style={styles.floatingPaginationWrap}>
          <View style={styles.floatingPaginationBar}>
            <TouchableOpacity
              disabled={pagination.page <= 1}
              onPress={() => confirmAndCloseModal(pagination.page - 1)}
              style={[styles.pgBtn, pagination.page <= 1 && { opacity: 0.45 }]}
              activeOpacity={0.9}
            >
              <Ionicons
                name="chevron-back"
                size={18}
                color={pagination.page <= 1 ? '#9CA3AF' : appColors.orange}
              />
            </TouchableOpacity>

            <TextComponent
              text={`Page ${pagination.page} / ${pagination.totalPages}`}
              size={13}
              color="#6B7280"
            />

            <TouchableOpacity
              disabled={pagination.page >= pagination.totalPages}
              onPress={() => confirmAndCloseModal(pagination.page + 1)}
              style={[
                styles.pgBtn,
                pagination.page >= pagination.totalPages && { opacity: 0.45 },
              ]}
              activeOpacity={0.9}
            >
              <Ionicons
                name="chevron-forward"
                size={18}
                color={
                  pagination.page >= pagination.totalPages
                    ? '#9CA3AF'
                    : appColors.orange
                }
              />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Login Modal cho favorite */}
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

      {/* Loading overlay cho tìm kiếm & toggle favorite */}
      <LoadingModal visible={isBusyLoading} />
    </ContainerComponent>
  );
};

export default SearchScreen;

const styles = StyleSheet.create({
  headerWrap: { paddingHorizontal: 16, paddingTop: 4 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 14,
    borderRadius: 14,
    height: 48,
    marginTop: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#EEE',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0, color: '#111827' },
  iconBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: appColors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  sectionTitle: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  rowItem: {
    paddingVertical: 8,
    paddingHorizontal: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowText: { marginLeft: 8, color: '#111827', flex: 1 },
  suggestionMeta: { color: '#9CA3AF', fontSize: 12, marginLeft: 8 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 8 },
  muted: { color: '#9CA3AF', marginBottom: 4 },
  emptyWrap: { alignItems: 'center', marginTop: 24, gap: 10 },
  emptyText: { color: '#6B7280', marginTop: 6 },
  emptyBtn: {
    backgroundColor: appColors.orange,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 6,
  },
  fullOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  searchSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '88%',
    paddingTop: 10,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -2 },
    elevation: 10,
  },
  modalHeader: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  closeBtn: { padding: 8, backgroundColor: '#F3F4F6', borderRadius: 12 },
  label: {
    marginTop: 10,
    marginBottom: 6,
    color: '#6B7280',
    fontWeight: '600',
  },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#FFF',
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: appColors.orange,
    borderColor: appColors.orange,
  },
  starChip: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#FFF',
  },
  starChipSelected: {
    borderColor: appColors.orange,
    backgroundColor: '#FFF7EE',
  },
  sheetFooter: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  footerBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtn: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: appColors.orange,
  },
  applyBtn: { backgroundColor: appColors.orange },
  floatingPaginationWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Platform.select({ ios: 12, android: 12 }),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
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
