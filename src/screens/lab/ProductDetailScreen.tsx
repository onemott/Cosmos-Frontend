import React, { useState, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  BadgeText,
  Spinner,
} from '@gluestack-ui/themed';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { colors, spacing, borderRadius } from '../../config/theme';
import { formatCurrency } from '../../utils/format';
import { DocumentViewer } from '../../components/documents/DocumentViewer';
import {
  useProductDocuments,
  getProductDocumentDownloadUrl,
  getAccessToken,
} from '../../api/hooks';
import type { LabStackScreenProps } from '../../navigation/types';
import type { Product, ProductDocument } from '../../types/api';

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

const RISK_COLORS: Record<string, string> = {
  low: colors.success,
  medium: colors.warning,
  high: colors.error,
};

type RouteParams = {
  product: Product;
};

export default function ProductDetailScreen() {
  const route = useRoute<LabStackScreenProps<'ProductDetail'>['route']>();
  const navigation = useNavigation();
  const { product } = route.params as RouteParams;

  const [activeTab, setActiveTab] = useState<'details' | 'documents'>('details');
  const [selectedDocument, setSelectedDocument] = useState<ProductDocument | null>(null);
  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const {
    data: documents,
    isLoading: isLoadingDocs,
    refetch: refetchDocs,
    isRefetching,
    error: documentsError,
  } = useProductDocuments(product.id);

  // Debug: Log product documents fetch status
  React.useEffect(() => {
    console.log('[ProductDetailScreen] product.id:', product.id);
    console.log('[ProductDetailScreen] documents:', documents);
    console.log('[ProductDetailScreen] isLoadingDocs:', isLoadingDocs);
    if (documentsError) {
      console.error('[ProductDetailScreen] Error fetching product documents:', documentsError);
    }
  }, [product.id, documents, isLoadingDocs, documentsError]);

  const handleDocumentPress = useCallback(async (doc: ProductDocument) => {
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
        'Download functionality requires expo-file-system.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsDownloading(true);
    try {
      const token = await getAccessToken();
      const downloadUrl = getProductDocumentDownloadUrl(product.id, selectedDocument.id);

      const downloadResult = await downloadFile(
        downloadUrl,
        selectedDocument.file_name,
        false, // save to documents, not cache
        token ? { Authorization: `Bearer ${token}` } : {}
      );

      if (downloadResult.status === 200) {
        Alert.alert(
          'Download Complete',
          `${selectedDocument.name} has been saved.`,
          [{ text: 'OK' }]
        );
      } else {
        throw new Error(`Download failed with status ${downloadResult.status}`);
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Download Failed', 'Unable to download the document.', [{ text: 'OK' }]);
    } finally {
      setIsDownloading(false);
    }
  }, [selectedDocument, product.id]);

  const handleShare = useCallback(async () => {
    if (!selectedDocument) return;

    if (!ExpoFS?.File || !ExpoFS?.Paths || !Sharing) {
      Alert.alert(
        'Not Available',
        'Sharing functionality requires expo-file-system and expo-sharing.',
        [{ text: 'OK' }]
      );
      return;
    }

    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert('Not Available', 'Sharing is not available on this device.', [{ text: 'OK' }]);
      return;
    }

    setIsDownloading(true);
    try {
      const token = await getAccessToken();
      const downloadUrl = getProductDocumentDownloadUrl(product.id, selectedDocument.id);

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
      Alert.alert('Share Failed', 'Unable to share the document.', [{ text: 'OK' }]);
    } finally {
      setIsDownloading(false);
    }
  }, [selectedDocument, product.id]);

  const getDownloadUrl = useCallback(() => {
    if (!selectedDocument) return null;
    return getProductDocumentDownloadUrl(product.id, selectedDocument.id);
  }, [selectedDocument, product.id]);

  const renderDetailsTab = () => (
    <VStack space="lg" padding="$4">
      {/* Product Header */}
      <VStack space="sm">
        <HStack justifyContent="space-between" alignItems="center">
          <Text size="2xl" fontWeight="$bold" color="white" flex={1}>
            {product.name}
          </Text>
          <Badge
            size="md"
            borderRadius="$full"
            bg={RISK_COLORS[product.riskLevel]}
          >
            <BadgeText color="white" textTransform="capitalize">
              {product.riskLevel} Risk
            </BadgeText>
          </Badge>
        </HStack>
        {product.nameZh && (
          <Text size="lg" color={colors.textSecondary}>
            {product.nameZh}
          </Text>
        )}
      </VStack>

      {/* Description */}
      <Box bg={colors.surface} padding="$4" borderRadius={borderRadius.lg}>
        <Text size="sm" color={colors.textMuted} marginBottom="$2">
          Description
        </Text>
        <Text color="white" lineHeight={22}>
          {product.description}
        </Text>
        {product.descriptionZh && (
          <Text color={colors.textSecondary} marginTop="$2" lineHeight={22}>
            {product.descriptionZh}
          </Text>
        )}
      </Box>

      {/* Key Info */}
      <HStack space="md">
        <Box flex={1} bg={colors.surface} padding="$4" borderRadius={borderRadius.lg}>
          <Text size="sm" color={colors.textMuted} marginBottom="$1">
            Min. Investment
          </Text>
          <Text size="lg" fontWeight="$semibold" color={colors.primary}>
            {formatCurrency(product.minInvestment, product.currency)}
          </Text>
        </Box>
        <Box flex={1} bg={colors.surface} padding="$4" borderRadius={borderRadius.lg}>
          <Text size="sm" color={colors.textMuted} marginBottom="$1">
            Expected Return
          </Text>
          <Text size="lg" fontWeight="$semibold" color={colors.success}>
            {product.expectedReturn || 'N/A'}
          </Text>
        </Box>
      </HStack>

      {/* Asset Class */}
      <Box bg={colors.surface} padding="$4" borderRadius={borderRadius.lg}>
        <Text size="sm" color={colors.textMuted} marginBottom="$2">
          Asset Class
        </Text>
        <Text size="md" fontWeight="$medium" color="white">
          {product.assetClass}
        </Text>
      </Box>

      {/* Tags */}
      {product.tags && product.tags.length > 0 && (
        <Box bg={colors.surface} padding="$4" borderRadius={borderRadius.lg}>
          <Text size="sm" color={colors.textMuted} marginBottom="$3">
            Tags
          </Text>
          <HStack space="sm" flexWrap="wrap">
            {product.tags.map((tag) => (
              <Badge
                key={tag}
                size="md"
                variant="outline"
                borderRadius="$full"
                borderColor={colors.border}
                marginBottom="$2"
              >
                <BadgeText color={colors.textSecondary}>{tag}</BadgeText>
              </Badge>
            ))}
          </HStack>
        </Box>
      )}
    </VStack>
  );

  const renderDocumentsTab = () => (
    <Box flex={1} padding="$4">
      {isLoadingDocs ? (
        <Box flex={1} justifyContent="center" alignItems="center" paddingVertical="$8">
          <Spinner size="large" color={colors.primary} />
          <Text color={colors.textSecondary} marginTop="$3">
            Loading documents...
          </Text>
        </Box>
      ) : documentsError ? (
        <Box flex={1} justifyContent="center" alignItems="center" paddingVertical="$8">
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text color={colors.error} marginTop="$3">
            Failed to load documents
          </Text>
          <Text size="sm" color={colors.textSecondary} marginTop="$1" textAlign="center">
            {(documentsError as Error)?.message || 'Unknown error'}
          </Text>
          <TouchableOpacity
            style={{ marginTop: spacing.md }}
            onPress={() => refetchDocs()}
          >
            <Text color={colors.primary} fontWeight="$semibold">
              Tap to retry
            </Text>
          </TouchableOpacity>
        </Box>
      ) : documents && documents.length > 0 ? (
        <VStack space="sm">
          <Text size="sm" color={colors.textMuted} marginBottom="$2">
            {documents.length} document{documents.length !== 1 ? 's' : ''} available
          </Text>
          {documents.map((doc) => (
            <TouchableOpacity
              key={doc.id}
              onPress={() => handleDocumentPress(doc)}
              activeOpacity={0.7}
            >
              <HStack
                bg={colors.surface}
                padding="$4"
                borderRadius={borderRadius.lg}
                space="md"
                alignItems="center"
              >
                <Box
                  bg={`${colors.primary}20`}
                  padding="$3"
                  borderRadius={borderRadius.md}
                >
                  <Ionicons
                    name={getDocumentIcon(doc.mime_type)}
                    size={24}
                    color={colors.primary}
                  />
                </Box>
                <VStack flex={1}>
                  <Text fontWeight="$medium" color="white" numberOfLines={1}>
                    {doc.name}
                  </Text>
                  <Text size="sm" color={colors.textSecondary}>
                    {doc.file_name} • {formatFileSize(doc.file_size)}
                  </Text>
                </VStack>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textMuted}
                />
              </HStack>
            </TouchableOpacity>
          ))}
        </VStack>
      ) : (
        <Box flex={1} justifyContent="center" alignItems="center" paddingVertical="$8">
          <Ionicons name="document-outline" size={48} color={colors.textMuted} />
          <Text color={colors.textSecondary} marginTop="$3">
            No documents available
          </Text>
          {__DEV__ && (
            <Text size="xs" color={colors.textMuted} marginTop="$2">
              Product ID: {product.id}
            </Text>
          )}
        </Box>
      )}
    </Box>
  );

  return (
    <Box flex={1} bg={colors.background}>
      {/* Tab Bar */}
      <HStack bg={colors.surface} padding="$1" marginHorizontal="$4" marginTop="$2" borderRadius={borderRadius.lg}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'details' && styles.activeTab]}
          onPress={() => setActiveTab('details')}
        >
          <Text
            color={activeTab === 'details' ? 'white' : colors.textSecondary}
            fontWeight={activeTab === 'details' ? '$semibold' : '$normal'}
          >
            Details
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'documents' && styles.activeTab]}
          onPress={() => setActiveTab('documents')}
        >
          <HStack space="xs" alignItems="center">
            <Text
              color={activeTab === 'documents' ? 'white' : colors.textSecondary}
              fontWeight={activeTab === 'documents' ? '$semibold' : '$normal'}
            >
              Documents
            </Text>
            {documents && documents.length > 0 && (
              <Badge size="sm" bg={colors.primary} borderRadius="$full">
                <BadgeText color="white" size="xs">
                  {documents.length}
                </BadgeText>
              </Badge>
            )}
          </HStack>
        </TouchableOpacity>
      </HStack>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          activeTab === 'documents' ? (
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetchDocs}
              tintColor={colors.primary}
            />
          ) : undefined
        }
      >
        {activeTab === 'details' ? renderDetailsTab() : renderDocumentsTab()}
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

      {/* Loading overlay */}
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

function getDocumentIcon(mimeType: string): keyof typeof Ionicons.glyphMap {
  if (mimeType === 'application/pdf') return 'document-text';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.includes('word')) return 'document';
  return 'document-outline';
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

const styles = StyleSheet.create({
  tab: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
});

