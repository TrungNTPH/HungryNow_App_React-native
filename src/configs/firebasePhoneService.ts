import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { getAuth, signInWithPhoneNumber } from '@react-native-firebase/auth';

export const sendOtp = async (phoneNumber: string) => {
  const confirmation = await signInWithPhoneNumber(getAuth(), phoneNumber);
  return confirmation;
};

export const confirmOtp = async (
  confirmation: FirebaseAuthTypes.ConfirmationResult,
  code: string,
): Promise<string> => {
  const userCredential = await confirmation.confirm(code);

  if (!userCredential?.user) {
    throw new Error('User info is missing');
  }

  return await userCredential.user.getIdToken();
};
