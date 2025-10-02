import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import React from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { appColors, appFonts } from '../../../constants';
import { ContainerComponent } from '../../../components';

const SettingScreen = ({ navigation }: any) => {
  const renderRow = (icon: string, label: string, onPress: () => void) => (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <Ionicons name={icon} size={20} color={appColors.text} />
      <Text style={styles.rowText}>{label}</Text>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={appColors.text}
        style={styles.arrow}
      />
    </TouchableOpacity>
  );

  return (
    <ContainerComponent title="Settings" back>
      <ScrollView contentContainerStyle={styles.content}>
        {renderRow('lock-closed-outline', 'Change Password', () =>
          navigation.navigate('ChangePasswordScreen'),
        )}

        {renderRow('language-outline', 'Change Language', () =>
          navigation.navigate('ChangeLanguageScreen'),
        )}
      </ScrollView>
    </ContainerComponent>
  );
};

export default SettingScreen;

const styles = StyleSheet.create({
  content: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  sectionLabel: {
    fontSize: 14,
    color: appColors.text,
    fontWeight: '500',
    marginBottom: 8,
    fontFamily: appFonts.semiBold,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    paddingVertical: 12,
  },
  rowText: {
    fontSize: 16,
    marginLeft: 12,
    color: appColors.text,
    fontFamily: appFonts.regular,
  },
  arrow: {
    marginLeft: 'auto',
  },
});
