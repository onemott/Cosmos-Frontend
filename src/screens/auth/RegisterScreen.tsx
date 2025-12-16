import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
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
import type { AuthStackScreenProps } from '../../navigation/types';

type RegisterScreenProps = AuthStackScreenProps<'Register'>;

export default function RegisterScreen() {
  const navigation = useNavigation<RegisterScreenProps['navigation']>();
  const route = useRoute<RegisterScreenProps['route']>();
  
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
  
  // Pre-fill form when invitation is valid
  useEffect(() => {
    if (invitationData?.valid) {
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
    }
  }, [invitationData]);
  
  const handleValidateCode = () => {
    if (invitationCode.replace(/-/g, '').length !== 9) {
      setCodeError('Please enter a valid 9-character code');
      return;
    }
    
    if (invitationData?.valid) {
      setStep('form');
    } else {
      setCodeError(invitationData?.error || 'Invalid invitation code');
    }
  };
  
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!firstName.trim()) errors.firstName = 'First name is required';
    if (!lastName.trim()) errors.lastName = 'Last name is required';
    
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email';
    }
    
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    
    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
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
        'Registration Successful!',
        'Your account has been created. You can now log in.',
        [{ text: 'Go to Login', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { detail?: string } } };
      Alert.alert(
        'Registration Failed',
        axiosError.response?.data?.detail || 'Something went wrong. Please try again.'
      );
    }
  };
  
  const renderCodeStep = () => (
    <VStack space="xl">
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
          Enter Invitation Code
        </Heading>
        <Text size="md" color={colors.textSecondary} textAlign="center">
          Your advisor sent you a code to register
        </Text>
      </VStack>
      
      {/* Code Input */}
      <FormControl isInvalid={!!codeError}>
        <FormControlLabel>
          <FormControlLabelText color={colors.textSecondary}>
            Invitation Code
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
          <Text color={colors.textSecondary}>Validating code...</Text>
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
            <Text color={colors.success} fontWeight="$semibold">Valid Invitation</Text>
          </HStack>
          <Text color={colors.textSecondary} size="sm">
            From: {invitationData.tenant_name}
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
            Continue
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
          Already have an account? Log in
        </ButtonText>
      </Button>
    </VStack>
  );
  
  const renderFormStep = () => (
    <VStack space="lg">
      {/* Header */}
      <VStack space="sm" alignItems="center" marginBottom="$2">
        <Heading size="xl" color="white" textAlign="center">
          Create Your Account
        </Heading>
        <Text size="sm" color={colors.textSecondary} textAlign="center">
          Joining {invitationData?.tenant_name}
        </Text>
      </VStack>
      
      {/* Name Row */}
      <HStack space="md">
        <FormControl flex={1} isInvalid={!!formErrors.firstName}>
          <FormControlLabel>
            <FormControlLabelText color={colors.textSecondary}>First Name</FormControlLabelText>
          </FormControlLabel>
          <Input variant="outline" size="md" borderRadius="$lg" borderColor={colors.border} bg={colors.surfaceHighlight}>
            <InputField
              placeholder="John"
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
            <FormControlLabelText color={colors.textSecondary}>Last Name</FormControlLabelText>
          </FormControlLabel>
          <Input variant="outline" size="md" borderRadius="$lg" borderColor={colors.border} bg={colors.surfaceHighlight}>
            <InputField
              placeholder="Smith"
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
      
      {/* Email */}
      <FormControl isInvalid={!!formErrors.email}>
        <FormControlLabel>
          <FormControlLabelText color={colors.textSecondary}>Email</FormControlLabelText>
        </FormControlLabel>
        <Input variant="outline" size="md" borderRadius="$lg" borderColor={colors.border} bg={colors.surfaceHighlight}>
          <InputField
            placeholder="john@example.com"
            placeholderTextColor={colors.textMuted}
            color="white"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
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
            Phone <Text color={colors.textMuted}>(optional)</Text>
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
            autoComplete="tel"
          />
        </Input>
      </FormControl>
      
      {/* Password */}
      <FormControl isInvalid={!!formErrors.password}>
        <FormControlLabel>
          <FormControlLabelText color={colors.textSecondary}>Password</FormControlLabelText>
        </FormControlLabel>
        <Input variant="outline" size="md" borderRadius="$lg" borderColor={colors.border} bg={colors.surfaceHighlight}>
          <InputField
            placeholder="Min. 8 characters"
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
          <FormControlLabelText color={colors.textSecondary}>Confirm Password</FormControlLabelText>
        </FormControlLabel>
        <Input variant="outline" size="md" borderRadius="$lg" borderColor={colors.border} bg={colors.surfaceHighlight}>
          <InputField
            placeholder="Re-enter password"
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
            {registerMutation.isPending ? 'Creating Account...' : 'Create Account'}
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
            Back to invitation code
          </ButtonText>
        </HStack>
      </Button>
    </VStack>
  );
  
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
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Box style={styles.content}>
              {step === 'code' ? renderCodeStep() : renderFormStep()}
            </Box>
          </ScrollView>
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
});

