import React, { useState, useCallback } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Text, HStack, VStack, Box } from '@gluestack-ui/themed';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../config/theme';
import type { Document, ProductDocument } from '../../types/api';

// Check if we can import PDF viewer
let Pdf: any = null;
try {
  // react-native-pdf is optional - will be added as dependency
  Pdf = require('react-native-pdf').default;
} catch {
  // PDF viewer not available
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Common fields needed by DocumentViewer.
 * Works with both client Document and ProductDocument types.
 */
type ViewableDocument = Pick<Document, 'name' | 'file_size'> & {
  mime_type?: string;
};

interface DocumentViewerProps {
  visible: boolean;
  document: ViewableDocument | null;
  downloadUrl: string | null;
  authToken: string | null;
  onClose: () => void;
  onDownload?: () => void;
  onShare?: () => void;
}

export function DocumentViewer({
  visible,
  document,
  downloadUrl,
  authToken,
  onClose,
  onDownload,
  onShare,
}: DocumentViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState({ width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.7 });

  const isPdf = document?.mime_type === 'application/pdf';
  const isImage = document?.mime_type?.startsWith('image/');
  const isWord =
    document?.mime_type === 'application/msword' ||
    document?.mime_type?.includes('wordprocessingml');

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  const handleError = useCallback((err: any) => {
    setIsLoading(false);
    setError(err?.message || 'Failed to load document');
  }, []);

  const handleImageLoad = useCallback((event: any) => {
    const { width, height } = event.nativeEvent.source;
    const aspectRatio = width / height;
    const maxWidth = SCREEN_WIDTH - spacing.md * 2;
    const maxHeight = SCREEN_HEIGHT * 0.7;

    let newWidth = maxWidth;
    let newHeight = maxWidth / aspectRatio;

    if (newHeight > maxHeight) {
      newHeight = maxHeight;
      newWidth = maxHeight * aspectRatio;
    }

    setImageSize({ width: newWidth, height: newHeight });
    handleLoad();
  }, [handleLoad]);

  const renderContent = () => {
    if (!document || !downloadUrl) {
      return (
        <Box flex={1} justifyContent="center" alignItems="center">
          <Ionicons name="document-outline" size={64} color={colors.textMuted} />
          <Text color={colors.textSecondary} marginTop="$4">
            No document selected
          </Text>
        </Box>
      );
    }

    // Word documents - show download prompt
    if (isWord) {
      return (
        <Box flex={1} justifyContent="center" alignItems="center" padding="$6">
          <Box bg={colors.surface} padding="$6" borderRadius={borderRadius.xl} marginBottom="$4">
            <Ionicons name="document-text" size={64} color={colors.primary} />
          </Box>
          <Text color="white" size="lg" fontWeight="$semibold" textAlign="center">
            {document.name}
          </Text>
          <Text color={colors.textSecondary} size="sm" marginTop="$2" textAlign="center">
            Word documents cannot be viewed in-app.
          </Text>
          <Text color={colors.textSecondary} size="sm" textAlign="center">
            Please download to view.
          </Text>
          {onDownload && (
            <TouchableOpacity style={styles.downloadButton} onPress={onDownload}>
              <Ionicons name="download-outline" size={20} color="white" />
              <Text color="white" marginLeft="$2" fontWeight="$semibold">
                Download Document
              </Text>
            </TouchableOpacity>
          )}
        </Box>
      );
    }

    // PDF viewer
    if (isPdf) {
      if (!Pdf) {
        return (
          <Box flex={1} justifyContent="center" alignItems="center" padding="$6">
            <Ionicons name="alert-circle-outline" size={48} color={colors.warning} />
            <Text color={colors.textSecondary} marginTop="$4" textAlign="center">
              PDF viewer is not available.
            </Text>
            <Text color={colors.textSecondary} size="sm" textAlign="center">
              Please download to view this document.
            </Text>
            {onDownload && (
              <TouchableOpacity style={styles.downloadButton} onPress={onDownload}>
                <Ionicons name="download-outline" size={20} color="white" />
                <Text color="white" marginLeft="$2" fontWeight="$semibold">
                  Download PDF
                </Text>
              </TouchableOpacity>
            )}
          </Box>
        );
      }

      return (
        <View style={styles.pdfContainer}>
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
          <Pdf
            source={{
              uri: downloadUrl,
              headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
            }}
            style={styles.pdf}
            onLoadComplete={handleLoad}
            onError={handleError}
            enablePaging={true}
            horizontal={false}
            trustAllCerts={false}
          />
        </View>
      );
    }

    // Image viewer
    if (isImage) {
      return (
        <ScrollView
          style={styles.imageScrollView}
          contentContainerStyle={styles.imageScrollContent}
          maximumZoomScale={3}
          minimumZoomScale={1}
          showsVerticalScrollIndicator={false}
        >
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
          <Image
            source={{
              uri: downloadUrl,
              headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
            }}
            style={[styles.image, { width: imageSize.width, height: imageSize.height }]}
            resizeMode="contain"
            onLoad={handleImageLoad}
            onError={() => handleError(new Error('Failed to load image'))}
          />
        </ScrollView>
      );
    }

    // Unknown file type
    return (
      <Box flex={1} justifyContent="center" alignItems="center" padding="$6">
        <Ionicons name="help-circle-outline" size={48} color={colors.textMuted} />
        <Text color={colors.textSecondary} marginTop="$4" textAlign="center">
          This file type cannot be previewed.
        </Text>
        {onDownload && (
          <TouchableOpacity style={styles.downloadButton} onPress={onDownload}>
            <Ionicons name="download-outline" size={20} color="white" />
            <Text color="white" marginLeft="$2" fontWeight="$semibold">
              Download File
            </Text>
          </TouchableOpacity>
        )}
      </Box>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>

          <View style={styles.headerTitle}>
            <Text color="white" size="md" fontWeight="$semibold" numberOfLines={1}>
              {document?.name || 'Document'}
            </Text>
            {document && (
              <Text color={colors.textSecondary} size="xs">
                {formatFileSize(document.file_size)}
              </Text>
            )}
          </View>

          <HStack space="sm">
            {onShare && (
              <TouchableOpacity onPress={onShare} style={styles.headerButton}>
                <Ionicons name="share-outline" size={22} color="white" />
              </TouchableOpacity>
            )}
            {onDownload && (
              <TouchableOpacity onPress={onDownload} style={styles.headerButton}>
                <Ionicons name="download-outline" size={22} color="white" />
              </TouchableOpacity>
            )}
          </HStack>
        </View>

        {/* Error state */}
        {error && (
          <Box
            bg={colors.errorBackground}
            padding="$3"
            margin="$3"
            borderRadius={borderRadius.md}
          >
            <HStack space="sm" alignItems="center">
              <Ionicons name="alert-circle" size={20} color={colors.error} />
              <Text color={colors.error} size="sm" flex={1}>
                {error}
              </Text>
            </HStack>
          </Box>
        )}

        {/* Content */}
        <View style={styles.content}>{renderContent()}</View>
      </View>
    </Modal>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 50 : spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: spacing.md,
  },
  content: {
    flex: 1,
  },
  pdfContainer: {
    flex: 1,
  },
  pdf: {
    flex: 1,
    backgroundColor: colors.background,
  },
  imageScrollView: {
    flex: 1,
  },
  imageScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  image: {
    backgroundColor: colors.surface,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    zIndex: 10,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
  },
});

export default DocumentViewer;

