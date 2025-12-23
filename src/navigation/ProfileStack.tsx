import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { useTranslation } from '../lib/i18n';
import type { ProfileStackParamList } from './types';
import { colors } from '../config/theme';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStack() {
  const { t } = useTranslation();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: 'white',
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={{ title: t('navigation.profile') }}
      />
    </Stack.Navigator>
  );
}

