import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';

import { HomeScreen } from '../screens/HomeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { SupportScreen } from '../screens/SupportScreen';

const Tab = createBottomTabNavigator();

export const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName: any;

          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Perfil') iconName = 'person';
          else if (route.name === 'Suporte') iconName = 'headset-mic';
          else if (route.name === 'Config') iconName = 'settings';

          return <MaterialIcons name={iconName} size={size + 2} color={color} />;
        },
        tabBarActiveTintColor: '#0056b3',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          height: 65,
          paddingBottom: 10,
          paddingTop: 5,
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#eee',
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        }
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
      <Tab.Screen name="Suporte" component={SupportScreen} />
      <Tab.Screen name="Config" component={SettingsScreen} options={{ title: 'Ajustes' }} />
    </Tab.Navigator>
  );
};
