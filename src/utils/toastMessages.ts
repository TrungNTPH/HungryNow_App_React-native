import Toast from 'react-native-toast-message';

export const showSuccess = (message: string) =>
  Toast.show({
    type: 'success',
    text1: 'Success',
    text2: message,
  });

export const showError = (message: string) =>
  Toast.show({
    type: 'error',
    text1: 'Error',
    text2: message,
  });

export const showInfo = (title: string, message: string) =>
  Toast.show({
    type: 'info',
    text1: title,
    text2: message,
  });
