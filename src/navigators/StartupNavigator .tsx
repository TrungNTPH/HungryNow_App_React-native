import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SplashScreen, OnboardingScreen } from '../screens';

const Stack = createNativeStackNavigator();

const StartupNavigator = ({
  onFinishOnboarding,
}: {
  onFinishOnboarding: () => void;
}) => {
  const SplashWrapper = ({ navigation }: any) => {
    useEffect(() => {
      const timer = setTimeout(() => {
        navigation.replace('OnboardingScreen');
      }, 2000);
      return () => clearTimeout(timer);
    }, []);

    return <SplashScreen />;
  };

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashWrapper} />
      <Stack.Screen
        name="OnboardingScreen"
        children={() => <OnboardingScreen onFinish={onFinishOnboarding} />}
      />
    </Stack.Navigator>
  );
};

export default StartupNavigator;
