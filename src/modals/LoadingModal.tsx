import React, { useEffect } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Platform,
  ImageSourcePropType,
} from 'react-native';
import Animated, {
  Easing,
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  visible: boolean;
  logoSource?: ImageSourcePropType;
  spinnerColor?: string;
  secondaryColor?: string;
  logoSize?: number;
  ringThickness?: number;
  rounded?: number;
};

const defaultLogo = require('../assets/images/logo.png');

const LoadingModal = ({
  visible,
  logoSource = defaultLogo,
  spinnerColor = '#FF3B30',
  secondaryColor = '#FF9500',
  logoSize = 96,
  ringThickness = 4,
  rounded = 24,
}: Props) => {
  const spinOuter = useSharedValue(0);
  const spinInner = useSharedValue(0);
  const appear = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    if (visible) {
      spinOuter.value = withRepeat(
        withTiming(1, { duration: 1200, easing: Easing.linear }),
        -1,
        false,
      );
      spinInner.value = withRepeat(
        withTiming(1, { duration: 1800, easing: Easing.linear }),
        -1,
        false,
      );
      appear.value = withTiming(1, {
        duration: 180,
        easing: Easing.out(Easing.quad),
      });
    } else {
      appear.value = withTiming(0, {
        duration: 140,
        easing: Easing.in(Easing.quad),
      });
      spinOuter.value = 0;
      spinInner.value = 0;
    }
  }, [visible]);

  const ringOuterSize = logoSize + ringThickness * 7;
  const ringInnerSize = logoSize + ringThickness * 3.5;

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: appear.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(appear.value, [0, 1], [0.98, 1], Extrapolate.CLAMP),
      },
      {
        translateY: interpolate(
          appear.value,
          [0, 1],
          [8, 0],
          Extrapolate.CLAMP,
        ),
      },
    ],
  }));

  const spinnerOuterStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${interpolate(spinOuter.value, [0, 1], [0, Math.PI * 2])}rad`,
      },
    ],
  }));

  const spinnerInnerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${interpolate(spinInner.value, [0, 1], [0, -Math.PI * 2])}rad`,
      },
    ],
  }));

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      accessibilityRole="progressbar"
      style={[
        StyleSheet.absoluteFillObject,
        overlayStyle,
        {
          zIndex: 9999,
          elevation: 9999,
          backgroundColor: 'rgba(0,0,0,0.55)',
          justifyContent: 'center',
          alignItems: 'center',
        },
      ]}
    >
      <Animated.View
        style={[styles.card, { borderRadius: rounded }, cardStyle]}
      >
        <View style={styles.center}>
          <View style={styles.logoWrap}>
            {/* vòng nền mờ */}
            <View
              style={{
                position: 'absolute',
                width: ringOuterSize,
                height: ringOuterSize,
                borderRadius: ringOuterSize / 2,
                borderWidth: ringThickness,
                borderColor: '#ffffff',
              }}
            />
            {/* vòng ngoài */}
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  width: ringOuterSize,
                  height: ringOuterSize,
                  borderRadius: ringOuterSize / 2,
                  borderWidth: ringThickness,
                  borderTopColor: 'transparent',
                  borderRightColor: 'transparent',
                  borderBottomColor: spinnerColor,
                  borderLeftColor: spinnerColor,
                },
                spinnerOuterStyle,
              ]}
            />
            {/* vòng trong */}
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  width: ringInnerSize,
                  height: ringInnerSize,
                  borderRadius: ringInnerSize / 2,
                  borderWidth: ringThickness,
                  borderTopColor: secondaryColor,
                  borderRightColor: 'transparent',
                  borderBottomColor: 'transparent',
                  borderLeftColor: secondaryColor,
                },
                spinnerInnerStyle,
              ]}
            />
            {/* logo */}
            <View
              style={[
                styles.logoHolder,
                {
                  width: logoSize,
                  height: logoSize,
                  borderRadius: Math.max(16, logoSize * 0.18),
                },
              ]}
            >
              <Image
                source={logoSource}
                style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
              />
            </View>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 240,
    minHeight: 240,
    paddingHorizontal: 24,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { alignItems: 'center', justifyContent: 'center' },
  logoWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoHolder: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
});

export default LoadingModal;
