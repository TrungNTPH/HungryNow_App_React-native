import React from 'react';
import { StyleSheet, View, Image } from 'react-native';
import {
  ContainerComponent,
  SectionComponent,
  TextComponent,
  ButtonComponent,
  RowComponent,
  SpaceComponent,
} from '../../components';
import { useAppSelector } from '../../redux/hooks';
import { userSelector } from '../../redux/reducer/userReducer';
import { appColors, appFonts } from '../../constants';

const Step = ({
  idx,
  title,
  desc,
}: {
  idx: number;
  title: string;
  desc: string;
}) => (
  <View style={styles.step}>
    <View style={styles.stepNum}>
      <TextComponent text={String(idx)} size={12} color="#fff" />
    </View>
    <View style={{ flex: 1 }}>
      <TextComponent text={title} size={14} font={appFonts.semiBold} />
      <TextComponent text={desc} size={12} color={'#6b7280'} />
    </View>
  </View>
);

const ManageAccountsScreen = ({ navigation }: any) => {
  const { profile } = useAppSelector(userSelector);

  return (
    <ContainerComponent title="Manage Accounts" back>
      <SectionComponent styles={styles.card}>
        <TextComponent
          text="Current account"
          size={14}
          font={appFonts.semiBold}
        />
        <RowComponent styles={{ alignItems: 'center', marginTop: 10 }}>
          <Image
            source={
              profile?.image
                ? { uri: profile.image }
                : require('../../assets/images/logo.png')
            }
            style={styles.avatar}
          />
          <View style={{ flex: 1 }}>
            <TextComponent
              text={profile?.fullName || 'HungryNow user'}
              size={15}
              font={appFonts.semiBold}
            />
            <TextComponent
              text={profile?.email || '—'}
              size={12}
              color={'#6b7280'}
            />
          </View>
        </RowComponent>
      </SectionComponent>

      <SectionComponent styles={styles.card}>
        <TextComponent text="How it works" size={14} font={appFonts.semiBold} />
        <SpaceComponent height={8} />
        <Step
          idx={1}
          title="Add via email or social"
          desc="You can sign in another account using email or social login."
        />
        <Step
          idx={2}
          title="Quick switch"
          desc="After signing in, go back to Profile to quickly switch between accounts."
        />
        <Step
          idx={3}
          title="Keep orders separate"
          desc="Orders, addresses, and vouchers are tied to each account."
        />
      </SectionComponent>

      <SectionComponent styles={styles.card}>
        <TextComponent text="Actions" size={14} font={appFonts.semiBold} />
        <SpaceComponent height={10} />
        <ButtonComponent
          text="Add via Email/Password"
          type="primary"
          color={appColors.orange}
          onPress={() => navigation.navigate('LoginScreen', { mode: 'add' })}
          styles={{ width: '100%', borderRadius: 12, paddingVertical: 12 }}
        />
        <SpaceComponent height={8} />
        <ButtonComponent
          text="Create a new account"
          type="primary"
          color={appColors.orange}
          onPress={() => navigation.navigate('RegisterScreen', { mode: 'add' })}
          styles={{ width: '100%', borderRadius: 12, paddingVertical: 12 }}
        />
      </SectionComponent>
    </ContainerComponent>
  );
};

export default ManageAccountsScreen;

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#f3f4f6',
    marginRight: 10,
  },
  step: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 8,
  },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: appColors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
});
