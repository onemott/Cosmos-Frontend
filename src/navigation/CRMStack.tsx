import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CRMScreen from '../screens/crm/CRMScreen';
import { useTranslation } from '../lib/i18n';
import type { CRMStackParamList } from './types';
import { colors } from '../config/theme';

const Stack = createNativeStackNavigator<CRMStackParamList>();

export default function CRMStack() {
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
        name="CRMHome"
        component={CRMScreen}
        options={{ title: t('navigation.myHub') }}
      />
    </Stack.Navigator>
  );
}

