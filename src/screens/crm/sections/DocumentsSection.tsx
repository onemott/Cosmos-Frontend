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
  Text,
  Spinner,
  Button,
  ButtonText,
  ButtonIcon,
  AddIcon,
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicatorWrapper,
  ActionsheetDragIndicator,
  ActionsheetItem,
  ActionsheetItemText,
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Heading,
  Input,
  InputField,
  InputSlot,
  InputIcon,
  SearchIcon,
  VStack,
  HStack,
} from '@gluestack-ui/themed';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
// Use legacy API to avoid deprecation error with downloadAsync in newer expo-file-system
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { colors, spacing, borderRadius } from '../../../config/theme';
import { DocumentCard } from '../../../components/crm/DocumentCard';
import { DocumentViewer } from '../../../components/documents/DocumentViewer';
import { useDocuments, useUploadDocument, useDeleteDocument, getDocumentDownloadUrl, getAccessToken } from '../../../api/hooks';
import { useTranslation } from '../../../lib/i18n';
import type { Document } from '../../../types/api';

export default function DocumentsSection() {
  const { t } = useTranslation();
  
  const DOCUMENT_FILTERS = [
    { key: undefined, label: t('common.all') },
    { key: 'statement', label: t('crm.documents.statements') },
    { key: 'report', label: t('crm.documents.reports') },
    { key: 'contract', label: t('crm.documents.contracts') },
    { key: 'tax', label: t('crm.documents.tax') },
    { key: 'kyc', label: t('crm.documents.kyc') },
    { key: 'compliance', label: t('crm.documents.compliance') },
  ];
  const [filterType, setFilterType] = useState<string | undefined>(undefined);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showUploadSheet, setShowUploadSheet] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [uploadType, setUploadType] = useState<string>('other');
  const [uploadDescription, setUploadDescription] = useState('');

  const { data: documents, isLoading, refetch, isRefetching } = useDocuments(filterType);
  const { mutate: uploadDocument, isPending: isUploading } = useUploadDocument();
  const { mutate: deleteDocument } = useDeleteDocument();

  const handleUploadPress = () => setShowUploadSheet(true);

  const handleLongPress = useCallback((doc: Document) => {
    if (doc.uploaded_by_id) {
        Alert.alert(
            t('common.info'),
            t('crm.documents.deleteNotAllowed', { defaultValue: 'You can only delete documents that you uploaded yourself.' })
        );
        return;
    }

    Alert.alert(
      t('crm.documents.deleteTitle', { defaultValue: 'Delete Document' }),
      t('crm.documents.deleteConfirm', { defaultValue: 'Are you sure you want to delete this document?' }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive',
          onPress: () => {
            deleteDocument(doc.id, {
              onError: (error: any) => {
                const message = error.response?.data?.detail || t('crm.documents.deleteFailed');
                Alert.alert(t('common.error'), message);
              }
            });
          }
        }
      ]
    );
  }, [deleteDocument, t]);

  const handleSelectType = useCallback(async (type: string) => {
    setShowUploadSheet(false);
    
    // Small delay to allow sheet to close
    setTimeout(async () => {
      try {
        const allowedMimeTypes = [
          'application/pdf', 
          'image/jpeg', 
          'image/png', 
          'image/heic',
          'image/gif',
          'image/webp',
          'application/msword', 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
        ];

        const result = await DocumentPicker.getDocumentAsync({
          type: allowedMimeTypes,
          copyToCacheDirectory: true,
        });
  
        if (result.canceled) return;
        
        const asset = result.assets[0];

        // Validation: Check file size (50MB limit)
        const MAX_SIZE = 50 * 1024 * 1024; // 50MB
        if (asset.size && asset.size > MAX_SIZE) {
          Alert.alert(
            t('common.error'),
            t('crm.documents.fileTooLarge', { defaultValue: 'File is too large. Max size is 50MB.' })
          );
          return;
        }

        const mimeType = asset.mimeType;
        const extension = asset.name.split('.').pop()?.toLowerCase();
        
        const isValidMime = mimeType && allowedMimeTypes.some(type => mimeType.includes(type));
        const isValidExt = extension && ['pdf', 'jpg', 'jpeg', 'png', 'heic', 'gif', 'webp', 'doc', 'docx', 'xls', 'xlsx'].includes(extension);

        if (!isValidMime && !isValidExt) {
             Alert.alert(
                t('common.error'),
                t('crm.documents.invalidFormat', { defaultValue: 'Invalid file format. Supported: PDF, Images (JPEG/PNG/HEIC/GIF/WEBP), Word, Excel' })
             );
             return;
        }

        // Set state and open modal
        setUploadFile(asset);
        setUploadType(type);
        setUploadDescription('');
        setShowUploadModal(true);
        
      } catch (err) {
        console.error('Picker error:', err);
      }
    }, 500);
  }, [t]);

  const handleConfirmUpload = useCallback(async () => {
    if (!uploadFile) return;

    const formData = new FormData();
        
    if (Platform.OS === 'web') {
      // On web, we need to append the File object directly
      if (uploadFile.file) {
        formData.append('file', uploadFile.file);
      } else {
        // Fallback: fetch blob from URI
        try {
            const response = await fetch(uploadFile.uri);
            const blob = await response.blob();
            formData.append('file', blob, uploadFile.name);
        } catch (e) {
            console.error("Failed to fetch blob", e);
            Alert.alert(t('common.error'), "Failed to process file");
            return;
        }
      }
    } else {
      // React Native expects an object with uri, name, type
    // Helper to determine mime type if missing
    const getMimeType = (name: string, fallback: string) => {
        const ext = name.split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'pdf': return 'application/pdf';
            case 'jpg':
            case 'jpeg': return 'image/jpeg';
            case 'png': return 'image/png';
            case 'heic': return 'image/heic';
            case 'gif': return 'image/gif';
            case 'webp': return 'image/webp';
            case 'doc': return 'application/msword';
            case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            case 'xls': return 'application/vnd.ms-excel';
            case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            default: return fallback;
        }
    };

    const mimeType = uploadFile.mimeType || getMimeType(uploadFile.name, 'application/octet-stream');

    // @ts-ignore: React Native FormData
    formData.append('file', {
        uri: uploadFile.uri,
        name: uploadFile.name,
        type: mimeType,
    });
    }

    formData.append('document_type', uploadType);
    formData.append('name', uploadFile.name);
    if (uploadDescription) {
        formData.append('description', uploadDescription);
    }

    setShowUploadModal(false);

    uploadDocument(formData, {
      onSuccess: () => {
        Alert.alert(t('common.success'), t('crm.documents.uploadSuccess'));
        refetch(); // Refresh list
        setUploadFile(null);
        setUploadDescription('');
      },
      onError: (error) => {
        console.error('Upload error:', error);
        Alert.alert(t('common.error'), t('crm.documents.uploadFailed'));
        // Re-open modal if needed, or just keep it closed? 
        // Better to keep it closed to avoid state complexity, user can retry.
      },
    });
  }, [uploadFile, uploadType, uploadDescription, uploadDocument, t, refetch]);

  const handleCancelUpload = () => {
    setShowUploadModal(false);
    setUploadFile(null);
    setUploadDescription('');
  };

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

    setIsDownloading(true);
    try {
      const token = await getAccessToken();
      const downloadUrl = getDocumentDownloadUrl(selectedDocument.id);

      if (Platform.OS === 'web') {
        const response = await fetch(downloadUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!response.ok) throw new Error(`Download failed with status ${response.status}`);

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = selectedDocument.file_name || selectedDocument.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        Alert.alert(t('common.success'), t('crm.documents.downloadComplete'));
        return;
      }
      
      // Ensure we have a valid directory
      const fileUri = `${FileSystem.documentDirectory}${selectedDocument.file_name}`;

      const downloadResult = await FileSystem.downloadAsync(
        downloadUrl,
        fileUri,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (downloadResult.status === 200) {
        Alert.alert(
          t('crm.documents.downloadComplete'),
          t('crm.documents.downloadCompleteMessage', { name: selectedDocument.name }),
          [
            { 
              text: t('common.open'), 
              onPress: async () => {
                const canOpen = await Sharing.isAvailableAsync();
                if (canOpen) {
                  await Sharing.shareAsync(downloadResult.uri);
                } else {
                   Alert.alert(t('common.info'), t('crm.documents.savedTo', { path: downloadResult.uri }));
                }
              }
            },
            { text: t('common.ok') }
          ]
        );
      } else {
        throw new Error(`Download failed with status ${downloadResult.status}`);
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert(
        t('crm.documents.downloadFailed'),
        t('crm.documents.downloadFailedMessage'),
        [{ text: t('common.ok') }]
      );
    } finally {
      setIsDownloading(false);
    }
  }, [selectedDocument, t]);

  const handleShare = useCallback(async () => {
    if (!selectedDocument) return;

    if (Platform.OS === 'web') {
      setIsDownloading(true);
      try {
        const token = await getAccessToken();
        const downloadUrl = getDocumentDownloadUrl(selectedDocument.id);

        // Check if Web Share API is supported AND supports files
        let canShareFiles = false;
        try {
            if (typeof navigator.share === 'function' && typeof navigator.canShare === 'function') {
                // We can't really check 'canShare' with a real file without fetching it first,
                // which might break the user activation chain. 
                // However, we can do a basic check.
                // For desktop, this usually returns false for files.
                canShareFiles = true; // Optimistic check, will be verified after fetch
            }
        } catch (e) {
            canShareFiles = false;
        }

        // 1. Try Native Web Share if likely supported
        if (canShareFiles) {
          try {
            const response = await fetch(downloadUrl, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });

            if (!response.ok) throw new Error('Download failed');

            const blob = await response.blob();
            const file = new File([blob], selectedDocument.file_name || selectedDocument.name, {
              type: selectedDocument.mime_type || blob.type,
            });

            if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
              await navigator.share({
                files: [file],
                title: selectedDocument.name,
                text: selectedDocument.name,
              });
              return;
            }
          } catch (shareError) {
             console.warn('Web Share API failed, falling back to download', shareError);
             // Continue to fallback
          }
        }
        
        // 2. Fallback: Auto-download for manual sharing
        // Re-use handleDownload logic for consistency
        const response = await fetch(downloadUrl, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        
        if (!response.ok) throw new Error('Download failed');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = selectedDocument.file_name || selectedDocument.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        // Notify user clearly
        Alert.alert(
            t('common.info'), 
            t('crm.documents.shareNotAvailableWeb', { defaultValue: 'Browser sharing not supported. File downloaded for manual sharing.' })
        );

      } catch (error) {
        console.error('Web share error:', error);
        // Fallback to error alert if everything fails
        Alert.alert(t('common.error'), t('crm.documents.shareFailed'));
      } finally {
        setIsDownloading(false);
      }
      return;
    }

    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert(t('crm.documents.notAvailable'), t('crm.documents.shareNotAvailable'), [{ text: t('common.ok') }]);
      return;
    }

    setIsDownloading(true);
    try {
      const token = await getAccessToken();
      const downloadUrl = getDocumentDownloadUrl(selectedDocument.id);
      
      // Use cache directory for sharing
      const fileUri = `${FileSystem.cacheDirectory}${selectedDocument.file_name}`;

      const downloadResult = await FileSystem.downloadAsync(
        downloadUrl,
        fileUri,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (downloadResult.status === 200) {
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: selectedDocument.mime_type,
          dialogTitle: `Share ${selectedDocument.name}`,
        });
      } else {
        throw new Error(`Download failed with status ${downloadResult.status}`);
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert(t('crm.documents.shareFailed'), t('crm.documents.shareFailedMessage'), [
        { text: t('common.ok') },
      ]);
    } finally {
      setIsDownloading(false);
    }
  }, [selectedDocument, t]);

  const getDownloadUrl = useCallback(() => {
    if (!selectedDocument) return null;
    return getDocumentDownloadUrl(selectedDocument.id);
  }, [selectedDocument]);

  const docList = (Array.isArray(documents) ? documents : []).filter((doc) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const nameMatch = doc.name.toLowerCase().includes(query);
    const descMatch = doc.description?.toLowerCase().includes(query);
    return nameMatch || descMatch;
  });

  return (
    <Box flex={1}>
      {/* Upload Button */}
      <Box paddingHorizontal="$4" paddingTop="$4" paddingBottom="$2">
        <Button
          size="md"
          variant="solid"
          action="primary"
          isDisabled={isUploading || isDownloading}
          isFocusVisible={false}
          onPress={handleUploadPress}
        >
          <ButtonIcon as={AddIcon} marginRight="$2" />
          <ButtonText>{t('crm.documents.upload')}</ButtonText>
          {isUploading && <Spinner color="white" marginLeft="$2" />}
        </Button>
      </Box>

      {/* Search Input */}
      <Box paddingHorizontal="$4" paddingBottom="$2">
        <Input size="md" variant="outline" isFullWidth>
          <InputField
            placeholder={t('common.search')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          <InputSlot paddingRight="$3">
            <InputIcon as={SearchIcon} />
          </InputSlot>
        </Input>
      </Box>

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
              size="md"
              color={filterType === filter.key ? 'white' : colors.textSecondary}
              fontWeight={filterType === filter.key ? '$bold' : '$medium'}
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
        {isLoading ? (
          <Box flex={1} justifyContent="center" alignItems="center" paddingVertical="$8">
            <Spinner size="large" color={colors.primary} />
          </Box>
        ) : docList.length === 0 ? (
          <Box alignItems="center" paddingVertical="$8">
            <Ionicons name="document-outline" size={48} color={colors.textMuted} />
            <Text color={colors.textSecondary} marginTop="$2">
              {t('crm.documents.noDocuments')}
            </Text>
          </Box>
        ) : (
          docList.map((doc: Document) => (
            <DocumentCard
              key={doc.id}
              id={doc.id}
              name={doc.name}
              documentType={doc.document_type}
              status={doc.status}
              description={doc.description}
              fileSize={doc.file_size}
              createdAt={doc.created_at}
              onPress={() => handleDocumentPress(doc)}
              onLongPress={() => handleLongPress(doc)}
              isDeletable={!doc.uploaded_by_id}
              onDelete={() => handleLongPress(doc)}
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

      {/* Upload Confirmation Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={handleCancelUpload}
      >
        <ModalBackdrop />
        <ModalContent>
          <ModalHeader>
            <Heading size="lg">{t('crm.documents.upload')}</Heading>
          </ModalHeader>
          <ModalBody>
            <VStack space="md">
              <Box>
                <Text size="sm" color={colors.textSecondary} mb="$1">
                  {t('crm.documents.selectedFile')}:
                </Text>
                <Box bg={colors.background} p="$3" borderRadius="$md" borderColor={colors.border} borderWidth={1}>
                  <HStack space="md" alignItems="center">
                    <Ionicons name="document-text" size={24} color={colors.primary} />
                    <VStack flex={1}>
                      <Text fontWeight="$bold" numberOfLines={1}>
                        {uploadFile?.name}
                      </Text>
                      <Text size="xs" color={colors.textMuted}>
                        {uploadFile?.size ? (uploadFile.size / 1024 / 1024).toFixed(2) : 0} MB
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              </Box>

              <Box>
                <Text size="sm" color={colors.textSecondary} mb="$1">
                  {t('crm.documents.description')}:
                </Text>
                <Input size="md" variant="outline">
                  <InputField
                    placeholder={t('crm.documents.descriptionPlaceholder', { defaultValue: 'Enter description (optional)' })}
                    value={uploadDescription}
                    onChangeText={setUploadDescription}
                  />
                </Input>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="outline"
              size="sm"
              action="secondary"
              mr="$3"
              onPress={handleCancelUpload}
            >
              <ButtonText>{t('common.cancel')}</ButtonText>
            </Button>
            <Button
              size="sm"
              action="primary"
              onPress={handleConfirmUpload}
              isDisabled={isUploading}
            >
              <ButtonText>{t('common.upload')}</ButtonText>
              {isUploading && <Spinner color="white" marginLeft="$2" />}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Upload Action Sheet */}
      <Actionsheet isOpen={showUploadSheet} onClose={() => setShowUploadSheet(false)}>
        <ActionsheetBackdrop />
        <ActionsheetContent>
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>
          <Box p="$4" pb="$2">
            <Text size="sm" color={colors.textSecondary} textAlign="center">
              {t('crm.documents.upload')}
            </Text>
            <Text size="xs" color={colors.textMuted} textAlign="center" mt="$1">
              {t('crm.documents.supportedFormats')}
            </Text>
          </Box>
          <ActionsheetItem onPress={() => handleSelectType('statement')}>
            <ActionsheetItemText>{t('crm.documents.statements')}</ActionsheetItemText>
          </ActionsheetItem>
          <ActionsheetItem onPress={() => handleSelectType('report')}>
            <ActionsheetItemText>{t('crm.documents.reports')}</ActionsheetItemText>
          </ActionsheetItem>
          <ActionsheetItem onPress={() => handleSelectType('contract')}>
            <ActionsheetItemText>{t('crm.documents.contracts')}</ActionsheetItemText>
          </ActionsheetItem>
          <ActionsheetItem onPress={() => handleSelectType('tax')}>
            <ActionsheetItemText>{t('crm.documents.tax')}</ActionsheetItemText>
          </ActionsheetItem>
          <ActionsheetItem onPress={() => handleSelectType('kyc')}>
            <ActionsheetItemText>{t('crm.documents.kyc')}</ActionsheetItemText>
          </ActionsheetItem>
          <ActionsheetItem onPress={() => handleSelectType('compliance')}>
            <ActionsheetItemText>{t('crm.documents.compliance')}</ActionsheetItemText>
          </ActionsheetItem>
          <ActionsheetItem onPress={() => handleSelectType('other')}>
            <ActionsheetItemText>{t('crm.documents.other')}</ActionsheetItemText>
          </ActionsheetItem>
        </ActionsheetContent>
      </Actionsheet>

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
              {t('common.processing')}
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  );
}

const styles = StyleSheet.create({
  filterScroll: {
    maxHeight: 60,
    marginBottom: spacing.sm,
  },
  filterContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 100, // Add bottom padding for better scrolling experience
  },
});
