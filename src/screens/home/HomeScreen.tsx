import React, { useState } from 'react';
import { ScrollView, RefreshControl, StyleSheet, View, Dimensions, TouchableOpacity, Text as RNText, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Spinner,
  Divider,
  Badge,
  BadgeText,
} from '@gluestack-ui/themed';
import { VictoryPie, VictoryLabel } from 'victory-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { usePortfolioSummary, usePortfolioAllocation, useActionTaskCount, useFeaturedProducts } from '../../api/hooks';
import { formatCurrency, formatPercentage } from '../../utils/format';
import { colors, spacing, borderRadius } from '../../config/theme';
import { GradientCard } from '../../components/ui/GradientCard';
import { useTranslation, useLocalizedDate, useLocalizedField } from '../../lib/i18n';
import { useAuth } from '../../contexts/AuthContext';
import { useAppName, usePrimaryColor } from '../../contexts/BrandingContext';
import TenantLogo from '../../components/TenantLogo';
import type { Product } from '../../types/api';

const screenWidth = Dimensions.get('window').width;

export default function HomeScreen() {
  const { data: portfolio, isLoading, refetch, isRefetching } = usePortfolioSummary();
  const { data: allocation, isLoading: isLoadingAllocation } = usePortfolioAllocation();
  const { data: actionTaskCount, refetch: refetchActionCount } = useActionTaskCount();
  const { data: featuredProducts, isLoading: isLoadingFeatured, refetch: refetchFeatured } = useFeaturedProducts();
  const { t } = useTranslation();
  const { formatFullDateTime } = useLocalizedDate();
  const getLocalizedField = useLocalizedField();
  const { user } = useAuth();
  const appName = useAppName();
  const primaryColor = usePrimaryColor();
  const navigation = useNavigation<any>();

  const handleRefresh = async () => {
    await Promise.all([refetch(), refetchActionCount(), refetchFeatured()]);
  };

  const navigateToTasks = () => {
    // Navigate to CRM tab which shows tasks by default
    navigation.navigate('CRM', { screen: 'CRMHome' });
  };

  const navigateToProduct = (product: Product) => {
    // Navigate to Lab tab with product detail
    navigation.navigate('Lab', { screen: 'ProductDetail', params: { product } });
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
        <Text color={colors.textSecondary}>{t('home.noPortfolioData')}</Text>
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
        {/* Welcome Header with Tenant Logo */}
        <HStack alignItems="center" space="md" paddingBottom="$2">
          <TenantLogo size={48} />
          <VStack flex={1}>
            <Text size="sm" color={colors.textSecondary}>
              {t('home.welcomeBack')}
            </Text>
            <Heading size="lg" color="white" numberOfLines={1}>
              {user?.client_name || appName}
            </Heading>
          </VStack>
        </HStack>

        {/* Action Notification Banner */}
        {actionTaskCount && actionTaskCount > 0 && (
          <TouchableOpacity onPress={navigateToTasks} activeOpacity={0.7}>
            <Box
              style={styles.actionBanner}
              bg={colors.warning}
              borderRadius={borderRadius.lg}
              padding="$3"
            >
              <HStack alignItems="center" space="md">
                <Box
                  bg="rgba(255,255,255,0.2)"
                  padding="$2"
                  borderRadius={borderRadius.md}
                >
                  <Ionicons name="alert-circle" size={24} color="white" />
                </Box>
                <VStack flex={1}>
                  <Text size="sm" fontWeight="$bold" color="white">
                    {t('home.actionRequired')}
                  </Text>
                  <Text size="xs" color="white" opacity={0.9}>
                    {t('home.actionRequiredCount', { count: actionTaskCount })}
                  </Text>
                </VStack>
                <Ionicons name="chevron-forward" size={20} color="white" />
              </HStack>
            </Box>
          </TouchableOpacity>
        )}

        {/* Net Worth Card */}
        <GradientCard variant="primary">
          <VStack space="sm">
            <Text size="sm" color="white" opacity={0.8}>
              {t('home.totalNetWorth')}
            </Text>
            <Heading size="3xl" color="white">
              {formatCurrency(portfolio.net_worth, portfolio.currency)}
            </Heading>
            <HStack space="lg" marginTop="$2">
              <VStack>
                <Text size="xs" color="white" opacity={0.7}>{t('home.invested')}</Text>
                <Text size="sm" fontWeight="$semibold" color="white">
                  {formatCurrency(portfolio.invested_value, portfolio.currency)}
                </Text>
              </VStack>
              <VStack>
                <Text size="xs" color="white" opacity={0.7}>{t('home.cash')}</Text>
                <Text size="sm" fontWeight="$semibold" color="white">
                  {formatCurrency(portfolio.cash_balance, portfolio.currency)}
                </Text>
              </VStack>
            </HStack>
          </VStack>
        </GradientCard>

        {/* Featured Products Carousel */}
        <FeaturedProductsCarousel
          products={featuredProducts || []}
          isLoading={isLoadingFeatured}
          onViewAll={() => navigation.navigate('Lab', { screen: 'AllocationLab' })}
          onProductPress={navigateToProduct}
          getLocalizedField={getLocalizedField}
          primaryColor={primaryColor}
          t={t}
        />

        {/* Asset Allocation Chart */}
        <GradientCard variant="dark">
          <VStack space="md">
            <Heading size="md" color="white">{t('home.assetAllocation')}</Heading>
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
                {t('home.noAllocationData')}
              </Text>
            )}
          </VStack>
        </GradientCard>

        {/* Currency Breakdown */}
        <GradientCard variant="dark">
          <VStack space="md">
            <Heading size="md" color="white">{t('home.currencyExposure')}</Heading>
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
                {t('home.noCurrencyData')}
              </Text>
            )}
          </VStack>
        </GradientCard>

        {/* Top Holdings */}
        <GradientCard variant="dark">
          <VStack space="md">
            <Heading size="md" color="white">{t('home.topHoldings')}</Heading>
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
                {t('home.noHoldingsData')}
              </Text>
            )}
          </VStack>
        </GradientCard>

        {/* Performance Card */}
        <GradientCard variant="dark">
          <VStack space="md">
            <Heading size="md" color="white">{t('home.performance')}</Heading>
            <HStack justifyContent="space-around">
              <PerformanceMetric label="1M" value={portfolio.performance?.['1M'] ?? null} />
              <PerformanceMetric label="3M" value={portfolio.performance?.['3M'] ?? null} />
              <PerformanceMetric label="6M" value={portfolio.performance?.['6M'] ?? null} />
              <PerformanceMetric label="YTD" value={portfolio.performance?.YTD ?? null} />
              <PerformanceMetric label="1Y" value={portfolio.performance?.['1Y'] ?? null} />
            </HStack>
          </VStack>
        </GradientCard>

        {/* Quick Stats */}
        <HStack space="md">
          <View style={{ flex: 1 }}>
            <GradientCard variant="dark" style={{ marginBottom: 0 }}>
              <VStack alignItems="center" space="xs">
                <Text size="xs" color={colors.textSecondary}>{t('home.accounts')}</Text>
                <Text size="3xl" fontWeight="$bold" color={colors.primary}>
                  {portfolio.total_accounts}
                </Text>
              </VStack>
            </GradientCard>
          </View>
          <View style={{ flex: 1 }}>
            <GradientCard variant="dark" style={{ marginBottom: 0 }}>
              <VStack alignItems="center" space="xs">
                <Text size="xs" color={colors.textSecondary}>{t('home.holdings')}</Text>
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
            {t('common.lastUpdated')}: {formatFullDateTime(portfolio.last_updated)}
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

// Featured Product Card Component
interface FeaturedProductCardProps {
  product: Product;
  onPress: () => void;
  getLocalizedField: (item: any, field: string) => string;
}

const RISK_COLORS: Record<string, string> = {
  low: colors.success,
  medium: colors.warning,
  high: colors.error,
};

// Calculate card width (container padding is 20 on each side)
const CAROUSEL_CARD_WIDTH = screenWidth - 32 - 40; // 32 = outer padding, 40 = container padding (20*2)

interface FeaturedProductsCarouselProps {
  products: Product[];
  isLoading: boolean;
  onViewAll: () => void;
  onProductPress: (product: Product) => void;
  getLocalizedField: (item: any, field: string) => string;
  primaryColor: string;
  t: (key: string) => string;
}

function FeaturedProductsCarousel({
  products,
  isLoading,
  onViewAll,
  onProductPress,
  getLocalizedField,
  primaryColor,
  t,
}: FeaturedProductsCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / CAROUSEL_CARD_WIDTH);
    setActiveIndex(index);
  };

  return (
    <View style={featuredSectionStyles.container}>
      <View style={featuredSectionStyles.header}>
        <RNText style={featuredSectionStyles.title}>{t('home.featuredProducts')}</RNText>
        {products.length > 0 && (
          <TouchableOpacity onPress={onViewAll} activeOpacity={0.7}>
            <RNText style={[featuredSectionStyles.viewAll, { color: primaryColor }]}>
              {t('common.viewAll')}
            </RNText>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={featuredSectionStyles.loadingContainer}>
          <Spinner size="small" color={colors.primary} />
        </View>
      ) : products.length > 0 ? (
        <>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            decelerationRate="fast"
            snapToInterval={CAROUSEL_CARD_WIDTH}
            snapToAlignment="start"
            contentContainerStyle={featuredSectionStyles.scrollContent}
          >
            {products.map((product) => (
              <FeaturedProductCard
                key={product.id}
                product={product}
                onPress={() => onProductPress(product)}
                getLocalizedField={getLocalizedField}
              />
            ))}
          </ScrollView>

          {/* Pagination Dots */}
          {products.length > 1 && (
            <View style={featuredSectionStyles.pagination}>
              {products.map((_, index) => (
                <View
                  key={index}
                  style={[
                    featuredSectionStyles.dot,
                    index === activeIndex && featuredSectionStyles.dotActive,
                  ]}
                />
              ))}
            </View>
          )}
        </>
      ) : (
        <View style={featuredSectionStyles.emptyContainer}>
          <Ionicons name="sparkles-outline" size={32} color={colors.textMuted} />
          <RNText style={featuredSectionStyles.emptyText}>
            {t('home.noFeaturedProducts')}
          </RNText>
        </View>
      )}
    </View>
  );
}

function FeaturedProductCard({ product, onPress, getLocalizedField }: FeaturedProductCardProps) {
  const { t } = useTranslation();
  const productName = getLocalizedField(
    { name: product.name, name_zh: product.nameZh },
    'name'
  );
  const riskColor = RISK_COLORS[product.riskLevel] || colors.textMuted;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={productCardStyles.cardWrapper}>
      <View style={productCardStyles.card}>
        {/* Header: Name + Risk Badge */}
        <View style={productCardStyles.header}>
          <RNText style={productCardStyles.name} numberOfLines={2}>
            {productName}
          </RNText>
          <View style={[productCardStyles.badge, { backgroundColor: riskColor }]}>
            <RNText style={productCardStyles.badgeText}>
              {product.riskLevel?.toUpperCase()}
            </RNText>
          </View>
        </View>

        {/* Category */}
        <RNText style={productCardStyles.category} numberOfLines={1}>
          {product.assetClass}
        </RNText>

        {/* Footer: Min Investment */}
        <View style={productCardStyles.footer}>
          <RNText style={productCardStyles.label}>
            {t('products.minInvestment')}
          </RNText>
          <RNText style={productCardStyles.value}>
            {product.currency} {product.minInvestment?.toLocaleString() ?? '—'}
          </RNText>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const featuredSectionStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  scrollContent: {
    // No extra padding needed for full-width cards
  },
  emptyContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 20,
  },
});

const productCardStyles = StyleSheet.create({
  cardWrapper: {
    width: CAROUSEL_CARD_WIDTH,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  name: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 22,
    marginRight: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  category: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    color: colors.textMuted,
  },
  value: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.primary,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.md,
  },
  actionBanner: {
    shadowColor: colors.warning,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  featuredProductsContainer: {
    paddingVertical: spacing.xs,
    paddingHorizontal: 16,
  },
});
