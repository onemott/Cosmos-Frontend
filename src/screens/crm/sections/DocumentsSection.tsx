import React, { useState, useCallback } from 'react';
import {
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import {
  Box,
  HStack,
  Text,
  Spinner,
} from '@gluestack-ui/themed';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../../config/theme';
import { DocumentCard } from '../../../components/crm/DocumentCard';
import { DocumentViewer } from '../../../components/documents/DocumentViewer';
import { useDocuments, getDocumentDownloadUrl, getAccessToken } from '../../../api/hooks';
import type { Document } from '../../../types/api';

// Optional dependencies for download/share
let Sharing: any = null;
let ExpoFS: any = null;

try {
  ExpoFS = require('expo-file-system');
  Sharing = require('expo-sharing');
} catch {
  // Optional deps not available
}

// Helper function to download file using expo-file-system new API
async function downloadFile(
  url: string,
  fileName: string,
  useCache: boolean = false,
  headers?: Record<string, string>
): Promise<{ uri: string; status: number }> {
  try {
    if (!ExpoFS?.File || !ExpoFS?.Paths) {
      return { uri: '', status: 500 };
    }
    
    const { File, Paths } = ExpoFS;
    const directory = useCache ? Paths.cache : Paths.document;
    const destFile = new File(directory, fileName);
    
    // Use static File.downloadFileAsync method
    const resultFile = await File.downloadFileAsync(url, destFile, {
      headers: headers || {},
    });
    
    return { uri: resultFile.uri, status: 200 };
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
}

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
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: documents, isLoading, refetch, isRefetching } = useDocuments(filterType);

  const handleDocumentPress = useCallback(async (doc: Document) => {
    // Get auth token for authenticated requests
    const token = await getAccessToken();
    setAuthToken(token);
    setSelectedDocument(doc);
    setIsViewerVisible(true);
  }, []);

  const handleCloseViewer = useCallback(() => {
    setIsViewerVisible(false);
    setSelectedDocument(null);
  }, []);

  const handleDownload = useCallback(async () => {
    if (!selectedDocument) return;

    if (!ExpoFS?.File || !ExpoFS?.Paths) {
      Alert.alert(
        'Not Available',
        'Download functionality requires expo-file-system. Please install it to enable downloads.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsDownloading(true);
    try {
      const token = await getAccessToken();
      const downloadUrl = getDocumentDownloadUrl(selectedDocument.id);

      const downloadResult = await downloadFile(
        downloadUrl,
        selectedDocument.file_name,
        false, // save to documents, not cache
        token ? { Authorization: `Bearer ${token}` } : {}
      );

      if (downloadResult.status === 200) {
        Alert.alert(
          'Download Complete',
          `${selectedDocument.name} has been saved to your device.`,
          [{ text: 'OK' }]
        );
      } else {
        throw new Error(`Download failed with status ${downloadResult.status}`);
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert(
        'Download Failed',
        'Unable to download the document. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsDownloading(false);
    }
  }, [selectedDocument]);

  const handleShare = useCallback(async () => {
    if (!selectedDocument) return;

    if (!ExpoFS?.File || !ExpoFS?.Paths || !Sharing) {
      Alert.alert(
        'Not Available',
        'Sharing functionality requires expo-file-system and expo-sharing. Please install them to enable sharing.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Check if sharing is available on this platform
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert('Not Available', 'Sharing is not available on this device.', [{ text: 'OK' }]);
      return;
    }

    setIsDownloading(true);
    try {
      const token = await getAccessToken();
      const downloadUrl = getDocumentDownloadUrl(selectedDocument.id);

      // Download to cache first
      const downloadResult = await downloadFile(
        downloadUrl,
        selectedDocument.file_name,
        true, // use cache for sharing
        token ? { Authorization: `Bearer ${token}` } : {}
      );

      if (downloadResult.status === 200 && downloadResult.uri) {
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: selectedDocument.mime_type,
          dialogTitle: `Share ${selectedDocument.name}`,
        });
      } else {
        throw new Error(`Download failed with status ${downloadResult.status}`);
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Share Failed', 'Unable to share the document. Please try again.', [
        { text: 'OK' },
      ]);
    } finally {
      setIsDownloading(false);
    }
  }, [selectedDocument]);

  const getDownloadUrl = useCallback(() => {
    if (!selectedDocument) return null;
    return getDocumentDownloadUrl(selectedDocument.id);
  }, [selectedDocument]);

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

      {/* Document Viewer */}
      <DocumentViewer
        visible={isViewerVisible}
        document={selectedDocument}
        downloadUrl={getDownloadUrl()}
        authToken={authToken}
        onClose={handleCloseViewer}
        onDownload={handleDownload}
        onShare={handleShare}
      />

      {/* Loading overlay for download/share */}
      {isDownloading && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="rgba(0,0,0,0.5)"
          justifyContent="center"
          alignItems="center"
        >
          <Box bg={colors.surface} padding="$6" borderRadius={borderRadius.lg}>
            <Spinner size="large" color={colors.primary} />
            <Text color={colors.textSecondary} marginTop="$3">
              Processing...
            </Text>
          </Box>
        </Box>
      )}
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

