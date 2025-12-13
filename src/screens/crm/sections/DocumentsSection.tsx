import React, { useState } from 'react';
import {
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Linking,
} from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Spinner,
  Button,
  ButtonText,
} from '@gluestack-ui/themed';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../../config/theme';
import { DocumentCard } from '../../../components/crm/DocumentCard';
import { useDocuments } from '../../../api/hooks';
import type { Document } from '../../../types/api';

const DOCUMENT_FILTERS = [
  { key: undefined, label: 'All' },
  { key: 'statement', label: 'Statements' },
  { key: 'report', label: 'Reports' },
  { key: 'contract', label: 'Contracts' },
  { key: 'tax', label: 'Tax' },
];

export default function DocumentsSection() {
  const [filterType, setFilterType] = useState<string | undefined>(undefined);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isViewerVisible, setIsViewerVisible] = useState(false);

  const { data: documents, isLoading, refetch, isRefetching } = useDocuments(filterType);

  const handleDocumentPress = (doc: Document) => {
    setSelectedDocument(doc);
    setIsViewerVisible(true);
  };

  const handleDownload = () => {
    // TODO: Implement actual download via API
    Alert.alert(
      'Download',
      'Document download will be available once backend integration is complete.',
      [{ text: 'OK' }]
    );
  };

  const handleShare = () => {
    // TODO: Implement sharing
    Alert.alert(
      'Share',
      'Document sharing will be available once backend integration is complete.',
      [{ text: 'OK' }]
    );
  };

  if (isLoading) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center">
        <Spinner size="large" color={colors.primary} />
      </Box>
    );
  }

  const docList = Array.isArray(documents) ? documents : [];

  return (
    <Box flex={1}>
      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {DOCUMENT_FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter.label}
            onPress={() => setFilterType(filter.key)}
            style={[
              styles.filterChip,
              filterType === filter.key && styles.filterChipActive,
            ]}
          >
            <Text
              size="sm"
              color={filterType === filter.key ? colors.primary : colors.textSecondary}
              fontWeight={filterType === filter.key ? '$semibold' : '$normal'}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Documents List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
      >
        {docList.length === 0 ? (
          <Box alignItems="center" paddingVertical="$8">
            <Ionicons name="document-outline" size={48} color={colors.textMuted} />
            <Text color={colors.textSecondary} marginTop="$2">
              No documents found
            </Text>
          </Box>
        ) : (
          docList.map((doc: Document) => (
            <DocumentCard
              key={doc.id}
              id={doc.id}
              name={doc.name}
              documentType={doc.document_type}
              fileSize={doc.file_size}
              createdAt={doc.created_at}
              onPress={() => handleDocumentPress(doc)}
            />
          ))
        )}
      </ScrollView>

      {/* Document Viewer Modal */}
      <Modal
        visible={isViewerVisible}
        animationType="slide"
        onRequestClose={() => setIsViewerVisible(false)}
      >
        <Box flex={1} bg={colors.background}>
          {/* Header */}
          <HStack
            justifyContent="space-between"
            alignItems="center"
            padding="$4"
            paddingTop="$6"
            borderBottomWidth={1}
            borderBottomColor={colors.border}
          >
            <TouchableOpacity onPress={() => setIsViewerVisible(false)}>
              <HStack alignItems="center" space="xs">
                <Ionicons name="chevron-back" size={24} color={colors.primary} />
                <Text color={colors.primary}>Back</Text>
              </HStack>
            </TouchableOpacity>
            
            <HStack space="md">
              <TouchableOpacity onPress={handleShare}>
                <Ionicons name="share-outline" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDownload}>
                <Ionicons name="download-outline" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </HStack>
          </HStack>

          {/* Document Info & Preview Placeholder */}
          <Box flex={1} justifyContent="center" alignItems="center" padding="$4">
            {selectedDocument && (
              <VStack space="lg" alignItems="center">
                <Box
                  bg={colors.surface}
                  padding="$6"
                  borderRadius={borderRadius.xl}
                >
                  <Ionicons name="document-text" size={64} color={colors.primary} />
                </Box>
                
                <VStack space="xs" alignItems="center">
                  <Heading size="lg" color="white" textAlign="center">
                    {selectedDocument.name}
                  </Heading>
                  <Text color={colors.textSecondary} textTransform="capitalize">
                    {selectedDocument.document_type}
                  </Text>
                </VStack>

                <Box
                  bg={colors.surface}
                  padding="$4"
                  borderRadius={borderRadius.lg}
                  width="100%"
                >
                  <Text size="sm" color={colors.textMuted} textAlign="center">
                    PDF viewer requires react-native-pdf integration.
                    {'\n\n'}
                    For now, documents can be downloaded and viewed externally.
                  </Text>
                </Box>

                <HStack space="md" marginTop="$4">
                  <Button
                    variant="outline"
                    borderColor={colors.border}
                    onPress={handleShare}
                  >
                    <Ionicons name="share-outline" size={18} color={colors.textSecondary} />
                    <ButtonText color={colors.textSecondary} marginLeft="$2">Share</ButtonText>
                  </Button>
                  <Button bg={colors.primary} onPress={handleDownload}>
                    <Ionicons name="download-outline" size={18} color="white" />
                    <ButtonText marginLeft="$2">Download</ButtonText>
                  </Button>
                </HStack>
              </VStack>
            )}
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}

const styles = StyleSheet.create({
  filterScroll: {
    maxHeight: 50,
  },
  filterContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
  },
  filterChipActive: {
    backgroundColor: `${colors.primary}20`,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
});

