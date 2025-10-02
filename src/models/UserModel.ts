import { AddressModel } from './AddressModel';

export type Gender = 'male' | 'female';
export type UserRole = 'user' | 'admin' | 'employee';

export interface UserModel {
  _id?: string;
  fullName: string;
  email: string;
  password?: string;
  phoneNumber?: string;
  addresses?: AddressModel[];
  birthday?: string | Date;
  gender?: Gender;
  role: UserRole;
  isLoyalCustomer?: boolean;
  isBlocked?: boolean;
  language?: 'vi' | 'en';
  provider?: 'local' | 'google' | 'facebook';
  providerId?: string;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  image?: string;
  fcmToken?: string;
  createdAt?: string;
  updatedAt?: string;
}
