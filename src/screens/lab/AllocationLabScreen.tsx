import React, { useState, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  View,
} from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Divider,
} from '@gluestack-ui/themed';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../config/theme';
import { GradientCard } from '../../components/ui/GradientCard';
import { ProductCard } from '../../components/lab/ProductCard';
import { CartSheet } from '../../components/lab/CartSheet';
import { useCart } from '../../contexts/CartContext';
import { MOCK_PRODUCT_MODULES } from '../../data/mockProducts';
import type { ProductModule } from '../../types/api';

export default function AllocationLabScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(MOCK_PRODUCT_MODULES.filter((m) => m.isEnabled).map((m) => m.code))
  );
  const [isCartVisible, setIsCartVisible] = useState(false);

  const { itemCount, isInCart, toggleCartItem } = useCart();

  // Filter products by search query
  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) return MOCK_PRODUCT_MODULES;

    const query = searchQuery.toLowerCase();
    return MOCK_PRODUCT_MODULES.map((module) => ({
      ...module,
      products: module.products.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.tags.some((t) => t.toLowerCase().includes(query))
      ),
    })).filter((m) => m.products.length > 0);
  }, [searchQuery]);

  const toggleModuleExpand = (moduleCode: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleCode)) {
        next.delete(moduleCode);
      } else {
        next.add(moduleCode);
      }
      return next;
    });
  };

  const handleSubmitOrder = (notes: string) => {
    // TODO: Integrate with backend API
    console.log('Order submitted with notes:', notes);
  };

  return (
    <Box flex={1} bg={colors.background}>
      {/* Search Bar */}
      <Box padding="$4" paddingBottom="$2">
        <HStack
          bg={colors.surface}
          borderRadius={borderRadius.lg}
          alignItems="center"
          paddingHorizontal="$3"
          borderWidth={1}
          borderColor={colors.border}
        >
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </HStack>
      </Box>

      {/* Intro Card */}
      <Box paddingHorizontal="$4" paddingBottom="$2">
        <GradientCard variant="primary" style={{ marginBottom: 0 }}>
          <HStack space="md" alignItems="center">
            <Box
              bg="rgba(255,255,255,0.2)"
              padding="$2"
              borderRadius={borderRadius.md}
            >
              <Ionicons name="flask" size={24} color="white" />
            </Box>
            <VStack flex={1}>
              <Text fontWeight="$semibold" color="white">
                Allocation Lab
              </Text>
              <Text size="sm" color="white" opacity={0.8}>
                Select products and submit to your advisor for review
              </Text>
            </VStack>
          </HStack>
        </GradientCard>
      </Box>

      {/* Module List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredModules.map((module) => (
          <ModuleSection
            key={module.code}
            module={module}
            isExpanded={expandedModules.has(module.code)}
            onToggleExpand={() => toggleModuleExpand(module.code)}
            isInCart={isInCart}
            onToggleProduct={toggleCartItem}
          />
        ))}

        {filteredModules.length === 0 && (
          <Box alignItems="center" paddingVertical="$8">
            <Ionicons name="search-outline" size={48} color={colors.textMuted} />
            <Text color={colors.textSecondary} marginTop="$2">
              No products match your search
            </Text>
          </Box>
        )}

        {/* Bottom padding for cart button */}
        <Box height={100} />
      </ScrollView>

      {/* Floating Cart Button */}
      <TouchableOpacity
        style={styles.cartButton}
        onPress={() => setIsCartVisible(true)}
        activeOpacity={0.8}
      >
        <HStack space="sm" alignItems="center">
          <Ionicons name="cart" size={22} color="white" />
          <Text color="white" fontWeight="$semibold">
            Cart
          </Text>
          {itemCount > 0 && (
            <Box style={styles.cartBadge}>
              <Text size="xs" fontWeight="$bold" color="white">
                {itemCount}
              </Text>
            </Box>
          )}
        </HStack>
      </TouchableOpacity>

      {/* Cart Sheet */}
      <CartSheet
        visible={isCartVisible}
        onClose={() => setIsCartVisible(false)}
        onSubmit={handleSubmitOrder}
      />
    </Box>
  );
}

interface ModuleSectionProps {
  module: ProductModule;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isInCart: (productId: string) => boolean;
  onToggleProduct: (product: any) => void;
}

function ModuleSection({
  module,
  isExpanded,
  onToggleExpand,
  isInCart,
  onToggleProduct,
}: ModuleSectionProps) {
  const enabledCount = module.products.length;

  return (
    <Box marginBottom="$4">
      {/* Module Header */}
      <TouchableOpacity onPress={onToggleExpand} activeOpacity={0.7}>
        <HStack
          justifyContent="space-between"
          alignItems="center"
          bg={colors.surface}
          padding="$3"
          borderRadius={borderRadius.lg}
          borderWidth={1}
          borderColor={module.isEnabled ? colors.border : colors.textMuted}
          opacity={module.isEnabled ? 1 : 0.6}
        >
          <HStack space="md" alignItems="center" flex={1}>
            <Box
              bg={module.isEnabled ? colors.primary : colors.textMuted}
              padding="$2"
              borderRadius={borderRadius.md}
            >
              <Ionicons
                name={module.isEnabled ? 'cube' : 'lock-closed'}
                size={18}
                color="white"
              />
            </Box>
            <VStack flex={1}>
              <HStack alignItems="center" space="sm">
                <Text fontWeight="$semibold" color="white">
                  {module.name}
                </Text>
                {!module.isEnabled && (
                  <Text size="xs" color={colors.textMuted}>
                    (Locked)
                  </Text>
                )}
              </HStack>
              <Text size="sm" color={colors.textSecondary}>
                {enabledCount} product{enabledCount !== 1 ? 's' : ''}
              </Text>
            </VStack>
          </HStack>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.textSecondary}
          />
        </HStack>
      </TouchableOpacity>

      {/* Products */}
      {isExpanded && (
        <Box marginTop="$2" paddingLeft="$2">
          {module.products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isSelected={isInCart(product.id)}
              isLocked={!module.isEnabled}
              onToggle={() => onToggleProduct(product)}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

const styles = StyleSheet.create({
  searchInput: {
    flex: 1,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.sm,
    color: 'white',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
  cartButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  cartBadge: {
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
});

