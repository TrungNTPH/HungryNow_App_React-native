export interface AddressModel {
  _id?: string;
  label: string;
  addressDetail: string;
  latitude: number;
  longitude: number;
  isDefault?: boolean;
}

export interface AddressData {
  label: string;
  addressDetail: string;
  latitude: number;
  longitude: number;
  isDefault?: boolean;
}
