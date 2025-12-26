/**
 * Centralized theme constants for the Cosmos app.
 * Use these for non-Gluestack components (charts, RefreshControl, etc.)
 */

// Default primary color (Cyan)
const DEFAULT_PRIMARY = '#06B6D4';

export const colors = {
  // Primary
  primary: DEFAULT_PRIMARY,
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

/**
 * Create a dynamic theme with tenant branding colors.
 * 
 * @param primaryColor - Optional hex color from tenant branding
 * @returns Theme colors with tenant primary color applied
 */
export function createDynamicColors(primaryColor?: string | null) {
  const primary = primaryColor || DEFAULT_PRIMARY;
  
  // Generate lighter/darker variants from the primary color
  // For MVP, we use simple opacity-based variants
  // In future, could use color manipulation library
  const primaryDark = adjustColorBrightness(primary, -20);
  const primaryLight = adjustColorBrightness(primary, 20);
  
  return {
    ...colors,
    primary,
    primaryDark,
    primaryLight,
    gradients: {
      ...colors.gradients,
      primary: [primary, '#3B82F6'] as [string, string], // Keep blue as gradient end
    },
    chartPalette: [
      primary,
      '#3B82F6', // Blue
      '#10B981', // Green
      '#F59E0B', // Amber
      '#F472B6', // Pink
      '#A78BFA', // Purple
    ],
  };
}

/**
 * Adjust color brightness by a percentage.
 * Positive values lighten, negative values darken.
 */
function adjustColorBrightness(hex: string, percent: number): string {
  // Remove # if present
  const color = hex.replace('#', '');
  
  // Parse RGB
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  
  // Adjust brightness
  const adjust = (value: number) => {
    const adjusted = value + Math.round((percent / 100) * 255);
    return Math.max(0, Math.min(255, adjusted));
  };
  
  // Convert back to hex
  const toHex = (value: number) => value.toString(16).padStart(2, '0');
  
  return `#${toHex(adjust(r))}${toHex(adjust(g))}${toHex(adjust(b))}`;
}

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
