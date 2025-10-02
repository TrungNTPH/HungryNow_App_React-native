import React from 'react';
import { Modal, View, StyleSheet, Image } from 'react-native';
import { ButtonComponent, SpaceComponent, TextComponent } from '../components';
import { appColors, appFonts } from '../constants';

interface Props {
  visible: boolean;
  onClose: () => void;
  onNavigateLogin: () => void;
}

const PasswordChangedModal = ({ visible, onClose, onNavigateLogin }: Props) => {
  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Image
            source={require('../assets/images/password_changed.png')}
            style={styles.image}
            resizeMode="contain"
          />
          <SpaceComponent height={20} />
          <TextComponent
            text="Password Changed"
            size={22}
            font={appFonts.semiBold}
            styles={styles.title}
          />
          <SpaceComponent height={10} />
          <TextComponent
            text="Password changed successfully, you can login again with a new password"
            size={14}
            color={appColors.gray}
            styles={styles.description}
          />
          <SpaceComponent height={30} />
          <ButtonComponent
            text="LOGIN"
            type="primary"
            color={appColors.orange}
            styles={[{ width: 375 }]}
            onPress={onNavigateLogin}
          />
        </View>
      </View>
    </Modal>
  );
};

export default PasswordChangedModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000060',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: appColors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  image: {
    width: 150,
    height: 150,
  },
  title: {
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
