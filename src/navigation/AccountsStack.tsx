import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AccountsListScreen from '../screens/accounts/AccountsListScreen';
import AccountDetailScreen from '../screens/accounts/AccountDetailScreen';
import type { AccountsStackParamList } from './types';

const Stack = createNativeStackNavigator<AccountsStackParamList>();

export default function AccountsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AccountsList"
        component={AccountsListScreen}
        options={{ title: 'Accounts' }}
      />
      <Stack.Screen
        name="AccountDetail"
        component={AccountDetailScreen}
        options={({ route }) => ({ title: route.params.accountName })}
      />
    </Stack.Navigator>
  );
}

