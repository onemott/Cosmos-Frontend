import React from 'react';
import { StyleSheet, ViewStyle, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Box } from '@gluestack-ui/themed';
import { colors, borderRadius, spacing } from '../../config/theme';

type GradientVariant = 'primary' | 'success' | 'warning' | 'error' | 'purple' | 'dark';

interface GradientCardProps {
  children: React.ReactNode;
  variant?: GradientVariant;
  style?: ViewStyle;
  className?: string; // For compatibility if using class-based styling later
}

export const GradientCard: React.FC<GradientCardProps> = ({ 
  children, 
  variant = 'dark',
  style 
}) => {
  const gradientColors = colors.gradients[variant];

  return (
    <Box
      style={[
        styles.container,
        style,
        Platform.OS === 'ios' ? styles.shadow : styles.elevation
      ]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {children}
      </LinearGradient>
    </Box>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  gradient: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  elevation: {
    elevation: 8,
  },
});

