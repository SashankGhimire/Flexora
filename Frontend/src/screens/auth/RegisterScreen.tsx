import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Logo, CustomInput, CustomButton, SimpleIcon } from '../../components/ui';
import { Colors } from '../../theme/colors';
import { AuthStackParamList } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { FontWeight, Radius, Spacing, Typography } from '../../theme/tokens';

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
  const color = [Colors.error, Colors.error, Colors.warning, Colors.primary][score];

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
      <View style={styles.topAura} />
      <View style={styles.bottomAura} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <Animated.View entering={FadeInUp.duration(350)} style={styles.heroBlock}>
              <Logo size={52} />
              <Text style={styles.eyebrow}>FLEXORA</Text>
              <Text style={styles.title}>Create account</Text>
              <Text style={styles.subtitle}>Start your smarter fitness journey in under a minute.</Text>
              <View style={styles.badge}>
                <SimpleIcon name="shield" size={12} color={Colors.primary} />
                <Text style={styles.badgeText}>Protected and private</Text>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(320).delay(70)} style={styles.formCard}>
              <Text style={styles.formTitle}>Sign Up</Text>

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
                <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
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

              <CustomButton
                title="Create Account"
                onPress={handleRegister}
                loading={loading}
                disabled={isDisabled}
              />

              <View style={styles.signInRow}>
                <Text style={styles.signInText}>Already have an account? </Text>
                <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.signInLink}>Log In</Text>
                </TouchableOpacity>
              </View>
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
    backgroundColor: Colors.background,
  },
  topAura: {
    position: 'absolute',
    top: -120,
    right: -90,
    width: 250,
    height: 250,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primaryA12,
  },
  bottomAura: {
    position: 'absolute',
    bottom: -130,
    left: -90,
    width: 220,
    height: 220,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primaryLightA12,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.x2,
    gap: Spacing.lg,
  },
  heroBlock: {
    alignItems: 'center',
  },
  eyebrow: {
    marginTop: Spacing.sm,
    color: Colors.primary,
    fontSize: Typography.caption,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
  },
  title: {
    marginTop: Spacing.sm,
    color: Colors.textPrimary,
    fontSize: 32,
    fontWeight: FontWeight.heavy,
  },
  subtitle: {
    marginTop: Spacing.xs,
    color: Colors.textSecondary,
    fontSize: Typography.body,
    textAlign: 'center',
    maxWidth: 320,
  },
  badge: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.primaryA3,
    backgroundColor: Colors.primaryLightA15,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  badgeText: {
    color: Colors.primary,
    fontSize: Typography.caption,
    fontWeight: FontWeight.semi,
  },
  formCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    shadowColor: Colors.black,
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  formTitle: {
    marginBottom: Spacing.md,
    color: Colors.textPrimary,
    fontSize: Typography.title,
    fontWeight: FontWeight.bold,
  },
  strengthRow: {
    marginTop: -6,
    marginBottom: 14,
  },
  strengthBar: {
    height: 6,
    backgroundColor: Colors.input,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: Radius.pill,
  },
  strengthLabel: {
    marginTop: Spacing.xs,
    fontSize: Typography.caption,
    fontWeight: FontWeight.semi,
  },
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  signInText: {
    color: Colors.textSecondary,
    fontSize: Typography.body,
  },
  signInLink: {
    color: Colors.primary,
    fontSize: Typography.body,
    fontWeight: FontWeight.bold,
  },
});





