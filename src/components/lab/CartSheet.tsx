import React, { useState } from 'react';
import {
  Modal,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Divider,
  Button,
  ButtonText,
} from '@gluestack-ui/themed';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../config/theme';
import { formatCurrency } from '../../utils/format';
import { useCart } from '../../contexts/CartContext';
import { useSubmitProductRequest } from '../../api/hooks';
import { useTranslation, useLocalizedField } from '../../lib/i18n';
import type { ProductRequestItem } from '../../types/api';

interface CartSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (notes: string) => void;
}

export function CartSheet({ visible, onClose, onSubmit }: CartSheetProps) {
  const { items, removeFromCart, clearCart, getCartSummary } = useCart();
  const [clientNotes, setClientNotes] = useState('');
  const { t } = useTranslation();
  const localizedField = useLocalizedField();
  
  const submitMutation = useSubmitProductRequest();
  const { totalMinInvestment } = getCartSummary();

  const handleSubmit = async () => {
    if (items.length === 0) {
      Alert.alert(t('cart.emptyTitle'), t('cart.emptyMessage'));
      return;
    }

    // Build request payload
    const products: ProductRequestItem[] = items.map((item) => ({
      product_id: item.product.id,
      product_name: item.product.name,
      module_code: item.product.moduleCode,
      min_investment: item.product.minInvestment,
      currency: item.product.currency,
    }));

    try {
      const result = await submitMutation.mutateAsync({
        products,
        client_notes: clientNotes || undefined,
      });
      
      // Success!
      onSubmit(clientNotes);
      clearCart();
      setClientNotes('');
      
      Alert.alert(
        t('cart.requestSubmitted'),
        result.message,
        [{ text: t('common.ok'), onPress: onClose }]
      );
    } catch (error: any) {
      console.error('Submit error:', error);
      const message = error.response?.data?.detail || t('cart.submitFailed');
      Alert.alert(t('common.error'), message);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <HStack justifyContent="space-between" alignItems="center" paddingHorizontal="$4" paddingBottom="$3">
            <Heading size="lg" color="white">{t('cart.title')}</Heading>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </HStack>

          <Divider bg={colors.border} />

          {/* Cart Items */}
          <ScrollView style={styles.itemsContainer} showsVerticalScrollIndicator={false}>
            {items.length === 0 ? (
              <Box alignItems="center" paddingVertical="$8">
                <Ionicons name="cart-outline" size={48} color={colors.textMuted} />
                <Text color={colors.textSecondary} marginTop="$2">
                  {t('cart.empty')}
                </Text>
              </Box>
            ) : (
              <VStack space="sm" paddingVertical="$3">
                {items.map((item) => (
                  <HStack
                    key={item.product.id}
                    justifyContent="space-between"
                    alignItems="center"
                    bg={colors.surface}
                    padding="$3"
                    borderRadius={borderRadius.md}
                  >
                    <VStack flex={1}>
                      <Text fontWeight="$semibold" color="white">
                        {localizedField(item.product, 'name')}
                      </Text>
                      <Text size="sm" color={colors.textSecondary}>
                        {t('cart.minInvestment')}: {formatCurrency(item.product.minInvestment, item.product.currency)}
                      </Text>
                    </VStack>
                    <TouchableOpacity
                      onPress={() => removeFromCart(item.product.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="trash-outline" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </HStack>
                ))}
              </VStack>
            )}
          </ScrollView>

          {/* Summary */}
          {items.length > 0 && (
            <>
              <Divider bg={colors.border} />
              <Box padding="$4">
                <HStack justifyContent="space-between" marginBottom="$3">
                  <Text color={colors.textSecondary}>{t('cart.totalMinInvestment')}</Text>
                  <Text fontWeight="$bold" color={colors.primary} size="lg">
                    {formatCurrency(totalMinInvestment, 'USD')}
                  </Text>
                </HStack>

                {/* Notes Input */}
                <Text size="sm" color={colors.textSecondary} marginBottom="$2">
                  {t('cart.notesLabel')}
                </Text>
                <TextInput
                  style={styles.notesInput}
                  placeholder={t('cart.notesPlaceholder')}
                  placeholderTextColor={colors.textMuted}
                  value={clientNotes}
                  onChangeText={setClientNotes}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </Box>
            </>
          )}

          {/* Actions */}
          <Box padding="$4" paddingTop="$2">
            <HStack space="md">
              <Button
                flex={1}
                variant="outline"
                borderColor={colors.border}
                onPress={onClose}
                disabled={submitMutation.isPending}
              >
                <ButtonText color={colors.textSecondary}>{t('common.cancel')}</ButtonText>
              </Button>
              <Button
                flex={2}
                bg={colors.primary}
                onPress={handleSubmit}
                disabled={items.length === 0 || submitMutation.isPending}
                opacity={items.length === 0 || submitMutation.isPending ? 0.5 : 1}
              >
                <ButtonText color="white">
                  {submitMutation.isPending ? t('cart.submitting') : t('cart.submitToAdvisor')}
                </ButtonText>
              </Button>
            </HStack>
          </Box>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  itemsContainer: {
    paddingHorizontal: spacing.md,
    maxHeight: 250,
  },
  notesInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: 'white',
    fontSize: 14,
    minHeight: 80,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
