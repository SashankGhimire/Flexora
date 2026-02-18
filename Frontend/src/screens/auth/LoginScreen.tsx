import React, { useState } from 'react';
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
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Logo, CustomInput, CustomButton } from '../../components/ui';
import { COLORS } from '../../constants/theme';
import { AuthStackParamList } from '../../types/navigation';
import { useAuth } from '../../context/AuthContext';

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
      // Use auth context to login
      await login(email, password);
      
      // Login successful - navigation handled automatically by App context
      Alert.alert('Success', 'Login successful!');
    } catch (error: any) {
      // Handle error
      const errorMessage = error?.message || 'Login failed. Please try again.';
      Alert.alert('Login Error', errorMessage);
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = !email.trim() || !password || loading;

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
              <Text style={styles.subtitle}>Welcome back to your training</Text>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.duration(600).delay(200).springify()}
              style={styles.card}
            >
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

              <TouchableOpacity style={styles.forgotButton}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>

              <View style={styles.buttonShadow}>
                <CustomButton
                  title="Log In"
                  onPress={handleLogin}
                  loading={loading}
                  disabled={isDisabled}
                />
              </View>

              <View style={styles.signUpRow}>
                <Text style={styles.signUpText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.signUpLink}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.duration(600).delay(400).springify()}
              style={styles.footer}
            >
              <Text style={styles.footerText}>
                AI-powered fitness tracking with real-time feedback
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
    marginTop: 20,
    backgroundColor: COLORS.card,
    borderRadius: 24,
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
  forgotButton: {
    alignSelf: 'flex-end',
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 18,
  },
  forgotText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  buttonShadow: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 4,
  },
  signUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  signUpText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  signUpLink: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  footer: {
    paddingTop: 24,
  },
  footerText: {
    color: COLORS.placeholder,
    fontSize: 12,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
