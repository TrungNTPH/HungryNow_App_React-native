import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  FlatList,
  ScrollView,
  Dimensions,
} from 'react-native';
import moment from 'moment';
import PagerView from 'react-native-pager-view';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  ButtonComponent,
  ContainerComponent,
  TextComponent,
} from '../../../components';
import { appColors, appFonts } from '../../../constants';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import {
  fetchMyInvoicesThunk,
  cancelInvoiceThunk,
} from '../../../redux/actions/invoiceAction';
import { invoiceItemsSelector } from '../../../redux/reducer/invoiceReducer';
import { fetchPendingRatingsThunk } from '../../../redux/actions/ratingAction';
import { pendingRatingsSelector } from '../../../redux/reducer/ratingReducer';
import { foodSelector } from '../../../redux/reducer/foodReducer';
import { comboSelector } from '../../../redux/reducer/comboReducer';
import { showError, showSuccess } from '../../../utils/toastMessages';
import { useFocusEffect } from '@react-navigation/native';
import { ModalNotification, LoadingModal } from '../../../modals';
import { lalamoveApi } from '../../../apis/lalamoveApi';

const statuses = [
  { key: 'pending', label: 'Pending' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipping', label: 'Shipping' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'canceled', label: 'Canceled' },
  { key: 'Reviews', label: 'Reviews' },
] as const;

type InvoiceStatus =
  | 'pending'
  | 'processing'
  | 'shipping'
  | 'delivered'
  | 'canceled';

const statusColorMap: Record<InvoiceStatus, string> = {
  pending: '#FFC107',
  processing: '#17A2B8',
  shipping: '#007BFF',
  delivered: '#28A745',
  canceled: '#DC3545',
};

const Badge = ({ label, color }: { label: string; color: string }) => (
  <View
    style={[
      styles.badge,
      { backgroundColor: `${color}1A`, borderColor: color },
    ]}
  >
    <TextComponent
      text={label}
      size={11}
      color={color}
      font={appFonts.semiBold}
    />
  </View>
);

const Pill = ({ text }: { text: string }) => (
  <View style={styles.pill}>
    <TextComponent
      text={text}
      size={11}
      color={appColors.gray}
      font={appFonts.semiBold}
    />
  </View>
);

const TabButton = ({
  label,
  active,
  onPress,
  count,
  onLayout,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  count?: number;
  onLayout?: (e: any) => void;
}) => (
  <TouchableOpacity
    style={[styles.tabBtn, active && styles.tabBtnActive]}
    onPress={onPress}
    activeOpacity={0.85}
    onLayout={onLayout}
  >
    <TextComponent
      text={label}
      styles={[styles.tabBtnText, active && styles.tabBtnTextActive]}
    />
    {typeof count === 'number' && <Pill text={`${count}`} />}
  </TouchableOpacity>
);

const fromNow = (date?: string) => (date ? moment(date).fromNow() : '');
const formatMoney = (v: number) => `${(v || 0).toLocaleString()} VND`;

const InvoiceScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();

  const invoices = useAppSelector(invoiceItemsSelector);
  const pendingRatings = useAppSelector(pendingRatingsSelector);
  const foods = useAppSelector(foodSelector);
  const combos = useAppSelector(comboSelector);

  const [tab, setTab] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const pagerRef = useRef<PagerView>(null);
  const tabsScrollRef = useRef<ScrollView>(null);
  const screenWidth = Dimensions.get('window').width;

  const [tabLayouts, setTabLayouts] = useState<{ x: number; width: number }[]>(
    Array(statuses.length).fill({ x: 0, width: 0 }),
  );

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null);

  const loadData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setBusy(true);
      }
      setLoading(true);
      try {
        await Promise.all([
          dispatch(fetchMyInvoicesThunk()).unwrap(),
          dispatch(fetchPendingRatingsThunk()).unwrap(),
        ]);
      } catch {
        showError('Failed to load data');
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
      loadData();
    }, [loadData]),
  );

  const counts = useMemo(() => {
    const map: Record<string, number> = {
      pending: 0,
      processing: 0,
      shipping: 0,
      delivered: 0,
      canceled: 0,
      Reviews: pendingRatings.length,
    };
    invoices.forEach(i => {
      if (i.status in map) map[i.status] += 1;
    });
    return map;
  }, [invoices, pendingRatings.length]);

  const filteredInvoices = useMemo(
    () => statuses.map(s => invoices.filter(i => i.status === (s.key as any))),
    [invoices],
  );

  const mapInvoiceToLMHint = (st: InvoiceStatus | string | undefined) => {
    switch (st) {
      case 'processing':
        return 'ASSIGNING';
      case 'shipping':
        return 'ON_GOING';
      case 'delivered':
        return 'COMPLETED';
      case 'canceled':
        return 'CANCELED';
      default:
        return undefined;
    }
  };

  const handlePressDeliveryTracking = async (inv: any) => {
    if (!inv?.deliveryId) {
      showError('There is no delivery id to track.');
      return;
    }
    try {
      setBusy(true);
      let shareLink: string | null = null;
      try {
        shareLink = await lalamoveApi.getDriverShareLink(inv.deliveryId);
      } catch (_) {}
      navigation.navigate('DeliveryTrackingScreen', {
        shareLink: shareLink || undefined,
        orderId: inv.deliveryId,
        status: mapInvoiceToLMHint(inv.status),
      });
    } catch {
      showError('Error opening delivery tracking.');
    } finally {
      setBusy(false);
    }
  };

  const enrichedPendingRatings = useMemo(() => {
    return pendingRatings.map(item => {
      const { itemId, type } = item;
      const itemIdString =
        typeof itemId === 'string' ? itemId : (itemId as any)?._id;
      const source = type === 'Food' ? foods : combos;
      const fullItem = source.find(i => i._id === itemIdString);
      return {
        ...item,
        itemId: {
          ...(fullItem || {}),
          _id: itemIdString,
        },
      };
    });
  }, [pendingRatings, foods, combos]);

  const openCancelConfirm = useCallback((id: string) => {
    setPendingCancelId(id);
    setConfirmVisible(true);
  }, []);

  const handleConfirmNo = useCallback(() => {
    setConfirmVisible(false);
    setPendingCancelId(null);
  }, []);

  const handleConfirmYes = useCallback(async () => {
    if (!pendingCancelId) return;
    try {
      setBusy(true);
      await dispatch(cancelInvoiceThunk(pendingCancelId)).unwrap();
      showSuccess(`Invoice #${pendingCancelId.slice(-6)} cancelled`);
      setConfirmVisible(false);
      setPendingCancelId(null);
      await loadData();
    } catch {
      showError('Failed to cancel invoice');
    } finally {
      setBusy(false);
    }
  }, [dispatch, pendingCancelId, loadData]);

  const ThumbStack = ({ items }: { items: any[] }) => {
    const thumbs = items.slice(0, 4);
    return (
      <View style={styles.stackRow}>
        {thumbs.map((it, idx) => {
          let src: any = require('../../../assets/images/logo.png');
          if (
            it?.itemId &&
            typeof it.itemId === 'object' &&
            'image' in it.itemId &&
            it.itemId.image
          ) {
            src = { uri: it.itemId.image };
          }
          return (
            <Image
              key={idx}
              source={src}
              style={[styles.stackThumb, { left: idx * 22, zIndex: 10 - idx }]}
            />
          );
        })}
        {items.length > 4 && (
          <View style={[styles.stackMore, { left: 4 * 22 }]}>
            <TextComponent
              text={`+${items.length - 4}`}
              size={11}
              color="#fff"
              font={appFonts.semiBold}
            />
          </View>
        )}
      </View>
    );
  };

  const computeRefundUI = (inv: any) => {
    if (inv.status !== 'canceled') return null;

    const method = String(inv?.payment?.method || '').toLowerCase();
    const paid = inv?.payment?.status === 'paid';
    const isZaloPayPaid = method === 'zalopay' && paid;

    if (!isZaloPayPaid) {
      return {
        tone: 'neutral',
        color: '#6c757d',
        icon: 'information-circle-outline',
        title: 'Order canceled',
        sub: 'No refund needed.',
        showSupport: false,
      };
    }

    const rs = inv?.refundStatus || 'none';
    if (rs === 'succeeded') {
      return {
        tone: 'success',
        color: '#28A745',
        icon: 'checkmark-circle-outline',
        title: 'Refund completed',
        sub: `Refunded ${formatMoney(inv.total)} to your ZaloPay.`,
        showSupport: false,
      };
    }
    if (rs === 'failed') {
      return {
        tone: 'danger',
        color: '#DC3545',
        icon: 'alert-circle-outline',
        title: 'Refund failed',
        sub: 'Please contact support for assistance.',
        showSupport: true,
      };
    }
    return {
      tone: 'info',
      color: '#17A2B8',
      icon: 'time-outline',
      title: 'Refund processing',
      sub: 'We are working with ZaloPay. It may take a few minutes.',
      showSupport: false,
    };
  };

  const renderCard = (item: any) => {
    const statusColor = statusColorMap[item.status as InvoiceStatus] || '#888';

    const canTrack =
      !!item.deliveryId &&
      (item.status === 'processing' || item.status === 'shipping');
    const trackLabel = item.status === 'processing' ? 'Track' : 'Driver';
    const trackBtnStyle =
      item.status === 'processing' ? styles.assignBtn : styles.shipperBtn;

    return (
      <TouchableOpacity
        key={item._id}
        style={styles.cardOrder}
        activeOpacity={0.9}
        onPress={() =>
          navigation.navigate('InvoiceDetailScreen', { invoiceId: item._id })
        }
      >
        <View style={styles.cardHeader}>
          <TextComponent
            text={`#${item._id.slice(-6)}`}
            font={appFonts.semiBold}
            size={14}
          />
          <View style={styles.headerRight}>
            <TextComponent
              text={fromNow(item.invoiceDate)}
              size={12}
              color={appColors.gray}
            />
            <Badge label={item.status.toUpperCase()} color={statusColor} />
          </View>
        </View>

        {/* middle */}
        <View style={styles.cardMiddle}>
          <ThumbStack items={item.items} />
          <View style={{ flex: 1 }}>
            <TextComponent
              text={`${item.items.length} items`}
              size={12}
              color={appColors.gray}
            />
            <TextComponent
              text={formatMoney(item.total)}
              font={appFonts.semiBold}
              size={16}
              color={appColors.orange}
              styles={{ marginTop: 2 }}
            />
          </View>
          <Ionicons name="chevron-forward" size={18} color="#B5B5B5" />
        </View>

        <View style={styles.cardFooter}>
          <TextComponent
            text={moment(item.invoiceDate).format('DD/MM/YYYY HH:mm')}
            size={12}
            color={appColors.gray}
          />
          <View style={styles.footerButtons}>
            {item.status === 'pending' && (
              <TouchableOpacity
                onPress={() => openCancelConfirm(item._id)}
                style={styles.cancelBtn}
                activeOpacity={0.85}
              >
                <TextComponent text="Cancel" size={12} color="#fff" />
              </TouchableOpacity>
            )}

            {canTrack && (
              <TouchableOpacity
                onPress={() => handlePressDeliveryTracking(item)}
                style={[styles.actionBtn, trackBtnStyle]}
                activeOpacity={0.85}
              >
                <TextComponent text={trackLabel} size={12} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Refund status box when canceled */}
        {item.status === 'canceled' &&
          (() => {
            const ui = computeRefundUI(item);
            if (!ui) return null;
            return (
              <View
                style={[
                  styles.refundBox,
                  { borderColor: ui.color, backgroundColor: `${ui.color}12` },
                ]}
              >
                <Ionicons
                  name={ui.icon as any}
                  size={18}
                  color={ui.color}
                  style={{ marginRight: 8 }}
                />
                <View style={{ flex: 1 }}>
                  <TextComponent
                    text={ui.title}
                    size={13}
                    font={appFonts.semiBold}
                    color={ui.color}
                  />
                  <TextComponent
                    text={ui.sub}
                    size={12}
                    color={appColors.gray}
                    styles={{ marginTop: 3 }}
                  />
                </View>
                {ui.showSupport && (
                  <TouchableOpacity
                    onPress={() => navigation.navigate('HelpCenterScreen')}
                    style={[styles.supportBtn, { backgroundColor: ui.color }]}
                    activeOpacity={0.85}
                  >
                    <TextComponent
                      text="Support"
                      size={12}
                      color="#fff"
                      font={appFonts.semiBold}
                    />
                  </TouchableOpacity>
                )}
              </View>
            );
          })()}
      </TouchableOpacity>
    );
  };

  const renderRatingItem = ({ item }: any) => {
    const imgSrc = item?.itemId?.image
      ? { uri: item.itemId.image }
      : require('../../../assets/images/logo.png');
    return (
      <View style={styles.cardRate}>
        <Image source={imgSrc} style={styles.rateImage} />
        <View style={styles.rateContent}>
          <TextComponent
            text={item.itemId.name || 'Unknown Item'}
            font={appFonts.semiBold}
            size={15}
            styles={{ marginBottom: 4 }}
          />
          <View style={styles.rateRow}>
            <TextComponent
              text={`Quantity: ${item.quantity}`}
              size={12}
              color={appColors.gray}
            />
          </View>
          {!!item.deliveredAt && (
            <TextComponent
              text={`Delivered: ${moment(item.deliveredAt).format(
                'DD/MM/YYYY HH:mm',
              )}`}
              size={12}
              color={appColors.gray}
              styles={{ marginTop: 2 }}
            />
          )}
          <TextComponent
            text={`Total: ${formatMoney(item.totalPrice)}`}
            size={13}
            font={appFonts.semiBold}
            color={appColors.orange}
            styles={{ marginTop: 6 }}
          />
          <ButtonComponent
            text="Rate Now"
            type="primary"
            color={appColors.orange}
            icon={<Ionicons name="star" size={18} color="#fff" />}
            iconFlex="left"
            onPress={() => navigation.navigate('ReviewFoodScreen', { item })}
            styles={styles.rateBtn}
            textStyles={{ color: '#fff', fontWeight: '600' }}
          />
        </View>
      </View>
    );
  };

  const scrollToTab = (index: number) => {
    const meta = tabLayouts[index];
    if (!meta || !tabsScrollRef.current) return;
    const centerX = Math.max(meta.x + meta.width / 2 - screenWidth / 2, 0);
    tabsScrollRef.current.scrollTo({ x: centerX, animated: true });
  };

  const onTabLayout = (index: number) => (e: any) => {
    const { x, width } = e.nativeEvent.layout;
    setTabLayouts(prev => {
      const next = [...prev];
      next[index] = { x, width };
      return next;
    });
  };

  return (
    <ContainerComponent title="Order status" back>
      <ScrollView
        ref={tabsScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsScrollContent}
        style={styles.tabsScroll}
      >
        <View style={styles.tabsRow}>
          {statuses.map((s, i) => (
            <TabButton
              key={s.key}
              label={s.label}
              active={tab === i}
              onPress={() => {
                setTab(i);
                pagerRef.current?.setPage(i);
                scrollToTab(i);
              }}
              count={
                s.key === 'Reviews'
                  ? (counts as any).Reviews
                  : (counts as any)[s.key]
              }
              onLayout={onTabLayout(i)}
            />
          ))}
        </View>
      </ScrollView>

      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageSelected={e => {
          const idx = e.nativeEvent.position;
          setTab(idx);
          scrollToTab(idx);
        }}
      >
        {statuses.map((s, i) => (
          <ScrollView
            key={s.key}
            contentContainerStyle={styles.page}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadData(true)}
              />
            }
          >
            {s.key === 'Reviews' ? (
              enrichedPendingRatings.length > 0 ? (
                <FlatList
                  data={enrichedPendingRatings}
                  keyExtractor={(it, index) => `${it.itemId._id}_${index}`}
                  renderItem={renderRatingItem}
                  scrollEnabled={false}
                  ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                />
              ) : (
                <View style={styles.emptyWrap}>
                  <Ionicons
                    name="star-outline"
                    size={26}
                    color={appColors.orange}
                  />
                  <TextComponent
                    text="Nothing to review"
                    size={15}
                    styles={{ marginTop: 8 }}
                  />
                  <TextComponent
                    text="You have no pending ratings for now."
                    size={12}
                    color={appColors.gray}
                    styles={{ marginTop: 4, textAlign: 'center' }}
                  />
                </View>
              )
            ) : filteredInvoices[i]?.length > 0 ? (
              filteredInvoices[i].map(renderCard)
            ) : (
              <View style={styles.emptyWrap}>
                <Ionicons
                  name="file-tray-outline"
                  size={26}
                  color={appColors.gray}
                />
                <TextComponent
                  text="No invoices found"
                  size={15}
                  styles={{ marginTop: 8 }}
                />
                <TextComponent
                  text="Pull to refresh or check another tab."
                  size={12}
                  color={appColors.gray}
                  styles={{ marginTop: 4 }}
                />
              </View>
            )}
          </ScrollView>
        ))}
      </PagerView>

      {/* Modal xác nhận hủy */}
      <ModalNotification
        visible={confirmVisible}
        onClose={handleConfirmNo}
        title="Confirm cancellation"
        message="Are you sure you want to cancel this invoice? This action cannot be undone."
        variant="warning"
        actions={[
          {
            label: 'No',
            style: 'secondary',
            onPress: handleConfirmNo,
          },
          {
            label: 'Yes',
            style: 'danger',
            onPress: handleConfirmYes,
          },
        ]}
        accessibilityLabel={
          pendingCancelId
            ? `Cancel invoice #${pendingCancelId.slice(-6)} confirmation`
            : 'Cancel invoice confirmation'
        }
      />

      {/* Overlay loading */}
      <LoadingModal visible={loading || busy} />
    </ContainerComponent>
  );
};

export default InvoiceScreen;

const styles = StyleSheet.create({
  tabsScroll: {
    maxHeight: 56,
  },
  tabsScrollContent: {
    paddingHorizontal: 10,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    backgroundColor: '#FFF',
  },
  tabBtnActive: {
    borderColor: appColors.orange,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  tabBtnText: {
    fontFamily: appFonts.semiBold,
    fontSize: 13,
    color: appColors.gray,
  },
  tabBtnTextActive: {
    color: appColors.orange,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#F7F7F7',
  },
  page: {
    padding: 14,
  },
  cardOrder: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  cardMiddle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
  },
  stackRow: {
    width: 120,
    height: 40,
  },
  stackThumb: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#F3F3F3',
  },
  stackMore: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: appColors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  refundBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  supportBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginLeft: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    marginTop: 12,
    paddingTop: 10,
  },
  footerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cancelBtn: {
    backgroundColor: appColors.orange,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shipperBtn: {
    backgroundColor: '#007BFF',
  },
  assignBtn: {
    backgroundColor: '#6F42C1',
  },
  cardRate: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  rateImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: '#F5F5F5',
  },
  rateContent: {
    paddingHorizontal: 2,
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rateBtn: {
    width: '100%',
    marginTop: 10,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
});
