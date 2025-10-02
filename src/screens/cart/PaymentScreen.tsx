import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import {
  View,
  Modal,
  ActivityIndicator,
  Pressable,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  InteractionManager,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  useFocusEffect,
  useRoute,
  useIsFocused,
} from '@react-navigation/native';
import { ContainerComponent, TextComponent } from '../../components';
import { appColors, appFonts } from '../../constants';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../redux/store';
import {
  addInvoiceThunk,
  updateInvoicePaymentStatusThunk,
} from '../../redux/actions/invoiceAction';
import { voucherApi } from '../../apis/voucherApi';
import { userApi } from '../../apis/userApi';
import { showError, showSuccess } from '../../utils/toastMessages';
import moment from 'moment';
import { fetchVouchersThunk } from '../../redux/actions/voucherAction';
import {
  createZaloPayIntentThunk,
  getPaymentIntentThunk,
} from '../../redux/actions/paymentIntentAction';
import {
  NonZaloPayMethod,
  PaymentMethod,
  ShippingStopRef,
} from '../../models/InvoiceModel';
import { LalamoveFeeResponse } from '../../types/lalamove';
import { calculateLalamoveFeeThunk } from '../../redux/actions/lalamoveAction';

const paymentApi = {
  createVietQR: async (payload: { amount: number; description?: string }) => {
    try {
      return {
        success: true,
        data: {
          paymentSessionId: `vietqr_${Date.now()}`,
          qrUrl: `https://img.vietqr.io/image/970422-000000000-compact.png?amount=${
            payload.amount
          }&addInfo=${encodeURIComponent(payload.description || 'Payment')}`,
        },
      };
    } catch {
      return { success: false, message: 'Failed to create VietQR' };
    }
  },
};

const MAX_DISTANCE_METERS = 10000;

type Method = 'cash' | 'qr' | 'zalopay';
const toStrictBool = (val: any) => val === true || val === 'true' || val === 1;

const getItemFlags = (item: any) => {
  const doc = item?.itemId || {};
  const status = doc?.status;
  const isDiscontinued = status === 'unavailable';

  const isFood = item?.itemType === 'Food';
  const foodQty = isFood ? Number(doc?.quantity ?? 0) : undefined;
  const isOutOfStock = isFood ? foodQty! <= 0 : false;

  const isSelectable = !isDiscontinued && (!isFood || !isOutOfStock);

  const statusLabel = isDiscontinued
    ? 'Discontinued'
    : isOutOfStock
    ? 'Out of Stock'
    : undefined;

  return { isSelectable, isDiscontinued, isOutOfStock, statusLabel };
};

const PaymentScreen = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const route = useRoute();
  const isFocused = useIsFocused();
  const { selectedItems = [] } = route.params as any;

  const [shippingFee, setShippingFee] = useState<number>(0);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [lalamoveQuotation, setLalamoveQuotation] =
    useState<LalamoveFeeResponse | null>(null);

  const [selectedMethod, setSelectedMethod] = useState<Method>('cash');
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(false);

  const [vouchers, setVouchers] = useState<any[]>([]);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);

  const [showQRModal, setShowQRModal] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [paymentSessionId, setPaymentSessionId] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const [pendingIntentId, setPendingIntentId] = useState<string | null>(null);

  const inflightRef = useRef<null | { key: string }>(null);
  const lastKeyRef = useRef<string | null>(null);
  const quoteCacheRef = useRef<
    Map<string, { fee: number; quote: LalamoveFeeResponse }>
  >(new Map());

  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);

  const tooFar = useMemo(
    () => distanceMeters != null && distanceMeters > MAX_DISTANCE_METERS,
    [distanceMeters],
  );
  const distanceKm = useMemo(
    () => (distanceMeters != null ? (distanceMeters / 1000).toFixed(1) : null),
    [distanceMeters],
  );

  const loadUserProfile = async () => {
    setLoadingUser(true);
    try {
      const res = await userApi.getProfile();
      setUser(res.data || res);
    } catch {
      showError('Failed to refresh profile.');
    } finally {
      setLoadingUser(false);
    }
  };

  const purchasableItems = useMemo(
    () => selectedItems.filter((it: any) => getItemFlags(it).isSelectable),
    [selectedItems],
  );
  const blockedItems = useMemo(
    () =>
      selectedItems
        .filter((it: any) => !getItemFlags(it).isSelectable)
        .map((it: any) => ({
          id: it?._id,
          name: it?.itemId?.name || 'Unknown',
          reason: getItemFlags(it).statusLabel || 'Unavailable',
        })),
    [selectedItems],
  );

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      let timer: any = null;

      loadUserProfile();

      if (!pendingIntentId) return () => {};

      const pollOnce = async () => {
        try {
          const res = await dispatch(
            getPaymentIntentThunk(pendingIntentId),
          ).unwrap();
          if (!isActive) return;

          if (res.status === 'succeeded' && res.invoiceId) {
            showSuccess('Payment successful.');
            setPendingIntentId(null);
            await dispatch(fetchVouchersThunk());
            navigation.replace('CompletionScreen', {
              invoiceId: res.invoiceId,
            });
            return;
          }

          if (res.status === 'canceled' || res.status === 'expired') {
            showError(
              res.status === 'canceled'
                ? 'Payment canceled.'
                : 'Payment expired.',
            );
            setPendingIntentId(null);
            return;
          }

          timer = setTimeout(pollOnce, 2000);
        } catch (_) {
          if (!isActive) return;
          timer = setTimeout(pollOnce, 2000);
        }
      };

      pollOnce();

      return () => {
        isActive = false;
        if (timer) clearTimeout(timer);
      };
    }, [pendingIntentId, dispatch, navigation]),
  );

  const totalProduct = useMemo(() => {
    return purchasableItems.reduce((sum: number, item: any) => {
      const price = item.foodSizeId?.price ?? item.itemId?.price ?? 0;
      return sum + price * item.quantity;
    }, 0);
  }, [purchasableItems]);

  const calcVoucherDiscount = (
    voucher: any | null | undefined,
    subtotal: number,
  ) => {
    if (!voucher) return { discount: 0, cappedBy: null as number | null };

    const dv = Number(voucher.discountValue ?? 0);
    const cap =
      voucher.discountMaxValue === null ||
      voucher.discountMaxValue === undefined
        ? null
        : Number(voucher.discountMaxValue);

    let raw = 0;
    if (voucher.type === 'percentage') raw = (subtotal * dv) / 100;
    else if (
      voucher.type === 'fixed' ||
      voucher.type === 'special' ||
      voucher.type === 'firstOrder'
    )
      raw = dv;
    else if (voucher.type === 'freeShipping') raw = 0;

    const withCap = cap != null ? Math.min(raw, cap) : raw;
    const discount = Math.min(Math.max(0, Math.floor(withCap)), subtotal);

    return { discount, cappedBy: cap };
  };

  const { discount: discountAmount } = useMemo(() => {
    return calcVoucherDiscount(selectedVoucher, totalProduct);
  }, [selectedVoucher, totalProduct]);

  const defaultAddr =
    user?.addresses?.find((a: any) => a.isDefault) || user?.addresses?.[0];

  const shippingFeeEffective = useMemo(() => {
    return selectedVoucher?.type === 'freeShipping'
      ? 0
      : Number(shippingFee) || 0;
  }, [selectedVoucher, shippingFee]);

  const totalPrice = useMemo(() => {
    const productCost = Math.max(0, totalProduct - discountAmount);
    return productCost + shippingFeeEffective;
  }, [totalProduct, discountAmount, shippingFeeEffective]);

  const quotationId =
    (lalamoveQuotation as any)?.quotationId ||
    (lalamoveQuotation as any)?.data?.quotationId ||
    null;

  const shippingStops = useMemo(
    () =>
      (lalamoveQuotation?.stops || [])
        .map(s => ({ stopId: s.stopId }))
        .filter(s => !!s.stopId),
    [lalamoveQuotation],
  );

  const shippingReady = useMemo(() => {
    if (isCalculatingShipping) return false;
    if (!user || !defaultAddr) return false;
    if (!quotationId || shippingStops.length < 2) return false;
    if (selectedVoucher?.type === 'freeShipping') return true;
    return Number(shippingFee) > 0;
  }, [
    isCalculatingShipping,
    user,
    defaultAddr,
    selectedVoucher,
    shippingFee,
    quotationId,
    shippingStops,
  ]);

  const hasPhone = useMemo(() => {
    const p = user?.phoneNumber;
    return typeof p === 'string' ? p.trim().length > 0 : !!p;
  }, [user]);

  const shippingKey = useMemo(() => {
    if (!defaultAddr) return null;
    const n = purchasableItems.length;
    return `${defaultAddr.addressDetail}|${defaultAddr.latitude},${defaultAddr.longitude}|${n}`;
  }, [
    defaultAddr?.addressDetail,
    defaultAddr?.latitude,
    defaultAddr?.longitude,
    purchasableItems.length,
  ]);

  useEffect(() => {
    if (!isFocused) return;
    if (!defaultAddr || purchasableItems.length === 0 || !shippingKey) return;

    const cached = quoteCacheRef.current.get(shippingKey);
    if (cached) {
      setLalamoveQuotation(cached.quote);
      setShippingFee(cached.fee);
      const cachedDist = Number((cached.quote as any)?.distance?.value);
      setDistanceMeters(Number.isFinite(cachedDist) ? cachedDist : null);
      return;
    }

    if (inflightRef.current?.key === shippingKey) return;

    inflightRef.current = { key: shippingKey };
    setIsCalculatingShipping(true);

    const task = InteractionManager.runAfterInteractions(() => {
      dispatch(
        calculateLalamoveFeeThunk({
          address: defaultAddr.addressDetail,
          lat: defaultAddr.latitude,
          lng: defaultAddr.longitude,
          quantity: purchasableItems.length,
        }),
      )
        .unwrap()
        .then(q => {
          const pb: any = q?.priceBreakdown ?? {};
          const totalStr =
            pb.total ??
            pb.totalExcludePriorityFee ??
            pb.totalBeforeOptimization ??
            pb.base ??
            '0';
          const fee = Number(totalStr) || 0;

          const dist = Number((q as any)?.distance?.value);
          setDistanceMeters(Number.isFinite(dist) ? dist : null);

          quoteCacheRef.current.set(shippingKey, { fee, quote: q });

          setLalamoveQuotation(q);
          setShippingFee(fee);
          lastKeyRef.current = shippingKey;
        })
        .catch(err => {
          if (!quoteCacheRef.current.size) {
            setShippingFee(0);
            setLalamoveQuotation(null);
            setDistanceMeters(null);
          }
          showError(err?.message || 'No shipping charges can be charged.');
        })
        .finally(() => {
          setIsCalculatingShipping(false);
          inflightRef.current = null;
        });
    });

    return () => {
      task?.cancel?.();
    };
  }, [isFocused, defaultAddr, purchasableItems.length, shippingKey, dispatch]);

  useEffect(() => {
    if (!selectedItems || selectedItems.length === 0) {
      showError('Your cart is empty.');
      navigation.goBack();
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoadingUser(true);
      try {
        const res = await userApi.getProfile();
        const profile = res.data || res;
        setUser(profile);

        if (!profile?.addresses || profile.addresses.length === 0) {
          showError('Please add a delivery address before checkout.');
        }
        if (
          !profile?.phoneNumber ||
          String(profile.phoneNumber).trim() === ''
        ) {
          showError('Please add a phone number before checkout.');
        }
      } catch {
        showError('Failed to load user profile.');
      } finally {
        setLoadingUser(false);
      }
    })();

    (async () => {
      try {
        const res = await voucherApi.getVouchers();
        if (res.success) setVouchers(res.data || []);
        else throw new Error(res.message || 'Failed to load vouchers');
      } catch {
        showError('Failed to load vouchers.');
      }
    })();
  }, []);

  const handleApplyVoucher = useCallback(() => {
    if (!selectedVoucher) {
      showError('Please select a voucher to apply.');
      return;
    }
    showSuccess(`Voucher ${selectedVoucher.title} selected successfully.`);
    setShowVoucherModal(false);
  }, [selectedVoucher]);

  const createInvoiceNow = useCallback(
    async (extra: {
      paymentMethod: NonZaloPayMethod;
      paymentRef?: string | null;
      shippingFee: number;
      shippingQuotationId: string;
      shippingStops: ShippingStopRef[];
    }) => {
      const cartIds: string[] = purchasableItems.map((item: any) => item._id);
      const payload = {
        cartIds,
        paymentMethod: extra.paymentMethod as PaymentMethod,
        ...(selectedVoucher?._id ? { voucherId: selectedVoucher._id } : {}),
        paymentRef: extra.paymentRef ?? null,
        shippingFee: extra.shippingFee,
        shippingQuotationId: extra.shippingQuotationId,
        shippingStops: extra.shippingStops,
      };

      const result = await dispatch(addInvoiceThunk(payload as any)).unwrap();
      if (!result || !result.invoice)
        throw new Error('Invoice not returned from server.');
      return result.invoice;
    },
    [dispatch, purchasableItems, selectedVoucher],
  );

  const handleCheckout = useCallback(async () => {
    try {
      if (creating) return;
      setCreating(true);

      if (!hasPhone) {
        showError('Please add a phone number before checkout.');
        return;
      }

      if (purchasableItems.length === 0) {
        showError('Selected items are unavailable. Please modify your cart.');
        return;
      }

      if (!shippingReady) {
        showError(
          !quotationId || shippingStops.length < 2
            ? 'Delivery is not ready. Please wait for quotation to be prepared.'
            : 'Calculating shipping fee, please wait a moment.',
        );
        return;
      }

      if (tooFar) {
        showError(
          distanceKm
            ? `Your address is too far away (${distanceKm} km > ${(
                MAX_DISTANCE_METERS / 1000
              ).toFixed(0)} km). Please select a closer location.`
            : `Your address exceeds the maximum allowed distance..`,
        );
        return;
      }

      const finalAmount = Math.max(0, Number(totalPrice));

      if (selectedVoucher) {
        const voucherRes =
          (await voucherApi
            .applyVoucher({
              idVoucher: selectedVoucher._id,
              totalOrderAmount: totalProduct,
              validateOnly: true,
            })
            .catch(() => null)) ||
          (await voucherApi.applyVoucher({
            idVoucher: selectedVoucher._id,
            totalOrderAmount: totalProduct,
          }));

        if (!voucherRes?.success) {
          showError(voucherRes?.message || 'Failed to apply voucher.');
          return;
        }
      }

      if (selectedMethod === 'cash') {
        const invoice = await createInvoiceNow({
          paymentMethod: 'COD',
          shippingFee: shippingFeeEffective,
          shippingQuotationId: quotationId || undefined,
          shippingStops,
        });
        await dispatch(fetchVouchersThunk());
        showSuccess('Order placed successfully.');
        navigation.navigate('CompletionScreen', { invoiceData: invoice });
        return;
      }

      if (selectedMethod === 'zalopay') {
        const cartIds: string[] = purchasableItems.map((item: any) => item._id);
        const intent = await dispatch(
          createZaloPayIntentThunk({
            amount: finalAmount,
            description: 'Single payment item',
            cartIds,
            voucherId: selectedVoucher?._id,
            note: '',
            shippingFee: shippingFeeEffective,
            shippingQuotationId: quotationId || undefined,
            shippingStops,
          } as any),
        ).unwrap();

        if (!intent?.orderUrl && !intent?.deeplink) {
          showError('Cannot get ZaloPay link.');
          return;
        }

        setPendingIntentId(intent.intentId);

        const url = intent.deeplink || intent.orderUrl!;
        navigation.navigate('ZaloPayWebView', {
          url,
          intentId: intent.intentId,
          paymentMethod: 'ZaloPay',
        });
        return;
      }

      if (selectedMethod === 'qr') {
        const invoiceAmount = Math.max(0, Number(finalAmount));
        const qrRes = await paymentApi.createVietQR({
          amount: invoiceAmount,
          description: 'Single payment item',
        });

        if (!qrRes?.success || !qrRes?.data?.qrUrl) {
          showError(qrRes?.message || 'Failed to create VietQR.');
          return;
        }

        setQrUrl(qrRes.data.qrUrl);
        setPaymentSessionId(qrRes.data.paymentSessionId);
        setShowQRModal(true);
        return;
      }
    } catch (error: any) {
      showError(
        typeof error === 'string'
          ? error
          : error?.message || 'Failed to place order.',
      );
    } finally {
      setCreating(false);
    }
  }, [
    creating,
    hasPhone,
    selectedMethod,
    totalProduct,
    totalPrice,
    purchasableItems,
    selectedVoucher,
    dispatch,
    navigation,
    createInvoiceNow,
    shippingFeeEffective,
    shippingReady,
    quotationId,
    shippingStops,
    tooFar,
    distanceKm,
  ]);

  const handleCheckPaid = useCallback(async () => {
    if (!paymentSessionId || isVerifying) return;
    try {
      if (!shippingReady) {
        showError('Delivery is not ready yet. Please wait a moment.');
        return;
      }

      if (purchasableItems.length === 0) {
        showError('Selected items are unavailable. Please modify your cart.');
        return;
      }

      if (tooFar) {
        showError(
          distanceKm
            ? `Your address is too far away (${distanceKm} km > ${(
                MAX_DISTANCE_METERS / 1000
              ).toFixed(0)} km).`
            : `Your address exceeds the maximum allowed distance..`,
        );
        return;
      }

      setIsVerifying(true);
      const invoice = await createInvoiceNow({
        paymentMethod: 'QRPay',
        paymentRef: paymentSessionId,
        shippingFee: shippingFeeEffective,
        shippingQuotationId: quotationId || undefined,
        shippingStops,
      });
      const updated = await dispatch(
        updateInvoicePaymentStatusThunk(invoice._id),
      ).unwrap();

      await dispatch(fetchVouchersThunk());
      setShowQRModal(false);
      setPaymentSessionId(null);
      showSuccess('Payment verified successfully.');
      navigation.navigate('CompletionScreen', {
        invoiceData: updated || invoice,
      });
    } catch (err: any) {
      showError(
        typeof err === 'string'
          ? err
          : err?.message || 'Failed to verify payment.',
      );
    } finally {
      setIsVerifying(false);
    }
  }, [
    paymentSessionId,
    isVerifying,
    dispatch,
    navigation,
    createInvoiceNow,
    shippingFeeEffective,
    quotationId,
    shippingStops,
    shippingReady,
    purchasableItems,
    tooFar,
    distanceKm,
  ]);

  const handleDismissQR = useCallback(() => {
    if (isVerifying) return;
    setShowQRModal(false);
    setPaymentSessionId(null);
    setQrUrl(null);
  }, [isVerifying]);

  const filteredVouchers = useMemo(() => {
    return vouchers.filter(v => {
      const isNotExpired = moment(v.expirationDate).isSameOrAfter(
        moment(),
        'day',
      );

      const userIsLoyal =
        user?.isLoyalCustomer === true || toStrictBool(user?.isLoyalCustomer);
      const voucherIsLoyalOnly =
        v.isForLoyalCustomer === true || toStrictBool(v.isForLoyalCustomer);
      const passesLoyalGate = voucherIsLoyalOnly ? userIsLoyal : true;

      const hasRemainingUsage =
        v.remainingUsage == null || v.remainingUsage > 0;

      return isNotExpired && passesLoyalGate && hasRemainingUsage;
    });
  }, [vouchers, user]);

  const renderCartItem = (item: any, i: number) => {
    const flags = getItemFlags(item);
    const name = item.itemId?.name || 'Unknown';
    const sizeName =
      item.itemType === 'Food'
        ? item.foodSizeId?.sizeId?.name ?? 'Default'
        : 'Combo';
    const unitPrice = item.foodSizeId?.price ?? item.itemId?.price ?? 0;
    const total = unitPrice * item.quantity;

    return (
      <View
        key={i}
        style={[
          styles.cartCard,
          !flags.isSelectable && { opacity: 0.55, borderColor: '#F2C7C7' },
        ]}
      >
        <Image
          source={
            item.itemId?.image
              ? { uri: item.itemId.image }
              : require('../../assets/images/logo.png')
          }
          style={styles.itemImage}
        />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextComponent
              text={name}
              size={14}
              font={appFonts.semiBold}
              color={appColors.text}
            />
            {!flags.isSelectable && (
              <View
                style={{
                  marginLeft: 8,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 999,
                  backgroundColor: '#FFF0F0',
                  borderWidth: 1,
                  borderColor: '#FFD6D6',
                }}
              >
                <TextComponent
                  text={flags.statusLabel || 'Unavailable'}
                  size={11}
                  color="#B00020"
                  font={appFonts.semiBold}
                />
              </View>
            )}
          </View>

          <TextComponent
            text={`(${sizeName}) • ${item.quantity} items`}
            size={12}
            color="#7A7A7A"
            styles={{ marginTop: 2 }}
          />
          {!!item.note && (
            <TextComponent
              text={`Note: ${item.note}`}
              size={12}
              color="#666"
              styles={{ marginTop: 4, fontStyle: 'italic' }}
            />
          )}
        </View>
        <TextComponent
          text={`${total.toLocaleString()} VND`}
          size={13}
          color={appColors.orange}
          font={appFonts.semiBold}
        />
      </View>
    );
  };

  return (
    <ContainerComponent back title="Payment">
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {blockedItems.length > 0 && (
          <View
            style={{
              backgroundColor: '#FFF8F8',
              borderColor: '#FFD6D6',
              borderWidth: 1,
              borderRadius: 12,
              padding: 12,
              marginBottom: 12,
            }}
          >
            <TextComponent
              text="Some items are not available and will be excluded from checkout:"
              size={12}
              color="#B00020"
              font={appFonts.semiBold}
            />
            {blockedItems
              .slice(0, 4)
              .map(
                (b: {
                  id: React.Key | null | undefined;
                  name: any;
                  reason: any;
                }) => (
                  <TextComponent
                    key={b.id}
                    text={`• ${b.name} — ${b.reason}`}
                    size={12}
                    color="#B00020"
                    styles={{ marginTop: 4 }}
                  />
                ),
              )}
            {blockedItems.length > 4 && (
              <TextComponent
                text={`…and ${blockedItems.length - 4} more`}
                size={12}
                color="#B00020"
                styles={{ marginTop: 4 }}
              />
            )}
          </View>
        )}

        <View style={styles.card}>
          <TouchableOpacity
            style={styles.headerNav}
            onPress={() => navigation.navigate('AddressScreen')}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <TextComponent
              text="Delivery Address"
              size={14}
              font={appFonts.semiBold}
            />
            <Ionicons name="chevron-forward" size={18} color="#888" />
          </TouchableOpacity>

          {loadingUser ? (
            <ActivityIndicator color={appColors.orange} />
          ) : (
            <View style={{ gap: 4 }}>
              <View style={styles.addrRow}>
                <Ionicons name="location-outline" size={16} color="#666" />
                <TextComponent
                  text={`${user?.fullName || ''}${
                    defaultAddr?.label ? `  •  ${defaultAddr.label}` : ''
                  }`}
                  size={13}
                  color={appColors.text}
                  font={appFonts.semiBold}
                />
              </View>
              <View style={styles.addrRow}>
                <Ionicons name="home-outline" size={16} color="#666" />
                <TextComponent
                  text={defaultAddr?.addressDetail || 'No default address'}
                  size={13}
                  color="#666"
                />
              </View>
              <TouchableOpacity
                style={styles.addrRowNav}
                onPress={() => navigation.navigate('PersonalDataScreen')}
                activeOpacity={0.8}
              >
                <View style={styles.addrRow}>
                  <Ionicons name="call-outline" size={16} color="#666" />
                  <TextComponent
                    text={user?.phoneNumber || '-'}
                    size={13}
                    color="#666"
                  />
                </View>
                <Ionicons name="chevron-forward" size={18} color="#888" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Banner cảnh báo khoảng cách */}
        {tooFar && (
          <View
            style={{
              backgroundColor: '#FFF8F8',
              borderColor: '#FFD6D6',
              borderWidth: 1,
              borderRadius: 12,
              padding: 12,
              marginBottom: 12,
            }}
          >
            <TextComponent
              text={
                distanceKm
                  ? `The delivery distance is currently ${distanceKm} km, exceeding the limit ${(
                      MAX_DISTANCE_METERS / 1000
                    ).toFixed(0)} km.`
                  : `Delivery distance exceeds allowable limit.`
              }
              size={12}
              color="#B00020"
              font={appFonts.semiBold}
            />
          </View>
        )}

        {/* Voucher Selector */}
        <View style={[styles.card, styles.voucherCard]}>
          <TouchableOpacity
            style={styles.voucherLeft}
            onPress={() => setShowVoucherModal(true)}
            activeOpacity={0.9}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="pricetags-outline"
              size={18}
              color={appColors.orange}
            />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <TextComponent
                text="Voucher"
                size={13}
                font={appFonts.semiBold}
                color={appColors.text}
              />
              <TextComponent
                text={
                  selectedVoucher
                    ? `${selectedVoucher.title}`
                    : 'Not applicable — tap to select'
                }
                size={12}
                color="#666"
              />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <TextComponent
            text="Items Ordered"
            size={14}
            font={appFonts.semiBold}
          />
          <View style={{ height: 8 }} />
          {selectedItems.map(renderCartItem)}
        </View>

        <View style={styles.card}>
          <TextComponent
            text="Order Summary"
            size={14}
            font={appFonts.semiBold}
          />
          <View style={styles.summaryRow}>
            <TextComponent text="Products" size={13} color="#666" />
            <TextComponent
              text={`${totalProduct.toLocaleString()} VND`}
              size={13}
              color="#222"
            />
          </View>
          <View style={styles.summaryRow}>
            <TextComponent text="Discount" size={13} color="#666" />
            <TextComponent
              text={`- ${discountAmount.toLocaleString()} VND`}
              size={13}
              color="#222"
            />
          </View>

          <View style={styles.summaryRow}>
            <TextComponent text="Shipping Fee" size={13} color="#666" />
            {isCalculatingShipping && !shippingFee ? (
              <ActivityIndicator size="small" color={appColors.orange} />
            ) : (
              <TextComponent
                text={`${(shippingFeeEffective ?? 0).toLocaleString()} VND`}
                size={13}
                color="#222"
              />
            )}
          </View>

          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <TextComponent text="Total" size={14} font={appFonts.semiBold} />
            <TextComponent
              text={`${Math.max(0, totalPrice).toLocaleString()} VND`}
              size={14}
              color={appColors.orange}
              font={appFonts.semiBold}
            />
          </View>

          {selectedVoucher?.type === 'percentage' &&
            selectedVoucher?.discountMaxValue != null && (
              <TextComponent
                text={`* Discount capped at ${Number(
                  selectedVoucher.discountMaxValue,
                ).toLocaleString()} VND`}
                size={12}
                color="#888"
                styles={{ marginTop: 6 }}
              />
            )}

          {selectedVoucher?.type === 'freeShipping' && (
            <TextComponent
              text="* Free Shipping applied."
              size={12}
              color="#888"
              styles={{ marginTop: 6 }}
            />
          )}
        </View>

        <View style={styles.card}>
          <TextComponent
            text="Payment Method"
            size={14}
            font={appFonts.semiBold}
          />
          {[
            { key: 'cash', label: 'Pay with Cash (COD)', icon: 'cash' },
            // { key: 'qr', label: 'VietQR', icon: 'qr-code' },
            { key: 'zalopay', label: 'ZaloPay', icon: null as any },
          ].map(m => {
            const sel = selectedMethod === (m.key as Method);
            return (
              <TouchableOpacity
                key={m.key}
                style={[styles.methodItem, sel && styles.methodItemSelected]}
                onPress={() => setSelectedMethod(m.key as Method)}
                activeOpacity={0.9}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {m.key === 'zalopay' ? (
                    <Image
                      source={require('../../assets/images/zalopay.webp')}
                      style={{ width: 24, height: 24 }}
                    />
                  ) : (
                    <Ionicons
                      name={m.icon as any}
                      size={20}
                      color={appColors.cash}
                    />
                  )}
                  <TextComponent
                    text={m.label}
                    size={13}
                    color={sel ? appColors.orange : appColors.text}
                    font={sel ? appFonts.semiBold : appFonts.regular}
                    styles={{ marginLeft: 8 }}
                  />
                </View>
                {sel && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={appColors.orange}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      <View style={styles.footer}>
        <View style={{ flex: 1 }}>
          <TextComponent text="Total" size={12} color="#777" />
          <TextComponent
            text={`${Math.max(0, totalPrice).toLocaleString()} VND`}
            size={16}
            color={appColors.orange}
            font={appFonts.semiBold}
          />
        </View>
        <TouchableOpacity
          style={[
            styles.payBtn,
            (creating ||
              !shippingReady ||
              purchasableItems.length === 0 ||
              tooFar) && {
              opacity: 0.6,
            },
          ]}
          onPress={handleCheckout}
          disabled={
            creating ||
            !shippingReady ||
            purchasableItems.length === 0 ||
            tooFar
          }
          activeOpacity={0.9}
        >
          <TextComponent
            text={
              creating
                ? 'Processing...'
                : purchasableItems.length === 0
                ? 'Unavailable items'
                : !shippingReady
                ? 'Preparing delivery...'
                : tooFar
                ? 'Address too far'
                : 'Checkout Now'
            }
            size={14}
            color="#FFF"
            font={appFonts.semiBold}
          />
        </TouchableOpacity>
      </View>

      {/* Voucher Modal */}
      <Modal visible={showVoucherModal} transparent animationType="slide">
        <Pressable
          style={styles.overlay}
          onPress={() => setShowVoucherModal(false)}
        />
        <View style={styles.voucherModal}>
          <View style={styles.sheetHandle} />
          <TextComponent text="Voucher Selection" styles={styles.modalTitle} />
          <FlatList
            data={filteredVouchers}
            keyExtractor={v => v._id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const sel = selectedVoucher?._id === item._id;
              const voucherImage =
                item.type === 'freeShipping'
                  ? require('../../assets/images/logoVoucher2.png')
                  : require('../../assets/images/logoVoucher1.png');

              const discountLabel =
                item.type === 'percentage'
                  ? (() => {
                      const cap =
                        item.discountMaxValue == null
                          ? ''
                          : ` • max ${Number(
                              item.discountMaxValue,
                            ).toLocaleString()} VND`;
                      return `Discount ${Number(
                        item.discountValue ?? 0,
                      )}%${cap}`;
                    })()
                  : item.type === 'fixed'
                  ? `Discount ₫${Number(
                      item.discountValue ?? 0,
                    ).toLocaleString()}`
                  : item.type === 'freeShipping'
                  ? 'Free Shipping'
                  : item.type === 'firstOrder'
                  ? 'First Order Offer'
                  : 'Special Offer';

              return (
                <TouchableOpacity
                  style={[
                    styles.voucherItem,
                    sel && styles.voucherItemSelected,
                  ]}
                  onPress={() =>
                    sel ? setSelectedVoucher(null) : setSelectedVoucher(item)
                  }
                  activeOpacity={0.9}
                >
                  <View style={styles.voucherTop}>
                    <Image source={voucherImage} style={styles.voucherImage} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <TextComponent
                        text={discountLabel}
                        styles={styles.voucherTitle}
                      />
                      <TextComponent
                        text={item.title}
                        styles={styles.voucherSubtitle}
                      />
                    </View>
                    {sel && (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={appColors.orange}
                      />
                    )}
                  </View>

                  <View style={styles.voucherDetails}>
                    {item.minimumOrderValue != null && (
                      <TextComponent
                        text={`• Min Order: ${item.minimumOrderValue.toLocaleString()} VND`}
                        styles={styles.voucherDetailText}
                      />
                    )}
                    {item.maxOrderValue != null && (
                      <TextComponent
                        text={`• Max Order: ${item.maxOrderValue.toLocaleString()} VND`}
                        styles={styles.voucherDetailText}
                      />
                    )}
                    {item.type === 'percentage' &&
                      item.discountMaxValue != null && (
                        <TextComponent
                          text={`• Max Discount: ${Number(
                            item.discountMaxValue,
                          ).toLocaleString()} VND`}
                          styles={styles.voucherDetailText}
                        />
                      )}
                    <TextComponent
                      text={`• Expiry: ${moment(item.expirationDate).format(
                        'DD/MM/YYYY',
                      )}`}
                      styles={styles.voucherDetailText}
                    />
                    <TextComponent
                      text={`• Usage: ${
                        item.remainingUsage != null
                          ? `${item.remainingUsage} remaining`
                          : 'Unlimited'
                      }`}
                      styles={styles.voucherDetailText}
                    />
                  </View>
                </TouchableOpacity>
              );
            }}
          />
          <TouchableOpacity
            style={styles.applyButton}
            onPress={handleApplyVoucher}
            activeOpacity={0.9}
          >
            <TextComponent
              text="Apply Voucher"
              styles={styles.applyButtonText}
            />
          </TouchableOpacity>
        </View>
      </Modal>

      {/* VietQR Modal */}
      <Modal
        visible={showQRModal}
        transparent
        animationType="slide"
        onRequestClose={handleDismissQR}
      >
        <Pressable style={styles.overlay} onPress={handleDismissQR} />
        <View style={styles.qrModal}>
          <View style={styles.sheetHandle} />
          <TextComponent text="Scan QR to Pay" styles={styles.modalTitle} />
          {qrUrl ? (
            <Image source={{ uri: qrUrl }} style={styles.qrImage} />
          ) : (
            <ActivityIndicator size="large" color={appColors.orange} />
          )}
          <TextComponent
            text={`Total: ${Math.max(0, totalPrice).toLocaleString()} VND`}
            styles={styles.totalText}
          />
          <TouchableOpacity
            style={[
              styles.paidButton,
              (isVerifying || !qrUrl) && { opacity: 0.6 },
            ]}
            onPress={handleCheckPaid}
            activeOpacity={0.9}
            disabled={isVerifying || !qrUrl}
          >
            <TextComponent
              text={isVerifying ? 'Verifying...' : 'I’ve Paid'}
              styles={styles.paidButtonText}
            />
          </TouchableOpacity>
        </View>
      </Modal>
    </ContainerComponent>
  );
};

export default PaymentScreen;

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 0 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingVertical: 2,
  },
  addrRowNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  addrRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  voucherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderStyle: 'dashed',
    borderColor: '#FFD9B8',
    backgroundColor: '#FFF7EE',
  },
  voucherLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  cartCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F1F1',
    backgroundColor: '#FFF',
    marginBottom: 8,
  },
  itemImage: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
  },
  summaryRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 10 },
  methodItem: {
    marginTop: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 69,
  },
  methodItemSelected: {
    borderColor: appColors.orange,
    backgroundColor: '#FFF8F0',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderColor: '#EEE',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  payBtn: {
    backgroundColor: appColors.orange,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheetHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E3E3E3',
    alignSelf: 'center',
    marginBottom: 10,
  },
  voucherModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    padding: 16,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    maxHeight: '70%',
  },
  modalTitle: { fontSize: 16, fontFamily: appFonts.semiBold, marginBottom: 8 },
  voucherItem: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  voucherItemSelected: {
    borderColor: appColors.orange,
    backgroundColor: '#FFF7F0',
  },
  voucherTop: { flexDirection: 'row', alignItems: 'center' },
  voucherImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    resizeMode: 'contain',
  },
  voucherTitle: {
    fontSize: 14,
    color: appColors.orange,
    fontFamily: appFonts.semiBold,
  },
  voucherSubtitle: { fontSize: 12, color: '#444' },
  voucherDetails: { marginTop: 6, paddingLeft: 52 },
  voucherDetailText: { fontSize: 12, color: '#666', marginTop: 2 },
  applyButton: {
    backgroundColor: appColors.orange,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  applyButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: appFonts.semiBold,
  },
  qrModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    padding: 20,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    alignItems: 'center',
  },
  qrImage: { width: 220, height: 220, marginVertical: 12 },
  totalText: {
    fontFamily: appFonts.semiBold,
    fontSize: 16,
    color: appColors.text,
    marginVertical: 6,
  },
  paidButton: {
    backgroundColor: appColors.orange,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginTop: 6,
  },
  paidButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: appFonts.semiBold,
  },
});