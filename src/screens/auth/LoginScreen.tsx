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
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../config/theme';
import type { AuthStackScreenProps } from '../../navigation/types';

type LoginScreenProps = AuthStackScreenProps<'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenProps['navigation']>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { login } = useAuth();

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
      const axiosError = error as { response?: { data?: { detail?: string }; status?: number } };
      const errorDetail = axiosError.response?.data?.detail || '';
      
      // Handle deactivated account specifically
      if (errorDetail.toLowerCase().includes('deactivated')) {
        Alert.alert(
          'Account Suspended',
          'Your account has been deactivated. Please contact your advisor for assistance.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Login Failed',
          errorDetail || 'Invalid credentials. Please try again.'
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
                    Cosmos Wealth
                  </Heading>
                  <Text size="md" color={colors.textSecondary} textAlign="left">
                    Your modern wealth platform
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

                   {/* Forgot Password Link */}
                   <TouchableOpacity
                     onPress={() => Alert.alert(
                       'Reset Password',
                       'Please contact your advisor to reset your login credentials.\n\nThey can generate a new temporary password for you.',
                       [{ text: 'OK' }]
                     )}
                     style={{ alignSelf: 'flex-end', marginTop: 8 }}
                   >
                     <Text color={colors.primary} size="sm">Forgot Password?</Text>
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
                         {isLoading ? 'Logging in...' : 'Login'}
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
                       Have an invitation code? Register here
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
});
