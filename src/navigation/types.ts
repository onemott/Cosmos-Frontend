import type { NativeStackScreenProps, NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: { code?: string } | undefined;
};

export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList>;
  Accounts: NavigatorScreenParams<AccountsStackParamList>;
  Lab: NavigatorScreenParams<LabStackParamList>;
  CRM: NavigatorScreenParams<CRMStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

export type HomeStackParamList = {
  HomeScreen: undefined;
};

export type AccountsStackParamList = {
  AccountsList: undefined;
  AccountDetail: { accountId: string; accountName: string };
};

export type LabStackParamList = {
  AllocationLab: undefined;
  ProductDetail: { product: import('../types/api').Product };
};

export type CRMStackParamList = {
  CRMHome: undefined;
};

export type ProfileStackParamList = {
  ProfileScreen: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

// Screen props types
export type AuthStackScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<
  AuthStackParamList,
  T
>;

export type HomeStackScreenProps<T extends keyof HomeStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, T>,
  BottomTabScreenProps<MainTabParamList>
>;

export type AccountsStackScreenProps<T extends keyof AccountsStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<AccountsStackParamList, T>,
  BottomTabScreenProps<MainTabParamList>
>;

export type LabStackScreenProps<T extends keyof LabStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<LabStackParamList, T>,
  BottomTabScreenProps<MainTabParamList>
>;

export type CRMStackScreenProps<T extends keyof CRMStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<CRMStackParamList, T>,
  BottomTabScreenProps<MainTabParamList>
>;

export type ProfileStackScreenProps<T extends keyof ProfileStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<ProfileStackParamList, T>,
  BottomTabScreenProps<MainTabParamList>
>;

// Typed navigation props for useNavigation hook
export type AccountsNavigationProp = NativeStackNavigationProp<AccountsStackParamList>;
export type LabNavigationProp = NativeStackNavigationProp<LabStackParamList>;
export type CRMNavigationProp = NativeStackNavigationProp<CRMStackParamList>;

// Typed route props for useRoute hook
export type AccountDetailRouteProp = RouteProp<AccountsStackParamList, 'AccountDetail'>;
