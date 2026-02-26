import React, { useEffect, useState } from 'react';
import { Modal, BackHandler, ScrollView, ActivityIndicator } from 'react-native';
import {
  Box,
  Button,
  ButtonText,
  Heading,
  Text,
  VStack,
} from '@gluestack-ui/themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Markdown from 'react-native-markdown-display';
import { colors, borderRadius } from '../config/theme';
import { useSystemConfig, useRecordAgreement, useAgreementStatus } from '../api/hooks';
import { useAuth } from '../contexts/AuthContext';

const STORAGE_KEY = 'privacy_accepted_at';

interface PrivacyModalProps {
  onAccept?: () => void;
}

export const PrivacyModal = ({ onAccept }: PrivacyModalProps) => {
  const [visible, setVisible] = useState(false);
  const { data: config, isLoading, isError } = useSystemConfig('privacy_policy');
  const [checking, setChecking] = useState(true);
  const { isAuthenticated } = useAuth();
  const recordAgreementMutation = useRecordAgreement();
  const { data: agreementStatus } = useAgreementStatus('privacy_policy', isAuthenticated);

  useEffect(() => {
    // Check local status first (for startup)
    if (config) {
        checkPrivacyStatus(config.updated_at);
    } else if (isError) {
        setChecking(false);
        setVisible(true);
    }
  }, [config, isError]);

  // Double check with server status if authenticated
  useEffect(() => {
    if (isAuthenticated && agreementStatus && config) {
      if (!agreementStatus.accepted) {
        // Force show if server says not accepted
        setVisible(true);
      }
    }
  }, [isAuthenticated, agreementStatus, config]);

  const checkPrivacyStatus = async (serverUpdatedAt: string) => {
    try {
      const acceptedAt = await AsyncStorage.getItem(STORAGE_KEY);
      // Compare dates. If serverUpdatedAt is newer (or different), show modal.
      if (!acceptedAt || acceptedAt < serverUpdatedAt) {
        setVisible(true);
      } else {
        if (onAccept) onAccept();
      }
    } catch (e) {
      console.error('Failed to check privacy status', e);
      setVisible(true);
    } finally {
        setChecking(false);
    }
  };

  const handleAccept = async () => {
    if (config) {
        try {
            // 1. Save locally
            await AsyncStorage.setItem(STORAGE_KEY, config.updated_at);
            
            // 2. If logged in, save to server
            if (isAuthenticated) {
                try {
                    await recordAgreementMutation.mutateAsync({
                        type: 'privacy_policy',
                        version: config.version || '1.0' // Use explicit version
                    });
                } catch (err) {
                    console.error('Failed to record agreement on server', err);
                    // Continue anyway, we have local consent
                }
            }
            
            setVisible(false);
            if (onAccept) onAccept();
        } catch (e) {
            console.error('Failed to save privacy status', e);
        }
    }
  };


  const handleReject = () => {
    BackHandler.exitApp();
  };

  if (checking || (isLoading && !visible)) {
      return null; 
  }

  return (
    <Modal visible={visible} transparent={false} animationType="slide">
      <Box flex={1} bg={colors.background} safeArea>
        <VStack space="md" flex={1} p="$4">
          <Heading size="xl" textAlign="center" color="white" mt="$4">
            隐私政策与服务条款
          </Heading>
          
          <Box flex={1} bg={colors.surface} borderRadius={borderRadius.lg} p="$4" borderWidth={1} borderColor={colors.border}>
            {isError ? (
                <Box flex={1} justifyContent="center" alignItems="center">
                    <Text color={colors.error} textAlign="center" mb="$4">无法加载隐私政策。请检查网络连接。</Text>
                    <Button onPress={() => BackHandler.exitApp()} variant="outline" borderColor={colors.textSecondary}>
                         <ButtonText color={colors.textSecondary}>退出应用</ButtonText>
                    </Button>
                </Box>
            ) : (
                <ScrollView showsVerticalScrollIndicator={true}>
                {isLoading ? (
                    <ActivityIndicator size="large" color={colors.primary} />
                ) : (
                    <Markdown style={markdownStyles}>
                        {config?.value || ''}
                    </Markdown>
                )}
                </ScrollView>
            )}
          </Box>

          <VStack space="sm" mb="$4">
            <Button size="lg" onPress={handleAccept} bg={colors.primary} disabled={isError || isLoading} opacity={(isError || isLoading) ? 0.5 : 1}>
              <ButtonText color="white">同意并继续</ButtonText>
            </Button>
            <Button size="lg" variant="outline" onPress={handleReject} borderColor={colors.error}>
              <ButtonText color={colors.error}>不同意并退出</ButtonText>
            </Button>
          </VStack>
        </VStack>
      </Box>
    </Modal>
  );
};

const markdownStyles = {
  body: { color: colors.textSecondary, fontSize: 16, lineHeight: 24 },
  heading1: { color: colors.textPrimary, fontSize: 22, fontWeight: 'bold', marginVertical: 10 },
  heading2: { color: colors.textPrimary, fontSize: 18, fontWeight: 'bold', marginVertical: 8 },
  heading3: { color: colors.textPrimary, fontSize: 16, fontWeight: 'bold', marginVertical: 6 },
  link: { color: colors.primary },
  list_item: { color: colors.textSecondary, fontSize: 16, marginVertical: 4 },
  strong: { color: colors.textPrimary, fontWeight: 'bold' },
};
