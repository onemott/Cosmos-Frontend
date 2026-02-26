import React from 'react';
import { ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Box, Text } from '@gluestack-ui/themed';
import Markdown from 'react-native-markdown-display';
import { colors, spacing } from '../../config/theme';
import { useSystemConfig } from '../../api/hooks';

export default function PrivacyScreen() {
  const { data: config, isLoading, error } = useSystemConfig('privacy_policy');

  if (isLoading) {
    return (
      <Box flex={1} bg={colors.background} justifyContent="center" alignItems="center">
        <ActivityIndicator size="large" color={colors.primary} />
      </Box>
    );
  }

  if (error || !config) {
    return (
      <Box flex={1} bg={colors.background} justifyContent="center" alignItems="center" p="$4">
        <Text color={colors.error} textAlign="center">
          无法加载隐私政策。请检查网络连接。
        </Text>
      </Box>
    );
  }

  return (
    <Box flex={1} bg={colors.background}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <Markdown style={markdownStyles}>
          {config.value}
        </Markdown>
      </ScrollView>
    </Box>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
});

const markdownStyles = {
  body: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
  },
  heading1: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 8,
  },
  heading2: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 20,
  },
  heading3: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 16,
  },
  link: {
    color: colors.primary,
  },
  list_item: {
    color: colors.textSecondary,
    fontSize: 16,
    marginVertical: 4,
  },
  strong: {
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
};
