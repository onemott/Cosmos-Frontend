import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AllocationLabScreen from '../screens/lab/AllocationLabScreen';
import ProductDetailScreen from '../screens/lab/ProductDetailScreen';
import type { LabStackParamList } from './types';
import { colors } from '../config/theme';

const Stack = createNativeStackNavigator<LabStackParamList>();

export default function LabStack() {
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
        name="AllocationLab"
        component={AllocationLabScreen}
        options={{ title: 'Allocation Lab' }}
      />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={({ route }) => ({
          title: route.params.product.name,
        })}
      />
    </Stack.Navigator>
  );
}

