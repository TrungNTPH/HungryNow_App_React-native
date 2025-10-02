import React from 'react';
import { View, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  ButtonComponent,
  ContainerComponent,
  TextComponent,
} from '../components';
import { appColors, appFonts } from '../constants';

const LoginRequiredScreen = ({ navigation }: any) => {
  return (
    <ContainerComponent back title="Login Required" isScroll={false}>
      <View style={styles.wrap}>
        <View style={styles.illustration}>
          <View style={styles.circleLg} />
          <View style={styles.circleSm} />
          <View style={styles.iconBadge}>
            <Ionicons name="lock-closed" size={36} color="#fff" />
          </View>
        </View>

        <TextComponent
          text="You need to log in to access this section."
          size={18}
          font={appFonts.semiBold}
          styles={styles.title}
        />
        <TextComponent
          text="Sign in to view your orders, favorites, and personalized offers."
          size={14}
          color="#666"
          styles={styles.subtitle}
        />

        <View style={styles.list}>
          {[
            'Track orders & delivery updates',
            'Save favorites and re-order faster',
            'Unlock vouchers & member perks',
          ].map((t, i) => (
            <View style={styles.listRow} key={i}>
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={appColors.orange}
              />
              <TextComponent
                text={t}
                size={13}
                color="#444"
                styles={{ marginLeft: 8, flex: 1 }}
              />
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <ButtonComponent
            text="Login"
            type="primary"
            color={appColors.orange}
            onPress={() => navigation.navigate('LoginScreen')}
            styles={styles.btnPrimary}
            textStyles={{ fontFamily: appFonts.semiBold }}
          />
          <ButtonComponent
            text="Register"
            type="primary"
            color="#fff"
            onPress={() => navigation.navigate('RegisterScreen')}
            styles={styles.btnSecondary}
            textStyles={{
              color: appColors.orange,
              fontFamily: appFonts.semiBold,
            }}
          />
        </View>

        <TextComponent
          text="Having trouble? You can reset your password on the login screen."
          size={12}
          color="#999"
          styles={{ marginTop: 14, textAlign: 'center' }}
        />
      </View>
    </ContainerComponent>
  );
};

export default LoginRequiredScreen;

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: '#F7F7F7',
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustration: {
    width: 140,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  circleLg: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFA50026',
  },
  circleSm: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFA50040',
    right: 6,
    top: 10,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: appColors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  title: {
    textAlign: 'center',
    marginTop: 4,
    color: appColors.text,
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 10,
  },
  list: {
    width: '100%',
    marginTop: 14,
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    padding: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  actions: {
    width: '100%',
    marginTop: 16,
    gap: 10,
  },
  btnPrimary: {
    width: 135,
    height: 45,
    borderRadius: 12,
    paddingVertical: 12,
  },
  btnSecondary: {
    width: 135,
    height: 45,
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: appColors.orange,
    backgroundColor: '#FFF',
  },
});
