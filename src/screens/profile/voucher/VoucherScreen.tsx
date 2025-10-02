import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../../redux/store';
import { fetchVouchersThunk } from '../../../redux/actions/voucherAction';
import {
  ButtonComponent,
  ContainerComponent,
  TextComponent,
  VoucherItem,
} from '../../../components';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { showSuccess, showError } from '../../../utils/toastMessages';
import { useAppSelector } from '../../../redux/hooks';
import {
  voucherSelector,
  clearVoucherMessages,
} from '../../../redux/reducer/voucherReducer';
import { useAppSelector as useTypedSelector } from '../../../redux/hooks';
import { UserModel } from '../../../models/UserModel';
import { LoadingModal } from '../../../modals';
import moment from 'moment';

const toStrictBool = (val: any) => val === true || val === 'true' || val === 1;

const VoucherScreen = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const [refreshing, setRefreshing] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);

  const {
    items: vouchers,
    loading,
    error,
    successMessage,
  } = useAppSelector(voucherSelector);
  const user: UserModel | null = useTypedSelector(state => state.user.profile);

  const loadData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setPageLoading(true);
      try {
        await dispatch(fetchVouchersThunk()).unwrap();
      } catch {
        showError('Failed to refresh vouchers');
      } finally {
        if (isRefresh) setRefreshing(false);
        else setPageLoading(false);
      }
    },
    [dispatch],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const errorMapping = [
      {
        hasError: !!error,
        clear: () => dispatch(clearVoucherMessages()),
        label: 'Vouchers',
      },
    ];

    errorMapping.forEach(({ hasError, clear, label }) => {
      if (hasError && !refreshing) {
        showError(`Failed to load ${label}`);
        clear();
      }
    });
  }, [error, refreshing, dispatch]);

  useEffect(() => {
    const successMapping = [
      {
        message: successMessage,
        clear: () => dispatch(clearVoucherMessages()),
      },
    ];

    successMapping.forEach(({ message, clear }) => {
      if (message && !refreshing) {
        showSuccess(message);
        clear();
      }
    });
  }, [successMessage, refreshing, dispatch]);

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
      const isVisibleToUser = voucherIsLoyalOnly ? userIsLoyal : true;

      const hasRemainingUsage =
        v.remainingUsage == null || v.remainingUsage > 0;

      return isNotExpired && isVisibleToUser && hasRemainingUsage;
    });
  }, [vouchers, user]);

  const groupedVouchers = useMemo(() => {
    return filteredVouchers.reduce((acc: Record<string, any[]>, voucher) => {
      if (!acc[voucher.type]) acc[voucher.type] = [];
      acc[voucher.type].push(voucher);
      return acc;
    }, {});
  }, [filteredVouchers]);

  return (
    <ContainerComponent title="Vouchers" back>
      {!error && filteredVouchers.length === 0 ? (
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
          <TextComponent text="No Vouchers Yet" styles={styles.emptyTitle} />
          <TextComponent
            text="It looks like you haven’t any vouchers yet."
            styles={styles.emptyText}
          />
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadData(true)}
            />
          }
        >
          {Object.entries(groupedVouchers).map(([type, list]) => (
            <View key={type} style={{ marginBottom: 10 }}>
              <TextComponent
                text={type.toUpperCase()}
                styles={styles.sectionTitle}
              />
              {list.map(item => (
                <View key={item._id} style={{ marginBottom: 10 }}>
                  <VoucherItem
                    item={item}
                    onPress={() =>
                      navigation.navigate('VoucherDetailScreen', {
                        voucher: item,
                      })
                    }
                    onApply={() =>
                      navigation.navigate('TabNavigator', {
                        screen: 'Cart',
                      })
                    }
                  />
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      )}

      {/* Loading overlay for initial load/refresh */}
      <LoadingModal visible={loading || refreshing} />
    </ContainerComponent>
  );
};

export default VoucherScreen;

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBackground: {
    position: 'relative',
    marginBottom: 24,
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
    backgroundColor: '#FF7F00',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  findButton: {
    backgroundColor: '#FF7F00',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
});
