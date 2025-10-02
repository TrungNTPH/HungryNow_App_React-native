import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Share,
  Linking,
  Alert,
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import {
  Notification as NotificationIcon,
  People,
  Link as LinkIcon,
  Share as ShareIcon,
  DocumentText,
} from 'iconsax-react-native';

import TextComponent from '../../components/TextComponent';
import ContainerComponent from '../../components/ContainerComponent';
import { ButtonComponent } from '../../components';
import { appColors, appFonts } from '../../constants';

type NotificationDetailRouteProp = RouteProp<
  { params: { notification: any } },
  'params'
>;

const formatFullDate = (dateStr?: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString();
};

const fromNow = (dateStr?: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr).getTime();
  const diff = Date.now() - d;

  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} minute${mins > 1 ? 's' : ''} ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
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

const Row = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.row}>
    <TextComponent
      text={label}
      size={12}
      color={appColors.gray}
      styles={styles.rowLabel}
    />
    <TextComponent
      text={value}
      size={13}
      color={appColors.text}
      styles={{ flex: 1 }}
    />
  </View>
);

const NotificationDetailScreen = () => {
  const route = useRoute<NotificationDetailRouteProp>();
  const { notification } = route.params || { notification: {} };

  const iconColor = useMemo(
    () =>
      notification?.type === 'system' ? appColors.danger : appColors.orange,
    [notification?.type],
  );

  const typeLabel = useMemo(() => {
    if (notification?.type === 'system') return 'System';
    if (notification?.type === 'personal' || notification?.type === 'order')
      return 'Order';
    return 'General';
  }, [notification?.type]);

  const actionUrl: string | undefined =
    notification?.actionUrl || notification?.deepLink || notification?.url;

  const handleOpenLink = async () => {
    if (!actionUrl) return;
    try {
      const canOpen = await Linking.canOpenURL(actionUrl);
      if (canOpen) await Linking.openURL(actionUrl);
      else Alert.alert('Cannot open link', actionUrl);
    } catch {
      Alert.alert('Error', 'Failed to open the link.');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: notification?.title || 'Notification',
        message: `${notification?.title ?? ''}\n\n${
          notification?.message ?? ''
        }\n${actionUrl ? `\n${actionUrl}` : ''}`.trim(),
      });
    } catch {}
  };

  return (
    <ContainerComponent back title="Notification Detail" isScroll={false}>
      <ScrollView contentContainerStyle={styles.scroll} bounces>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View
              style={[styles.iconWrap, { backgroundColor: `${iconColor}11` }]}
            >
              {notification?.type === 'system' ? (
                <NotificationIcon size={22} color={iconColor} />
              ) : (
                <People size={22} color={iconColor} />
              )}
            </View>

            <View style={{ flex: 1 }}>
              <TextComponent
                text={notification?.title ?? 'Untitled notification'}
                font={appFonts.semiBold}
                size={18}
                styles={{ flexWrap: 'wrap' }}
              />
              <TextComponent
                text={fromNow(notification?.createdAt)}
                size={12}
                color={appColors.gray}
              />
            </View>

            <Badge
              label={typeLabel.toUpperCase()}
              color={
                notification?.type === 'system'
                  ? appColors.danger
                  : appColors.orange
              }
            />
          </View>

          {!!notification?.image && (
            <View style={styles.imageWrap}>
              <Image
                source={{ uri: notification.image }}
                style={styles.image}
              />
            </View>
          )}

          <View style={styles.messageWrap}>
            <View style={styles.messageHeader}>
              <DocumentText size={18} color={appColors.gray} />
              <TextComponent
                text="Message"
                size={13}
                color={appColors.gray}
                styles={{ marginLeft: 6 }}
              />
            </View>
            <TextComponent
              text={notification?.message ?? 'No content'}
              size={15}
              color={appColors.text}
              styles={styles.message}
            />
          </View>

          <View style={styles.divider} />
          <Row
            label="Created at"
            value={formatFullDate(notification?.createdAt)}
          />
          {!!notification?._id && (
            <Row label="Notification ID" value={notification._id} />
          )}

          <View style={styles.actions}>
            {!!actionUrl && (
              <ButtonComponent
                text="Open Link"
                type="primary"
                onPress={handleOpenLink}
                styles={styles.actionBtn}
              />
            )}
            <ButtonComponent
              text="Share"
              type="primary"
              onPress={handleShare}
              styles={[styles.actionBtn, !actionUrl && { flex: 1 }]}
            />
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </ContainerComponent>
  );
};

export default NotificationDetailScreen;

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  imageWrap: {
    marginTop: 14,
    overflow: 'hidden',
    borderRadius: 12,
  },
  image: {
    width: '100%',
    height: 200,
  },
  messageWrap: {
    marginTop: 16,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  message: {
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEE',
    marginVertical: 16,
    borderRadius: 2,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  rowLabel: {
    width: 90,
    marginRight: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  actionBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    marginLeft: 8,
  },
});
