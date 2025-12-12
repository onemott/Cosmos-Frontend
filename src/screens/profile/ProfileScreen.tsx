import React from 'react';
import { StyleSheet } from 'react-native';
import { Box, VStack, Heading, Text } from '@gluestack-ui/themed';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../config/theme';

export default function ProfileScreen() {
  return (
    <Box flex={1} justifyContent="center" alignItems="center" bg={colors.background} padding="$4">
      <Ionicons name="person-outline" size={64} color={colors.textSecondary} />
      <VStack space="sm" alignItems="center" marginTop="$4">
        <Heading size="lg" color="white">Profile</Heading>
        <Text size="sm" color={colors.textSecondary} textAlign="center">
          Coming soon...
        </Text>
      </VStack>
    </Box>
  );
}

