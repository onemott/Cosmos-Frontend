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
import { formatDate, formatFileSize } from '../../utils/format';

interface DocumentCardProps {
  id: string;
  name: string;
  documentType: string;
  status: string;
  description?: string;
  fileSize: number;
  createdAt: string;
  isDeletable?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  onDelete?: () => void;
}

const DOC_TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  statement: 'document-text',
  report: 'bar-chart',
  contract: 'document',
  tax: 'receipt',
  kyc: 'id-card',
  compliance: 'shield-checkmark',
  other: 'document-outline',
};

const DOC_TYPE_COLORS: Record<string, string> = {
  statement: colors.primary,
  report: colors.success,
  contract: colors.warning,
  tax: '#8B5CF6', // Purple
  kyc: '#EA580C', // Orange
  compliance: '#059669', // Emerald
  other: colors.textSecondary,
};

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B', // Amber
  approved: '#10B981', // Emerald
  rejected: '#EF4444', // Red
  expired: colors.textMuted,
};

export function DocumentCard({
  name,
  documentType,
  status,
  description,
  fileSize,
  createdAt,
  isDeletable = false,
  onPress,
  onLongPress,
  onDelete,
}: DocumentCardProps) {
  const icon = DOC_TYPE_ICONS[documentType] || DOC_TYPE_ICONS.other;
  const iconColor = DOC_TYPE_COLORS[documentType] || DOC_TYPE_COLORS.other;
  const statusColor = STATUS_COLORS[status] || colors.textMuted;

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={500}
      activeOpacity={0.7}
    >
      <Box style={styles.container}>
        <HStack space="md" alignItems="flex-start">
          {/* Icon */}
          <Box
            bg={`${iconColor}20`}
            padding="$3"
            borderRadius={borderRadius.md}
            marginTop="$1"
          >
            <Ionicons name={icon} size={24} color={iconColor} />
          </Box>

          {/* Content */}
          <VStack flex={1} space="xs">
            <HStack justifyContent="space-between" alignItems="flex-start">
              <Text
                size="md"
                fontWeight="$semibold"
                color="white"
                numberOfLines={1}
                flex={1}
                marginRight="$2"
              >
                {name}
              </Text>
              <Badge
                size="sm"
                variant="outline"
                borderColor={statusColor}
                borderRadius="$full"
              >
                <BadgeText color={statusColor} textTransform="capitalize" fontSize="$2xs">
                  {status}
                </BadgeText>
              </Badge>
            </HStack>
            
            {description && (
              <Text size="sm" color={colors.textSecondary} numberOfLines={2}>
                {description}
              </Text>
            )}
            
            <HStack space="md" alignItems="center" marginTop="$1">
              <Badge
                size="sm"
                bg={colors.surfaceHighlight}
                borderRadius="$full"
              >
                <BadgeText color={colors.textSecondary} textTransform="capitalize">
                  {documentType}
                </BadgeText>
              </Badge>
              
              <Text size="xs" color={colors.textMuted}>
                {formatFileSize(fileSize)}
              </Text>
            </HStack>

            <Text size="xs" color={colors.textMuted}>
              {formatDate(createdAt)}
            </Text>
          </VStack>

          {/* Actions */}
          <HStack space="md" alignItems="center">
            <TouchableOpacity
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={onPress}
            >
              <Ionicons name="eye-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
            
            {onDelete && (
              <TouchableOpacity
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                onPress={onDelete}
              >
                <Ionicons 
                  name="trash-outline" 
                  size={22} 
                  color={isDeletable ? "#EF4444" : colors.textMuted} 
                />
              </TouchableOpacity>
            )}
          </HStack>
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
});

