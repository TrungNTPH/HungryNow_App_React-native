import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { ComboItem, ContainerComponent, TextComponent } from '../../components';
import { appColors } from '../../constants';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../redux/store';
import { navigateToItemDetail } from '../../utils/navigateToItemDetail';
import { showSuccess, showError } from '../../utils/toastMessages';
import { useAppSelector } from '../../redux/hooks';
import {
  comboSelector,
  comboErrorSelector,
  comboSuccessSelector,
  comboPaginationSelector,
  clearComboMessages,
} from '../../redux/reducer/comboReducer';
import { fetchPaginatedCombosThunk } from '../../redux/actions/comboAction';
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

const SeeAllComboScreen = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const auth = useAppSelector(authSelector);

  const combos = useAppSelector(comboSelector);
  const combosError = useAppSelector(comboErrorSelector);
  const comboSuccessMessage = useAppSelector(comboSuccessSelector);

  const avgStarsMap = useAppSelector(avgStarsMapSelector);

  const favorites = useAppSelector(favoriteSelector);
  const favoriteError = useAppSelector(favoriteErrorSelector);
  const favoriteSuccessMessage = useAppSelector(favoriteSuccessSelector);

  const pagination = useAppSelector(comboPaginationSelector);
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
            fetchPaginatedCombosThunk({ page: pageNumber, limit }),
          ).unwrap(),
          dispatch(fetchFavoritesThunk()).unwrap(),
        ]);
      } catch {
        showError('Failed to refresh Combos');
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
        label: 'Combos',
        hasError: !!combosError,
        clear: () => dispatch(clearComboMessages()),
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
  }, [combosError, favoriteError, refreshing, dispatch]);

  useEffect(() => {
    const successMapping = [
      {
        message: comboSuccessMessage,
        clear: () => dispatch(clearComboMessages()),
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
  }, [comboSuccessMessage, favoriteSuccessMessage, refreshing, dispatch]);

  const combosWithMeta = useMemo(() => {
    return combos.map(combo => {
      const rating = avgStarsMap[combo._id] || 0;
      const isFavorite = favorites.some(
        f =>
          f.itemType === 'Combo' &&
          typeof f.itemId === 'object' &&
          f.itemId._id === combo._id,
      );
      return {
        ...combo,
        itemId: combo._id,
        itemType: 'Combo',
        price: combo.price || 0,
        rating,
        isFavorite,
      };
    });
  }, [combos, avgStarsMap, favorites]);

  const checkLoginAndExecute = (action: () => void) => {
    if (!auth.accesstoken) {
      setPendingFavoriteAction(() => action);
      setLoginModalVisible(true);
      return;
    }
    action();
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
      await dispatch(fetchFavoritesThunk()).unwrap();
    } catch {
      showError('Failed to update favorites');
    } finally {
      setBusy(false);
    }
  };

  const handleRefresh = async () => {
    await loadData(currentPage, true);
  };

  return (
    <ContainerComponent back title="All Combos">
      <View style={{ flex: 1, position: 'relative' }}>
        <FlatList
          data={combosWithMeta}
          keyExtractor={item => item._id}
          numColumns={2}
          renderItem={({ item }) => (
            <ComboItem
              item={item}
              isFavorite={item.isFavorite}
              onAddFavorite={() =>
                checkLoginAndExecute(() => handleAddComboFavorite(item._id))
              }
              onPress={() => {
                const currentCombo = combos.find(c => c._id === item._id);
                const allItems = combos
                  .filter(c => c._id !== item._id)
                  .map(c => ({
                    ...c,
                    price: c.price || 0,
                    rating: avgStarsMap[c._id] || 0,
                  }));

                navigateToItemDetail({
                  navigation,
                  item: currentCombo,
                  itemType: 'Combo',
                  foodSizes: [],
                  allItems,
                });
              }}
            />
          )}
          contentContainerStyle={[styles.content, { paddingBottom: 90 }]}
          columnWrapperStyle={styles.column}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />

        {/* Floating Pagination */}
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
                color={currentPage >= totalPages ? '#9CA3AF' : appColors.orange}
              />
            </TouchableOpacity>
          </View>
        </View>
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
              if (pendingFavoriteAction) {
                setPendingFavoriteAction(null);
              }
            },
          },
        ]}
      />

      {/* Loading overlay cho tải trang & toggle favorite */}
      <LoadingModal visible={loading || busy} />
    </ContainerComponent>
  );
};

export default SeeAllComboScreen;

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
