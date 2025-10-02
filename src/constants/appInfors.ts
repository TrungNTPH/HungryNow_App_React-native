import { Dimensions } from 'react-native';
import Config from 'react-native-config';

export const appInfors = {
  sizes: {
    WIDTH: Dimensions.get('window').width,
    HEIGHT: Dimensions.get('window').height,
  },
  BASE_URL: `http://${Config.IPV4}:2502/api`,
};
