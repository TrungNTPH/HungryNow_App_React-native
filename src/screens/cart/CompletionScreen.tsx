import React, { useEffect } from 'react';
import { View, StyleSheet, Image, BackHandler } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { TextComponent } from '../../components';
import { appFonts } from '../../constants';
import { useFocusEffect } from '@react-navigation/native';

const CompletionScreen = ({ navigation }: any) => {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withTiming(1, {
      duration: 800,
      easing: Easing.out(Easing.exp),
    });

    const timeout = setTimeout(() => {
      (navigation as any).navigate('TabNavigator');
    }, 3000);

    return () => clearTimeout(timeout);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => true;
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );
      return () => subscription.remove();
    }, []),
  );

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.animatedBox, animatedStyle]}>
        <Image
          source={require('../../assets/images/password_changed.png')}
          style={styles.image}
        />
      </Animated.View>

      <TextComponent text="Order Completed" styles={styles.title} />
      <TextComponent
        text="Redirecting to home screen..."
        styles={styles.subtext}
      />
    </View>
  );
};

export default CompletionScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottie: {
    width: 300,
    height: 300,
    position: 'absolute',
    top: 0,
  },
  animatedBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  image: {
    width: 100,
    height: 100,
  },
  title: {
    fontFamily: appFonts.bold,
    fontSize: 24,
    marginBottom: 8,
  },
  subtext: {
    fontFamily: appFonts.regular,
    fontSize: 14,
    color: '#888',
  },
});
