import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Spinner,
  Divider,
  Badge,
  BadgeText,
  Input,
  InputField,
  Button,
  ButtonText,
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  FormControlError,
  FormControlErrorText,
} from '@gluestack-ui/themed';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../config/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage, LANGUAGES, Language } from '../../contexts/LanguageContext';
import { usePrimaryColor, useAppName } from '../../contexts/BrandingContext';
import { useChangePassword, useUpdateLanguage } from '../../api/hooks';
import { useTranslation, useLocalizedDate } from '../../lib/i18n';

const RISK_PROFILE_COLORS: Record<string, string> = {
  conservative: colors.success,
  moderate: colors.primary,
  balanced: '#3B82F6',
  growth: colors.warning,
  aggressive: colors.error,
};

const APP_VERSION = '1.0.0 (MVP)';

export default function ProfileScreen() {
  const { user: profile, isLoading, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const { formatMonthYear, formatDateTime } = useLocalizedDate();
  const primaryColor = usePrimaryColor();
  const appName = useAppName();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Change password state
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  
  // Language modal state
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  
  const changePasswordMutation = useChangePassword();
  const updateLanguageMutation = useUpdateLanguage();

  const resetPasswordForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordErrors({});
  };

  const validatePasswordForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!currentPassword) {
      errors.currentPassword = t('profile.changePasswordModal.errorRequired');
    }
    
    if (!newPassword) {
      errors.newPassword = t('profile.changePasswordModal.errorNewRequired');
    } else if (newPassword.length < 8) {
      errors.newPassword = t('profile.changePasswordModal.errorMinLength');
    }
    
    if (newPassword !== confirmPassword) {
      errors.confirmPassword = t('profile.changePasswordModal.errorMismatch');
    }
    
    if (currentPassword === newPassword) {
      errors.newPassword = t('profile.changePasswordModal.errorSame');
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) return;
    
    try {
      await changePasswordMutation.mutateAsync({
        current_password: currentPassword,
        new_password: newPassword,
      });
      
      setPasswordModalVisible(false);
      resetPasswordForm();
      
      Alert.alert(
        t('common.success'),
        t('profile.changePasswordModal.success'),
        [{ text: t('common.ok') }]
      );
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { detail?: string } } };
      const errorMessage = axiosError.response?.data?.detail || 'Failed to change password';
      
      if (errorMessage.toLowerCase().includes('current password')) {
        setPasswordErrors({ currentPassword: t('profile.changePasswordModal.errorCurrent') });
      } else {
        Alert.alert('Error', errorMessage);
      }
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      // Use native browser confirm for Web
      if (window.confirm(t('profile.logoutConfirm'))) {
        performLogout();
      }
    } else {
      // Use native Alert for iOS/Android
      Alert.alert(
        t('auth.logout'),
        t('profile.logoutConfirm'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('auth.logout'),
            style: 'destructive',
            onPress: performLogout,
          },
        ]
      );
    }
  };

  const performLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      // Navigation is handled automatically by RootNavigator
      // when isAuthenticated becomes false
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleContactSupport = () => {
    Alert.alert(
      t('profile.contactSupport'),
      t('profile.contactSupportMessage'),
      [{ text: t('common.ok') }]
    );
  };

  const handleComingSoon = (feature: string) => {
    Alert.alert(
      t('common.comingSoon'),
      `${feature} will be available in a future update.`,
      [{ text: t('common.ok') }]
    );
  };

  const handleLanguageChange = async (newLanguage: Language) => {
    try {
      // Update local state first for immediate UI feedback
      await setLanguage(newLanguage);
      
      // Sync to backend
      await updateLanguageMutation.mutateAsync(newLanguage);
      
      setLanguageModalVisible(false);
    } catch (error) {
      console.error('Failed to update language:', error);
      // Local state is already updated, which is fine for offline-first UX
      setLanguageModalVisible(false);
    }
  };

  if (isLoading) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" bg={colors.background}>
        <Spinner size="large" color={colors.primary} />
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" bg={colors.background}>
        <Text color={colors.textSecondary}>{t('profile.failedToLoad')}</Text>
      </Box>
    );
  }

  // Extract initials from client name
  const getInitials = (name: string): string => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const initials = getInitials(profile.client_name);
  const riskProfileKey = profile.risk_profile?.toLowerCase() || 'balanced';
  const riskProfileColor = RISK_PROFILE_COLORS[riskProfileKey] || colors.textMuted;
  const riskProfileLabel = t(`profile.riskProfiles.${riskProfileKey}`);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <VStack space="lg">
        {/* Profile Header */}
        <Box alignItems="center" marginTop="$4">
          {/* Avatar - uses tenant primary color */}
          <Box
            bg={primaryColor}
            width={100}
            height={100}
            borderRadius={50}
            justifyContent="center"
            alignItems="center"
            marginBottom="$3"
          >
            <Text size="3xl" fontWeight="$bold" color="white">
              {initials}
            </Text>
          </Box>

          <Heading size="xl" color="white" textAlign="center">
            {profile.client_name}
          </Heading>
          <Text size="md" color={colors.textSecondary} textAlign="center" marginTop="$1">
            {profile.email}
          </Text>

          {/* Status Badge */}
          <HStack space="sm" marginTop="$3">
            <Badge
              size="md"
              bg={profile.is_active ? colors.success : colors.textMuted}
              borderRadius="$full"
            >
              <BadgeText color="white">
                {profile.is_active ? t('common.active') : t('common.inactive')}
              </BadgeText>
            </Badge>
            {profile.mfa_enabled && (
              <Badge size="md" bg={colors.primary} borderRadius="$full">
                <Ionicons name="shield-checkmark" size={12} color="white" />
                <BadgeText color="white" marginLeft="$1">MFA</BadgeText>
              </Badge>
            )}
          </HStack>
        </Box>

        {/* Account Information */}
        <Box style={styles.section}>
          <Heading size="sm" color="white" marginBottom="$3">
            {t('profile.accountInfo')}
          </Heading>
          
          <VStack space="md">
            {/* EAM/Tenant */}
            <HStack justifyContent="space-between" alignItems="center">
              <HStack alignItems="center" space="sm">
                <Ionicons name="business-outline" size={18} color={colors.textMuted} />
                <Text color={colors.textSecondary}>{t('profile.wealthManager')}</Text>
              </HStack>
              <Text color="white" fontWeight="$medium">
                {profile.tenant_name || t('profile.platformOperator')}
              </Text>
            </HStack>

            <Divider bg={colors.border} />

            {/* Risk Profile */}
            {profile.risk_profile && (
              <>
                <HStack justifyContent="space-between" alignItems="center">
                  <HStack alignItems="center" space="sm">
                    <Ionicons name="analytics-outline" size={18} color={colors.textMuted} />
                    <Text color={colors.textSecondary}>{t('profile.riskProfile')}</Text>
                  </HStack>
                  <Badge
                    size="sm"
                    bg={riskProfileColor}
                    borderRadius="$full"
                  >
                    <BadgeText color="white">{riskProfileLabel}</BadgeText>
                  </Badge>
                </HStack>
                <Divider bg={colors.border} />
              </>
            )}

            {/* Member Since */}
            <HStack justifyContent="space-between" alignItems="center">
              <HStack alignItems="center" space="sm">
                <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
                <Text color={colors.textSecondary}>{t('profile.memberSince')}</Text>
              </HStack>
              <Text color="white" fontWeight="$medium">
                {formatMonthYear(profile.created_at)}
              </Text>
            </HStack>

            {profile.last_login_at && (
              <>
                <Divider bg={colors.border} />
                <HStack justifyContent="space-between" alignItems="center">
                  <HStack alignItems="center" space="sm">
                    <Ionicons name="time-outline" size={18} color={colors.textMuted} />
                    <Text color={colors.textSecondary}>{t('profile.lastLogin')}</Text>
                  </HStack>
                  <Text color="white" fontWeight="$medium">
                    {formatDateTime(profile.last_login_at)}
                  </Text>
                </HStack>
              </>
            )}
          </VStack>
        </Box>

        {/* App Settings */}
        <Box style={styles.section}>
          <Heading size="sm" color="white" marginBottom="$3">
            {t('profile.appSettings')}
          </Heading>
          
          <VStack space="sm">
            <MenuItem
              icon="notifications-outline"
              label={t('profile.notifications')}
              isDisabled
              onPress={() => handleComingSoon(t('profile.notifications'))}
            />
            <LanguageMenuItem
              icon="language-outline"
              label={t('profile.language')}
              currentLanguage={LANGUAGES.find(l => l.code === language)?.nativeName || 'English'}
              onPress={() => setLanguageModalVisible(true)}
            />
            <MenuItem
              icon="lock-closed-outline"
              label={t('profile.changePassword')}
              onPress={() => setPasswordModalVisible(true)}
            />
          </VStack>
        </Box>

        {/* Support & Legal */}
        <Box style={styles.section}>
          <Heading size="sm" color="white" marginBottom="$3">
            {t('profile.supportLegal')}
          </Heading>
          
          <VStack space="sm">
            <MenuItem
              icon="shield-outline"
              label={t('profile.privacyPolicy')}
              onPress={handleContactSupport}
            />
            <MenuItem
              icon="document-text-outline"
              label={t('profile.termsOfService')}
              onPress={handleContactSupport}
            />
            <MenuItem
              icon="help-circle-outline"
              label={t('profile.contactSupport')}
              onPress={handleContactSupport}
            />
          </VStack>
        </Box>

        {/* Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          disabled={isLoggingOut}
          style={[styles.logoutButton, isLoggingOut && styles.logoutButtonDisabled]}
          activeOpacity={0.7}
        >
          <HStack justifyContent="center" alignItems="center" space="sm">
            {isLoggingOut ? (
              <Spinner size="small" color="white" />
            ) : (
              <Ionicons name="log-out-outline" size={20} color="white" />
            )}
            <Text color="white" fontWeight="$semibold">
              {isLoggingOut ? t('auth.loggingOut') : t('auth.logout')}
            </Text>
          </HStack>
        </TouchableOpacity>

        {/* App Version - shows tenant app name */}
        <Text size="xs" color={colors.textMuted} textAlign="center" marginTop="$2" marginBottom="$4">
          {appName} • {t('profile.appVersion')}: {APP_VERSION}
        </Text>
      </VStack>

      {/* Change Password Modal */}
      <Modal
        visible={passwordModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setPasswordModalVisible(false);
          resetPasswordForm();
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <Box style={styles.modalContent}>
            <HStack justifyContent="space-between" alignItems="center" marginBottom="$4">
              <Heading size="lg" color="white">{t('profile.changePasswordModal.title')}</Heading>
              <TouchableOpacity
                onPress={() => {
                  setPasswordModalVisible(false);
                  resetPasswordForm();
                }}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </HStack>

            <VStack space="md">
              <FormControl isInvalid={!!passwordErrors.currentPassword}>
                <FormControlLabel>
                  <FormControlLabelText color={colors.textSecondary}>
                    {t('profile.changePasswordModal.currentPassword')}
                  </FormControlLabelText>
                </FormControlLabel>
                <Input
                  variant="outline"
                  borderColor={colors.border}
                  bg={colors.surfaceHighlight}
                  borderRadius="$lg"
                >
                  <InputField
                    placeholder={t('profile.changePasswordModal.enterCurrent')}
                    placeholderTextColor={colors.textMuted}
                    color="white"
                    secureTextEntry
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                  />
                </Input>
                {passwordErrors.currentPassword && (
                  <FormControlError>
                    <FormControlErrorText color={colors.error}>
                      {passwordErrors.currentPassword}
                    </FormControlErrorText>
                  </FormControlError>
                )}
              </FormControl>

              <FormControl isInvalid={!!passwordErrors.newPassword}>
                <FormControlLabel>
                  <FormControlLabelText color={colors.textSecondary}>
                    {t('profile.changePasswordModal.newPassword')}
                  </FormControlLabelText>
                </FormControlLabel>
                <Input
                  variant="outline"
                  borderColor={colors.border}
                  bg={colors.surfaceHighlight}
                  borderRadius="$lg"
                >
                  <InputField
                    placeholder={t('profile.changePasswordModal.enterNew')}
                    placeholderTextColor={colors.textMuted}
                    color="white"
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                </Input>
                {passwordErrors.newPassword && (
                  <FormControlError>
                    <FormControlErrorText color={colors.error}>
                      {passwordErrors.newPassword}
                    </FormControlErrorText>
                  </FormControlError>
                )}
              </FormControl>

              <FormControl isInvalid={!!passwordErrors.confirmPassword}>
                <FormControlLabel>
                  <FormControlLabelText color={colors.textSecondary}>
                    {t('profile.changePasswordModal.confirmPassword')}
                  </FormControlLabelText>
                </FormControlLabel>
                <Input
                  variant="outline"
                  borderColor={colors.border}
                  bg={colors.surfaceHighlight}
                  borderRadius="$lg"
                >
                  <InputField
                    placeholder={t('profile.changePasswordModal.confirmNew')}
                    placeholderTextColor={colors.textMuted}
                    color="white"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                </Input>
                {passwordErrors.confirmPassword && (
                  <FormControlError>
                    <FormControlErrorText color={colors.error}>
                      {passwordErrors.confirmPassword}
                    </FormControlErrorText>
                  </FormControlError>
                )}
              </FormControl>

              <HStack space="md" marginTop="$4">
                <Button
                  flex={1}
                  variant="outline"
                  borderColor={colors.border}
                  onPress={() => {
                    setPasswordModalVisible(false);
                    resetPasswordForm();
                  }}
                >
                  <ButtonText color={colors.textSecondary}>{t('common.cancel')}</ButtonText>
                </Button>
                <Button
                  flex={1}
                  bg={colors.primary}
                  onPress={handleChangePassword}
                  isDisabled={changePasswordMutation.isPending}
                >
                  {changePasswordMutation.isPending ? (
                    <Spinner size="small" color="white" />
                  ) : (
                    <ButtonText color="white">{t('profile.changePasswordModal.button')}</ButtonText>
                  )}
                </Button>
              </HStack>
            </VStack>
          </Box>
        </KeyboardAvoidingView>
      </Modal>

      {/* Language Selection Modal */}
      <Modal
        visible={languageModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={() => setLanguageModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <Box style={styles.languageModalContent}>
              <HStack justifyContent="space-between" alignItems="center" marginBottom="$4">
                <Heading size="lg" color="white">{t('profile.languageModal.title')}</Heading>
                <TouchableOpacity onPress={() => setLanguageModalVisible(false)}>
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </HStack>

              <VStack space="sm">
                {LANGUAGES.map((lang) => (
                  <TouchableOpacity
                    key={lang.code}
                    onPress={() => handleLanguageChange(lang.code)}
                    activeOpacity={0.7}
                    style={[
                      styles.languageOption,
                      language === lang.code && styles.languageOptionSelected,
                    ]}
                  >
                    <HStack justifyContent="space-between" alignItems="center">
                      <VStack>
                        <Text color="white" fontWeight={language === lang.code ? '$semibold' : '$normal'}>
                          {lang.nativeName}
                        </Text>
                        <Text color={colors.textSecondary} size="sm">
                          {lang.name}
                        </Text>
                      </VStack>
                      {language === lang.code && (
                        <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                      )}
                    </HStack>
                  </TouchableOpacity>
                ))}
              </VStack>
            </Box>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  isDisabled?: boolean;
  onPress: () => void;
}

function MenuItem({ icon, label, isDisabled, onPress }: MenuItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[styles.menuItem, isDisabled && styles.menuItemDisabled]}
    >
      <HStack justifyContent="space-between" alignItems="center">
        <HStack alignItems="center" space="md">
          <Ionicons
            name={icon}
            size={20}
            color={isDisabled ? colors.textMuted : colors.textSecondary}
          />
          <Text color={isDisabled ? colors.textMuted : 'white'}>
            {label}
          </Text>
          {isDisabled && (
            <Badge size="sm" bg={colors.surfaceHighlight} borderRadius="$full">
              <BadgeText color={colors.textMuted} size="xs">Coming Soon</BadgeText>
            </Badge>
          )}
        </HStack>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={isDisabled ? colors.textMuted : colors.textSecondary}
        />
      </HStack>
    </TouchableOpacity>
  );
}

interface LanguageMenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  currentLanguage: string;
  onPress: () => void;
}

function LanguageMenuItem({ icon, label, currentLanguage, onPress }: LanguageMenuItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.menuItem}
    >
      <HStack justifyContent="space-between" alignItems="center">
        <HStack alignItems="center" space="md">
          <Ionicons
            name={icon}
            size={20}
            color={colors.textSecondary}
          />
          <Text color="white">
            {label}
          </Text>
        </HStack>
        <HStack alignItems="center" space="sm">
          <Text color={colors.textSecondary} size="sm">
            {currentLanguage}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textSecondary}
          />
        </HStack>
      </HStack>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.md,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  menuItemDisabled: {
    opacity: 0.6,
  },
  logoutButton: {
    backgroundColor: colors.error,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
  },
  logoutButtonDisabled: {
    opacity: 0.6,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl + 20, // Extra padding for home indicator
    borderWidth: 1,
    borderColor: colors.border,
  },
  languageModalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl + 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  languageOption: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceHighlight,
  },
  languageOptionSelected: {
    backgroundColor: `${colors.primary}20`,
    borderWidth: 1,
    borderColor: colors.primary,
  },
});
