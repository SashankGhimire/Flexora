import React, { useState } from 'react';
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
import { COLORS } from '../../utils/constants';
import { AuthStackParamList } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { FontWeight, Radius, Spacing, Typography } from '../../theme/tokens';

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();

  const validate = () => {
    let isValid = true;
    const trimmedEmail = email.trim();

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
    } else {
      setPasswordError(undefined);
    }

    return isValid;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await login(email, password);
      Alert.alert('Success', 'Login successful!');
    } catch (error: any) {
      const errorMessage = error?.message || 'Login failed. Please try again.';
      Alert.alert('Login Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = !email.trim() || !password || loading;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topAura} />
      <View style={styles.bottomAura} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <Animated.View entering={FadeInUp.duration(350)} style={styles.heroBlock}>
              <Logo size={56} />
              <Text style={styles.eyebrow}>FLEXORA</Text>
              <Text style={styles.title}>Welcome back</Text>
              <Text style={styles.subtitle}>Login to continue your training progress.</Text>

              <View style={styles.badgeRow}>
                <View style={styles.badge}>
                  <SimpleIcon name="activity" size={12} color={COLORS.primary} />
                  <Text style={styles.badgeText}>AI Coach</Text>
                </View>
                <View style={styles.badge}>
                  <SimpleIcon name="shield" size={12} color={COLORS.primary} />
                  <Text style={styles.badgeText}>Secure</Text>
                </View>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(320).delay(70)} style={styles.formCard}>
              <Text style={styles.formTitle}>Sign In</Text>

              <CustomInput
                label="Email"
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
                placeholder="Enter your password"
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  if (passwordError) setPasswordError(undefined);
                }}
                isPassword
                error={passwordError}
              />

              <TouchableOpacity style={styles.forgotButton} activeOpacity={0.8}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>

              <CustomButton title="Log In" onPress={handleLogin} loading={loading} disabled={isDisabled} />

              <View style={styles.signUpRow}>
                <Text style={styles.signUpText}>No account yet? </Text>
                <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.signUpLink}>Create one</Text>
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
    backgroundColor: '#0D1012',
  },
  topAura: {
    position: 'absolute',
    top: -120,
    right: -90,
    width: 250,
    height: 250,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
  },
  bottomAura: {
    position: 'absolute',
    bottom: -130,
    left: -90,
    width: 220,
    height: 220,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
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
    gap: Spacing.xl,
  },
  heroBlock: {
    alignItems: 'center',
  },
  eyebrow: {
    marginTop: Spacing.sm,
    color: COLORS.primary,
    fontSize: Typography.caption,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
  },
  title: {
    marginTop: Spacing.sm,
    color: '#F4F6F8',
    fontSize: 34,
    fontWeight: FontWeight.heavy,
  },
  subtitle: {
    marginTop: Spacing.xs,
    color: '#8C949D',
    fontSize: Typography.body,
    textAlign: 'center',
  },
  badgeRow: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.28)',
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  badgeText: {
    color: COLORS.primary,
    fontSize: Typography.caption,
    fontWeight: FontWeight.semi,
  },
  formCard: {
    backgroundColor: '#171C1F',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: '#262C31',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    shadowColor: '#000000',
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  formTitle: {
    marginBottom: Spacing.md,
    color: '#F4F6F8',
    fontSize: Typography.title,
    fontWeight: FontWeight.bold,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: -4,
    marginBottom: Spacing.lg,
    paddingVertical: 4,
  },
  forgotText: {
    color: COLORS.primary,
    fontSize: Typography.body,
    fontWeight: FontWeight.semi,
  },
  signUpRow: {
    marginTop: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signUpText: {
    color: '#8C949D',
    fontSize: Typography.body,
  },
  signUpLink: {
    color: COLORS.primary,
    fontSize: Typography.body,
    fontWeight: FontWeight.bold,
  },
});
