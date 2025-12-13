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
import { formatDate } from '../../utils/format';

interface TaskCardProps {
  id: string;
  title: string;
  description?: string;
  taskType: string;
  status: string;
  priority: string;
  workflowState?: string;
  dueDate?: string;
  requiresAction: boolean;
  onPress: () => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  low: colors.textSecondary,
  medium: colors.warning,
  high: colors.error,
  urgent: colors.error,
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: colors.warning, text: 'white' },
  in_progress: { bg: colors.primary, text: 'white' },
  completed: { bg: colors.success, text: 'white' },
  cancelled: { bg: colors.textMuted, text: 'white' },
  on_hold: { bg: colors.textSecondary, text: 'white' },
};

const TASK_TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  proposal_approval: 'document-text',
  document_review: 'document',
  kyc_review: 'person-circle',
  product_request: 'cart',
  general: 'checkbox',
};

export function TaskCard({
  title,
  description,
  taskType,
  status,
  priority,
  workflowState,
  dueDate,
  requiresAction,
  onPress,
}: TaskCardProps) {
  const statusStyle = STATUS_COLORS[status] || STATUS_COLORS.pending;
  const icon = TASK_TYPE_ICONS[taskType] || 'checkbox';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Box style={[styles.container, requiresAction && styles.actionRequired]}>
        <HStack space="md" alignItems="flex-start">
          {/* Icon */}
          <Box
            bg={requiresAction ? colors.primary : colors.surfaceHighlight}
            padding="$2"
            borderRadius={borderRadius.md}
          >
            <Ionicons
              name={icon}
              size={20}
              color={requiresAction ? 'white' : colors.textSecondary}
            />
          </Box>

          {/* Content */}
          <VStack flex={1} space="xs">
            <HStack justifyContent="space-between" alignItems="flex-start">
              <Text
                size="md"
                fontWeight="$semibold"
                color="white"
                style={{ flex: 1, marginRight: 8 }}
                numberOfLines={2}
              >
                {title}
              </Text>
              {requiresAction && (
                <Box
                  bg={colors.error}
                  paddingHorizontal="$2"
                  paddingVertical="$1"
                  borderRadius={borderRadius.sm}
                >
                  <Text size="xs" color="white" fontWeight="$bold">
                    ACTION
                  </Text>
                </Box>
              )}
            </HStack>

            {description && (
              <Text size="sm" color={colors.textSecondary} numberOfLines={2}>
                {description}
              </Text>
            )}

            <HStack space="sm" marginTop="$1" flexWrap="wrap">
              <Badge
                size="sm"
                bg={statusStyle.bg}
                borderRadius="$full"
              >
                <BadgeText color={statusStyle.text} textTransform="capitalize">
                  {status.replace('_', ' ')}
                </BadgeText>
              </Badge>
              
              {priority !== 'medium' && (
                <Badge
                  size="sm"
                  variant="outline"
                  borderRadius="$full"
                  borderColor={PRIORITY_COLORS[priority]}
                >
                  <BadgeText color={PRIORITY_COLORS[priority]} textTransform="capitalize">
                    {priority}
                  </BadgeText>
                </Badge>
              )}
            </HStack>

            {dueDate && (
              <HStack alignItems="center" space="xs" marginTop="$1">
                <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
                <Text size="xs" color={colors.textMuted}>
                  Due: {formatDate(dueDate)}
                </Text>
              </HStack>
            )}
          </VStack>

          {/* Chevron */}
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
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
  actionRequired: {
    borderColor: colors.primary,
    borderWidth: 1,
  },
});

