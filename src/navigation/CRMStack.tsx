import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CRMScreen from '../screens/crm/CRMScreen';
import type { CRMStackParamList } from './types';
import { colors } from '../config/theme';

const Stack = createNativeStackNavigator<CRMStackParamList>();

export default function CRMStack() {
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
        options={{ title: 'My Hub' }}
      />
    </Stack.Navigator>
  );
}

