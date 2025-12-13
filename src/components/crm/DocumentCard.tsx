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
  fileSize: number;
  createdAt: string;
  onPress: () => void;
}

const DOC_TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  statement: 'document-text',
  report: 'bar-chart',
  contract: 'document',
  tax: 'receipt',
  other: 'document-outline',
};

const DOC_TYPE_COLORS: Record<string, string> = {
  statement: colors.primary,
  report: colors.success,
  contract: colors.warning,
  tax: '#8B5CF6', // Purple
  other: colors.textSecondary,
};

export function DocumentCard({
  name,
  documentType,
  fileSize,
  createdAt,
  onPress,
}: DocumentCardProps) {
  const icon = DOC_TYPE_ICONS[documentType] || DOC_TYPE_ICONS.other;
  const iconColor = DOC_TYPE_COLORS[documentType] || DOC_TYPE_COLORS.other;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Box style={styles.container}>
        <HStack space="md" alignItems="center">
          {/* Icon */}
          <Box
            bg={`${iconColor}20`}
            padding="$3"
            borderRadius={borderRadius.md}
          >
            <Ionicons name={icon} size={24} color={iconColor} />
          </Box>

          {/* Content */}
          <VStack flex={1} space="xs">
            <Text
              size="md"
              fontWeight="$semibold"
              color="white"
              numberOfLines={1}
            >
              {name}
            </Text>
            
            <HStack space="md" alignItems="center">
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
          <HStack space="sm">
            <TouchableOpacity
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={onPress}
            >
              <Ionicons name="eye-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
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

