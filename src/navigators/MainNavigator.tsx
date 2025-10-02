import React from 'react';
import { StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import {
  AddAddressScreen,
  AddressScreen,
  CategoryScreen,
  ChangeLanguageScreen,
  ChangePasswordScreen,
  ComboDetailScreen,
  CompletionScreen,
  FoodDetailScreen,
  ForgotPassword,
  ForgotPasswordScreen,
  HelpCenterScreen,
  InvoiceDetailScreen,
  InvoiceScreen,
  LoginRequiredScreen,
  LoginScreen,
  ManageAccountsScreen,
  NotificationDetailScreen,
  NotificationScreen,
  PaymentScreen,
  PersonalDataScreen,
  PhoneNumberScreen,
  PhoneVerificationScreen,
  RatingScreen,
  RegisterScreen,
  ResetPassword,
  ResetPasswordScreen,
  ReviewFoodScreen,
  SearchScreen,
  SeeAllComboScreen,
  SeeAllFeaturedScreen,
  SeeAllFoodScreen,
  SettingScreen,
  DeliveryTrackingScreen,
  TermsPolicyScreen,
  UpdateAddressScreen,
  Verification,
  VerificationScreen,
  VoucherDetailScreen,
  VoucherScreen,
  ZaloPayWebView,
} from '../screens';
import { useSelector } from 'react-redux';
import { authSelector } from '../redux/reducer/authReducer';
import { RootStackParamList } from '../types/navigation';
import { defaultAnimation, fadeAnimation } from '../configs/animationConfig';

const Stack = createNativeStackNavigator<RootStackParamList>();

const MainNavigator = () => {
  const auth = useSelector(authSelector);
  const isLoggedIn = !!auth.accesstoken;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, ...defaultAnimation }}>
      <Stack.Screen name="TabNavigator" component={TabNavigator} />

      {/* Auth */}
      <Stack.Screen name="LoginScreen" component={LoginScreen} options={fadeAnimation}/>
      <Stack.Screen name="RegisterScreen" component={RegisterScreen} options={fadeAnimation} />
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
      <Stack.Screen name="ResetPassword" component={ResetPassword} />
      <Stack.Screen name="TermsPolicyScreen" component={TermsPolicyScreen} />
      <Stack.Screen name="Verification" component={Verification} />

      {/* Cart */}
      <Stack.Screen name="CompletionScreen" component={CompletionScreen} />
      <Stack.Screen name="PaymentScreen" component={PaymentScreen} />
      <Stack.Screen
        name="ZaloPayWebView"
        component={(props: any) => <ZaloPayWebView {...props} />}
      />
      {/* Food */}
      <Stack.Screen name="ComboDetailScreen" component={ComboDetailScreen} />
      <Stack.Screen name="FoodDetailScreen" component={FoodDetailScreen} />
      <Stack.Screen name="RatingScreen" component={RatingScreen} />

      {/* Home */}
      <Stack.Screen name="CategoryScreen" component={CategoryScreen} />
      <Stack.Screen
        name="NotificationDetailScreen"
        component={isLoggedIn ? NotificationDetailScreen : LoginRequiredScreen}
      />
      <Stack.Screen
        name="NotificationScreen"
        component={isLoggedIn ? NotificationScreen : LoginRequiredScreen}
      />
      <Stack.Screen name="SearchScreen" component={SearchScreen} />
      <Stack.Screen name="SeeAllComboScreen" component={SeeAllComboScreen} />
      <Stack.Screen
        name="SeeAllFeaturedScreen"
        component={SeeAllFeaturedScreen}
      />
      <Stack.Screen name="SeeAllFoodScreen" component={SeeAllFoodScreen} />

      {/* Invoice */}
      <Stack.Screen
        name="InvoiceDetailScreen"
        component={InvoiceDetailScreen}
      />
      <Stack.Screen name="InvoiceScreen" component={InvoiceScreen} />
      <Stack.Screen name="ReviewFoodScreen" component={ReviewFoodScreen} />
      <Stack.Screen
        name="DeliveryTrackingScreen"
        component={DeliveryTrackingScreen}
      />

      {/* Personal */}
      <Stack.Screen name="AddAddressScreen" component={AddAddressScreen} />
      <Stack.Screen name="AddressScreen" component={AddressScreen} />
      <Stack.Screen name="PersonalDataScreen" component={PersonalDataScreen} />
      <Stack.Screen name="PhoneNumberScreen" component={PhoneNumberScreen} />
      <Stack.Screen
        name="PhoneVerificationScreen"
        component={PhoneVerificationScreen}
      />
      <Stack.Screen
        name="UpdateAddressScreen"
        component={UpdateAddressScreen}
      />

      {/* Profile */}
      <Stack.Screen name="HelpCenterScreen" component={HelpCenterScreen} />
      <Stack.Screen
        name="ManageAccountsScreen"
        component={ManageAccountsScreen}
      />

      {/* Setting */}
      <Stack.Screen
        name="ChangeLanguageScreen"
        component={ChangeLanguageScreen}
      />
      <Stack.Screen
        name="ChangePasswordScreen"
        component={ChangePasswordScreen}
      />
      <Stack.Screen
        name="ForgotPasswordScreen"
        component={ForgotPasswordScreen}
      />
      <Stack.Screen
        name="ResetPasswordScreen"
        component={ResetPasswordScreen}
      />
      <Stack.Screen name="SettingScreen" component={SettingScreen} />
      <Stack.Screen name="VerificationScreen" component={VerificationScreen} />

      {/* Voucher */}
      <Stack.Screen
        name="VoucherDetailScreen"
        component={VoucherDetailScreen}
      />
      <Stack.Screen name="VoucherScreen" component={VoucherScreen} />
    </Stack.Navigator>
  );
};

export default MainNavigator;

const styles = StyleSheet.create({});
