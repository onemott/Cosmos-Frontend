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

interface CartSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (notes: string) => void;
}

export function CartSheet({ visible, onClose, onSubmit }: CartSheetProps) {
  const { items, removeFromCart, clearCart, getCartSummary } = useCart();
  const [clientNotes, setClientNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { totalMinInvestment } = getCartSummary();

  const handleSubmit = async () => {
    if (items.length === 0) {
      Alert.alert('Empty Cart', 'Please add at least one product to your cart.');
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Call backend API to submit order
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      onSubmit(clientNotes);
      clearCart();
      setClientNotes('');
      Alert.alert(
        'Request Submitted',
        'Your investment request has been sent to your EAM for review.',
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
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
            <Heading size="lg" color="white">Your Selection</Heading>
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
                  Your cart is empty
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
                        {item.product.name}
                      </Text>
                      <Text size="sm" color={colors.textSecondary}>
                        Min: {formatCurrency(item.product.minInvestment, item.product.currency)}
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
                  <Text color={colors.textSecondary}>Total Min. Investment</Text>
                  <Text fontWeight="$bold" color={colors.primary} size="lg">
                    {formatCurrency(totalMinInvestment, 'USD')}
                  </Text>
                </HStack>

                {/* Notes Input */}
                <Text size="sm" color={colors.textSecondary} marginBottom="$2">
                  Add notes for your advisor (optional)
                </Text>
                <TextInput
                  style={styles.notesInput}
                  placeholder="E.g., I'm interested in long-term growth..."
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
                disabled={isSubmitting}
              >
                <ButtonText color={colors.textSecondary}>Cancel</ButtonText>
              </Button>
              <Button
                flex={2}
                bg={colors.primary}
                onPress={handleSubmit}
                disabled={items.length === 0 || isSubmitting}
                opacity={items.length === 0 || isSubmitting ? 0.5 : 1}
              >
                <ButtonText color="white">
                  {isSubmitting ? 'Submitting...' : 'Submit to EAM'}
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

