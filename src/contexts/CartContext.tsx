/**
 * Shopping Cart Context for Allocation Lab.
 * Manages product selection state across the app.
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { Product, CartItem } from '../types/api';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  isInCart: (productId: string) => boolean;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  toggleCartItem: (product: Product) => void;
  updateItemNotes: (productId: string, notes: string) => void;
  updateItemAmount: (productId: string, amount: number) => void;
  clearCart: () => void;
  getCartSummary: () => { products: Product[]; totalMinInvestment: number; totalRequestedAmount: number };
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const itemCount = useMemo(() => items.length, [items]);

  const isInCart = useCallback(
    (productId: string) => items.some((item) => item.product.id === productId),
    [items]
  );

  const addToCart = useCallback((product: Product) => {
    setItems((prev) => {
      if (prev.some((item) => item.product.id === product.id)) {
        return prev; // Already in cart
      }
      return [...prev, { product, addedAt: new Date(), requestedAmount: product.minInvestment }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const toggleCartItem = useCallback(
    (product: Product) => {
      if (isInCart(product.id)) {
        removeFromCart(product.id);
      } else {
        addToCart(product);
      }
    },
    [isInCart, addToCart, removeFromCart]
  );

  const updateItemNotes = useCallback((productId: string, notes: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, notes } : item
      )
    );
  }, []);

  const updateItemAmount = useCallback((productId: string, amount: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, requestedAmount: amount } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getCartSummary = useCallback(() => {
    const products = items.map((item) => item.product);
    const totalMinInvestment = products.reduce(
      (sum, p) => sum + p.minInvestment,
      0
    );
    const totalRequestedAmount = items.reduce(
      (sum, item) => sum + item.requestedAmount,
      0
    );
    return { products, totalMinInvestment, totalRequestedAmount };
  }, [items]);

  const value = useMemo(
    () => ({
      items,
      itemCount,
      isInCart,
      addToCart,
      removeFromCart,
      toggleCartItem,
      updateItemNotes,
      updateItemAmount,
      clearCart,
      getCartSummary,
    }),
    [
      items,
      itemCount,
      isInCart,
      addToCart,
      removeFromCart,
      toggleCartItem,
      updateItemNotes,
      updateItemAmount,
      clearCart,
      getCartSummary,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

