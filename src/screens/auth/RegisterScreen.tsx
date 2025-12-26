import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  Keyboard,
  ScrollView,
  Modal,
} from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Input,
  InputField,
  Button,
  ButtonText,
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  FormControlError,
  FormControlErrorText,
  Spinner,
} from '@gluestack-ui/themed';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, spacing, borderRadius } from '../../config/theme';
import { useValidateInvitation, useRegisterWithInvitation } from '../../api/hooks';
import { useTranslation } from '../../lib/i18n';
import { useLanguage, LANGUAGES, Language } from '../../contexts/LanguageContext';
import type { AuthStackScreenProps } from '../../navigation/types';

type RegisterScreenProps = AuthStackScreenProps<'Register'>;

export default function RegisterScreen() {
  const navigation = useNavigation<RegisterScreenProps['navigation']>();
  const route = useRoute<RegisterScreenProps['route']>();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  
  // Language modal state
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  
  // Step tracking
  const [step, setStep] = useState<'code' | 'form'>('code');
  
  // Step 1: Invitation code
  const [invitationCode, setInvitationCode] = useState(route.params?.code || '');
  const [codeError, setCodeError] = useState<string | null>(null);
  
  // Step 2: Registration form
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // API hooks
  const { data: invitationData, isLoading: isValidating, refetch } = useValidateInvitation(
    invitationCode.replace(/-/g, '').toUpperCase()
  );
  const registerMutation = useRegisterWithInvitation();
  
  // Format code as XXX-XXX-XXX
  const formatCode = (text: string) => {
    const cleaned = text.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const parts = [];
    for (let i = 0; i < cleaned.length && i < 9; i += 3) {
      parts.push(cleaned.slice(i, i + 3));
    }
    return parts.join('-');
  };
  
  const handleCodeChange = (text: string) => {
    const formatted = formatCode(text);
    setInvitationCode(formatted);
    setCodeError(null);
  };
  
  // Auto-validate when code is complete
  useEffect(() => {
    if (invitationCode.replace(/-/g, '').length === 9) {
      refetch();
    }
  }, [invitationCode, refetch]);
  
  // Track if form has been pre-filled to avoid overwriting user input
  const [hasPrefilledForm, setHasPrefilledForm] = useState(false);

  // Pre-fill form when invitation is valid (only once)
  useEffect(() => {
    if (invitationData?.valid && !hasPrefilledForm) {
      if (invitationData.email) setEmail(invitationData.email);
      if (invitationData.invitee_name) {
        const nameParts = invitationData.invitee_name.split(' ');
        if (nameParts.length >= 2) {
          setFirstName(nameParts[0]);
          setLastName(nameParts.slice(1).join(' '));
        } else {
          setFirstName(invitationData.invitee_name);
        }
      }
      setHasPrefilledForm(true);
    }
  }, [invitationData, hasPrefilledForm]);
  
  const handleValidateCode = () => {
    if (invitationCode.replace(/-/g, '').length !== 9) {
      setCodeError(t('register.invalidCodeLength'));
      return;
    }
    
    if (invitationData?.valid) {
      setStep('form');
    } else {
      setCodeError(invitationData?.error || t('register.invalidCode'));
    }
  };
  
  const handleLanguageChange = async (newLanguage: Language) => {
    await setLanguage(newLanguage);
    setLanguageModalVisible(false);
  };
  
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!firstName.trim()) errors.firstName = t('register.firstNameRequired');
    if (!lastName.trim()) errors.lastName = t('register.lastNameRequired');
    
    if (!email.trim()) {
      errors.email = t('auth.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = t('auth.validEmail');
    }
    
    if (!password) {
      errors.password = t('auth.passwordRequired');
    } else if (password.length < 8) {
      errors.password = t('register.passwordMinLength');
    }
    
    if (password !== confirmPassword) {
      errors.confirmPassword = t('register.passwordMismatch');
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleRegister = async () => {
    if (!validateForm()) return;
    
    try {
      await registerMutation.mutateAsync({
        code: invitationCode.replace(/-/g, '').toUpperCase(),
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          password,
          phone: phone.trim() || undefined,
        },
      });
      
      Alert.alert(
        t('register.registrationSuccess'),
        t('register.registrationSuccessMessage'),
        [{ text: t('register.goToLogin'), onPress: () => navigation.navigate('Login') }]
      );
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { detail?: string } } };
      Alert.alert(
        t('register.registrationFailed'),
        axiosError.response?.data?.detail || t('register.somethingWentWrong')
      );
    }
  };
  
  const renderCodeStep = () => (
    <VStack space="xl">
      {/* Language Switcher */}
      <TouchableOpacity
        onPress={() => setLanguageModalVisible(true)}
        style={styles.languageButton}
      >
        <HStack space="xs" alignItems="center">
          <Ionicons name="globe-outline" size={18} color={colors.textSecondary} />
          <Text color={colors.textSecondary} size="sm">
            {LANGUAGES.find(l => l.code === language)?.nativeName || 'English'}
          </Text>
          <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
        </HStack>
      </TouchableOpacity>
      
      {/* Header */}
      <VStack space="sm" alignItems="center" marginBottom="$4">
        <Box
          bg={`${colors.primary}20`}
          p="$4"
          borderRadius={borderRadius.full}
          marginBottom="$2"
        >
          <Ionicons name="ticket-outline" size={40} color={colors.primary} />
        </Box>
        <Heading size="2xl" color="white" textAlign="center">
          {t('register.enterInvitationCode')}
        </Heading>
        <Text size="md" color={colors.textSecondary} textAlign="center">
          {t('register.advisorSentCode')}
        </Text>
      </VStack>
      
      {/* Code Input */}
      <FormControl isInvalid={!!codeError}>
        <FormControlLabel>
          <FormControlLabelText color={colors.textSecondary}>
            {t('register.invitationCode')}
          </FormControlLabelText>
        </FormControlLabel>
        <Input
          variant="outline"
          size="xl"
          borderRadius="$lg"
          borderColor={invitationData?.valid ? colors.success : colors.border}
          bg={colors.surfaceHighlight}
        >
          <InputField
            placeholder="XXX-XXX-XXX"
            placeholderTextColor={colors.textMuted}
            color="white"
            value={invitationCode}
            onChangeText={handleCodeChange}
            autoCapitalize="characters"
            maxLength={11}
            textAlign="center"
            fontSize={24}
            fontWeight="$bold"
            letterSpacing={4}
          />
        </Input>
        {codeError && (
          <FormControlError>
            <FormControlErrorText color={colors.error}>{codeError}</FormControlErrorText>
          </FormControlError>
        )}
      </FormControl>
      
      {/* Validation Status */}
      {isValidating && (
        <HStack space="sm" justifyContent="center" alignItems="center">
          <Spinner size="small" color={colors.primary} />
          <Text color={colors.textSecondary}>{t('register.validatingCode')}</Text>
        </HStack>
      )}
      
      {invitationData?.valid && (
        <Box
          bg={`${colors.success}15`}
          p="$4"
          borderRadius="$lg"
          borderWidth={1}
          borderColor={`${colors.success}30`}
        >
          <HStack space="sm" alignItems="center" marginBottom="$2">
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text color={colors.success} fontWeight="$semibold">{t('register.validInvitation')}</Text>
          </HStack>
          <Text color={colors.textSecondary} size="sm">
            {t('register.from')}: {invitationData.tenant_name}
          </Text>
          {invitationData.message && (
            <Text color={colors.textSecondary} size="sm" marginTop="$2" fontStyle="italic">
              &quot;{invitationData.message}&quot;
            </Text>
          )}
        </Box>
      )}
      
      {invitationData && !invitationData.valid && !isValidating && (
        <Box
          bg={`${colors.error}15`}
          p="$4"
          borderRadius="$lg"
          borderWidth={1}
          borderColor={`${colors.error}30`}
        >
          <HStack space="sm" alignItems="center">
            <Ionicons name="close-circle" size={20} color={colors.error} />
            <Text color={colors.error}>{invitationData.error}</Text>
          </HStack>
        </Box>
      )}
      
      {/* Continue Button */}
      <Button
        size="lg"
        borderRadius="$full"
        onPress={handleValidateCode}
        isDisabled={!invitationData?.valid || isValidating}
        bg="transparent"
        p="$0"
        overflow="hidden"
        marginTop="$6"
      >
        <LinearGradient
          colors={colors.gradients.primary as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.buttonGradient}
        >
          <ButtonText fontWeight="$bold" color="white">
            {t('register.continue')}
          </ButtonText>
        </LinearGradient>
      </Button>
      
      {/* Back to Login */}
      <Button
        variant="link"
        onPress={() => navigation.navigate('Login')}
        marginTop="$4"
      >
        <ButtonText color={colors.textSecondary}>
          {t('register.alreadyHaveAccount')}
        </ButtonText>
      </Button>
    </VStack>
  );
  
  const renderFormStep = () => (
    <VStack space="lg">
      {/* Header */}
      <VStack space="sm" alignItems="center" marginBottom="$2">
        <Heading size="xl" color="white" textAlign="center">
          {t('register.createYourAccount')}
        </Heading>
        <Text size="sm" color={colors.textSecondary} textAlign="center">
          {t('register.joining')} {invitationData?.tenant_name}
        </Text>
      </VStack>
      
      {/* Name Row */}
      <HStack space="md">
        <FormControl flex={1} isInvalid={!!formErrors.firstName}>
          <FormControlLabel>
            <FormControlLabelText color={colors.textSecondary}>{t('register.firstName')}</FormControlLabelText>
          </FormControlLabel>
          <Input variant="outline" size="md" borderRadius="$lg" borderColor={colors.border} bg={colors.surfaceHighlight}>
            <InputField
              placeholder={t('register.firstNamePlaceholder')}
              placeholderTextColor={colors.textMuted}
              color="white"
              value={firstName}
              onChangeText={setFirstName}
              autoComplete="given-name"
            />
          </Input>
          {formErrors.firstName && (
            <FormControlError>
              <FormControlErrorText color={colors.error}>{formErrors.firstName}</FormControlErrorText>
            </FormControlError>
          )}
        </FormControl>

        <FormControl flex={1} isInvalid={!!formErrors.lastName}>
          <FormControlLabel>
            <FormControlLabelText color={colors.textSecondary}>{t('register.lastName')}</FormControlLabelText>
          </FormControlLabel>
          <Input variant="outline" size="md" borderRadius="$lg" borderColor={colors.border} bg={colors.surfaceHighlight}>
            <InputField
              placeholder={t('register.lastNamePlaceholder')}
              placeholderTextColor={colors.textMuted}
              color="white"
              value={lastName}
              onChangeText={setLastName}
              autoComplete="family-name"
            />
          </Input>
          {formErrors.lastName && (
            <FormControlError>
              <FormControlErrorText color={colors.error}>{formErrors.lastName}</FormControlErrorText>
            </FormControlError>
          )}
        </FormControl>
      </HStack>

      {/* Spacer to fix HStack touch overlay bug */}
      <Box height={1} />

      {/* Email */}
      <FormControl isInvalid={!!formErrors.email}>
        <FormControlLabel>
          <FormControlLabelText color={colors.textSecondary}>{t('auth.email')}</FormControlLabelText>
        </FormControlLabel>
        <Input variant="outline" size="md" borderRadius="$lg" borderColor={colors.border} bg={colors.surfaceHighlight}>
          <InputField
            placeholder={t('register.emailPlaceholder')}
            placeholderTextColor={colors.textMuted}
            color="white"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </Input>
        {formErrors.email && (
          <FormControlError>
            <FormControlErrorText color={colors.error}>{formErrors.email}</FormControlErrorText>
          </FormControlError>
        )}
      </FormControl>

      {/* Phone (optional) */}
      <FormControl>
        <FormControlLabel>
          <FormControlLabelText color={colors.textSecondary}>
            {t('register.phone')} <Text color={colors.textMuted}>({t('register.optional')})</Text>
          </FormControlLabelText>
        </FormControlLabel>
        <Input variant="outline" size="md" borderRadius="$lg" borderColor={colors.border} bg={colors.surfaceHighlight}>
          <InputField
            placeholder="+1 555 123 4567"
            placeholderTextColor={colors.textMuted}
            color="white"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </Input>
      </FormControl>
      
      {/* Password */}
      <FormControl isInvalid={!!formErrors.password}>
        <FormControlLabel>
          <FormControlLabelText color={colors.textSecondary}>{t('auth.password')}</FormControlLabelText>
        </FormControlLabel>
        <Input variant="outline" size="md" borderRadius="$lg" borderColor={colors.border} bg={colors.surfaceHighlight}>
          <InputField
            placeholder={t('register.passwordPlaceholder')}
            placeholderTextColor={colors.textMuted}
            color="white"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
          />
        </Input>
        {formErrors.password && (
          <FormControlError>
            <FormControlErrorText color={colors.error}>{formErrors.password}</FormControlErrorText>
          </FormControlError>
        )}
      </FormControl>
      
      {/* Confirm Password */}
      <FormControl isInvalid={!!formErrors.confirmPassword}>
        <FormControlLabel>
          <FormControlLabelText color={colors.textSecondary}>{t('register.confirmPassword')}</FormControlLabelText>
        </FormControlLabel>
        <Input variant="outline" size="md" borderRadius="$lg" borderColor={colors.border} bg={colors.surfaceHighlight}>
          <InputField
            placeholder={t('register.confirmPasswordPlaceholder')}
            placeholderTextColor={colors.textMuted}
            color="white"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoComplete="new-password"
          />
        </Input>
        {formErrors.confirmPassword && (
          <FormControlError>
            <FormControlErrorText color={colors.error}>{formErrors.confirmPassword}</FormControlErrorText>
          </FormControlError>
        )}
      </FormControl>
      
      {/* Register Button */}
      <Button
        size="lg"
        borderRadius="$full"
        onPress={handleRegister}
        isDisabled={registerMutation.isPending}
        bg="transparent"
        p="$0"
        overflow="hidden"
        marginTop="$6"
      >
        <LinearGradient
          colors={colors.gradients.primary as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.buttonGradient}
        >
          <ButtonText fontWeight="$bold" color="white">
            {registerMutation.isPending ? t('register.creatingAccount') : t('register.createAccount')}
          </ButtonText>
        </LinearGradient>
      </Button>
      
      {/* Back Button */}
      <Button
        variant="link"
        onPress={() => setStep('code')}
        marginTop="$4"
      >
        <HStack space="xs" alignItems="center">
          <Ionicons name="arrow-back" size={16} color={colors.textSecondary} />
          <ButtonText color={colors.textSecondary}>
            {t('register.backToInvitationCode')}
          </ButtonText>
        </HStack>
      </Button>
    </VStack>
  );
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={[colors.background, '#111827']}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={Keyboard.dismiss}
        >
          <Box style={styles.content}>
            {step === 'code' ? renderCodeStep() : renderFormStep()}
          </Box>
        </ScrollView>
      </LinearGradient>
        
        {/* Language Selector Modal */}
        <Modal
          visible={languageModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setLanguageModalVisible(false)}
        >
          <Box flex={1} justifyContent="flex-end" bg="rgba(0,0,0,0.7)">
            <Box
              bg={colors.surface}
              borderTopLeftRadius={borderRadius.xl}
              borderTopRightRadius={borderRadius.xl}
              padding="$6"
              paddingBottom={spacing.xl + 20}
              borderWidth={1}
              borderColor={colors.border}
            >
              <HStack justifyContent="space-between" alignItems="center" marginBottom="$4">
                <Heading size="lg" color="white">{t('profile.languageModal.title')}</Heading>
                <TouchableOpacity onPress={() => setLanguageModalVisible(false)}>
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </HStack>

              <VStack space="md">
                {LANGUAGES.map((langOption) => (
                  <TouchableOpacity
                    key={langOption.code}
                    onPress={() => handleLanguageChange(langOption.code)}
                    style={styles.languageOption}
                  >
                    <HStack justifyContent="space-between" alignItems="center">
                      <Text color="white" size="md">
                        {langOption.nativeName}
                      </Text>
                      {language === langOption.code && (
                        <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                      )}
                    </HStack>
                  </TouchableOpacity>
                ))}
              </VStack>
            </Box>
          </Box>
        </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageButton: {
    alignSelf: 'flex-end',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceHighlight,
  },
  languageOption: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceHighlight,
  },
});

