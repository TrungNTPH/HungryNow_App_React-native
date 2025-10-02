import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  FlatList,
  Pressable,
  Platform,
  RefreshControl,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Edit, ArrowDown2 } from 'iconsax-react-native';
import {
  ButtonComponent,
  ContainerComponent,
  InputComponent,
  SectionComponent,
  SpaceComponent,
  TextComponent,
} from '../../../components';
import { appColors, appFonts } from '../../../constants';
import {
  ImageLibraryOptions,
  launchImageLibrary,
} from 'react-native-image-picker';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import {
  fetchUserProfileThunk,
  updateUserProfileThunk,
} from '../../../redux/actions/userAction';
import { showSuccess, showError } from '../../../utils/toastMessages';
import {
  clearUserMessages,
  userSelector,
} from '../../../redux/reducer/userReducer';
import { useFocusEffect } from '@react-navigation/native';
import { uploadApi } from '../../../apis/uploadApi';
import { LoadingModal } from '../../../modals';

const formatDate = (d?: Date | null) =>
  d ? d.toLocaleDateString('en-GB') : '';

export type GenderOption = 'male' | 'female' | 'unspecified';

const PersonalDataScreen = ({ navigation, route }: any) => {
  const dispatch = useAppDispatch();
  const { profile, error, successMessage, loading } =
    useAppSelector(userSelector);

  const didInitialLoadRef = useRef(false);

  const [isDirty, setIsDirty] = useState(false);

  const [name, setName] = useState('');
  const [dobDate, setDobDate] = useState<Date | null>(null);
  const dob = useMemo(() => formatDate(dobDate), [dobDate]);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState<GenderOption>('unspecified');
  const [genderModalVisible, setGenderModalVisible] = useState(false);
  const genderOptions: GenderOption[] = ['male', 'female', 'unspecified'];

  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isAvatarUpdated, setIsAvatarUpdated] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const markDirty = useCallback(() => setIsDirty(true), []);

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
        else setPageLoading(false);
      }
    },
    [dispatch],
  );

  useFocusEffect(
    useCallback(() => {
      if (!didInitialLoadRef.current) {
        didInitialLoadRef.current = true;
        loadData();
      }
    }, [loadData]),
  );

  useEffect(() => {
    if (profile && !isDirty) {
      setName(profile.fullName || '');
      setPhone(profile.phoneNumber || '');
      setEmail(profile.email || '');
      const normalizedGender: GenderOption =
        profile.gender === 'male' || profile.gender === 'female'
          ? profile.gender
          : 'unspecified';
      setGender(normalizedGender);
      setAvatarUri(profile.image || null);
      setIsAvatarUpdated(false);
      setDobDate(profile.birthday ? new Date(profile.birthday) : null);
    }
  }, [profile, isDirty]);

  useEffect(() => {
    if (error && !refreshing) {
      showError(error);
      dispatch(clearUserMessages());
    }
  }, [error, refreshing, dispatch]);

  useEffect(() => {
    if (successMessage && !refreshing) {
      showSuccess(successMessage);
      dispatch(clearUserMessages());
      setIsDirty(false);
    }
  }, [successMessage, refreshing, dispatch]);

  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e: any) => {
      if (e.data?.action?.type === 'GO_BACK') {
        setIsDirty(false);
      }
    });
    return unsub;
  }, [navigation]);

  const handlePickImage = useCallback(() => {
    const options: ImageLibraryOptions = { mediaType: 'photo' };
    launchImageLibrary(options, response => {
      if (!response.didCancel && response.assets?.length) {
        const uri = response.assets[0].uri ?? null;
        if (uri) {
          setAvatarUri(uri);
          setIsAvatarUpdated(true);
          markDirty();
        }
      }
    });
  }, [markDirty]);

  const handleChangePhone = useCallback(
    (t: string) => {
      const digitsOnly = t.replace(/\D/g, '');
      setPhone(digitsOnly);
      markDirty();
    },
    [markDirty],
  );

  const handleChangeName = useCallback(
    (t: string) => {
      setName(t);
      markDirty();
    },
    [markDirty],
  );

  const handleSelectGender = useCallback(
    (g: GenderOption) => {
      setGender(g);
      setGenderModalVisible(false);
      markDirty();
    },
    [markDirty],
  );

  const handleSelectDob = useCallback(
    (selectedDate?: Date) => {
      setShowDatePicker(false);
      if (selectedDate) {
        setDobDate(selectedDate);
        markDirty();
      }
    },
    [markDirty],
  );

  const handleSaveProfile = useCallback(async () => {
    if (!isDirty && !isAvatarUpdated) {
      showSuccess('Nothing to update');
      return;
    }

    if (name.trim() !== (profile?.fullName || '')) {
      if (!name.trim()) {
        showError('Full name is required');
        return;
      }
    }

    const normalized = phone.trim();
    if (normalized !== (profile?.phoneNumber || '')) {
      if (normalized && !/^\d{9,12}$/.test(normalized)) {
        showError('Please enter a valid phone number (9–12 digits).');
        return;
      }
    }

    setSaving(true);
    try {
      let finalImage = profile?.image;

      if (isAvatarUpdated && avatarUri) {
        const res = await uploadApi.uploadImage(avatarUri);
        finalImage = res.imageUrl;
      }

      const payload: any = {};
      if (name.trim() !== (profile?.fullName || ''))
        payload.fullName = name.trim();
      if (normalized !== (profile?.phoneNumber || ''))
        payload.phoneNumber = normalized;

      const prevDobISO = profile?.birthday
        ? new Date(profile.birthday).toISOString()
        : null;
      const newDobISO = dobDate ? dobDate.toISOString() : null;
      if (newDobISO !== prevDobISO && dobDate) payload.birthday = newDobISO;

      const prevGender: GenderOption =
        profile?.gender === 'male' || profile?.gender === 'female'
          ? profile.gender
          : 'unspecified';
      if (gender !== prevGender)
        payload.gender = gender === 'unspecified' ? null : gender;

      if (finalImage !== profile?.image) payload.image = finalImage;

      if (Object.keys(payload).length === 0) {
        showSuccess('Nothing to update');
        return;
      }
      await dispatch(updateUserProfileThunk(payload)).unwrap();
    } catch (e) {
    } finally {
      setSaving(false);
    }
  }, [
    isDirty,
    isAvatarUpdated,
    name,
    phone,
    dobDate,
    gender,
    avatarUri,
    profile,
    dispatch,
  ]);

  const goToAddress = useCallback(() => {
    navigation.navigate('AddressScreen');
  }, [navigation]);

  const defaultAddress =
    profile?.addresses?.find((addr: any) => addr.isDefault)?.addressDetail ||
    '';

  const displayGenderLabel = useMemo(() => {
    if (gender === 'unspecified') return 'Not specified';
    return gender.charAt(0).toUpperCase() + gender.slice(1);
  }, [gender]);

  return (
    <ContainerComponent title="Personal Data" back>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadData(true)}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <SectionComponent styles={styles.center}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatarRing}>
                <Image
                  source={
                    avatarUri
                      ? { uri: avatarUri }
                      : require('../../../assets/images/logo.png')
                  }
                  style={styles.avatar}
                />
              </View>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={handlePickImage}
                activeOpacity={0.9}
              >
                <Edit size={16} color={appColors.white} />
              </TouchableOpacity>
            </View>
            <SpaceComponent height={10} />
            <TextComponent
              text={name || 'Your name'}
              size={16}
              font={appFonts.semiBold}
              color={appColors.text}
            />
            {!!email && <TextComponent text={email} size={12} color="#888" />}
          </SectionComponent>

          <SectionComponent styles={styles.card}>
            <TextComponent text="Profile" size={14} font={appFonts.semiBold} />
            <SpaceComponent height={10} />

            <TextComponent text="Full Name" size={13} color="#666" />
            <SpaceComponent height={6} />
            <InputComponent value={name} onChange={handleChangeName} />

            <SpaceComponent height={12} />
            <TextComponent text="Date of Birth" size={13} color="#666" />
            <SpaceComponent height={6} />
            <TouchableOpacity
              style={styles.pickerInput}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.8}
            >
              <TextComponent
                text={dob || 'Select date'}
                color={dob ? appColors.text : '#999'}
                size={14}
              />
              <ArrowDown2 size={18} color="#9E9E9E" />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={dobDate || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()}
                onChange={(_, selectedDate) =>
                  handleSelectDob(selectedDate || undefined)
                }
              />
            )}

            <SpaceComponent height={12} />
            <TextComponent text="Gender" size={13} color="#666" />
            <SpaceComponent height={6} />
            <TouchableOpacity
              style={styles.pickerInput}
              onPress={() => setGenderModalVisible(true)}
              activeOpacity={0.8}
            >
              <TextComponent
                text={displayGenderLabel}
                color={gender === 'unspecified' ? '#999' : appColors.text}
                size={14}
              />
              <ArrowDown2 size={18} color="#9E9E9E" />
            </TouchableOpacity>
          </SectionComponent>

          <SectionComponent styles={styles.card}>
            <TextComponent text="Contact" size={14} font={appFonts.semiBold} />
            <SpaceComponent height={10} />

            <TextComponent text="Email" size={13} color="#666" />
            <SpaceComponent height={6} />
            <InputComponent
              value={email}
              editable={false}
              onChange={() => {}}
            />

            <SpaceComponent height={12} />
            <TextComponent text="Phone Number" size={13} color="#666" />
            <SpaceComponent height={6} />
            <InputComponent
              value={phone}
              onChange={handleChangePhone}
              placeholder="Enter phone number"
            />
          </SectionComponent>

          <SectionComponent styles={styles.card}>
            <TextComponent text="Address" size={14} font={appFonts.semiBold} />
            <SpaceComponent height={10} />
            <TouchableOpacity onPress={goToAddress} activeOpacity={0.8}>
              <InputComponent
                value={defaultAddress}
                editable={false}
                onChange={() => {}}
                placeholder={
                  defaultAddress ? undefined : 'No default address — tap to add'
                }
              />
            </TouchableOpacity>
          </SectionComponent>

          <SpaceComponent height={20} />
          <SectionComponent>
            <ButtonComponent
              text={saving ? 'Saving…' : 'Save'}
              type="primary"
              color={appColors.orange}
              styles={styles.saveBtn}
              onPress={saving ? undefined : handleSaveProfile}
            />
          </SectionComponent>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={genderModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setGenderModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setGenderModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <FlatList
              data={genderOptions}
              keyExtractor={item => item}
              ItemSeparatorComponent={() => <View style={styles.divider} />}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => handleSelectGender(item)}
                  activeOpacity={0.9}
                >
                  <TextComponent
                    text={
                      item === 'unspecified'
                        ? 'Not specified'
                        : item.charAt(0).toUpperCase() + item.slice(1)
                    }
                    size={14}
                  />
                </TouchableOpacity>
              )}
            />
          </View>
        </Pressable>
      </Modal>

      {/* Loading overlay */}
      <LoadingModal visible={loading || refreshing || saving} />
    </ContainerComponent>
  );
};

export default PersonalDataScreen;

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 24,
  },
  center: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 2,
  },
  avatarWrap: { position: 'relative' },
  avatarRing: {
    padding: 3,
    borderRadius: 66,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  avatar: { width: 120, height: 120, borderRadius: 60 },
  editBtn: {
    position: 'absolute',
    bottom: 6,
    right: -2,
    padding: 8,
    borderRadius: 18,
    backgroundColor: appColors.orange,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  pickerInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: appColors.gray,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  optionItem: {
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  saveBtn: {
    width: '100%',
    borderRadius: 14,
    paddingVertical: 14,
  },
});
