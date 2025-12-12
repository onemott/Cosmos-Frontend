import React from 'react';
import { FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  Spinner,
  Badge,
  BadgeText,
} from '@gluestack-ui/themed';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAccounts } from '../../api/hooks';
import { formatCurrency } from '../../utils/format';
import { colors, spacing } from '../../config/theme';
import { GradientCard } from '../../components/ui/GradientCard';
import type { Account } from '../../types/api';
import type { AccountsNavigationProp } from '../../navigation/types';

export default function AccountsListScreen() {
  const navigation = useNavigation<AccountsNavigationProp>();
  const { data: accounts, isLoading, refetch, isRefetching } = useAccounts();

  const handleAccountPress = (account: Account) => {
    navigation.navigate('AccountDetail', {
      accountId: account.id,
      accountName: account.account_name,
    });
  };

  if (isLoading) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" bg={colors.background}>
        <Spinner size="large" color={colors.primary} />
      </Box>
    );
  }

  if (!accounts || accounts.length === 0) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" bg={colors.background} padding="$4">
        <Ionicons name="wallet-outline" size={64} color={colors.textSecondary} />
        <Text size="lg" color={colors.textSecondary} marginTop="$4">
          No accounts found
        </Text>
      </Box>
    );
  }

  return (
    <FlatList
      data={accounts}
      keyExtractor={(item) => item.id}
      style={styles.list}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => handleAccountPress(item)}
          activeOpacity={0.7}
        >
          <GradientCard variant="dark">
            <VStack space="sm">
              <HStack justifyContent="space-between" alignItems="center">
                <VStack flex={1}>
                  <Text size="lg" fontWeight="$semibold" color="white">
                    {item.account_name}
                  </Text>
                  <Text size="sm" color={colors.textSecondary}>
                    {item.bank_name} • {item.account_number_masked}
                  </Text>
                </VStack>
                <Badge
                  action={item.is_active ? 'success' : 'muted'}
                  variant="solid"
                  borderRadius="$full"
                  bg={item.is_active ? colors.success : colors.textMuted}
                >
                  <BadgeText color="white">{item.is_active ? 'Active' : 'Inactive'}</BadgeText>
                </Badge>
              </HStack>

              <HStack justifyContent="space-between" marginTop="$3">
                <VStack>
                  <Text size="xs" color={colors.textSecondary}>Total Value</Text>
                  <Text size="xl" fontWeight="$bold" color="white">
                    {formatCurrency(item.total_value, item.currency)}
                  </Text>
                </VStack>
                <VStack alignItems="flex-end">
                  <Text size="xs" color={colors.textSecondary}>Cash Balance</Text>
                  <Text size="md" color={colors.textSecondary}>
                    {formatCurrency(item.cash_balance, item.currency)}
                  </Text>
                </VStack>
              </HStack>

              <HStack alignItems="center" marginTop="$2">
                <Badge size="sm" action="info" variant="outline" borderRadius="$full" borderColor={colors.primary}>
                  <BadgeText color={colors.primary}>{item.account_type}</BadgeText>
                </Badge>
                <Box flex={1} />
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </HStack>
            </VStack>
          </GradientCard>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.md,
  },
});

