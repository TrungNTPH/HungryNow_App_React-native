import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TextComponent } from '../../components';
import { appColors, appFonts, appInfors } from '../../constants';
import Swiper from 'react-native-swiper';
import { globalStyles } from '../../styles';
import Icon from 'react-native-vector-icons/Feather';

import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const SLIDES = [
  { img: require('../../assets/images/onboarding1.jpg') },
  { img: require('../../assets/images/onboarding2.jpg') },
  { img: require('../../assets/images/onboarding3.jpg') },
];

const OnboardingScreen = ({ onFinish }: any) => {
  const [index, setIndex] = useState(0);

  const pageSV = useSharedValue(0);
  const enterSV = useSharedValue(0);
  const pulseSV = useSharedValue(1);

  useEffect(() => {
    pageSV.value = withTiming(index, {
      duration: 320,
      easing: Easing.out(Easing.cubic),
    });
    enterSV.value = 0;
    enterSV.value = withTiming(1, {
      duration: 420,
      easing: Easing.out(Easing.cubic),
    });
  }, [index]);

  useEffect(() => {
    if (index === SLIDES.length - 1) {
      pulseSV.value = withRepeat(
        withTiming(1.06, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        -1,
        true,
      );
    } else {
      pulseSV.value = withTiming(1, { duration: 200 });
    }
  }, [index]);

  const handleFinish = () => {
    onFinish?.();
  };

  const Dot = ({ i }: { i: number }) => {
    const style = useAnimatedStyle(() => {
      const w = withTiming(i === index ? 20 : 10, { duration: 260 });
      const bg = i === index ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.4)';
      return { width: w, backgroundColor: bg };
    }, [index]);
    return <Animated.View style={[styles.dot, style]} />;
  };

  const Overlay = ({ children }: { children: React.ReactNode }) => {
    const style = useAnimatedStyle(() => {
      return {
        transform: [
          {
            translateY: interpolate(
              enterSV.value,
              [0, 1],
              [24, 0],
              Extrapolation.CLAMP,
            ),
          },
          {
            scale: interpolate(enterSV.value, [0, 1], [0.98, 1]),
          },
        ],
        opacity: interpolate(enterSV.value, [0, 1], [0, 1]),
      };
    });
    return (
      <Animated.View style={[styles.overlayContainer, style]}>
        {children}
      </Animated.View>
    );
  };

  const SlideImage = ({ src, i }: { src: any; i: number }) => {
    const style = useAnimatedStyle(() => {
      const active = i === index ? 1 : 0;
      const scale = withTiming(active ? 1.03 : 1, {
        duration: 420,
        easing: Easing.out(Easing.cubic),
      });
      const translateY = withTiming(active ? 0 : 6, { duration: 420 });
      const opacity = withTiming(active ? 1 : 0.8, { duration: 280 });
      return {
        transform: [{ scale }, { translateY }],
        opacity,
      };
    }, [index]);
    return <Animated.Image source={src} style={[styles.image, style]} />;
  };

  const ArrowButton = ({ onPress }: { onPress: () => void }) => {
    const style = useAnimatedStyle(() => ({
      transform: [{ scale: pulseSV.value }],
    }));
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={styles.outerCircle}
      >
        <Animated.View style={[styles.innerCircle, style]}>
          <Icon name="arrow-right" size={22} color={appColors.orange} />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderPagination = () => (
    <View style={styles.dotsContainer}>
      {SLIDES.map((_, i) => (
        <Dot key={i} i={i} />
      ))}
    </View>
  );

  const renderSlide = (imageSource: any, isLast: boolean = false) => (
    <View style={{ flex: 1 }}>
      <SlideImage src={imageSource} i={index} />
      <Overlay>
        <View style={styles.topSection}>
          <TextComponent
            text={`We serve\nincomparable\ndelicacies`}
            size={30}
            color={appColors.white}
            font={appFonts.bold}
            styles={{ textAlign: 'center', marginBottom: 10, lineHeight: 40 }}
          />
          <TextComponent
            text={`All the best restaurants with their top\nmenu waiting for you, they can't wait\nfor your order!!`}
            size={14}
            color={appColors.white}
            font={appFonts.regular}
            styles={{ textAlign: 'center', opacity: 0.9, lineHeight: 20 }}
          />
        </View>

        {renderPagination()}

        {isLast ? (
          <ArrowButton onPress={handleFinish} />
        ) : (
          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={handleFinish} activeOpacity={0.8}>
              <TextComponent
                text="Skip"
                color={appColors.white}
                font={appFonts.medium}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                setIndex(prev => Math.min(prev + 1, SLIDES.length - 1))
              }
              activeOpacity={0.8}
            >
              <TextComponent
                text="Next"
                color={appColors.white}
                font={appFonts.medium}
              />
            </TouchableOpacity>
          </View>
        )}
      </Overlay>
    </View>
  );

  return (
    <View style={[globalStyles.container]}>
      <Swiper
        loop={false}
        onIndexChanged={num => setIndex(num)}
        index={index}
        dot={<View />}
        activeDot={<View />}
      >
        {renderSlide(SLIDES[0].img)}
        {renderSlide(SLIDES[1].img)}
        {renderSlide(SLIDES[2].img, true)}
      </Swiper>
    </View>
  );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
  image: {
    flex: 1,
    width: appInfors.sizes.WIDTH,
    height: appInfors.sizes.HEIGHT,
    resizeMode: 'cover',
  },
  overlayContainer: {
    width: 330,
    height: 400,
    position: 'absolute',
    top: '45%',
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 122, 0, 0.8)',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topSection: { alignItems: 'center' },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
  },
  dot: {
    height: 6,
    borderRadius: 4,
    marginHorizontal: 5,
  },
  buttonRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  outerCircle: {
    alignSelf: 'center',
    padding: 40,
    width: 60,
    height: 60,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: appColors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: appColors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
});