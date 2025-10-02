import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { globalStyles } from '../styles';
import { appInfors, appColors, appFonts } from '../constants';

const SplashScreen = () => {
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.03,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1.0,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    });
  }, [fade, scale]);

  return (
    <View style={[globalStyles.container, styles.container]}>
      <StatusBar barStyle="dark-content" backgroundColor={appColors.white} />

      <View style={[styles.blob, styles.blobTL]} />
      <View style={[styles.blob, styles.blobBR]} />

      <Animated.View style={{ opacity: fade, transform: [{ scale }] }}>
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.logo}
        />
      </Animated.View>

      <Animated.Text style={[styles.tagline, { opacity: fade }]}>
        Fast • Fresh • Friendly
      </Animated.Text>

      <View style={styles.loaderWrap}>
        <ActivityIndicator size="small" color={appColors.orange} />
      </View>
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    backgroundColor: appColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logo: {
    width: appInfors.sizes.WIDTH * 0.58,
    height: appInfors.sizes.WIDTH * 0.58 * 0.38,
    resizeMode: 'contain',
  },
  tagline: {
    marginTop: 10,
    fontSize: 14,
    color: '#6B7280',
    fontFamily: appFonts.medium,
    letterSpacing: 0.3,
  },
  loaderWrap: {
    marginTop: 14,
  },
  blob: {
    position: 'absolute',
    backgroundColor: appColors.orange,
    opacity: 0.08,
    borderRadius: 9999,
  },
  blobTL: {
    width: appInfors.sizes.WIDTH * 0.9,
    height: appInfors.sizes.WIDTH * 0.9,
    top: -appInfors.sizes.WIDTH * 0.45,
    left: -appInfors.sizes.WIDTH * 0.25,
  },
  blobBR: {
    width: appInfors.sizes.WIDTH * 0.75,
    height: appInfors.sizes.WIDTH * 0.75,
    bottom: -appInfors.sizes.WIDTH * 0.35,
    right: -appInfors.sizes.WIDTH * 0.2,
  },
});
