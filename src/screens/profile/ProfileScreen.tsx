import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { fetchUserProfileThunk } from '../../redux/actions/userAction';
import { authSelector, removeAuth } from '../../redux/reducer/authReducer';
import {
  clearUserMessages,
  userSelector,
} from '../../redux/reducer/userReducer';
import { appColors, appFonts } from '../../constants';
import { ContainerComponent } from '../../components';
import { showSuccess, showError } from '../../utils/toastMessages';
import { clearToken } from '../../utils/authToken';
import { useFocusEffect } from '@react-navigation/native';
import { resetFavorites } from '../../redux/reducer/favoriteReducer';
import { LoadingModal, ModalNotification } from '../../modals';

const RowItem = ({
  icon,
  label,
  onPress,
  danger = false,
  style,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
  style?: StyleProp<ViewStyle>;
}) => (
  <Pressable
    onPress={onPress}
    android_ripple={{ color: '#00000010' }}
    style={({ pressed }) => [styles.row, style, pressed && { opacity: 0.95 }]}
  >
    <View
      style={[
        styles.rowIconWrap,
        danger && { backgroundColor: '#FFF1F1', borderColor: '#FFE3E3' },
      ]}
    >
      <Ionicons
        name={icon}
        size={18}
        color={danger ? appColors.danger : appColors.text}
      />
    </View>
    <Text style={[styles.rowText, danger && { color: appColors.danger }]}>
      {label}
    </Text>
    <Ionicons name="chevron-forward" size={18} color="#999" />
  </Pressable>
);

const ProfileScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(authSelector);

  const { profile, error, successMessage, loading } =
    useAppSelector(userSelector);
  const [refreshing, setRefreshing] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);

  const [signOutModalVisible, setSignOutModalVisible] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const loadData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setPageLoading(true);
      try {
        await dispatch(fetchUserProfileThunk()).unwrap();
      } catch {
        showError('Failed to refresh profile');
      } finally {
        if (isRefresh) setRefreshing(false);
        setPageLoading(false);
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
      showError('Failed to load profile');
      dispatch(clearUserMessages());
    }
  }, [error, refreshing, dispatch]);

  useEffect(() => {
    if (successMessage && !refreshing) {
      showSuccess(successMessage);
      dispatch(clearUserMessages());
    }
  }, [successMessage, refreshing, dispatch]);

  const handleSignOut = useCallback(() => {
    setSignOutModalVisible(true);
  }, []);

  const handleConfirmSignOut = useCallback(async () => {
    setSigningOut(true);
    try {
      await AsyncStorage.removeItem('auth');
      await AsyncStorage.removeItem('hasOnboarded');
      clearToken();
      dispatch(removeAuth());
      dispatch(resetFavorites());
      setSignOutModalVisible(false);
      showSuccess('Signed out successfully');
    } catch (err) {
      console.error('Sign out error', err);
      showError('Failed to sign out');
    } finally {
      setSigningOut(false);
    }
  }, [dispatch]);

  useEffect(() => {
    if (!auth.accesstoken) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'TabNavigator' }],
      });
    }
  }, [auth.accesstoken, navigation]);

  const displayName = profile?.fullName?.trim().length
    ? profile.fullName
    : 'HungryNow';
  const email = profile?.email || '';
  const avatarSource = profile?.image
    ? { uri: profile.image }
    : require('../../assets/images/logo.png');

  return (
    <ContainerComponent title="Profile">
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <Image source={avatarSource} style={styles.avatar} />
            <TouchableOpacity
              style={styles.editBadge}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('PersonalDataScreen')}
            >
              <Ionicons name="pencil" size={14} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{displayName}</Text>
            {!!email && <Text style={styles.email}>{email}</Text>}

            <View style={styles.badgesRow}>
              <View style={styles.badge}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={12}
                  color="#2F7DD0"
                />
                <Text style={styles.badgeText}>Verified</Text>
              </View>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: '#FFF3E8', borderColor: '#FFE1C8' },
                ]}
              >
                <Ionicons
                  name="star-outline"
                  size={12}
                  color={appColors.orange}
                />
                <Text style={[styles.badgeText, { color: appColors.orange }]}>
                  Member
                </Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Profile</Text>
        <View style={styles.card}>
          <RowItem
            icon="person-outline"
            label="Personal Data"
            onPress={() => navigation.navigate('PersonalDataScreen')}
          />
          <View style={styles.separator} />
          <RowItem
            icon="settings-outline"
            label="Settings"
            onPress={() => navigation.navigate('SettingScreen')}
          />
          <View style={styles.separator} />
          <RowItem
            icon="cube-outline"
            label="Order status"
            onPress={() => navigation.navigate('InvoiceScreen')}
          />
        </View>

        <Text style={styles.sectionLabel}>Support</Text>
        <View style={styles.card}>
          <RowItem
            icon="help-circle-outline"
            label="Help Center"
            onPress={() => navigation.navigate('HelpCenterScreen')}
          />
          <View style={styles.separator} />
          <RowItem
            icon="ticket-outline"
            label="Voucher"
            onPress={() => navigation.navigate('VoucherScreen')}
          />
          <View style={styles.separator} />
          <RowItem
            icon="person-add-outline"
            label="Add another account"
            onPress={() => navigation.navigate('ManageAccountsScreen')}
          />
        </View>

        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          activeOpacity={0.9}
          disabled={signingOut}
        >
          <Ionicons name="log-out-outline" size={18} color="#fff" />
          <Text style={styles.signOutText}>
            {signingOut ? 'Signing out…' : 'Sign Out'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <ModalNotification
        visible={signOutModalVisible}
        onClose={() => setSignOutModalVisible(false)}
        title="Sign out?"
        message="Are you sure you want to sign out? You will need to log in again to access your account."
        variant="error"
        actions={[
          {
            label: 'Cancel',
            style: 'secondary',
            onPress: () => setSignOutModalVisible(false),
            disabled: signingOut,
          },
          {
            label: signingOut ? 'Signing out...' : 'Sign Out',
            style: 'primary',
            onPress: handleConfirmSignOut,
            disabled: signingOut,
          },
        ]}
        closeOnBackdropPress={!signingOut}
      />

      {/* Loading overlay */}
      <LoadingModal visible={loading || refreshing} />
    </ContainerComponent>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  content: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  avatarWrap: {
    marginRight: 12,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F2F2F2',
  },
  editBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: appColors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFF',
  },
  name: {
    fontSize: 18,
    color: appColors.text,
    fontFamily: appFonts.semiBold,
  },
  email: {
    marginTop: 2,
    fontSize: 13,
    color: '#777',
    fontFamily: appFonts.regular,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#EEF7FF',
    borderWidth: 1,
    borderColor: '#D6ECFF',
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    color: '#2F7DD0',
    fontFamily: appFonts.semiBold,
  },
  sectionLabel: {
    marginTop: 8,
    marginBottom: 6,
    fontSize: 14,
    color: appColors.text,
    fontFamily: appFonts.semiBold,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 6,
  },
  rowIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginRight: 10,
  },
  rowText: {
    fontSize: 14,
    color: appColors.text,
    fontFamily: appFonts.regular,
    flex: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#EEE',
    marginLeft: 48,
  },
  signOutButton: {
    marginTop: 16,
    backgroundColor: appColors.danger,
    borderRadius: 28,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  signOutText: {
    color: '#FFF',
    fontSize: 15,
    fontFamily: appFonts.semiBold,
  },
});
