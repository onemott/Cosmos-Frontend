/**
 * Centralized theme constants for the Cosmos app.
 * Use these for non-Gluestack components (charts, RefreshControl, etc.)
 */

export const colors = {
  // Primary
  primary: '#06B6D4',      // Cyan
  primaryDark: '#0891B2',  
  primaryLight: '#22D3EE', 
  
  // Semantic
  success: '#10B981',      
  warning: '#F59E0B',      
  error: '#EF4444',        
  
  // Dark Mode Neutrals
  background: '#000000',   // Deep Black
  surface: '#1C1C1E',      // Dark Graphite
  surfaceHighlight: '#2C2C2E',
  textPrimary: '#FFFFFF',  
  textSecondary: '#A1A1AA', 
  textMuted: '#52525B',    
  border: '#27272A',
  
  // Navigation
  tabBarBackground: '#121212',
  
  // Gradients (Start/End colors)
  gradients: {
    primary: ['#06B6D4', '#3B82F6'], // Cyan to Blue
    success: ['#10B981', '#059669'], // Green to Dark Green
    warning: ['#F59E0B', '#D97706'], // Amber to Orange
    error:   ['#EF4444', '#DC2626'], // Red to Dark Red
    purple:  ['#8B5CF6', '#EC4899'], // Purple to Pink
    dark:    ['#1C1C1E', '#121212'], // Graphite to Darker Graphite
  },

  // Chart colors (for Victory Native) - Bright/Neon for dark mode
  chartPalette: [
    '#06B6D4', // Cyan
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#F472B6', // Pink
    '#A78BFA', // Purple
  ],
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};
