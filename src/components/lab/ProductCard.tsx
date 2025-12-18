import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  BadgeText,
} from '@gluestack-ui/themed';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../config/theme';
import { formatCurrency } from '../../utils/format';
import type { Product } from '../../types/api';

interface ProductCardProps {
  product: Product;
  isSelected: boolean;
  isLocked: boolean;
  onToggle: () => void;
  onPress?: () => void;
}

const RISK_COLORS: Record<string, string> = {
  low: colors.success,
  medium: colors.warning,
  high: colors.error,
};

export function ProductCard({ product, isSelected, isLocked, onToggle, onPress }: ProductCardProps) {
  return (
    <TouchableOpacity
      onPress={isLocked ? undefined : onPress}
      activeOpacity={isLocked ? 1 : 0.7}
      disabled={isLocked}
    >
      <Box style={[styles.container, isSelected && styles.selectedContainer]}>
        <HStack space="md" alignItems="flex-start">
          {/* Checkbox - separate touch target */}
          <TouchableOpacity
            onPress={isLocked ? undefined : onToggle}
            disabled={isLocked}
            style={styles.checkboxContainer}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {isLocked ? (
              <Ionicons name="lock-closed" size={20} color={colors.textMuted} />
            ) : (
              <Box
                style={[
                  styles.checkbox,
                  isSelected && styles.checkboxSelected,
                ]}
              >
                {isSelected && (
                  <Ionicons name="checkmark" size={14} color="white" />
                )}
              </Box>
            )}
          </TouchableOpacity>

          {/* Content */}
          <VStack flex={1} space="xs">
            <HStack justifyContent="space-between" alignItems="center">
              <Text
                size="md"
                fontWeight="$semibold"
                color={isLocked ? colors.textMuted : 'white'}
                style={{ flex: 1 }}
              >
                {product.name}
              </Text>
              <Badge
                size="sm"
                borderRadius="$full"
                bg={RISK_COLORS[product.riskLevel]}
                opacity={isLocked ? 0.5 : 1}
              >
                <BadgeText color="white" textTransform="capitalize">
                  {product.riskLevel}
                </BadgeText>
              </Badge>
            </HStack>

            <Text
              size="sm"
              color={isLocked ? colors.textMuted : colors.textSecondary}
              numberOfLines={2}
            >
              {product.description}
            </Text>

            <HStack space="lg" marginTop="$1">
              <VStack>
                <Text size="xs" color={colors.textMuted}>Min. Investment</Text>
                <Text size="sm" fontWeight="$medium" color={isLocked ? colors.textMuted : colors.primary}>
                  {formatCurrency(product.minInvestment, product.currency)}
                </Text>
              </VStack>
              <VStack>
                <Text size="xs" color={colors.textMuted}>Expected Return</Text>
                <Text size="sm" fontWeight="$medium" color={isLocked ? colors.textMuted : colors.success}>
                  {product.expectedReturn}
                </Text>
              </VStack>
            </HStack>

            {/* Tags */}
            <HStack space="xs" flexWrap="wrap" marginTop="$1">
              {product.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag}
                  size="sm"
                  variant="outline"
                  borderRadius="$full"
                  borderColor={isLocked ? colors.textMuted : colors.border}
                  opacity={isLocked ? 0.5 : 1}
                >
                  <BadgeText color={isLocked ? colors.textMuted : colors.textSecondary} size="xs">
                    {tag}
                  </BadgeText>
                </Badge>
              ))}
            </HStack>
          </VStack>
        </HStack>
      </Box>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedContainer: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}15`,
  },
  checkboxContainer: {
    paddingTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
});

