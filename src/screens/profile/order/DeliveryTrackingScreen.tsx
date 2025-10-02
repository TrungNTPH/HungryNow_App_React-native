import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
  Text,
  Animated,
  Easing,
  ImageSourcePropType,
  Image,
} from 'react-native';
import WebView from 'react-native-webview';
import { RouteProp, useFocusEffect } from '@react-navigation/native';

import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { RootStackParamList } from '../../../types/navigation';

import {
  getLalamoveDriverLocationThunk,
  getLalamoveOrderDetailThunk,
} from '../../../redux/actions/lalamoveAction';

import {
  lalamoveDriverShareLinkSelector,
  lalamoveLoadingSelector,
  lalamoveErrorSelector,
  clearLalamoveMessages,
  clearDriverShareLink,
  lalamoveOrderDetailSelector,
} from '../../../redux/reducer/lalamoveReducer';
import { ContainerComponent } from '../../../components';

const DRIVER_NAMES = [
  'Vũ Xuân Trường',
  'Nguyễn Thành Trung',
  'Phạm Trọng Nam',
  'Nguyễn Văn Trung',
  'Trần Nam Thắng',
];

const DRIVER_IMAGES: ImageSourcePropType[] = [
  require('../../../assets/images/shipper.jpg'),
  require('../../../assets/images/shipper2.png'),
  require('../../../assets/images/shipper3.png'),
  require('../../../assets/images/shipper4.png'),
  require('../../../assets/images/shipper5.png'),
];

type DeliveryTrackingScreenRouteProp = RouteProp<
  RootStackParamList,
  'DeliveryTrackingScreen'
>;

interface Props {
  route: DeliveryTrackingScreenRouteProp;
}

const POLL_MS = 7000;

const deepGet = (obj: any, key: string) =>
  obj?.[key] ?? obj?.data?.[key] ?? obj?.data?.data?.[key];

const normStatus = (s?: string) => {
  const u = String(s || '')
    .toUpperCase()
    .trim();
  if (u.startsWith('ASSIGN')) return 'ASSIGNING';
  if (u === 'ONGOING' || u === 'ON_GOING') return 'ON_GOING';
  if (
    u === 'PICKED_UP' ||
    u === 'PICKUP' ||
    u === 'PICK_UP' ||
    u === 'PICKEDUP' ||
    /PICK(?:ING)?(?:ED)?[ _-]?UP/.test(u)
  ) {
    return 'PICKED_UP';
  }
  if (u === 'COMPLETED' || u === 'DELIVERED') return 'COMPLETED';
  if (u === 'CANCELED' || u === 'CANCELLED') return 'CANCELED';
  return u;
};

const LoadingDots = () => {
  const a1 = useRef(new Animated.Value(0)).current;
  const a2 = useRef(new Animated.Value(0)).current;
  const a3 = useRef(new Animated.Value(0)).current;

  const pulse = (av: Animated.Value, delay = 0) =>
    Animated.loop(
      Animated.sequence([
        Animated.timing(av, {
          toValue: 1,
          duration: 380,
          delay,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
        Animated.timing(av, {
          toValue: 0,
          duration: 380,
          useNativeDriver: true,
          easing: Easing.in(Easing.quad),
        }),
      ]),
    ).start();

  useEffect(() => {
    pulse(a1, 0);
    pulse(a2, 120);
    pulse(a3, 240);
  }, []);

  const dotStyle = (av: Animated.Value) => ({
    transform: [
      {
        translateY: av.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -3],
        }),
      },
    ],
    opacity: av.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
  });

  return (
    <View style={styles.dotRow}>
      <Animated.View style={[styles.dot, dotStyle(a1)]} />
      <Animated.View style={[styles.dot, dotStyle(a2)]} />
      <Animated.View style={[styles.dot, dotStyle(a3)]} />
    </View>
  );
};

const FakeFindingDriver = ({
  subtitle = 'Connecting drivers near you…',
}: {
  subtitle?: string;
}) => {
  const [idx, setIdx] = useState(0);
  const scanX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = setInterval(
      () => setIdx(i => (i + 1) % DRIVER_NAMES.length),
      1200,
    );
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(scanX, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scanX, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [scanX]);

  const translateX = scanX.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 82],
  });

  return (
    <View style={styles.searchRow}>
      <View style={styles.fakeWrap}>
        <View style={styles.fakeRect}>
          <Image
            source={DRIVER_IMAGES[idx]}
            resizeMode="cover"
            style={styles.fakeAvatar}
          />
          <Animated.View
            style={[styles.scanBar, { transform: [{ translateX }] }]}
          />
        </View>
        <Text style={styles.fakeName}>{DRIVER_NAMES[idx]}</Text>
      </View>

      <View style={styles.searchRight}>
        <Text style={styles.searchTitle}>Looking for a nearby driver</Text>
        <Text style={styles.searchSub}>{subtitle}</Text>
        <LoadingDots />
      </View>
    </View>
  );
};

const IndeterminateBar = () => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 1400,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    ).start();
  }, [anim]);
  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 260],
  });
  return (
    <View style={styles.progressTrack}>
      <Animated.View
        style={[styles.progressRunner, { transform: [{ translateX }] }]}
      />
    </View>
  );
};

const MapSkeleton = () => {
  const scale1 = useRef(new Animated.Value(0)).current;
  const scale2 = useRef(new Animated.Value(0)).current;
  const scale3 = useRef(new Animated.Value(0)).current;

  const mk = (v: Animated.Value, delay: number) =>
    Animated.loop(
      Animated.sequence([
        Animated.timing(v, {
          toValue: 1,
          duration: 1600,
          delay,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
        Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    ).start();

  useEffect(() => {
    mk(scale1, 0);
    mk(scale2, 400);
    mk(scale3, 800);
  }, [scale1, scale2, scale3]);

  const ringStyle = (av: Animated.Value) => ({
    transform: [
      {
        scale: av.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.6] }),
      },
    ],
    opacity: av.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] }),
  });

  return (
    <View style={styles.mapSkeleton}>
      <View style={styles.mapRoadV} />
      <View style={[styles.mapRoadV, { left: '24%' }]} />
      <View style={[styles.mapRoadV, { left: '68%' }]} />
      <View style={styles.mapRoadH} />
      <View style={[styles.mapRoadH, { top: '36%' }]} />
      <View style={[styles.mapRoadH, { top: '70%' }]} />

      <View style={styles.radarCenter}>
        <Animated.View style={[styles.radarRing, ringStyle(scale1)]} />
        <Animated.View style={[styles.radarRing, ringStyle(scale2)]} />
        <Animated.View style={[styles.radarRing, ringStyle(scale3)]} />
        <View style={styles.radarDot} />
      </View>
    </View>
  );
};

const AssigningLayout = ({
  pickup,
  dropoff,
}: {
  pickup?: string;
  dropoff?: string;
}) => {
  return (
    <View style={styles.assignWrap}>
      <MapSkeleton />

      <View style={styles.sheet}>
        <Text style={styles.sheetTitle}>Looking for a driver near you</Text>
        <Text style={styles.sheetSub}>
          Dispatching from the Lalamove driver network…
        </Text>

        <View style={styles.routeBox}>
          {!!pickup && (
            <View style={styles.routeRow}>
              <View style={[styles.bullet, { backgroundColor: '#10b981' }]} />
              <Text numberOfLines={1} style={styles.routeText}>
                Pickup: {pickup}
              </Text>
            </View>
          )}
          {!!dropoff && (
            <View style={styles.routeRow}>
              <View style={[styles.bullet, { backgroundColor: '#ef4444' }]} />
              <Text numberOfLines={1} style={styles.routeText}>
                Drop-off: {dropoff}
              </Text>
            </View>
          )}
        </View>

        <IndeterminateBar />
        <View style={{ height: 12 }} />
        <FakeFindingDriver subtitle="Typically takes 1–3 minutes" />
      </View>
    </View>
  );
};

const DeliveryTrackingScreen: React.FC<Props> = ({ route }) => {
  const dispatch = useAppDispatch();

  const directShareLink = route.params?.shareLink;
  const orderIdParam = route.params?.orderId as string | undefined;

  const loading = useAppSelector(lalamoveLoadingSelector);
  const error = useAppSelector(lalamoveErrorSelector);
  const orderDetail = useAppSelector(lalamoveOrderDetailSelector);
  const driverShareLink = useAppSelector(lalamoveDriverShareLinkSelector);

  const [webError, setWebError] = useState<string | null>(null);

  const status = normStatus(
    (orderDetail?.status as string) ??
      (deepGet(orderDetail, 'status') as string),
  );
  const orderIdFromDetail =
    (orderDetail?.orderId as string) ??
    (deepGet(orderDetail, 'orderId') as string) ??
    orderIdParam;

  const stops: any[] = (deepGet(orderDetail, 'stops') as any[]) || [];
  const pickupAddress =
    stops?.[0]?.address ||
    stops?.[0]?.place?.address ||
    deepGet(orderDetail, 'pickupAddress');
  const dropoffAddress =
    stops?.[stops.length - 1]?.address ||
    stops?.[stops.length - 1]?.place?.address ||
    deepGet(orderDetail, 'dropoffAddress');

  useEffect(() => {
    dispatch(clearLalamoveMessages());
    dispatch(clearDriverShareLink());
    setWebError(null);
  }, [dispatch]);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        dispatch(clearLalamoveMessages());
        dispatch(clearDriverShareLink());
        setWebError(null);
      };
    }, [dispatch]),
  );

  useEffect(() => {
    if (orderIdParam) dispatch(getLalamoveOrderDetailThunk(orderIdParam));
  }, [dispatch, orderIdParam]);

  useEffect(() => {
    if (!orderIdParam) return;
    if (status && status !== 'ASSIGNING') return;
    const t = setInterval(() => {
      dispatch(getLalamoveOrderDetailThunk(orderIdParam));
    }, POLL_MS);
    return () => clearInterval(t);
  }, [dispatch, orderIdParam, status]);

  useEffect(() => {
    if (!orderIdFromDetail) return;
    const hasShareLink =
      Boolean(orderDetail?.shareLink ?? deepGet(orderDetail, 'shareLink')) ||
      Boolean(driverShareLink) ||
      Boolean(directShareLink);

    if ((status === 'ON_GOING' || status === 'PICKED_UP') && !hasShareLink) {
      dispatch(getLalamoveDriverLocationThunk(orderIdFromDetail));
    }
  }, [
    dispatch,
    directShareLink,
    orderIdFromDetail,
    orderDetail,
    driverShareLink,
    status,
  ]);

  const finalShareLink = useMemo<string | undefined>(() => {
    if (!(status === 'ON_GOING' || status === 'PICKED_UP')) return undefined;
    return (
      directShareLink ||
      (orderDetail?.shareLink as string) ||
      (deepGet(orderDetail, 'shareLink') as string) ||
      driverShareLink ||
      undefined
    );
  }, [directShareLink, orderDetail, driverShareLink, status]);

  useEffect(() => {
    setWebError(null);
  }, [finalShareLink]);

  const isAssigning =
    !!status &&
    (status === 'ASSIGNING' || status.startsWith('ASSIGN')) &&
    !webError;

  if (!finalShareLink || webError) {
    return (
      <ContainerComponent title="Delivery Tracking" back>
        <View style={styles.container}>
          {isAssigning ? (
            <AssigningLayout pickup={pickupAddress} dropoff={dropoffAddress} />
          ) : (
            <View style={styles.center}>
              {loading ? (
                <ActivityIndicator />
              ) : (
                <Text style={styles.infoText}>
                  {webError ||
                    error ||
                    (status?.startsWith('CANCEL')
                      ? 'The delivery order has been cancelled.'
                      : 'Preparing tracking link…')}
                </Text>
              )}
            </View>
          )}
        </View>
      </ContainerComponent>
    );
  }

  return (
    <ContainerComponent title="Delivery Tracking" back>
      {isAssigning && (
        <View pointerEvents="none" style={styles.fakeOverlay}>
          <FakeFindingDriver />
        </View>
      )}

      <WebView
        source={{ uri: finalShareLink }}
        style={{ flex: 1 }}
        startInLoadingState
        originWhitelist={['*']}
        onError={e =>
          setWebError(e?.nativeEvent?.description || 'Tracking page not loaded')
        }
        renderLoading={() => (
          <View style={styles.center}>
            <ActivityIndicator />
          </View>
        )}
        domStorageEnabled
        javaScriptEnabled
        androidLayerType="none"
      />
    </ContainerComponent>
  );
};

export default DeliveryTrackingScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  assignWrap: { flex: 1 },
  mapSkeleton: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
  },
  mapRoadV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '46%',
    width: 6,
    backgroundColor: '#E8ECF2',
  },
  mapRoadH: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '18%',
    height: 6,
    backgroundColor: '#E8ECF2',
  },
  radarCenter: {
    position: 'absolute',
    left: '50%',
    top: '48%',
    marginLeft: -14,
    marginTop: -14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#60a5fa',
  },
  radarDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2563eb',
    borderWidth: 3,
    borderColor: '#ffffff',
    elevation: 2,
  },
  sheet: {
    padding: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -2 },
  },
  sheetTitle: { fontSize: 16, fontWeight: '700' },
  sheetSub: { marginTop: 4, color: '#6b7280' },
  routeBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },
  routeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  bullet: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  routeText: { flex: 1, fontSize: 13, color: '#111827' },
  fakeOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: undefined,
    maxWidth: '92%',
    zIndex: 5,
    elevation: 6,
  },
  searchRow: {
    width: '100%',
    height: 160,
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    backgroundColor: '#FCFCFC',
    flexDirection: 'row',
  },
  fakeWrap: { width: 118, height: 88 },
  fakeRect: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDEDED',
    backgroundColor: '#F7F7F7',
    overflow: 'hidden',
    position: 'relative',
  },
  fakeAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  scanBar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 36,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  fakeName: {
    fontWeight: '600',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
  searchRight: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  searchTitle: { fontWeight: '700', fontSize: 14 },
  searchSub: { color: '#666', marginTop: 2 },
  progressTrack: {
    height: 8,
    backgroundColor: '#EEF2F7',
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 10,
  },
  progressRunner: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 120,
    borderRadius: 999,
    backgroundColor: '#60a5fa',
  },
  dotRow: { flexDirection: 'row', gap: 6, marginTop: 8, alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#111' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  infoText: { textAlign: 'center', marginBottom: 12, color: '#666' },
});
