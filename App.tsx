import React from 'react';
// 引入 Expo 提供的 StatusBar 组件，用于控制应用状态栏样式
import { StatusBar } from 'expo-status-bar';
// 引入 GluestackUI 的主题提供者，用于全局 UI 主题配置
import { GluestackUIProvider } from '@gluestack-ui/themed';
// 引入 GluestackUI 的默认配置文件
import { config } from '@gluestack-ui/config';
// 引入 React Query 的核心客户端及其提供者，用于数据请求与缓存管理
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
// 引入 SafeAreaProvider，确保内容在异形屏（刘海、水滴等）安全区域内渲染
import { SafeAreaProvider } from 'react-native-safe-area-context';
// 引入品牌/主题定制上下文提供者，用于动态切换品牌风格
import { BrandingProvider } from './src/contexts/BrandingContext';
// 引入用户认证上下文提供者，管理登录状态及相关逻辑
import { AuthProvider } from './src/contexts/AuthContext';
// 引入购物车上下文提供者，管理购物车数据与操作
import { CartProvider } from './src/contexts/CartContext';
// 引入多语言上下文提供者，提供国际化支持
import { LanguageProvider } from './src/contexts/LanguageContext';
// 引入全局错误边界组件
import { ErrorBoundary } from './src/components/ErrorBoundary';
// 引入根导航器组件，负责整个应用的导航结构
import RootNavigator from './src/navigation/RootNavigator';

// 创建 React Query 客户端实例，并配置默认查询行为
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,                     // 请求失败时最多重试 1 次
      staleTime: 5 * 60 * 1000,     // 数据在 5 分钟内视为新鲜，不会重复请求
      gcTime: 24 * 60 * 60 * 1000,  // 缓存数据保留 24 小时 (垃圾回收时间)
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

// 应用根组件：按顺序包裹各类上下文与 UI 提供者，确保全局功能可用
export default function App() {
  return (
    // SafeAreaProvider：提供安全区域信息，避免内容被刘海等遮挡
    <SafeAreaProvider>
      {/* 状态栏设置 */}
      <StatusBar style="light" />
      <ErrorBoundary>
        {/* PersistQueryClientProvider：为整个应用提供 React Query 客户端，支持数据缓存与同步，并持久化到本地 */}
        <PersistQueryClientProvider 
          client={queryClient} 
          persistOptions={{ persister: asyncStoragePersister }}
        >
        {/* GluestackUIProvider：注入 GluestackUI 主题配置，统一组件外观 */}
        <GluestackUIProvider config={config}>
          {/* LanguageProvider：提供多语言切换能力，子组件可获取当前语言及切换函数 */}
          <LanguageProvider>
            {/* BrandingProvider：提供品牌主题切换能力，子组件可动态获取品牌配置 */}
            <BrandingProvider>
              {/* AuthProvider：提供用户认证状态与登录/登出方法，子组件可监听或调用 */}
              <AuthProvider>
                {/* CartProvider：提供购物车数据与操作方法，子组件可读取或修改购物车 */}
                <CartProvider>
                  {/* RootNavigator：应用主导航，渲染所有页面及路由逻辑 */}
                  <RootNavigator />
                </CartProvider>
              </AuthProvider>
            </BrandingProvider>
          </LanguageProvider>
        </GluestackUIProvider>
        </PersistQueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
