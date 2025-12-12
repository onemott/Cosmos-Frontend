import React from 'react';
import { ScrollView, RefreshControl, StyleSheet, View, Dimensions } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Spinner,
  Divider,
} from '@gluestack-ui/themed';
import { VictoryPie, VictoryLabel } from 'victory-native';
import { usePortfolioSummary, usePortfolioAllocation } from '../../api/hooks';
import { formatCurrency, formatPercentage } from '../../utils/format';
import { colors, spacing } from '../../config/theme';
import { GradientCard } from '../../components/ui/GradientCard';

const screenWidth = Dimensions.get('window').width;

export default function HomeScreen() {
  const { data: portfolio, isLoading, refetch, isRefetching } = usePortfolioSummary();
  const { data: allocation, isLoading: isLoadingAllocation } = usePortfolioAllocation();

  const handleRefresh = async () => {
    await refetch();
  };

  if (isLoading) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" bg={colors.background}>
        <Spinner size="large" color={colors.primary} />
      </Box>
    );
  }

  if (!portfolio) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" bg={colors.background}>
        <Text color={colors.textSecondary}>No portfolio data available</Text>
      </Box>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} tintColor={colors.primary} />
      }
    >
      <VStack space="lg">
        {/* Net Worth Card */}
        <GradientCard variant="primary">
          <VStack space="sm">
            <Text size="sm" color="white" opacity={0.8}>
              Total Net Worth
            </Text>
            <Heading size="3xl" color="white">
              {formatCurrency(portfolio.net_worth, portfolio.currency)}
            </Heading>
            <HStack space="lg" marginTop="$2">
              <VStack>
                <Text size="xs" color="white" opacity={0.7}>Invested</Text>
                <Text size="sm" fontWeight="$semibold" color="white">
                  {formatCurrency(portfolio.invested_value, portfolio.currency)}
                </Text>
              </VStack>
              <VStack>
                <Text size="xs" color="white" opacity={0.7}>Cash</Text>
                <Text size="sm" fontWeight="$semibold" color="white">
                  {formatCurrency(portfolio.cash_balance, portfolio.currency)}
                </Text>
              </VStack>
            </HStack>
          </VStack>
        </GradientCard>

        {/* Asset Allocation Chart */}
        <GradientCard variant="dark">
          <VStack space="md">
            <Heading size="md" color="white">Asset Allocation</Heading>
            {isLoadingAllocation ? (
              <Box alignItems="center" paddingVertical="$6">
                <Spinner size="small" color={colors.primary} />
              </Box>
            ) : allocation?.assetClass && allocation.assetClass.length > 0 ? (
              <>
                <Box alignItems="center">
                  <VictoryPie
                    data={allocation.assetClass.map(item => ({
                      x: item.label,
                      y: item.value,
                    }))}
                    colorScale={colors.chartPalette}
                    width={screenWidth - 80}
                    height={180}
                    innerRadius={45}
                    padAngle={2}
                    style={{
                      labels: { fill: 'transparent' }, // Hide pie labels, use legend
                    }}
                    labelComponent={<VictoryLabel text="" />}
                  />
                </Box>
                {/* Legend */}
                <HStack flexWrap="wrap" justifyContent="center" space="sm">
                  {allocation.assetClass.map((item, index) => {
                    const total = allocation.assetClass.reduce((sum, i) => sum + i.value, 0);
                    const pct = ((item.value / total) * 100).toFixed(0);
                    return (
                      <HStack key={item.label} alignItems="center" space="xs" marginRight="$3" marginBottom="$2">
                        <Box
                          width={10}
                          height={10}
                          borderRadius="$full"
                          bg={colors.chartPalette[index % colors.chartPalette.length]}
                        />
                        <Text size="xs" color={colors.textSecondary}>
                          {item.label} ({pct}%)
                        </Text>
                      </HStack>
                    );
                  })}
                </HStack>
              </>
            ) : (
              <Text size="sm" color={colors.textSecondary} textAlign="center">
                No allocation data available
              </Text>
            )}
          </VStack>
        </GradientCard>

        {/* Currency Breakdown */}
        <GradientCard variant="dark">
          <VStack space="md">
            <Heading size="md" color="white">Currency Exposure</Heading>
            {allocation?.currency && allocation.currency.length > 0 ? (
              <VStack space="sm">
                {allocation.currency.map((item, index) => {
                  const total = allocation.currency.reduce((sum, i) => sum + i.value, 0);
                  const pct = (item.value / total) * 100;
                  return (
                    <VStack key={item.label} space="xs">
                      <HStack justifyContent="space-between">
                        <HStack alignItems="center" space="sm">
                          <Box
                            width={12}
                            height={12}
                            borderRadius="$full"
                            bg={colors.chartPalette[index % colors.chartPalette.length]}
                          />
                          <Text size="sm" color="white" fontWeight="$medium">{item.label}</Text>
                        </HStack>
                        <Text size="sm" color={colors.textSecondary}>
                          {formatCurrency(item.value, 'USD')} ({pct.toFixed(0)}%)
                        </Text>
                      </HStack>
                      {/* Progress bar */}
                      <Box height={6} bg={colors.border} borderRadius="$full" overflow="hidden">
                        <Box
                          height="100%"
                          width={`${pct}%`}
                          bg={colors.chartPalette[index % colors.chartPalette.length]}
                          borderRadius="$full"
                        />
                      </Box>
                    </VStack>
                  );
                })}
              </VStack>
            ) : (
              <Text size="sm" color={colors.textSecondary} textAlign="center">
                No currency data available
              </Text>
            )}
          </VStack>
        </GradientCard>

        {/* Top Holdings */}
        <GradientCard variant="dark">
          <VStack space="md">
            <Heading size="md" color="white">Top Holdings</Heading>
            {allocation?.topHoldings && allocation.topHoldings.length > 0 ? (
              <VStack space="sm">
                {allocation.topHoldings.map((holding, index) => (
                  <React.Fragment key={holding.ticker}>
                    {index > 0 && <Divider bg={colors.border} />}
                    <HStack justifyContent="space-between" alignItems="center" paddingVertical="$1">
                      <VStack flex={1}>
                        <Text size="sm" fontWeight="$semibold" color="white">
                          {holding.ticker}
                        </Text>
                        <Text size="xs" color={colors.textSecondary} numberOfLines={1}>
                          {holding.name}
                        </Text>
                      </VStack>
                      <VStack alignItems="flex-end">
                        <Text size="sm" fontWeight="$semibold" color="white">
                          {formatCurrency(holding.value, 'USD')}
                        </Text>
                        <Text
                          size="xs"
                          color={holding.pnlPercent >= 0 ? colors.success : colors.error}
                        >
                          {holding.pnlPercent >= 0 ? '+' : ''}{holding.pnlPercent.toFixed(2)}%
                        </Text>
                      </VStack>
                    </HStack>
                  </React.Fragment>
                ))}
              </VStack>
            ) : (
              <Text size="sm" color={colors.textSecondary} textAlign="center">
                No holdings data available
              </Text>
            )}
          </VStack>
        </GradientCard>

        {/* Performance Card */}
        <GradientCard variant="dark">
          <VStack space="md">
            <Heading size="md" color="white">Performance</Heading>
            <HStack justifyContent="space-around">
              <PerformanceMetric label="1M" value={portfolio.performance['1M']} />
              <PerformanceMetric label="3M" value={portfolio.performance['3M']} />
              <PerformanceMetric label="6M" value={portfolio.performance['6M']} />
              <PerformanceMetric label="YTD" value={portfolio.performance.YTD} />
              <PerformanceMetric label="1Y" value={portfolio.performance['1Y']} />
            </HStack>
          </VStack>
        </GradientCard>

        {/* Quick Stats */}
        <HStack space="md">
          <View style={{ flex: 1 }}>
            <GradientCard variant="dark" style={{ marginBottom: 0 }}>
              <VStack alignItems="center" space="xs">
                <Text size="xs" color={colors.textSecondary}>Accounts</Text>
                <Text size="3xl" fontWeight="$bold" color={colors.primary}>
                  {portfolio.total_accounts}
                </Text>
              </VStack>
            </GradientCard>
          </View>
          <View style={{ flex: 1 }}>
            <GradientCard variant="dark" style={{ marginBottom: 0 }}>
              <VStack alignItems="center" space="xs">
                <Text size="xs" color={colors.textSecondary}>Holdings</Text>
                <Text size="3xl" fontWeight="$bold" color={colors.primary}>
                  {portfolio.total_holdings}
                </Text>
              </VStack>
            </GradientCard>
          </View>
        </HStack>

        {/* Last Updated */}
        <Box alignItems="center" paddingTop="$2" paddingBottom="$4">
          <Text size="xs" color={colors.textMuted}>
            Last updated: {new Date(portfolio.last_updated).toLocaleString()}
          </Text>
        </Box>
      </VStack>
    </ScrollView>
  );
}

interface PerformanceMetricProps {
  label: string;
  value: number | null;
}

function PerformanceMetric({ label, value }: PerformanceMetricProps) {
  const getColor = () => {
    if (value === null) return colors.textSecondary;
    return value >= 0 ? colors.success : colors.error;
  };

  return (
    <VStack alignItems="center" space="xs">
      <Text size="xs" color={colors.textSecondary}>{label}</Text>
      <Text size="md" fontWeight="$bold" color={getColor()}>
        {formatPercentage(value)}
      </Text>
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
