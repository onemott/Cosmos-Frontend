import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { config } from '@gluestack-ui/config';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BrandingProvider } from './src/contexts/BrandingContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { CartProvider } from './src/contexts/CartContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import RootNavigator from './src/navigation/RootNavigator';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <QueryClientProvider client={queryClient}>
        <GluestackUIProvider config={config}>
          <LanguageProvider>
            <BrandingProvider>
              <AuthProvider>
                <CartProvider>
                  <RootNavigator />
                </CartProvider>
              </AuthProvider>
            </BrandingProvider>
          </LanguageProvider>
        </GluestackUIProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
