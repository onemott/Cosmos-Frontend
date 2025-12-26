import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeStack from './HomeStack';
import AccountsStack from './AccountsStack';
import LabStack from './LabStack';
import CRMStack from './CRMStack';
import ProfileStack from './ProfileStack';
import type { MainTabParamList } from './types';
import { colors } from '../config/theme';
import { usePrimaryColor } from '../contexts/BrandingContext';
import { useTranslation } from '../lib/i18n';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabs() {
  const { t } = useTranslation();
  const primaryColor = usePrimaryColor();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Accounts') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'Lab') {
            iconName = focused ? 'flask' : 'flask-outline';
          } else if (route.name === 'CRM') {
            iconName = focused ? 'briefcase' : 'briefcase-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'ellipse';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: primaryColor,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopWidth: 0,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} options={{ title: t('navigation.home') }} />
      <Tab.Screen name="Accounts" component={AccountsStack} options={{ title: t('navigation.accounts') }} />
      <Tab.Screen name="Lab" component={LabStack} options={{ title: t('navigation.lab') }} />
      <Tab.Screen name="CRM" component={CRMStack} options={{ title: t('navigation.crm') }} />
      <Tab.Screen name="Profile" component={ProfileStack} options={{ title: t('navigation.profile') }} />
    </Tab.Navigator>
  );
}
