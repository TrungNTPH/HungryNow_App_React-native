import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
  ScrollView,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Notification as NotificationIcon,
  People,
  TickCircle,
  ArrowRight2,
} from 'iconsax-react-native';
import PagerView from 'react-native-pager-view';

import TextComponent from '../../components/TextComponent';
import { appFonts, appColors } from '../../constants';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
  fetchUserNotificationsThunk,
  markAsReadNotificationThunk,
} from '../../redux/actions/notificationAction';
import {
  notificationSelector,
  notificationLoadingSelector,
  clearNotificationMessages,
  notificationErrorSelector,
  notificationSuccessSelector,
} from '../../redux/reducer/notificationReducer';
import { ButtonComponent, ContainerComponent } from '../../components';
import {
  getReadNotifications,
  saveReadNotification,
} from '../../utils/notificationStorage';
import { showError, showSuccess } from '../../utils/toastMessages';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../redux/store';
import { LoadingModal } from '../../modals';

const tabs = ['all', 'system', 'order'] as const;
type TabKey = (typeof tabs)[number];

const fromNow = (dateStr?: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr).getTime();
  const diff = Date.now() - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const Badge = ({ label, color }: { label: string; color: string }) => (
  <View
    style={[
      styles.badge,
      { backgroundColor: `${color}22`, borderColor: color },
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

const TabButton = ({
  label,
  active,
  onPress,
  count,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  count?: number;
}) => (
  <TouchableOpacity
    style={[styles.tab, active && styles.tabActive]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <TextComponent
      text={label}
      styles={[styles.tabText, active && styles.tabTextActive]}
    />
    {typeof count === 'number' && (
      <View
        style={[
          styles.countPill,
          active && { backgroundColor: `${appColors.orange}1A` },
        ]}
      >
        <TextComponent
          text={`${count}`}
          size={11}
          color={active ? appColors.orange : appColors.gray}
          font={appFonts.semiBold}
        />
      </View>
    )}
  </TouchableOpacity>
);

const NotificationScreen = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();

  const notifications = useAppSelector(notificationSelector);
  const loading = useAppSelector(notificationLoadingSelector);

  const notifError = useAppSelector(notificationErrorSelector);
  const notifSuccess = useAppSelector(notificationSuccessSelector);

  const [tabIndex, setTabIndex] = useState(0);
  const pagerRef = useRef<PagerView>(null);
  const [readLocalIds, setReadLocalIds] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);

  const filter: TabKey = tabs[tabIndex];

  const loadData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setBusy(true);
      }
      try {
        await dispatch(fetchUserNotificationsThunk()).unwrap();
      } catch {
        showError('Failed to refresh notifications');
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
      loadLocalRead();
      return () => {
        dispatch(clearNotificationMessages());
      };
    }, [dispatch, loadData]),
  );

  useEffect(() => {
    if (notifError && !refreshing) {
      showError(
        typeof notifError === 'string'
          ? notifError
          : 'Failed to fetch notifications',
      );
      dispatch(clearNotificationMessages());
    }
    if (notifSuccess && !refreshing) {
      showSuccess(notifSuccess);
      dispatch(clearNotificationMessages());
    }
  }, [notifError, notifSuccess, refreshing, dispatch]);

  const loadLocalRead = async () => {
    const ids = await getReadNotifications();
    setReadLocalIds(ids);
  };

  const markAsReadLocal = async (id: string) => {
    await saveReadNotification(id);
    setReadLocalIds(prev => [...new Set([...prev, id])]);
  };

  const handleNotificationPress = async (item: any) => {
    if (!readLocalIds.includes(item._id)) {
      await markAsReadLocal(item._id);
      if (item.userId) dispatch(markAsReadNotificationThunk(item._id));
    }
    navigation.navigate('NotificationDetailScreen', { notification: item });
  };

  const handleLongPress = async (item: any) => {
    if (!readLocalIds.includes(item._id)) {
      await markAsReadLocal(item._id);
      if (item.userId) dispatch(markAsReadNotificationThunk(item._id));
      showSuccess('Marked as read');
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !readLocalIds.includes(n._id));
    if (unread.length === 0) return;
    Alert.alert(
      'Mark all as read',
      `Mark ${unread.length} notification(s) as read?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark all',
          style: 'default',
          onPress: async () => {
            try {
              setBusy(true);
              for (const n of unread) {
                await markAsReadLocal(n._id);
                if (n.userId)
                  await dispatch(markAsReadNotificationThunk(n._id));
              }
              showSuccess('All notifications marked as read');
            } catch {
              showError('Failed to mark all as read');
            } finally {
              setBusy(false);
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  const isRead = (id: string) => readLocalIds.includes(id);

  const isToday = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  };

  const isYesterday = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const y = new Date(today);
    y.setDate(today.getDate() - 1);
    return d.toDateString() === y.toDateString();
  };

  const tabCounts = useMemo(() => {
    const all = notifications.length;
    const system = notifications.filter(n => n.type === 'system').length;
    const order = notifications.filter(n => n.type === 'personal').length;
    return { all, system, order };
  }, [notifications]);

  const renderNotificationItem = (item: (typeof notifications)[0]) => {
    const read = isRead(item._id);
    const iconColor =
      item.type === 'system' ? appColors.danger : appColors.orange;
    const typeLabel =
      item.type === 'system'
        ? 'System'
        : item.type === 'personal'
        ? 'Order'
        : 'General';

    return (
      <TouchableOpacity
        key={item._id}
        style={[styles.item, !read && styles.itemUnread]}
        onPress={() => handleNotificationPress(item)}
        onLongPress={() => handleLongPress(item)}
        activeOpacity={0.85}
      >
        <View style={[styles.iconWrap, { backgroundColor: `${iconColor}11` }]}>
          {item.type === 'system' ? (
            <NotificationIcon size={20} color={iconColor} />
          ) : (
            <People size={20} color={iconColor} />
          )}
        </View>

        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <TextComponent
              text={item.title}
              font={appFonts.semiBold}
              size={15}
              color={read ? appColors.text : appColors.black}
              styles={{ flex: 1, flexWrap: 'wrap' }}
            />
            {!read && <View style={styles.dotUnread} />}
          </View>

          <View style={styles.metaRow}>
            <Badge label={typeLabel.toUpperCase()} color={iconColor} />
            <TextComponent
              text={fromNow(item.createdAt)}
              size={11}
              color={appColors.gray}
              styles={{ marginLeft: 8 }}
            />
          </View>

          <TextComponent
            text={item.message}
            size={13}
            color={appColors.gray}
            styles={styles.message}
          />
        </View>

        <ArrowRight2 size={18} color={'#B5B5B5'} />
      </TouchableOpacity>
    );
  };

  const renderSection = (label: string, data: typeof notifications) => (
    <View style={styles.section}>
      <TextComponent text={label} styles={styles.sectionTitle} />
      {data.length === 0 ? (
        <TextComponent
          text="No notifications"
          color={appColors.gray}
          size={13}
        />
      ) : (
        data.map(renderNotificationItem)
      )}
    </View>
  );

  const renderPage = (key: TabKey) => {
    const filtered = notifications.filter(n => {
      if (key === 'system') return n.type === 'system';
      if (key === 'order') return n.type === 'personal';
      return true;
    });

    const grouped = [
      { label: 'Today', data: filtered.filter(n => isToday(n.createdAt)) },
      {
        label: 'Yesterday',
        data: filtered.filter(n => isYesterday(n.createdAt)),
      },
      {
        label: 'Earlier',
        data: filtered.filter(
          n => !isToday(n.createdAt) && !isYesterday(n.createdAt),
        ),
      },
    ];

    return (
      <FlatList
        data={grouped}
        keyExtractor={item => item.label}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <View>
            {renderSection(item.label, item.data)}
            {index < grouped.length - 1 && <View style={styles.separator} />}
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
          />
        }
      />
    );
  };

  const isEmpty = !loading && notifications.length === 0;
  const isBusyLoading = loading || refreshing || busy;

  return (
    <ContainerComponent back title="Notifications">
      {/* Top actions */}
      <View style={styles.topBar}>
        <View style={styles.tabs}>
          <TabButton
            label="All"
            active={tabIndex === 0}
            onPress={() => {
              setTabIndex(0);
              pagerRef.current?.setPage(0);
            }}
            count={tabCounts.all}
          />
          <TabButton
            label="System"
            active={tabIndex === 1}
            onPress={() => {
              setTabIndex(1);
              pagerRef.current?.setPage(1);
            }}
            count={tabCounts.system}
          />
          <TabButton
            label="Orders"
            active={tabIndex === 2}
            onPress={() => {
              setTabIndex(2);
              pagerRef.current?.setPage(2);
            }}
            count={tabCounts.order}
          />
        </View>

        <TouchableOpacity
          style={[styles.markAllBtn, (loading || busy) && { opacity: 0.7 }]}
          onPress={markAllAsRead}
          activeOpacity={0.85}
          disabled={loading || busy}
        >
          <TickCircle size={18} color="#fff" />
          <TextComponent
            text="Mark all"
            size={12}
            color="#fff"
            styles={{ marginLeft: 6 }}
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <TextComponent
            text="Loading notifications..."
            size={14}
            color={appColors.gray}
          />
        </View>
      ) : isEmpty ? (
        <ScrollView
          contentContainerStyle={[styles.emptyContainer]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadData(true)}
            />
          }
        >
          <View style={styles.emptyCircle}>
            <NotificationIcon size={28} color="#fff" />
          </View>
          <TextComponent
            text="You're all caught up"
            size={18}
            font={appFonts.semiBold}
            styles={{ marginTop: 12 }}
          />
          <TextComponent
            text="No notifications at the moment. Pull to refresh or tap the button below."
            size={13}
            color={appColors.gray}
            styles={{ textAlign: 'center', marginTop: 6 }}
          />
          <ButtonComponent
            text="Reload"
            type="primary"
            onPress={() => loadData(true)}
            styles={{ marginTop: 16, paddingHorizontal: 24, borderRadius: 12 }}
          />
        </ScrollView>
      ) : (
        <PagerView
          ref={pagerRef}
          style={{ flex: 1 }}
          initialPage={0}
          onPageSelected={e => setTabIndex(e.nativeEvent.position)}
        >
          {tabs.map(key => (
            <View key={key} style={{ flex: 1 }}>
              {renderPage(key)}
            </View>
          ))}
        </PagerView>
      )}

      {/* Loading overlay cho loading/refresh/mark-all */}
      <LoadingModal visible={isBusyLoading} />
    </ContainerComponent>
  );
};

export default NotificationScreen;

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  tabs: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F7F7F7',
    borderRadius: 12,
    padding: 4,
    gap: 6,
    marginRight: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    flexDirection: 'row',
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  tabText: {
    fontSize: 13,
    color: appColors.gray,
    fontFamily: appFonts.semiBold,
  },
  tabTextActive: {
    color: appColors.orange,
  },
  countPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#EFEFEF',
  },

  section: {
    marginTop: 10,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    color: '#777',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  item: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  itemUnread: {
    borderColor: appColors.gray,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  dotUnread: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: appColors.danger,
    marginLeft: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  message: {
    marginTop: 8,
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
  listContent: {
    paddingBottom: 40,
  },
  separator: {
    height: 1,
    backgroundColor: '#EAEAEA',
    marginVertical: 12,
    borderRadius: 2,
    marginHorizontal: 16,
  },
  emptyContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: appColors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appColors.orange,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
});
