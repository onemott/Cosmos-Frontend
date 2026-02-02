import React, { useState, useMemo, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
} from '@gluestack-ui/themed';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../../config/theme';
import { useClientProducts } from '../../../api/hooks';
import { useTranslation, useLocalizedField } from '../../../lib/i18n';
import type { ProductModule } from '../../../types/api';
import { isInvestmentModule } from '../../../types/api';

/**
 * ServicesSection displays non-investment modules in the Hub.
 * Investment modules are shown in the Lab section instead.
 */
export default function ServicesSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const { t } = useTranslation();
  const localizedField = useLocalizedField();

  // Fetch products from API
  const { data: productModules, isLoading, error, refetch } = useClientProducts();

  // Auto-expand enabled modules when data loads
  useEffect(() => {
    if (productModules && expandedModules.size === 0) {
      // Only show non-investment modules
      const nonInvestmentModules = productModules.filter((m) => !isInvestmentModule(m.category));
      setExpandedModules(
        new Set(nonInvestmentModules.filter((m) => m.isEnabled).map((m) => m.code))
      );
    }
  }, [productModules]);

  // Filter modules to only show non-investment ones (investment goes to Lab)
  // Then filter by search query
  const filteredModules = useMemo(() => {
    if (!productModules) return [];

    // Only show non-investment category modules in Services
    const nonInvestmentModules = productModules.filter((m) => !isInvestmentModule(m.category));

    if (!searchQuery.trim()) return nonInvestmentModules;

    const query = searchQuery.toLowerCase();
    return nonInvestmentModules.filter((module) => {
      const moduleName = localizedField(module as unknown as Record<string, unknown>, 'name').toLowerCase();
      const moduleDesc = localizedField(module as unknown as Record<string, unknown>, 'description').toLowerCase();
      return moduleName.includes(query) || moduleDesc.includes(query);
    });
  }, [searchQuery, productModules, localizedField]);

  const toggleModuleExpand = (moduleCode: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleCode)) {
        next.delete(moduleCode);
      } else {
        next.add(moduleCode);
      }
      return next;
    });
  };

  return (
    <Box flex={1} bg={colors.background}>
      {/* Search Bar */}
      <Box paddingHorizontal="$4" paddingTop="$2" paddingBottom="$2">
        <HStack
          bg={colors.surface}
          borderRadius={borderRadius.lg}
          alignItems="center"
          paddingHorizontal="$3"
          borderWidth={1}
          borderColor={colors.border}
        >
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('crm.services.searchServices')}
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </HStack>
      </Box>

      {/* Info Card */}
      <Box paddingHorizontal="$4" paddingBottom="$2">
        <Box
          bg={colors.surface}
          borderRadius={borderRadius.lg}
          padding="$3"
          borderWidth={1}
          borderColor={colors.border}
        >
          <HStack space="md" alignItems="center">
            <Box
              bg={colors.primary}
              padding="$2"
              borderRadius={borderRadius.md}
            >
              <Ionicons name="apps" size={24} color="white" />
            </Box>
            <VStack flex={1}>
              <Text fontWeight="$semibold" color="white">
                {t('crm.services.title')}
              </Text>
              <Text size="sm" color={colors.textSecondary}>
                {t('crm.services.subtitle')}
              </Text>
            </VStack>
          </HStack>
        </Box>
      </Box>

      {/* Module List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Loading State */}
        {isLoading && (
          <Box alignItems="center" paddingVertical="$8">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text color={colors.textSecondary} marginTop="$4">
              {t('common.loading')}
            </Text>
          </Box>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Box alignItems="center" paddingVertical="$8">
            <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
            <Text color={colors.textSecondary} marginTop="$2" textAlign="center">
              {t('crm.services.failedToLoad')}
            </Text>
            <TouchableOpacity
              onPress={() => refetch()}
              style={styles.retryButton}
            >
              <Text color={colors.primary} fontWeight="$semibold">
                {t('common.retry')}
              </Text>
            </TouchableOpacity>
          </Box>
        )}

        {/* Module List */}
        {!isLoading && !error && filteredModules.map((module) => (
          <ModuleCard
            key={module.code}
            module={module}
            isExpanded={expandedModules.has(module.code)}
            onToggleExpand={() => toggleModuleExpand(module.code)}
          />
        ))}

        {/* Empty Search Results */}
        {!isLoading && !error && filteredModules.length === 0 && searchQuery.trim() && (
          <Box alignItems="center" paddingVertical="$8">
            <Ionicons name="search-outline" size={48} color={colors.textMuted} />
            <Text color={colors.textSecondary} marginTop="$2">
              {t('crm.services.noSearchResults')}
            </Text>
          </Box>
        )}

        {/* No Services Available */}
        {!isLoading && !error && filteredModules.length === 0 && !searchQuery.trim() && (
          <Box alignItems="center" paddingVertical="$8">
            <Ionicons name="apps-outline" size={48} color={colors.textMuted} />
            <Text color={colors.textSecondary} marginTop="$2">
              {t('crm.services.noServices')}
            </Text>
          </Box>
        )}

        {/* Bottom padding */}
        <Box height={20} />
      </ScrollView>
    </Box>
  );
}

interface ModuleCardProps {
  module: ProductModule;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

function ModuleCard({
  module,
  isExpanded,
  onToggleExpand,
}: ModuleCardProps) {
  const { t } = useTranslation();
  const localizedField = useLocalizedField();

  // Get category display name
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'basic':
        return t('crm.services.categoryBasic');
      case 'analytics':
        return t('crm.services.categoryAnalytics');
      default:
        return category;
    }
  };

  return (
    <Box marginBottom="$3">
      {/* Module Header */}
      <TouchableOpacity onPress={onToggleExpand} activeOpacity={0.7}>
        <Box
          bg={colors.surface}
          padding="$4"
          borderRadius={borderRadius.lg}
          borderWidth={1}
          borderColor={module.isEnabled ? colors.border : colors.textMuted}
          opacity={module.isEnabled ? 1 : 0.6}
        >
          <HStack justifyContent="space-between" alignItems="center">
            <HStack space="md" alignItems="center" flex={1}>
              <Box
                bg={module.isEnabled ? colors.primary : colors.textMuted}
                padding="$2"
                borderRadius={borderRadius.md}
              >
                <Ionicons
                  name={module.isEnabled ? 'checkmark-circle' : 'lock-closed'}
                  size={20}
                  color="white"
                />
              </Box>
              <VStack flex={1}>
                <HStack alignItems="center" space="sm">
                  <Text fontWeight="$semibold" color="white" numberOfLines={1}>
                    {localizedField(module as unknown as Record<string, unknown>, 'name')}
                  </Text>
                  {!module.isEnabled && (
                    <Text size="xs" color={colors.textMuted}>
                      ({t('crm.services.locked')})
                    </Text>
                  )}
                </HStack>
                <Text size="xs" color={colors.textSecondary}>
                  {getCategoryLabel(module.category)}
                </Text>
              </VStack>
            </HStack>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.textSecondary}
            />
          </HStack>

          {/* Expanded Content */}
          {isExpanded && (
            <Box marginTop="$3" paddingTop="$3" borderTopWidth={1} borderTopColor={colors.border}>
              <Text size="sm" color={colors.textSecondary}>
                {localizedField(module as unknown as Record<string, unknown>, 'description') || t('crm.services.noDescription')}
              </Text>

              {module.isEnabled ? (
                <Box marginTop="$3">
                  <HStack alignItems="center" space="xs">
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    <Text size="sm" color={colors.success}>
                      {t('crm.services.moduleEnabled')}
                    </Text>
                  </HStack>
                </Box>
              ) : (
                <Box marginTop="$3">
                  <HStack alignItems="center" space="xs">
                    <Ionicons name="information-circle" size={16} color={colors.warning} />
                    <Text size="sm" color={colors.warning}>
                      {t('crm.services.contactAdvisor')}
                    </Text>
                  </HStack>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </TouchableOpacity>
    </Box>
  );
}

const styles = StyleSheet.create({
  searchInput: {
    flex: 1,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.sm,
    color: 'white',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
  retryButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
});
