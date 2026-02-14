import React from 'react';
// 引入底部标签导航器创建函数
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// 引入 Ionicons 图标库，用于底部标签图标
import { Ionicons } from '@expo/vector-icons';
// 引入各业务模块的堆栈导航器
import HomeStack from './HomeStack';
import AccountsStack from './AccountsStack';
import LabStack from './LabStack';
import CRMStack from './CRMStack';
import ProfileStack from './ProfileStack';
// 引入底部标签参数列表类型定义
import type { MainTabParamList } from './types';
// 引入全局主题色配置
import { colors } from '../config/theme';
// 引入品牌主色钩子，用于动态获取品牌主色
import { usePrimaryColor } from '../contexts/BrandingContext';
// 引入国际化翻译钩子
import { useTranslation } from '../lib/i18n';

// 创建底部标签导航器实例，并指定参数列表类型
const Tab = createBottomTabNavigator<MainTabParamList>();

// 导出默认组件：主底部标签导航
export default function MainTabs() {
  // 获取翻译函数
  const { t } = useTranslation();
  // 获取当前品牌主色
  const primaryColor = usePrimaryColor();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        // 隐藏顶部导航栏
        headerShown: false,
        // 配置底部标签图标：根据路由名称、聚焦状态返回对应图标
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            // 首页图标：聚焦时为实心，非聚焦时为轮廓
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Accounts') {
            // 账户图标：聚焦时为实心钱包，非聚焦时为轮廓
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'Lab') {
            // 实验室图标：聚焦时为实心烧瓶，非聚焦时为轮廓
            iconName = focused ? 'flask' : 'flask-outline';
          } else if (route.name === 'CRM') {
            // CRM图标：聚焦时为实心公文包，非聚焦时为轮廓
            iconName = focused ? 'briefcase' : 'briefcase-outline';
          } else if (route.name === 'Profile') {
            // 个人中心图标：聚焦时为实心人形，非聚焦时为轮廓
            iconName = focused ? 'person' : 'person-outline';
          } else {
            // 兜底图标：椭圆
            iconName = 'ellipse';
          }

          // 返回 Ionicons 组件，传入计算出的图标名称、大小与颜色
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        // 激活状态标签颜色：使用品牌主色
        tabBarActiveTintColor: primaryColor,
        // 非激活状态标签颜色：使用主题配置的次要文字色
        tabBarInactiveTintColor: colors.textSecondary,
        // 底部标签栏样式：背景色取自主题，去掉顶部边框
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopWidth: 0,
        },
      })}
    >
      {/* 注册首页标签，标题使用国际化文案 */}
      <Tab.Screen name="Home" component={HomeStack} options={{ title: t('navigation.home') }} />
      {/* 注册账户标签 */}
      <Tab.Screen name="Accounts" component={AccountsStack} options={{ title: t('navigation.accounts') }} />
      {/* 注册实验室标签 */}
      <Tab.Screen name="Lab" component={LabStack} options={{ title: t('navigation.lab') }} />
      {/* 注册CRM标签 */}
      <Tab.Screen name="CRM" component={CRMStack} options={{ title: t('navigation.crm') }} />
      {/* 注册个人中心标签 */}
      <Tab.Screen name="Profile" component={ProfileStack} options={{ title: t('navigation.profile') }} />
    </Tab.Navigator>
  );
}
