import type { NativeStackScreenProps, NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
};

export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList>;
  Accounts: NavigatorScreenParams<AccountsStackParamList>;
  Products: NavigatorScreenParams<ProductsStackParamList>;
  Documents: NavigatorScreenParams<DocumentsStackParamList>;
  Tasks: NavigatorScreenParams<TasksStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

export type HomeStackParamList = {
  HomeScreen: undefined;
};

export type AccountsStackParamList = {
  AccountsList: undefined;
  AccountDetail: { accountId: string; accountName: string };
};

export type ProductsStackParamList = {
  ProductsList: undefined;
};

export type DocumentsStackParamList = {
  DocumentsList: undefined;
  DocumentViewer: { documentId: string; documentName: string };
};

export type TasksStackParamList = {
  TasksList: undefined;
  TaskDetail: { taskId: string };
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

export type ProductsStackScreenProps<T extends keyof ProductsStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<ProductsStackParamList, T>,
  BottomTabScreenProps<MainTabParamList>
>;

export type DocumentsStackScreenProps<T extends keyof DocumentsStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<DocumentsStackParamList, T>,
  BottomTabScreenProps<MainTabParamList>
>;

export type TasksStackScreenProps<T extends keyof TasksStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<TasksStackParamList, T>,
  BottomTabScreenProps<MainTabParamList>
>;

export type ProfileStackScreenProps<T extends keyof ProfileStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<ProfileStackParamList, T>,
  BottomTabScreenProps<MainTabParamList>
>;

// Typed navigation props for useNavigation hook
export type AccountsNavigationProp = NativeStackNavigationProp<AccountsStackParamList>;
export type DocumentsNavigationProp = NativeStackNavigationProp<DocumentsStackParamList>;
export type TasksNavigationProp = NativeStackNavigationProp<TasksStackParamList>;

// Typed route props for useRoute hook
export type AccountDetailRouteProp = RouteProp<AccountsStackParamList, 'AccountDetail'>;
export type DocumentViewerRouteProp = RouteProp<DocumentsStackParamList, 'DocumentViewer'>;
export type TaskDetailRouteProp = RouteProp<TasksStackParamList, 'TaskDetail'>;

