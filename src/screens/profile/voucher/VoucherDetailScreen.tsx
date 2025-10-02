import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import moment from 'moment';
import { appColors, appFonts } from '../../../constants';
import { VoucherModel } from '../../../models/VoucherModel';
import {
  ContainerComponent,
  TextComponent,
  ButtonComponent,
} from '../../../components';
import { showError, showSuccess } from '../../../utils/toastMessages';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import {
  clearVoucherMessages,
  voucherSelector,
} from '../../../redux/reducer/voucherReducer';

const formatVND = (n: number | undefined | null) =>
  Number(n ?? 0).toLocaleString();

const VoucherDetailScreen = ({ navigation }: any) => {
  const route = useRoute();
  const dispatch = useAppDispatch();
  const { voucher } = route.params as { voucher: VoucherModel };

  const { error, successMessage } = useAppSelector(voucherSelector);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (error && !refreshing) {
      showError('Voucher error');
      dispatch(clearVoucherMessages());
    }
  }, [error, refreshing, dispatch]);

  useEffect(() => {
    if (successMessage && !refreshing) {
      showSuccess(successMessage);
      dispatch(clearVoucherMessages());
    }
  }, [successMessage, refreshing, dispatch]);

  const discountText = useMemo(() => {
    const dv = Number(voucher.discountValue ?? 0);
    const cap =
      voucher.discountMaxValue === null ||
      voucher.discountMaxValue === undefined
        ? null
        : Number(voucher.discountMaxValue);

    switch (voucher.type) {
      case 'percentage': {
        const capText = cap != null ? ` • max ${formatVND(cap)} VND` : '';
        return `Discount ${dv}%${capText}`;
      }
      case 'fixed':
        return `Discount ₫${formatVND(dv)}`;
      case 'freeShipping':
        return 'Free Shipping';
      case 'firstOrder':
        return 'First Order Offer';
      case 'special':
        return 'Special Offer';
      default:
        return '';
    }
  }, [voucher]);

  const conditionText = useMemo(() => {
    const min = voucher.minimumOrderValue || 0;
    return min > 0 ? `Min. Order ₫${formatVND(min)}` : 'No minimum order';
  }, [voucher]);

  const createdAt = moment(voucher.createdAt);
  const expiresAt = moment(voucher.expirationDate);
  const now = moment();
  const isExpired = now.isAfter(expiresAt);
  const totalMs = Math.max(1, expiresAt.diff(createdAt));
  const elapsedMs = Math.min(totalMs, Math.max(0, now.diff(createdAt)));
  const percent = Math.round((elapsedMs / totalMs) * 100);
  const timeLeft = isExpired ? 'Expired' : expiresAt.fromNow(true);

  const usageLeft =
    voucher.totalUsageLimit != null && voucher.remainingUsage != null
      ? `${voucher.remainingUsage}/${voucher.totalUsageLimit} left`
      : voucher.remainingUsage != null
      ? `${voucher.remainingUsage} left`
      : 'Unlimited';

  const hasCap =
    voucher.type === 'percentage' &&
    voucher.discountMaxValue !== undefined &&
    voucher.discountMaxValue !== null;

  return (
    <ContainerComponent back title="Voucher Detail" isScroll={false}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => setRefreshing(false)}
          />
        }
      >
        <View style={styles.headerCard}>
          <View style={styles.ribbon} />
          <View style={{ flex: 1 }}>
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: '#FFF1E6', borderColor: appColors.orange },
                ]}
              >
                <TextComponent
                  text={
                    voucher.type === 'freeShipping' ? 'FREE SHIP' : 'VOUCHER'
                  }
                  size={11}
                  color={appColors.orange}
                  font={appFonts.semiBold}
                />
              </View>
              {voucher.isForLoyalCustomer && (
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: '#EEF8FF', borderColor: '#7BB8FF' },
                  ]}
                >
                  <TextComponent
                    text="LOYAL ONLY"
                    size={11}
                    color="#2F7DD0"
                    font={appFonts.semiBold}
                  />
                </View>
              )}
              {voucher.maxUsagePerUser != null && (
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: '#F5F5F5', borderColor: '#E6E6E6' },
                  ]}
                >
                  <TextComponent
                    text={`Per user: ${voucher.maxUsagePerUser}`}
                    size={11}
                    color="#555"
                  />
                </View>
              )}
            </View>

            <TextComponent
              text={discountText}
              size={20}
              font={appFonts.semiBold}
              styles={{ marginTop: 8 }}
            />
            <TextComponent
              text={conditionText}
              size={13}
              color="#666"
              styles={{ marginTop: 4 }}
            />

            <View style={styles.metaRow}>
              <TextComponent
                text={
                  isExpired
                    ? 'Expired'
                    : `Expires: ${expiresAt.format('DD MMM YYYY, HH:mm')}`
                }
                size={12}
                color={isExpired ? '#D9534F' : '#777'}
              />
              <TextComponent
                text={`Usage: ${usageLeft}`}
                size={12}
                color="#777"
                styles={{ marginLeft: 'auto' }}
              />
            </View>

            <View style={styles.progressWrap}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${isExpired ? 100 : percent}%`,
                    backgroundColor: isExpired ? '#D9534F' : appColors.orange,
                  },
                ]}
              />
            </View>
            <View style={styles.progressLabels}>
              <TextComponent
                text={createdAt.format('DD/MM')}
                size={11}
                color="#999"
              />
              <TextComponent
                text={isExpired ? 'Expired' : `${timeLeft} left`}
                size={11}
                color={isExpired ? '#D9534F' : '#999'}
              />
              <TextComponent
                text={expiresAt.format('DD/MM')}
                size={11}
                color="#999"
              />
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <TextComponent text="Validity Period" size={13} color="#777" />
          <TextComponent
            text={`${createdAt.format(
              'DD MMM YYYY HH:mm',
            )}  —  ${expiresAt.format('DD MMM YYYY HH:mm')}`}
            size={14}
            styles={{ marginTop: 6 }}
          />
        </View>

        <View style={styles.card}>
          <TextComponent text="Promotion" size={13} color="#777" />
          <TextComponent
            text={voucher.description || 'No specific description.'}
            size={14}
            styles={{ marginTop: 6 }}
          />
        </View>

        <View style={styles.card}>
          <TextComponent text="Conditions" size={13} color="#777" />
          <View style={styles.chipsRow}>
            <View style={styles.chip}>
              <TextComponent text={conditionText} size={12} color="#555" />
            </View>
            {voucher.maxOrderValue != null && (
              <View style={styles.chip}>
                <TextComponent
                  text={`Max ₫${formatVND(voucher.maxOrderValue)}`}
                  size={12}
                  color="#555"
                />
              </View>
            )}
            <View style={styles.chip}>
              <TextComponent
                text={
                  voucher.isForLoyalCustomer ? 'Loyal customers' : 'All users'
                }
                size={12}
                color="#555"
              />
            </View>
            {hasCap && (
              <View style={styles.chip}>
                <TextComponent
                  text={`Max Discount: ₫${formatVND(
                    voucher.discountMaxValue as number,
                  )}`}
                  size={12}
                  color="#555"
                />
              </View>
            )}
          </View>

          <TextComponent
            text={`• Applies to all categories`}
            size={13}
            styles={{ marginTop: 8 }}
          />
          <TextComponent
            text={`• Usage per user: ${voucher.maxUsagePerUser ?? 'Unlimited'}`}
            size={13}
            styles={{ marginTop: 4 }}
          />
          <TextComponent
            text={`• Total usage limit: ${
              voucher.totalUsageLimit ?? 'Unlimited'
            }`}
            size={13}
            styles={{ marginTop: 4 }}
          />
        </View>

        <View style={styles.cardRow}>
          <View style={[styles.smallCard, { marginRight: 8 }]}>
            <TextComponent text="Payment Methods" size={13} color="#777" />
            <TextComponent
              text="All methods"
              size={14}
              styles={{ marginTop: 6 }}
            />
          </View>
          <View style={[styles.smallCard, { marginLeft: 8 }]}>
            <TextComponent text="Devices" size={13} color="#777" />
            <TextComponent
              text="iOS, Android"
              size={14}
              styles={{ marginTop: 6 }}
            />
          </View>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      <View style={styles.footer}>
        <View style={{ flex: 1 }}>
          <TextComponent text={discountText} size={12} color="#777" />
          <TextComponent text={conditionText} size={14} />
        </View>
        <ButtonComponent
          text={isExpired ? 'Expired' : 'Apply Now'}
          type="primary"
          color={isExpired ? '#C9C9C9' : appColors.orange}
          onPress={() =>
            navigation.navigate('TabNavigator', {
              screen: 'Cart',
            })
          }
          styles={[styles.footerBtn, isExpired && { opacity: 0.7 }]}
          disable={isExpired}
        />
      </View>
    </ContainerComponent>
  );
};

export default VoucherDetailScreen;

const styles = StyleSheet.create({
  content: { padding: 16 },
  headerCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 12,
  },
  ribbon: {
    width: 8,
    backgroundColor: appColors.orange,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    marginRight: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  progressWrap: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 999,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: 8,
    borderRadius: 999,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  smallCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  footerBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 150,
  },
});
