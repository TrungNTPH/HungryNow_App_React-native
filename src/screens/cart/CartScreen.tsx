import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store';
import {
  deleteCartThunk,
  fetchCartThunk,
  updateCartThunk,
} from '../../redux/actions/cartAction';
import { navigateToItemDetail } from '../../utils/navigateToItemDetail';
import {
  ButtonComponent,
  CartItem,
  ContainerComponent,
  TextComponent,
} from '../../components';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { showSuccess, showError } from '../../utils/toastMessages';
import {
  cartSelector,
  cartErrorSelector,
  cartSuccessSelector,
  clearCartMessages,
} from '../../redux/reducer/cartReducer';
import { HydratedCartModel } from '../../models/CartModel';
import { FoodSizeModel } from '../../models/FoodSizeModel';
import debounce from 'lodash.debounce';
import { foodSelector } from '../../redux/reducer/foodReducer';
import { comboSelector } from '../../redux/reducer/comboReducer';
import { useFocusEffect } from '@react-navigation/native';
import { appColors, appFonts } from '../../constants';
import { ModalNotification, LoadingModal } from '../../modals';

const CartScreen = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();

  const cart = useSelector(cartSelector);
  const error = useSelector(cartErrorSelector);
  const successMessage = useSelector(cartSuccessSelector);
  const foodSizes = useSelector((state: RootState) => state.foodSize.foodSizes);

  const foods = useSelector(foodSelector);
  const combos = useSelector(comboSelector);

  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pendingQty, setPendingQty] = useState<Record<string, boolean>>({});

  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>(
    {},
  );

  const [confirmSingleVisible, setConfirmSingleVisible] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const [confirmBulkVisible, setConfirmBulkVisible] = useState(false);
  const [bulkCount, setBulkCount] = useState(0);

  const loadData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setBusy(true);
      }
      try {
        await dispatch(fetchCartThunk()).unwrap();
      } catch {
        showError('Failed to refresh cart.');
      } finally {
        setRefreshing(false);
        setBusy(false);
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
    if (error && !refreshing) {
      showError('Failed to load Cart');
      dispatch(clearCartMessages());
    }
  }, [error, refreshing, dispatch]);

  useEffect(() => {
    if (successMessage && !refreshing) {
      showSuccess(successMessage);
      dispatch(clearCartMessages());
    }
  }, [successMessage, refreshing, dispatch]);

  const getItemFlags = useCallback((raw: any) => {
    const itemDoc = raw?.itemId || {};
    const status = itemDoc?.status;
    const isDiscontinued = status === 'unavailable';

    const isFood = raw?.itemType === 'Food';
    const foodQty = isFood ? Number(itemDoc?.quantity ?? 0) : undefined;
    const isOutOfStock = isFood ? foodQty! <= 0 : false;

    return {
      isDiscontinued,
      isOutOfStock,
      isSelectable: !isDiscontinued && (!isFood || !isOutOfStock),
      statusLabel: isDiscontinued
        ? 'Discontinued'
        : isOutOfStock
        ? 'Out of Stock'
        : undefined,
    };
  }, []);

  const hydratedCart: HydratedCartModel[] = useMemo(() => {
    return cart.map(item => {
      const { itemId, itemType } = item;

      let price = 0;
      let sizeName = 'Default';
      let sizeData: FoodSizeModel | undefined;

      if (itemType === 'Food') {
        const foodSizeId =
          typeof item.foodSizeId === 'string'
            ? item.foodSizeId
            : item.foodSizeId?._id;

        const foodSize = foodSizes.find(fs => fs._id === foodSizeId);
        if (foodSize) {
          sizeData = foodSize;
          price = sizeData.price;
          sizeName = sizeData.sizeId?.name ?? 'Default';
        }
      }

      if (
        itemType === 'Combo' &&
        itemId &&
        typeof itemId === 'object' &&
        'price' in itemId
      ) {
        price = (itemId as any).price;
        sizeName = 'Combo';
      }

      const flags = getItemFlags(item);

      return {
        ...item,
        size: { name: sizeName, price },
        selected: selectedItems[item._id] ?? false,
        __isDiscontinued: flags.isDiscontinued,
        __isOutOfStock: flags.isOutOfStock,
        __isSelectable: flags.isSelectable,
        __statusLabel: flags.statusLabel,
      } as HydratedCartModel & {
        __isDiscontinued?: boolean;
        __isOutOfStock?: boolean;
        __isSelectable?: boolean;
        __statusLabel?: string;
      };
    });
  }, [cart, foodSizes, selectedItems, getItemFlags]);

  const validCart = hydratedCart.filter(
    item => item._id && item.itemId?._id && item.quantity,
  );

  const totalSelected = useMemo(
    () =>
      validCart.filter(i => selectedItems[i._id] && (i as any).__isSelectable)
        .length,
    [validCart, selectedItems],
  );

  const isAllSelected = useMemo(() => {
    const ids = validCart
      .filter(i => (i as any).__isSelectable)
      .map(i => i._id);
    if (ids.length === 0) return false;
    return ids.every(id => selectedItems[id]);
  }, [validCart, selectedItems]);

  const toggleItemSelection = useCallback(
    (id: string, value: boolean) => {
      const it = validCart.find(i => i._id === id) as any;
      if (!it) return;
      if (!it.__isSelectable && value) {
        showError(it.__statusLabel || 'This item cannot be selected.');
        return;
      }
      setSelectedItems(prev => ({ ...prev, [id]: value }));
    },
    [validCart],
  );

  const toggleSelectAll = useCallback(() => {
    const ids = validCart
      .filter(i => (i as any).__isSelectable)
      .map(i => i._id);
    if (ids.length === 0) return;
    setSelectedItems(prev => {
      const next: Record<string, boolean> = { ...prev };
      const select = !isAllSelected;
      ids.forEach(id => (next[id] = select));
      return next;
    });
  }, [validCart, isAllSelected]);

  const updateItemQuantity = useCallback(
    async (id: string, quantity: number, type: 'increase' | 'decrease') => {
      const item = validCart.find(i => i._id === id) as any;
      if (!item) return;

      if (pendingQty[id]) return;

      if (!item.__isSelectable) {
        showError(item.__statusLabel || 'This item cannot be updated.');
        return;
      }

      let newQuantity = quantity;
      if (type === 'decrease' && quantity > 1) newQuantity = quantity - 1;
      else if (type === 'increase') newQuantity = quantity + 1;
      if (newQuantity === quantity) return;

      try {
        setPendingQty(prev => ({ ...prev, [id]: true }));
        await dispatch(
          updateCartThunk({
            id,
            quantity: newQuantity,
            note: item.note,
          }),
        ).unwrap();
      } catch {
        showError('This item is currently unavailable or out of stock.');
      } finally {
        setPendingQty(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    },
    [validCart, dispatch, pendingQty],
  );

  const openConfirmDelete = useCallback((id: string) => {
    setPendingDeleteId(id);
    setConfirmSingleVisible(true);
  }, []);

  const openConfirmDeleteSelected = useCallback(() => {
    const ids = validCart.filter(i => selectedItems[i._id]).map(i => i._id);
    if (ids.length === 0) return;
    setBulkCount(ids.length);
    setConfirmBulkVisible(true);
  }, [validCart, selectedItems]);

  const handleDeleteConfirmed = useCallback(async () => {
    if (!pendingDeleteId) return;
    try {
      setBusy(true);
      await dispatch(deleteCartThunk(pendingDeleteId)).unwrap();
      showSuccess('Item removed from cart.');
      setSelectedItems(prev => {
        const updated = { ...prev };
        delete updated[pendingDeleteId];
        return updated;
      });
      loadData();
    } catch {
      showError('Failed to remove item.');
    } finally {
      setBusy(false);
    }
  }, [dispatch, pendingDeleteId, loadData]);

  const handleBulkDeleteConfirmed = useCallback(async () => {
    const ids = validCart.filter(i => selectedItems[i._id]).map(i => i._id);
    if (ids.length === 0) return;
    try {
      setBusy(true);
      await Promise.all(ids.map(id => dispatch(deleteCartThunk(id))));
      showSuccess('Removed selected items.');
      setSelectedItems(prev => {
        const next = { ...prev };
        ids.forEach(id => delete next[id]);
        return next;
      });
      loadData(true);
    } catch {
      showError('Failed to remove selected items.');
    } finally {
      setBusy(false);
    }
  }, [dispatch, validCart, selectedItems, loadData]);

  const handlePayment = () => {
    if (busy) return;
    const selectedCartItems = validCart.filter(
      (item: any) => selectedItems[item._id] && item.__isSelectable,
    );
    if (selectedCartItems.length === 0) {
      return showError(
        'Please select at least one available item to checkout.',
      );
    }
    navigation.navigate('PaymentScreen', { selectedItems: selectedCartItems });
  };

  const handleNavigateToItemDetail = useCallback(
    (item: any) => {
      if (!item.itemId || !item.itemType) return;
      const allItems = item.itemType === 'Food' ? foods : combos;

      navigateToItemDetail({
        navigation,
        item: {
          ...item.itemId,
          itemId: item.itemId._id,
          itemType: item.itemType,
          price: item.size?.price,
          rating: item.rating,
        },
        itemType: item.itemType,
        foodSizes,
        allItems,
      });
    },
    [navigation, foods, combos, foodSizes],
  );

  const debouncedUpdateNote = useMemo(() => {
    return debounce((id: string, note: string) => {
      dispatch(updateCartThunk({ id, note })).catch(() =>
        showError('Failed to update note.'),
      );
    }, 500);
  }, [dispatch]);

  const handleNoteChange = useCallback(
    (id: string, note: string) => {
      debouncedUpdateNote(id, note);
    },
    [debouncedUpdateNote],
  );

  const renderItem = ({ item }: any) => {
    const isQtyUpdating = !!pendingQty[item._id];
    return (
      <CartItem
        item={item}
        onIncrease={() =>
          !isQtyUpdating &&
          updateItemQuantity(item._id, item.quantity, 'increase')
        }
        onDecrease={() =>
          !isQtyUpdating &&
          updateItemQuantity(item._id, item.quantity, 'decrease')
        }
        onDelete={() => openConfirmDelete(item._id)}
        onToggleSelect={value => toggleItemSelection(item._id, value)}
        onPress={() => {
          if ((item as any).__isDiscontinued) {
            showError('This item is discontinued.');
            return;
          }
          handleNavigateToItemDetail(item);
        }}
        onNoteChange={(val: string) => handleNoteChange(item._id, val)}
      />
    );
  };

  const selectedCartItems = validCart.filter(
    (item: any) => selectedItems[item._id] && item.__isSelectable,
  );
  const totalPrice = selectedCartItems.reduce((acc, item) => {
    const price = item.size?.price ?? 0;
    return acc + price * item.quantity;
  }, 0);

  return (
    <ContainerComponent title="Cart" isScroll={false}>
      {/* KHÔNG thay đổi opacity theo busy để tránh lóe nhẹ khi tăng/giảm số lượng */}
      <View style={{ flex: 1 }}>
        {validCart.length === 0 ? (
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
            <TextComponent
              text="Your cart is empty"
              size={18}
              font={appFonts.semiBold}
              color={appColors.text}
              styles={{ marginBottom: 6 }}
            />
            <TextComponent
              text="It looks like you haven’t added any items yet."
              size={13}
              color="#666"
              styles={styles.emptyText}
            />
            <ButtonComponent
              text="Find Foods"
              type="primary"
              color={appColors.orange}
              onPress={() => navigation.navigate('Home')}
              styles={styles.findButton}
              textStyles={styles.findButtonText}
            />
          </ScrollView>
        ) : (
          <>
            <View style={styles.utilsBar}>
              <TouchableOpacity
                style={[styles.utilBtn, { opacity: busy ? 0.6 : 1 }]}
                onPress={busy ? undefined : toggleSelectAll}
                activeOpacity={0.9}
                disabled={busy}
              >
                <MaterialIcons
                  name={isAllSelected ? 'check-box' : 'check-box-outline-blank'}
                  size={20}
                  color={isAllSelected ? appColors.orange : '#777'}
                />
                <TextComponent
                  text={isAllSelected ? 'Unselect all' : 'Select all'}
                  size={12}
                  color="#555"
                  styles={{ marginLeft: 6 }}
                />
              </TouchableOpacity>

              <View style={{ flex: 1 }} />

              <TouchableOpacity
                style={[
                  styles.utilBtn,
                  { opacity: totalSelected && !busy ? 1 : 0.4 },
                ]}
                onPress={busy ? undefined : openConfirmDeleteSelected}
                disabled={!totalSelected || busy}
                activeOpacity={0.9}
              >
                <MaterialIcons
                  name="delete-outline"
                  size={20}
                  color="#B00020"
                />
                <TextComponent
                  text="Clear selected"
                  size={12}
                  color="#B00020"
                  styles={{ marginLeft: 6 }}
                />
              </TouchableOpacity>
            </View>

            <FlatList
              data={validCart}
              keyExtractor={item => item._id}
              renderItem={renderItem}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => loadData(true)}
                />
              }
              contentContainerStyle={[styles.listContent]}
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
            />

            <View style={styles.checkoutContainer}>
              <View style={{ flex: 1 }}>
                <TextComponent
                  text={`Selected ${totalSelected} item${totalSelected > 1 ? 's' : ''
                    }`}
                  size={12}
                  color="#777"
                />
                <TextComponent
                  text={`${totalPrice.toLocaleString()} ₫`}
                  size={18}
                  color={appColors.orange}
                  font={appFonts.semiBold}
                />
              </View>
              <TouchableOpacity
                style={[
                  styles.checkoutButton,
                  !totalSelected || busy ? { opacity: 0.5 } : null,
                ]}
                onPress={handlePayment}
                disabled={!totalSelected || busy}
                activeOpacity={0.9}
              >
                <TextComponent
                  text={busy ? 'Processing…' : 'Checkout Now'}
                  size={14}
                  color="#fff"
                  font={appFonts.semiBold}
                />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Confirm xoá 1 item */}
      <ModalNotification
        visible={confirmSingleVisible}
        onClose={() => {
          setConfirmSingleVisible(false);
          setPendingDeleteId(null);
        }}
        title="Remove item?"
        message="Do you want to remove this item from your cart?"
        variant="warning"
        actions={[
          { label: 'Cancel', style: 'secondary' },
          { label: 'Delete', style: 'danger', onPress: handleDeleteConfirmed },
        ]}
        accessibilityLabel="Delete cart item confirmation"
      />

      {/* Confirm xoá nhiều item */}
      <ModalNotification
        visible={confirmBulkVisible}
        onClose={() => {
          setConfirmBulkVisible(false);
          setBulkCount(0);
        }}
        title="Remove selected items?"
        subtitle={
          bulkCount
            ? `${bulkCount} item${bulkCount > 1 ? 's' : ''} selected`
            : undefined
        }
        message="Do you want to remove all selected items from your cart?"
        variant="warning"
        actions={[
          { label: 'Cancel', style: 'secondary' },
          {
            label: 'Delete',
            style: 'danger',
            onPress: handleBulkDeleteConfirmed,
          },
        ]}
        accessibilityLabel="Delete selected cart items confirmation"
      />

      {/* Loading modal: CHỈ hiện khi đang refresh hoặc thao tác nặng (busy) — KHÔNG bật khi đổi số lượng */}
      <LoadingModal visible={refreshing || busy} />
    </ContainerComponent>
  );
};

export default CartScreen;

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  circleBackground: {
    position: 'relative',
    marginBottom: 20,
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
    backgroundColor: appColors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  emptyText: { textAlign: 'center', marginBottom: 16 },
  findButton: {
    backgroundColor: appColors.orange,
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  findButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 140,
  },
  utilsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  utilBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  checkoutContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  checkoutButton: {
    backgroundColor: appColors.orange,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
  },
});
