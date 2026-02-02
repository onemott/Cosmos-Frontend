import React from 'react';
import { Image, View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useBranding, usePrimaryColor, useAppName } from '../contexts/BrandingContext';
import { ENV } from '../config/env';
import { colors } from '../config/theme';

interface TenantLogoProps {
  size?: number;
  style?: object;
  /** If true, shows a gradient letter as fallback instead of the default icon */
  showLetterFallback?: boolean;
}

/**
 * Displays the tenant's logo if available, or a fallback.
 * 
 * The logo URL from the backend is relative (/api/v1/tenants/{id}/logo),
 * so we prepend the API base URL.
 */
export default function TenantLogo({ 
  size = 80, 
  style,
  showLetterFallback = false,
}: TenantLogoProps) {
  const { branding, isLoading } = useBranding();
  const primaryColor = usePrimaryColor();
  const appName = useAppName();
  const [imageError, setImageError] = React.useState(false);
  const [imageLoading, setImageLoading] = React.useState(true);

  // Reset error state when branding changes
  React.useEffect(() => {
    setImageError(false);
    setImageLoading(true);
  }, [branding?.logo_url]);

  if (isLoading) {
    return (
      <View style={[styles.container, { width: size, height: size }, style]}>
        <ActivityIndicator size="small" color={primaryColor} />
      </View>
    );
  }

  // Show logo if available
  if (branding?.has_logo && branding?.logo_url && !imageError) {
    // Construct full URL - strip /api/v1 from ENV.API_BASE_URL to get base domain
    const baseUrl = ENV.API_BASE_URL.replace(/\/api\/v1$/, '');
    const logoUrl = branding.logo_url.startsWith('http') 
      ? branding.logo_url 
      : `${baseUrl}${branding.logo_url}`;

    return (
      <View style={[styles.container, { width: size, height: size }, style]}>
        {imageLoading && (
          <View style={[styles.loadingOverlay, { width: size, height: size }]}>
            <ActivityIndicator size="small" color={primaryColor} />
          </View>
        )}
        <Image
          source={{ uri: logoUrl }}
          style={[styles.logo, { width: size, height: size }]}
          resizeMode="contain"
          onError={() => setImageError(true)}
          onLoadEnd={() => setImageLoading(false)}
        />
      </View>
    );
  }

  // Fallback: Show gradient letter or default app icon
  if (showLetterFallback) {
    return (
      <LinearGradient
        colors={[primaryColor, colors.primaryDark] as [string, string]}
        style={[
          styles.letterFallback,
          { 
            width: size, 
            height: size, 
            borderRadius: size * 0.25,
          },
          style
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={[styles.letterText, { fontSize: size * 0.5 }]}>
          {appName.charAt(0).toUpperCase()}
        </Text>
      </LinearGradient>
    );
  }

  // Default fallback: Show app logo
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Image
        source={require('../../assets/logo.png')}
        style={[styles.logo, { width: size, height: size }]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    borderRadius: 8,
  },
  loadingOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  letterFallback: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  letterText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

