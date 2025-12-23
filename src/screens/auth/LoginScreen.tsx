import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Keyboard,
  Animated,
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
} from '@gluestack-ui/themed';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, borderRadius } from '../../config/theme';
import { useTranslation } from '../../lib/i18n';
import { useLanguage, LANGUAGES, Language } from '../../contexts/LanguageContext';
import type { AuthStackScreenProps } from '../../navigation/types';

type LoginScreenProps = AuthStackScreenProps<'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenProps['navigation']>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const { login } = useAuth();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  
  const handleLanguageChange = async (newLanguage: Language) => {
    await setLanguage(newLanguage);
    setLanguageModalVisible(false);
  };

  // Animations
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-20)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.stagger(300, [
      Animated.parallel([
        Animated.timing(headerOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(headerTranslateY, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(formTranslateY, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = t('auth.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = t('auth.emailInvalid');
    }

    if (!password) {
      newErrors.password = t('auth.passwordRequired');
    } else if (password.length < 6) {
      newErrors.password = t('auth.passwordTooShort');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await login(email.trim(), password);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { detail?: string }; status?: number } };
      const errorDetail = axiosError.response?.data?.detail || '';
      
      // Handle deactivated account specifically
      if (errorDetail.toLowerCase().includes('deactivated')) {
        Alert.alert(
          t('auth.accountSuspended'),
          t('auth.accountDeactivated'),
          [{ text: t('common.ok') }]
        );
      } else {
        Alert.alert(
          t('auth.loginFailed'),
          errorDetail || t('auth.invalidCredentials')
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <LinearGradient
          colors={[colors.background, '#111827']}
          style={styles.gradient}
        >
          <Box style={styles.content}>
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
            
            <VStack space="xl">
              {/* Header */}
              <Animated.View
                style={{
                  opacity: headerOpacity,
                  transform: [{ translateY: headerTranslateY }],
                }}
              >
                <VStack space="sm" marginBottom="$8">
                  <LinearGradient
                    colors={colors.gradients.primary as [string, string]}
                    style={styles.logoContainer}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text color="white" fontSize="$4xl" fontWeight="$bold">
                      C
                    </Text>
                  </LinearGradient>
                  <Heading size="3xl" color="white" textAlign="left">
                    {t('auth.cosmosWealth')}
                  </Heading>
                  <Text size="md" color={colors.textSecondary} textAlign="left">
                    {t('auth.tagline')}
                  </Text>
                </VStack>
              </Animated.View>

              {/* Form */}
              <Animated.View
                style={{
                  opacity: formOpacity,
                  transform: [{ translateY: formTranslateY }],
                }}
              >
                <VStack space="lg">
                  <FormControl isInvalid={!!errors.email}>
                    <FormControlLabel>
                      <FormControlLabelText color={colors.textSecondary}>{t('auth.email')}</FormControlLabelText>
                    </FormControlLabel>
                    <Input
                      variant="outline"
                      size="lg"
                      borderRadius="$lg"
                      borderColor={colors.border}
                      bg={colors.surfaceHighlight}
                    >
                      <InputField
                        placeholder={t('auth.enterEmail')}
                        placeholderTextColor={colors.textMuted}
                        color="white"
                        value={email}
                        onChangeText={(text) => {
                          setEmail(text);
                          if (errors.email) setErrors({ ...errors, email: undefined });
                        }}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        autoComplete="email"
                      />
                    </Input>
                    {errors.email && (
                      <FormControlError>
                        <FormControlErrorText color={colors.error}>{errors.email}</FormControlErrorText>
                      </FormControlError>
                    )}
                  </FormControl>

                  <FormControl isInvalid={!!errors.password}>
                    <FormControlLabel>
                      <FormControlLabelText color={colors.textSecondary}>{t('auth.password')}</FormControlLabelText>
                    </FormControlLabel>
                    <Input
                      variant="outline"
                      size="lg"
                      borderRadius="$lg"
                      borderColor={colors.border}
                      bg={colors.surfaceHighlight}
                    >
                      <InputField
                        placeholder={t('auth.enterPassword')}
                        placeholderTextColor={colors.textMuted}
                        color="white"
                        value={password}
                        onChangeText={(text) => {
                          setPassword(text);
                          if (errors.password) setErrors({ ...errors, password: undefined });
                        }}
                        secureTextEntry
                        autoComplete="password"
                      />
                    </Input>
                    {errors.password && (
                      <FormControlError>
                        <FormControlErrorText color={colors.error}>{errors.password}</FormControlErrorText>
                      </FormControlError>
                    )}
                  </FormControl>

                   {/* Forgot Password Link */}
                   <TouchableOpacity
                     onPress={() => Alert.alert(
                       t('auth.resetPassword'),
                       t('auth.resetPasswordMessage'),
                       [{ text: t('common.ok') }]
                     )}
                     style={{ alignSelf: 'flex-end', marginTop: 8 }}
                   >
                     <Text color={colors.primary} size="sm">{t('auth.forgotPassword')}</Text>
                   </TouchableOpacity>
 
                   {/* Login Button */}
                   <Button
                     size="lg"
                     borderRadius="$full"
                     onPress={handleLogin}
                     isDisabled={isLoading}
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
                         {isLoading ? t('auth.loggingIn') : t('auth.login')}
                       </ButtonText>
                     </LinearGradient>
                   </Button>
 
                   {/* Register Link */}
                   <Button
                     variant="link"
                     onPress={() => navigation.navigate('Register')}
                     marginTop="$4"
                   >
                     <ButtonText color={colors.textSecondary} size="sm">
                       {t('auth.haveInvitationCode')}
                     </ButtonText>
                   </Button>

                  {/* Test Credentials Hint */}
                  <Box
                    bg={colors.surfaceHighlight}
                    padding="$4"
                    borderRadius="$lg"
                    marginTop="$4"
                    borderWidth={1}
                    borderColor={colors.border}
                  >
                    <Text size="xs" color={colors.textSecondary} textAlign="left">
                      Test credentials: client1@test.com / Test1234!
                    </Text>
                  </Box>
                </VStack>
              </Animated.View>
            </VStack>
          </Box>
          
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
        </LinearGradient>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceHighlight,
    zIndex: 10,
  },
  languageOption: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceHighlight,
  },
});
