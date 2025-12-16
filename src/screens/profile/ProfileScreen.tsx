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
import { useChangePassword } from '../../api/hooks';
import { format } from 'date-fns';

const RISK_PROFILE_CONFIG: Record<string, { color: string; label: string }> = {
  conservative: { color: colors.success, label: 'Conservative' },
  moderate: { color: colors.primary, label: 'Moderate' },
  balanced: { color: '#3B82F6', label: 'Balanced' },
  growth: { color: colors.warning, label: 'Growth' },
  aggressive: { color: colors.error, label: 'Aggressive' },
};

const APP_VERSION = '1.0.0 (MVP)';

export default function ProfileScreen() {
  const { user: profile, isLoading, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Change password state
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  
  const changePasswordMutation = useChangePassword();

  const resetPasswordForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordErrors({});
  };

  const validatePasswordForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (!newPassword) {
      errors.newPassword = 'New password is required';
    } else if (newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    }
    
    if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (currentPassword === newPassword) {
      errors.newPassword = 'New password must be different from current';
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
        'Success',
        'Your password has been changed successfully.',
        [{ text: 'OK' }]
      );
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { detail?: string } } };
      const errorMessage = axiosError.response?.data?.detail || 'Failed to change password';
      
      if (errorMessage.toLowerCase().includes('current password')) {
        setPasswordErrors({ currentPassword: 'Current password is incorrect' });
      } else {
        Alert.alert('Error', errorMessage);
      }
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
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
          },
        },
      ]
    );
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Please contact your advisor for assistance:\n\nEmail: support@cosmos-wealth.com\nPhone: +1 (555) 123-4567',
      [{ text: 'OK' }]
    );
  };

  const handleComingSoon = (feature: string) => {
    Alert.alert(
      'Coming Soon',
      `${feature} will be available in a future update.`,
      [{ text: 'OK' }]
    );
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
        <Text color={colors.textSecondary}>Failed to load profile</Text>
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
  const riskConfig = RISK_PROFILE_CONFIG[profile.risk_profile?.toLowerCase() || 'balanced'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <VStack space="lg">
        {/* Profile Header */}
        <Box alignItems="center" marginTop="$4">
          {/* Avatar */}
          <Box
            bg={colors.primary}
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
                {profile.is_active ? 'Active' : 'Inactive'}
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
            Account Information
          </Heading>
          
          <VStack space="md">
            {/* EAM/Tenant */}
            <HStack justifyContent="space-between" alignItems="center">
              <HStack alignItems="center" space="sm">
                <Ionicons name="business-outline" size={18} color={colors.textMuted} />
                <Text color={colors.textSecondary}>Wealth Manager</Text>
              </HStack>
              <Text color="white" fontWeight="$medium">
                {profile.tenant_name || 'Platform Operator'}
              </Text>
            </HStack>

            <Divider bg={colors.border} />

            {/* Risk Profile */}
            {profile.risk_profile && (
              <>
                <HStack justifyContent="space-between" alignItems="center">
                  <HStack alignItems="center" space="sm">
                    <Ionicons name="analytics-outline" size={18} color={colors.textMuted} />
                    <Text color={colors.textSecondary}>Risk Profile</Text>
                  </HStack>
                  <Badge
                    size="sm"
                    bg={riskConfig?.color || colors.textMuted}
                    borderRadius="$full"
                  >
                    <BadgeText color="white">{riskConfig?.label || 'N/A'}</BadgeText>
                  </Badge>
                </HStack>
                <Divider bg={colors.border} />
              </>
            )}

            {/* Member Since */}
            <HStack justifyContent="space-between" alignItems="center">
              <HStack alignItems="center" space="sm">
                <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
                <Text color={colors.textSecondary}>Member Since</Text>
              </HStack>
              <Text color="white" fontWeight="$medium">
                {format(new Date(profile.created_at), 'MMM yyyy')}
              </Text>
            </HStack>

            {profile.last_login_at && (
              <>
                <Divider bg={colors.border} />
                <HStack justifyContent="space-between" alignItems="center">
                  <HStack alignItems="center" space="sm">
                    <Ionicons name="time-outline" size={18} color={colors.textMuted} />
                    <Text color={colors.textSecondary}>Last Login</Text>
                  </HStack>
                  <Text color="white" fontWeight="$medium">
                    {format(new Date(profile.last_login_at), 'MMM d, HH:mm')}
                  </Text>
                </HStack>
              </>
            )}
          </VStack>
        </Box>

        {/* App Settings */}
        <Box style={styles.section}>
          <Heading size="sm" color="white" marginBottom="$3">
            App Settings
          </Heading>
          
          <VStack space="sm">
            <MenuItem
              icon="notifications-outline"
              label="Notifications"
              isDisabled
              onPress={() => handleComingSoon('Notifications')}
            />
            <MenuItem
              icon="language-outline"
              label="Language"
              isDisabled
              onPress={() => handleComingSoon('Language Settings')}
            />
            <MenuItem
              icon="lock-closed-outline"
              label="Change Password"
              onPress={() => setPasswordModalVisible(true)}
            />
          </VStack>
        </Box>

        {/* Support & Legal */}
        <Box style={styles.section}>
          <Heading size="sm" color="white" marginBottom="$3">
            Support & Legal
          </Heading>
          
          <VStack space="sm">
            <MenuItem
              icon="shield-outline"
              label="Privacy Policy"
              onPress={handleContactSupport}
            />
            <MenuItem
              icon="document-text-outline"
              label="Terms of Service"
              onPress={handleContactSupport}
            />
            <MenuItem
              icon="help-circle-outline"
              label="Contact Support"
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
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </Text>
          </HStack>
        </TouchableOpacity>

        {/* App Version */}
        <Text size="xs" color={colors.textMuted} textAlign="center" marginTop="$2" marginBottom="$4">
          App Version: {APP_VERSION}
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
              <Heading size="lg" color="white">Change Password</Heading>
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
                    Current Password
                  </FormControlLabelText>
                </FormControlLabel>
                <Input
                  variant="outline"
                  borderColor={colors.border}
                  bg={colors.surfaceHighlight}
                  borderRadius="$lg"
                >
                  <InputField
                    placeholder="Enter current password"
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
                    New Password
                  </FormControlLabelText>
                </FormControlLabel>
                <Input
                  variant="outline"
                  borderColor={colors.border}
                  bg={colors.surfaceHighlight}
                  borderRadius="$lg"
                >
                  <InputField
                    placeholder="Enter new password (min 8 characters)"
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
                    Confirm New Password
                  </FormControlLabelText>
                </FormControlLabel>
                <Input
                  variant="outline"
                  borderColor={colors.border}
                  bg={colors.surfaceHighlight}
                  borderRadius="$lg"
                >
                  <InputField
                    placeholder="Confirm new password"
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
                  <ButtonText color={colors.textSecondary}>Cancel</ButtonText>
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
                    <ButtonText color="white">Change Password</ButtonText>
                  )}
                </Button>
              </HStack>
            </VStack>
          </Box>
        </KeyboardAvoidingView>
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
});
