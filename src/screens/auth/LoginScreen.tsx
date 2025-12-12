import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import {
  Box,
  VStack,
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
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing } from '../../config/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { login } = useAuth();

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
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
      const axiosError = error as { response?: { data?: { detail?: string } } };
      Alert.alert(
        'Login Failed',
        axiosError.response?.data?.detail || 'Invalid credentials. Please try again.'
      );
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
            <VStack space="xl">
              {/* Header */}
              <VStack space="sm" alignItems="center" marginBottom="$8">
                <LinearGradient
                  colors={colors.gradients.primary}
                  style={styles.logoContainer}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text color="white" fontSize="$4xl" fontWeight="$bold">
                    C
                  </Text>
                </LinearGradient>
                <Heading size="3xl" color="white" textAlign="center">
                  Cosmos Wealth
                </Heading>
                <Text size="md" color={colors.textSecondary} textAlign="center">
                  Your modern wealth platform
                </Text>
              </VStack>

              {/* Form */}
              <VStack space="lg">
                <FormControl isInvalid={!!errors.email}>
                  <FormControlLabel>
                    <FormControlLabelText color={colors.textSecondary}>Email</FormControlLabelText>
                  </FormControlLabel>
                  <Input
                    variant="outline"
                    size="lg"
                    borderRadius="$lg"
                    borderColor={colors.border}
                    bg={colors.surfaceHighlight}
                  >
                    <InputField
                      placeholder="Enter your email"
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
                    <FormControlLabelText color={colors.textSecondary}>Password</FormControlLabelText>
                  </FormControlLabel>
                  <Input
                    variant="outline"
                    size="lg"
                    borderRadius="$lg"
                    borderColor={colors.border}
                    bg={colors.surfaceHighlight}
                  >
                    <InputField
                      placeholder="Enter your password"
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
              </VStack>

              {/* Login Button */}
              <Button
                size="lg"
                borderRadius="$full"
                onPress={handleLogin}
                isDisabled={isLoading}
                bg="transparent"
                p="$0"
                overflow="hidden"
                marginTop="$4"
              >
                <LinearGradient
                   colors={colors.gradients.primary}
                   start={{ x: 0, y: 0 }}
                   end={{ x: 1, y: 0 }}
                   style={styles.buttonGradient}
                 >
                  <ButtonText fontWeight="$bold" color="white">
                    {isLoading ? 'Logging in...' : 'Login'}
                  </ButtonText>
                </LinearGradient>
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
                <Text size="xs" color={colors.textSecondary} textAlign="center">
                  Test credentials: client1@test.com / Test1234!
                </Text>
              </Box>
            </VStack>
          </Box>
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
    width: 80,
    height: 80,
    borderRadius: 40,
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
    paddingVertical: 12,
  },
});

