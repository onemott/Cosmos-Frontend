import React from 'react';
import { StyleSheet } from 'react-native';
import { Box, VStack, Heading, Text } from '@gluestack-ui/themed';
import { Ionicons } from '@expo/vector-icons';

export default function DocumentsListScreen() {
  return (
    <Box flex={1} justifyContent="center" alignItems="center" bg="$backgroundLight50" padding="$4">
      <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
      <VStack space="sm" alignItems="center" marginTop="$4">
        <Heading size="lg">Documents</Heading>
        <Text size="sm" color="$textLight500" textAlign="center">
          Coming soon...
        </Text>
      </VStack>
    </Box>
  );
}

