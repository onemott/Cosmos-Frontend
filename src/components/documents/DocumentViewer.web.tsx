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
} from 'react-native';
import { Text, HStack, Box } from '@gluestack-ui/themed';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../config/theme';
import type { Document } from '../../types/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  
  // Helper to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

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

    // PDF viewer for Web (using iframe)
    if (isPdf) {
      return (
        <View style={styles.webContainer}>
          <iframe
            src={downloadUrl}
            width="100%"
            height="100%"
            style={{ border: 'none' }}
            title={document.name}
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
          showsVerticalScrollIndicator={false}
        >
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

    // Fallback for other files
    return (
      <Box flex={1} justifyContent="center" alignItems="center" padding="$6">
        <Ionicons name="document-text-outline" size={64} color={colors.primary} />
        <Text color="white" size="lg" fontWeight="$semibold" textAlign="center" marginTop="$4">
          {document.name}
        </Text>
        <Text color={colors.textSecondary} size="sm" marginTop="$2" textAlign="center">
          Preview not available for this file type.
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

        {/* Content */}
        <View style={styles.content}>{renderContent()}</View>
      </View>
    </Modal>
  );
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
    paddingTop: 50, // SafeArea
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 10,
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.surfaceHighlight,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: 'white',
  },
  imageScrollView: {
    flex: 1,
    width: '100%',
  },
  imageScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  image: {
    borderRadius: 8,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 24,
  },
});
