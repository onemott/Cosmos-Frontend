import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DocumentsListScreen from '../screens/documents/DocumentsListScreen';
import DocumentViewerScreen from '../screens/documents/DocumentViewerScreen';
import type { DocumentsStackParamList } from './types';

const Stack = createNativeStackNavigator<DocumentsStackParamList>();

export default function DocumentsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="DocumentsList"
        component={DocumentsListScreen}
        options={{ title: 'Documents' }}
      />
      <Stack.Screen
        name="DocumentViewer"
        component={DocumentViewerScreen}
        options={({ route }) => ({ title: route.params.documentName })}
      />
    </Stack.Navigator>
  );
}

