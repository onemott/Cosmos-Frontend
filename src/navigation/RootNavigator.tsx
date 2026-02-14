import React from 'react';
// 引入导航容器和深色主题
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
// 引入原生栈导航器创建函数
import { createNativeStackNavigator } from '@react-navigation/native-stack';
// 引入用于加载状态的视图组件和加载指示器
import { View, ActivityIndicator, StyleSheet } from 'react-native';
// 引入认证上下文钩子，用于获取认证状态
import { useAuth } from '../contexts/AuthContext';
// 引入认证相关导航栈
import AuthStack from './AuthStack';
// 引入主页面底部标签导航
import MainTabs from './MainTabs';
// 引入根栈参数列表类型定义
import type { RootStackParamList } from './types';
// 引入主题颜色配置
import { colors } from '../config/theme';

// 创建根栈导航器实例，并指定参数列表类型
const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  // 从认证上下文中获取认证状态和加载状态
  const { isAuthenticated, isLoading } = useAuth();

  // 如果仍在加载中，显示加载指示器
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // 根据认证状态决定渲染主标签导航还是认证导航栈
  return (
    <NavigationContainer theme={DarkTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          // 已认证：渲染主标签导航
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          // 未认证：渲染认证导航栈
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// 加载容器的样式定义
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1, // 占满整个屏幕
    justifyContent: 'center', // 垂直居中
    alignItems: 'center', // 水平居中
    backgroundColor: colors.background, // 使用主题背景色
  },
});
