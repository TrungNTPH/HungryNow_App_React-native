import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  FlatList,
  TouchableOpacity,
  View,
  StyleSheet,
  RefreshControl,
  Pressable,
  Platform,
} from 'react-native';
import {
  ContainerComponent,
  TextComponent,
  SectionComponent,
  ButtonComponent,
} from '../../../components';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import {
  fetchAddressesThunk,
  updateAddressThunk,
  deleteAddressThunk,
} from '../../../redux/actions/addressAction';
import {
  clearAddressMessages,
  addressErrorSelector,
  addressLoadingSelector,
  addressSelector,
  addressSuccessSelector,
} from '../../../redux/reducer/addressReducer';
import { appColors, appFonts } from '../../../constants';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { showSuccess, showError } from '../../../utils/toastMessages';
import { fetchUserProfileThunk } from '../../../redux/actions/userAction';
import { useFocusEffect } from '@react-navigation/native';
import { LoadingModal, ModalNotification } from '../../../modals';

const SPACING = 16;

const AddressScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const addresses = useAppSelector(addressSelector) || [];
  const loading = useAppSelector(addressLoadingSelector);
  const error = useAppSelector(addressErrorSelector);
  const successMessage = useAppSelector(addressSuccessSelector);

  const [refreshing, setRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    label?: string;
  } | null>(null);

  const loadData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      try {
        const data = await dispatch(fetchAddressesThunk()).unwrap();
        const def = data.find((addr: any) => addr?.isDefault);
        setSelectedId(def?._id || data?.[0]?._id || null);
      } catch {
        showError('Failed to refresh addresses');
      } finally {
        setRefreshing(false);
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
      showError(error);
      dispatch(clearAddressMessages());
    }
  }, [error, refreshing, dispatch]);

  useEffect(() => {
    if (successMessage && !refreshing) {
      showSuccess(successMessage);
      dispatch(clearAddressMessages());
    }
  }, [successMessage, refreshing, dispatch]);

  const handleSave = useCallback(async () => {
    if (!selectedId) {
      showError('Please choose an address to save.');
      return;
    }
    try {
      await dispatch(
        updateAddressThunk({ id: selectedId, data: { isDefault: true } }),
      ).unwrap();
      await dispatch(fetchAddressesThunk()).unwrap();
      await dispatch(fetchUserProfileThunk());
      showSuccess('Default address updated.');
    } catch {
      showError('Failed to update default address.');
    }
  }, [dispatch, selectedId]);

  const handleAdd = useCallback(() => {
    navigation.navigate('AddAddressScreen');
  }, [navigation]);

  const openDeleteConfirm = useCallback((id: string, label?: string) => {
    setPendingDelete({ id, label });
    setConfirmVisible(true);
  }, []);

  const handleDeleteConfirmed = useCallback(async () => {
    if (!pendingDelete?.id) return;
    try {
      await dispatch(deleteAddressThunk(pendingDelete.id)).unwrap();
      if (selectedId === pendingDelete.id) setSelectedId(null);
      await loadData(true);
    } catch {
      showError('Failed to remove address.');
    }
  }, [dispatch, loadData, pendingDelete, selectedId]);

  const data = useMemo(
    () => addresses.filter((a: any) => !!a && !!a._id),
    [addresses],
  );

  const renderItem = ({ item }: any) => {
    const selected = selectedId === item._id;
    return (
      <Pressable
        onPress={() => setSelectedId(item._id)}
        android_ripple={{ color: '#00000010' }}
        style={({ pressed }) => [
          styles.card,
          selected && styles.cardSelected,
          pressed && styles.cardPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Address ${item.label || ''}`}
      >
        <View style={styles.radioCol}>
          <Ionicons
            name={selected ? 'radio-button-on' : 'radio-button-off'}
            size={22}
            color={selected ? appColors.orange : '#BDBDBD'}
          />
        </View>

        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <TextComponent
              text={item.label || 'Address'}
              size={15}
              font={appFonts.semiBold}
              color="#1f2937"
            />
            {item.isDefault && (
              <View style={styles.badge}>
                <TextComponent text="Default" size={11} color="#2563eb" />
              </View>
            )}
          </View>

          <TextComponent
            text={item.addressDetail || ''}
            size={13}
            color="#4b5563"
            styles={{ marginTop: 2 }}
          />
        </View>

        <View style={styles.iconCol}>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('UpdateAddressScreen', { address: item })
            }
            style={styles.iconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Edit address"
          >
            <MaterialIcons name="edit" size={20} color="#6b7280" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => openDeleteConfirm(item._id, item.label)}
            style={[styles.iconBtn, { marginTop: 6 }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Delete address"
          >
            <MaterialIcons name="delete-outline" size={22} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </Pressable>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIcon}>
        <MaterialIcons name="place" size={26} color="#fff" />
      </View>
      <TextComponent
        text="No addresses yet"
        size={16}
        font={appFonts.semiBold}
        styles={{ marginTop: 10 }}
      />
      <TextComponent
        text="Add your first address to speed up checkout."
        size={13}
        color="#6b7280"
        styles={{ marginTop: 2, textAlign: 'center' } as any}
      />
      <ButtonComponent
        text="Add address"
        type="primary"
        color={appColors.orange}
        styles={{
          marginTop: 14,
          borderRadius: 12,
          paddingVertical: 10,
          paddingHorizontal: 14,
        }}
        onPress={handleAdd}
      />
    </View>
  );

  const Separator = () => <View style={{ height: 12 }} />;

  return (
    <View style={{ flex: 1 }}>
      <ContainerComponent title="Address" back isScroll={false}>
        <SectionComponent styles={{ paddingTop: 8 }}>
          <FlatList
            data={data}
            keyExtractor={(item, index) => item._id ?? String(index)}
            renderItem={renderItem}
            ListEmptyComponent={<EmptyState />}
            ItemSeparatorComponent={Separator}
            contentContainerStyle={{ paddingBottom: 140, paddingTop: 4 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadData(true)}
              />
            }
          />
        </SectionComponent>

        {/* Bottom bar Save */}
        {data.length > 0 && (
          <View style={styles.bottomBar}>
            <ButtonComponent
              text="Save default address"
              type="primary"
              color={appColors.orange}
              styles={styles.saveBtn}
              onPress={handleSave}
            />
          </View>
        )}
      </ContainerComponent>

      {/* FAB add address (tối đa 3) */}
      {data.length < 3 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleAdd}
          activeOpacity={0.9}
        >
          <MaterialIcons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Delete confirm */}
      <ModalNotification
        visible={confirmVisible}
        onClose={() => {
          setConfirmVisible(false);
          setPendingDelete(null);
        }}
        title="Delete address?"
        subtitle={pendingDelete?.label ? `"${pendingDelete.label}"` : undefined}
        message="Do you really want to delete this address? This action cannot be undone."
        variant="warning"
        actions={[
          { label: 'Cancel', style: 'secondary' },
          { label: 'Delete', style: 'danger', onPress: handleDeleteConfirmed },
        ]}
        accessibilityLabel="Delete address confirmation"
      />

      {/* Loading overlay (nhớ dùng LoadingModal tái sử dụng) */}
      <LoadingModal visible={loading || refreshing} />
    </View>
  );
};

export default AddressScreen;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eef0f4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: Platform.OS === 'ios' ? 0.08 : 0,
    shadowRadius: 6,
    elevation: Platform.OS === 'android' ? 1 : 0,
  },
  cardSelected: {
    borderColor: '#ffd7ae',
    backgroundColor: '#fff9f3',
  },
  cardPressed: {
    transform: [{ scale: 0.995 }],
  },
  radioCol: {
    marginRight: 12,
    marginTop: 4,
  },
  iconCol: {
    marginLeft: 10,
    alignSelf: 'center',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#eef6ff',
    borderWidth: 0,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: appColors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    position: 'absolute',
    left: SPACING,
    right: SPACING,
    bottom: SPACING,
  },
  saveBtn: {
    width: '100%',
    borderRadius: 14,
    paddingVertical: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 24,
    backgroundColor: appColors.orange,
    borderRadius: 28,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});
