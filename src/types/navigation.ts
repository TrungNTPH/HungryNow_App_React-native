export type RootStackParamList = {
  TabNavigator: undefined;

  // Auth
  LoginScreen: undefined;
  RegisterScreen: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
  TermsPolicyScreen: undefined;
  Verification: undefined;

  // Cart
  CompletionScreen: undefined;
  PaymentScreen: undefined;
  ZaloPayWebView: {
    url: string;
    paymentMethod: 'ZaloPay';
    intentId: string;
  };

  // Food
  ComboDetailScreen: undefined;
  FoodDetailScreen: undefined;
  RatingScreen: undefined;

  // Home
  CategoryScreen: undefined;
  NotificationDetailScreen: undefined;
  NotificationScreen: undefined;
  SearchScreen: undefined;
  SeeAllComboScreen: undefined;
  SeeAllFeaturedScreen: undefined;
  SeeAllFoodScreen: undefined;

  // Invoice
  InvoiceDetailScreen: undefined;
  InvoiceScreen: undefined;
  ReviewFoodScreen: undefined;
  DeliveryTrackingScreen: {
    orderId?: string;
    shareLink?: string;
    status?: string;
  };

  // Personal
  AddAddressScreen: undefined;
  AddressScreen: undefined;
  MapScreen: undefined;
  PersonalDataScreen: undefined;
  PhoneNumberScreen: undefined;
  PhoneVerificationScreen: undefined;
  UpdateAddressScreen: undefined;

  // Profile
  HelpCenterScreen: undefined;
  ManageAccountsScreen: undefined;

  // Setting
  ChangeLanguageScreen: undefined;
  ChangePasswordScreen: undefined;
  ForgotPasswordScreen: undefined;
  ResetPasswordScreen: undefined;
  SettingScreen: undefined;
  VerificationScreen: undefined;

  // Voucher
  VoucherDetailScreen: undefined;
  VoucherScreen: undefined;
};
