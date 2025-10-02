import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React, { ReactNode, useState, useEffect } from 'react';
import { appColors } from '../constants/appColors';
import { User } from 'iconsax-react-native';
import { TextComponent } from '../components';
import { Platform } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {
  CartScreen,
  FavoriteScreen,
  HomeScreen,
  ProfileScreen,
  LoginRequiredScreen,
  ChatAIScreen,
} from '../screens';
import { getToken } from '../utils/authToken';

const TabNavigator = () => {
  const Tab = createBottomTabNavigator();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = getToken();
    setIsLoggedIn(!!token);
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 88 : 68,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: appColors.white,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let icon: ReactNode;
          color = focused ? appColors.orange : appColors.gray;
          size = 24;

          switch (route.name) {
            case 'Home':
              icon = <MaterialIcons name="home" size={size} color={color} />;
              break;
            case 'Cart':
              icon = (
                <MaterialIcons name="shopping-cart" size={size} color={color} />
              );
              break;
            case 'Favorite':
              icon = (
                <MaterialIcons name="favorite" size={size} color={color} />
              );
              break;
            case 'Chat':
              icon = <MaterialIcons name="chat" size={size} color={color} />;
              break;
            case 'Profile':
              icon = <User size={size} variant="Bold" color={color} />;
              break;
          }

          return icon;
        },
        tabBarIconStyle: {
          marginTop: 8,
        },
        tabBarLabel: ({ focused }) => (
          <TextComponent
            text={route.name}
            flex={0}
            size={12}
            color={focused ? appColors.orange : appColors.gray}
            styles={{
              marginBottom: Platform.OS === 'android' ? 12 : 0,
            }}
          />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen}/>
      <Tab.Screen
        name="Cart"
        component={isLoggedIn ? CartScreen : LoginRequiredScreen}
      />
      <Tab.Screen
        name="Chat"
        component={isLoggedIn ? ChatAIScreen : LoginRequiredScreen}
      />
      <Tab.Screen
        name="Favorite"
        component={isLoggedIn ? FavoriteScreen : LoginRequiredScreen}
      />
      <Tab.Screen
        name="Profile"
        component={isLoggedIn ? ProfileScreen : LoginRequiredScreen}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
