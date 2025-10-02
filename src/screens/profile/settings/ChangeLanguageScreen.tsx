import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
  Image,
  RefreshControl,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {
  ContainerComponent,
  SectionComponent,
  TextComponent,
  ButtonComponent,
} from '../../../components';
import { appColors } from '../../../constants';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import {
  clearUserMessages,
  userSelector,
} from '../../../redux/reducer/userReducer';
import { updateUserProfileThunk } from '../../../redux/actions/userAction';
import { showSuccess, showError } from '../../../utils/toastMessages';

const languages = [
  {
    key: 'en',
    label: 'English',
    icon: require('../../../assets/images/us.png'),
  },
  {
    key: 'vi',
    label: 'Vietnamese',
    icon: require('../../../assets/images/vn.png'),
  },
] as const;

const ChangeLanguageScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const { profile, error, successMessage } = useAppSelector(userSelector);
  const [selectedLang, setSelectedLang] = useState<'en' | 'vi'>(
    profile?.language === 'vi' ? 'vi' : 'en',
  );
  const [refreshing, setRefreshing] = useState(false);

  const handleSave = useCallback(async () => {
    try {
      await dispatch(
        updateUserProfileThunk({ language: selectedLang }),
      ).unwrap();
      navigation.goBack();
    } catch {
      showError('Failed to update language');
    }
  }, [dispatch, navigation, selectedLang]);

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      if (profile?.language === 'vi' || profile?.language === 'en') {
        setSelectedLang(profile.language);
        showSuccess('Language refreshed');
      }
    } catch {
      showError('Failed to refresh language');
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, profile?.language]);

  useEffect(() => {
    const errorMapping = [
      {
        label: 'Language',
        hasError: !!error,
        clear: () => dispatch(clearUserMessages()),
      },
    ];

    errorMapping.forEach(({ label, hasError, clear }) => {
      if (hasError && !refreshing) {
        showError(`Failed to update ${label}`);
        clear();
      }
    });
  }, [error, refreshing]);

  useEffect(() => {
    const successMapping = [
      {
        message: successMessage,
        clear: () => dispatch(clearUserMessages()),
      },
    ];

    successMapping.forEach(({ message, clear }) => {
      if (message && !refreshing) {
        showSuccess(message);
        clear();
      }
    });
  }, [successMessage, refreshing]);

  const renderItem = ({ item }: { item: (typeof languages)[number] }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => setSelectedLang(item.key)}
    >
      <Image source={item.icon} style={styles.flagIcon} />
      <TextComponent
        text={item.label}
        size={16}
        color={selectedLang === item.key ? appColors.orange : appColors.text}
        styles={styles.labelText}
      />
      <MaterialIcons
        name={
          selectedLang === item.key ? 'check-box' : 'check-box-outline-blank'
        }
        size={24}
        color={selectedLang === item.key ? appColors.orange : appColors.gray}
        style={styles.checkIcon}
      />
    </TouchableOpacity>
  );

  return (
    <ContainerComponent back title="Change Language">
      <SectionComponent>
        <FlatList
          data={languages}
          renderItem={renderItem}
          keyExtractor={item => item.key}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />

        <ButtonComponent
          text="Save"
          type="primary"
          color={appColors.orange}
          styles={{ marginTop: 10, width: '100%' }}
          onPress={handleSave}
        />
      </SectionComponent>
    </ContainerComponent>
  );
};

export default ChangeLanguageScreen;

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  flagIcon: {
    width: 28,
    height: 20,
    resizeMode: 'contain',
    marginRight: 12,
  },
  labelText: {
    flex: 1,
  },
  checkIcon: {
    marginLeft: 8,
  },
});
