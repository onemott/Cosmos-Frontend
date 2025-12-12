import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AllocationLabScreen from '../screens/lab/AllocationLabScreen';
import type { ProductsStackParamList } from './types';
import { colors } from '../config/theme';

const Stack = createNativeStackNavigator<ProductsStackParamList>();

export default function ProductsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: 'white',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen
        name="ProductsList"
        component={AllocationLabScreen}
        options={{ title: 'Allocation Lab' }}
      />
    </Stack.Navigator>
  );
}

