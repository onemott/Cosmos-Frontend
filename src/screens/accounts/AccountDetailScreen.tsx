import React from 'react';
import { ScrollView, StyleSheet, Dimensions } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  Spinner,
  Heading,
  Divider,
} from '@gluestack-ui/themed';
import { useRoute } from '@react-navigation/native';
import { VictoryPie, VictoryLabel } from 'victory-native';
import { useAccountDetail } from '../../api/hooks';
import { formatCurrency } from '../../utils/format';
import { colors, spacing } from '../../config/theme';
import { GradientCard } from '../../components/ui/GradientCard';
import type { AccountDetailRouteProp } from '../../navigation/types';
import type { Holding } from '../../types/api';

export default function AccountDetailScreen() {
  const route = useRoute<AccountDetailRouteProp>();
  const { accountId } = route.params;

  const { data: account, isLoading } = useAccountDetail(accountId);

  if (isLoading) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" bg={colors.background}>
        <Spinner size="large" color={colors.primary} />
      </Box>
    );
  }

  if (!account) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" bg={colors.background}>
        <Text color={colors.textSecondary}>Account not found</Text>
      </Box>
    );
  }

  const holdings = account.holdings || [];

  // Group holdings by asset class for pie chart
  const assetClassData = holdings.reduce<Record<string, number>>((acc, holding) => {
    const assetClass = holding.asset_class || 'Other';
    if (!acc[assetClass]) {
      acc[assetClass] = 0;
    }
    acc[assetClass] += parseFloat(holding.market_value);
    return acc;
  }, {});

  const pieData = Object.entries(assetClassData).map(([key, value]) => ({
    x: key,
    y: value,
    label: `${key}\n${((value / Number(account.total_value)) * 100).toFixed(0)}%`
  }));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <VStack space="lg">
        {/* Account Summary Card */}
        <GradientCard variant="primary">
          <VStack space="md">
            <VStack space="xs">
              <Text size="sm" color="white" opacity={0.8}>Total Value</Text>
              <Heading size="3xl" color="white">
                {formatCurrency(account.total_value, account.currency)}
              </Heading>
            </VStack>
            
            <Divider bg="white" opacity={0.2} />
            
            <HStack justifyContent="space-between" alignItems="center">
              <VStack>
                <Text size="xs" color="white" opacity={0.8}>Cash Balance</Text>
                <Text size="lg" color="white" fontWeight="$semibold">
                  {formatCurrency(account.cash_balance, account.currency)}
                </Text>
              </VStack>
              <VStack alignItems="flex-end">
                <Text size="xs" color="white" opacity={0.8}>Account Type</Text>
                <Text size="md" color="white" fontWeight="$medium">
                  {account.account_type}
                </Text>
              </VStack>
            </HStack>
          </VStack>
        </GradientCard>

        {/* Asset Allocation Pie Chart */}
        {pieData.length > 0 && (
          <GradientCard variant="dark">
            <VStack space="md">
              <Heading size="md" color="white">Asset Allocation</Heading>
              <Box alignItems="center">
                <VictoryPie
                  data={pieData}
                  colorScale={colors.chartPalette}
                  width={Dimensions.get('window').width - 80}
                  height={220}
                  innerRadius={50}
                  padAngle={2}
                  style={{
                    labels: { fill: colors.textSecondary, fontSize: 10 }
                  }}
                  labelComponent={<VictoryLabel />}
                />
              </Box>
              {/* Legend */}
              <HStack flexWrap="wrap" justifyContent="center" space="sm">
                {pieData.map((item, index) => (
                  <HStack key={item.x} alignItems="center" space="xs" marginRight="$3" marginBottom="$2">
                    <Box
                      width={12}
                      height={12}
                      borderRadius="$full"
                      bg={colors.chartPalette[index % colors.chartPalette.length]}
                    />
                    <Text size="xs" color={colors.textSecondary}>{item.x}</Text>
                  </HStack>
                ))}
              </HStack>
            </VStack>
          </GradientCard>
        )}

        {/* Holdings List */}
        <GradientCard variant="dark">
          <VStack space="md">
            <Heading size="md" color="white">Holdings ({account.holdings_count})</Heading>
            {holdings.length === 0 ? (
              <Text color={colors.textSecondary} textAlign="center" paddingVertical="$4">
                No holdings in this account
              </Text>
            ) : (
              holdings.map((holding, index) => (
                <React.Fragment key={holding.id}>
                  {index > 0 && <Divider marginVertical="$2" bg={colors.border} />}
                  <HoldingRow holding={holding} />
                </React.Fragment>
              ))
            )}
          </VStack>
        </GradientCard>
      </VStack>
    </ScrollView>
  );
}

interface HoldingRowProps {
  holding: Holding;
}

function HoldingRow({ holding }: HoldingRowProps) {
  const pnl = parseFloat(holding.unrealized_pnl);
  const isPositive = pnl >= 0;
  const quantity = parseFloat(holding.quantity);
  const costBasis = parseFloat(holding.cost_basis);

  return (
    <VStack space="xs">
      <HStack justifyContent="space-between" alignItems="flex-start">
        <VStack flex={1}>
          <Text fontWeight="$semibold" color="white">
            {holding.instrument_ticker}
          </Text>
          <Text size="sm" color={colors.textSecondary} numberOfLines={1}>
            {holding.instrument_name}
          </Text>
        </VStack>
        <VStack alignItems="flex-end">
          <Text fontWeight="$semibold" color="white">
            {formatCurrency(holding.market_value, holding.currency)}
          </Text>
          <Text
            size="sm"
            color={isPositive ? colors.success : colors.error}
          >
            {isPositive ? '+' : ''}{holding.unrealized_pnl_percent.toFixed(2)}%
          </Text>
        </VStack>
      </HStack>
      <HStack space="md">
        <Text size="xs" color={colors.textSecondary}>
          Qty: {quantity.toLocaleString()}
        </Text>
        <Text size="xs" color={colors.textSecondary}>
          Avg Cost: {formatCurrency(costBasis / quantity, holding.currency)}
        </Text>
        <Text size="xs" color={isPositive ? colors.success : colors.error}>
          P/L: {formatCurrency(holding.unrealized_pnl, holding.currency)}
        </Text>
      </HStack>
    </VStack>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.md,
  },
});
