import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  BackHandler,
  Platform,
  Linking,
} from 'react-native';
import WebView, { WebViewNavigation } from 'react-native-webview';
import Ionicons from 'react-native-vector-icons/Ionicons';
import queryString from 'query-string';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'ZaloPayWebView'>;

const ZaloPayWebView: React.FC<Props> = ({ route, navigation }) => {
  const { url } = route.params;

  const handledRef = useRef(false);
  const webRef = useRef<WebView>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markHandled = () => {
    if (handledRef.current) return false;
    handledRef.current = true;
    return true;
  };

  const handleClose = useCallback(() => {
    if (!markHandled()) return;
    try {
      webRef.current?.stopLoading();
    } finally {
      navigation.goBack();
    }
  }, [navigation]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleClose();
      return true;
    });
    timeoutRef.current = setTimeout(() => {
      if (!handledRef.current) handleClose();
    }, 10 * 60 * 1000);

    return () => {
      sub.remove();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [handleClose]);

  const qpick = (v: unknown): string => {
    if (Array.isArray(v)) return String(v[0] ?? '');
    return String(v ?? '');
  };

  const detectSuccess = (currentUrl: string) => {
    try {
      const { url: parsedUrl, query } = queryString.parseUrl(currentUrl);
      const rawStatus = qpick(
        (query.status ??
          query.resultCode ??
          query.result_code ??
          query.return_code ??
          query.code) as any,
      );
      const successFlag = qpick(
        (query.success ?? query.isSuccess ?? query.paid) as any,
      );

      const s = rawStatus.toLowerCase();
      const f = successFlag.toLowerCase();
      const u = parsedUrl.toLowerCase();

      const looksSuccess =
        s === '1' ||
        s === '01' ||
        s === '00' ||
        s === 'success' ||
        s === 'successful' ||
        f === 'true' ||
        f === '1' ||
        /(?:^|[/?#])success(?:[/?#]|$)/.test(u) ||
        /(?:^|[/?#])paid(?:[/?#]|$)/.test(u);

      return looksSuccess;
    } catch {
      return false;
    }
  };

  const onNavChange = useCallback(
    (navState: WebViewNavigation) => {
      if (handledRef.current) return;

      const curUrl = navState?.url || '';
      if (!curUrl) return;

      if (detectSuccess(curUrl)) {
        if (!markHandled()) return;
        try {
          webRef.current?.stopLoading();
        } finally {
          navigation.goBack();
        }
        return;
      }

      if (/cancel|canceled|cancelled|failed|error/.test(curUrl.toLowerCase())) {
        handleClose();
      }
    },
    [navigation, handleClose],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleClose}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={22} color="#222" />
        </TouchableOpacity>
      </View>

      <WebView
        ref={webRef}
        source={{ uri: url }}
        startInLoadingState
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
        onNavigationStateChange={onNavChange}
        onShouldStartLoadWithRequest={req => {
          if (req.url.startsWith('http')) return true;
          if (/^[a-z]+:\/\//i.test(req.url)) {
            Linking.openURL(req.url).catch(() => {});
            return false;
          }
          return true;
        }}
        onError={() => {
          if (!handledRef.current) handleClose();
        }}
        onHttpError={() => {
          if (!handledRef.current) handleClose();
        }}
        {...(Platform.OS === 'android'
          ? {
              thirdPartyCookiesEnabled: true as const,
              allowFileAccess: true as const,
            }
          : {})}
      />
    </View>
  );
};

export default ZaloPayWebView;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: {
    height: 48,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
});
