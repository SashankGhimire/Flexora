import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Logo, CustomInput, CustomButton } from '../../components/ui';
import { COLORS } from '../../constants/theme';
import { AuthStackParamList } from '../../types/navigation';
import { useAuth } from '../../context/AuthContext';

type RegisterScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'>;
};

const getPasswordStrength = (value: string) => {
  let score = 0;

  if (value.length >= 6) score += 1;
  if (value.length >= 10) score += 1;
  if (/[A-Z]/.test(value) || /\d/.test(value) || /[^A-Za-z0-9]/.test(value)) {
    score += 1;
  }

  const percent = [0, 35, 70, 100][score];
  const label = ['Weak', 'Weak', 'Medium', 'Strong'][score];
  const color = [COLORS.error, COLORS.error, '#f59e0b', COLORS.primary][score];

  return { percent, label, color };
};

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fullNameError, setFullNameError] = useState<string | undefined>();
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | undefined>();

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const validate = () => {
    let isValid = true;
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setFullNameError('Full name is required');
      isValid = false;
    } else {
      setFullNameError(undefined);
    }

    if (!trimmedEmail) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setEmailError('Enter a valid email');
      isValid = false;
    } else {
      setEmailError(undefined);
    }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Use at least 6 characters');
      isValid = false;
    } else {
      setPasswordError(undefined);
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Confirm your password');
      isValid = false;
    } else if (confirmPassword !== password) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    } else {
      setConfirmPasswordError(undefined);
    }

    return isValid;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await register(email.trim(), password, fullName.trim());
      Alert.alert('Success', 'Account created successfully!');
    } catch (error: any) {
      const errorMessage = error?.message || 'Registration failed. Please try again.';
      Alert.alert('Registration Error', errorMessage);
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  const isDisabled =
    !fullName.trim() ||
    !email.trim() ||
    !password ||
    !confirmPassword ||
    password !== confirmPassword ||
    loading;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.background}>
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <Animated.View entering={FadeInUp.duration(600).springify()} style={styles.logoBlock}>
              <Logo size={72} />
              <Text style={styles.subtitle}>Create your fitness journey</Text>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.duration(600).delay(200).springify()}
              style={styles.card}
            >
              <CustomInput
                label="Full Name"
                icon="user"
                placeholder="Enter your full name"
                value={fullName}
                onChangeText={(value) => {
                  setFullName(value);
                  if (fullNameError) setFullNameError(undefined);
                }}
                error={fullNameError}
              />

              <CustomInput
                label="Email Address"
                icon="at-sign"
                placeholder="your.email@example.com"
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  if (emailError) setEmailError(undefined);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                error={emailError}
              />

              <CustomInput
                label="Password"
                icon="shield"
                placeholder="Create a strong password"
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  if (passwordError) setPasswordError(undefined);
                }}
                isPassword
                error={passwordError}
              />

              <View style={styles.strengthRow}>
                <View style={styles.strengthBar}>
                  <View
                    style={[
                      styles.strengthFill,
                      { width: `${strength.percent}%`, backgroundColor: strength.color },
                    ]}
                  />
                </View>
                <Text style={[styles.strengthLabel, { color: strength.color }]}>
                  {strength.label}
                </Text>
              </View>

              <CustomInput
                label="Confirm Password"
                icon="shield"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChangeText={(value) => {
                  setConfirmPassword(value);
                  if (confirmPasswordError) setConfirmPasswordError(undefined);
                }}
                isPassword
                error={confirmPasswordError}
              />

              <View style={styles.buttonShadow}>
                <CustomButton
                  title="Create Account"
                  onPress={handleRegister}
                  loading={loading}
                  disabled={isDisabled}
                />
              </View>

              <View style={styles.signInRow}>
                <Text style={styles.signInText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.signInLink}>Log In</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.duration(600).delay(400).springify()}
              style={styles.footer}
            >
              <Text style={styles.footerText}>
                By signing up, you agree to our Terms & Conditions
              </Text>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.background,
  },
  glowTop: {
    position: 'absolute',
    top: -140,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: `${COLORS.primary}25`,
    opacity: 0.7,
  },
  glowBottom: {
    position: 'absolute',
    bottom: -160,
    left: -90,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: `${COLORS.primary}15`,
    opacity: 0.6,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    justifyContent: 'space-between',
  },
  logoBlock: {
    alignItems: 'center',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  card: {
    marginTop: 16,
    backgroundColor: COLORS.card,
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.3,
    shadowRadius: 26,
    elevation: 6,
  },
  strengthRow: {
    marginTop: -6,
    marginBottom: 14,
  },
  strengthBar: {
    height: 6,
    backgroundColor: COLORS.input,
    borderRadius: 999,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 999,
  },
  strengthLabel: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  buttonShadow: {
    marginTop: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 4,
  },
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 18,
  },
  signInText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  signInLink: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  footer: {
    paddingTop: 24,
  },
  footerText: {
    color: COLORS.placeholder,
    fontSize: 11,
    textAlign: 'center',
  },
});
