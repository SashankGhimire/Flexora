import React, { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Feather';
import { Logo, CustomInput, CustomButton } from '../../components/ui';
import { COLORS } from '../../constants/theme';
import { AuthStackParamList } from '../../types/navigation';

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      console.log('Login:', { email, password });
    }, 1500);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: 'center', paddingVertical: 48 }}>
            {/* Logo Section */}
            <Animated.View entering={FadeInUp.duration(600).springify()}>
              <Logo />
              <Text style={{ color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 8 }}>
                Welcome back! Let's continue your fitness journey
              </Text>
            </Animated.View>

            {/* Form Section */}
            <Animated.View
              entering={FadeInDown.duration(600).delay(200).springify()}
              style={{ marginTop: 32 }}
            >
              {/* Email Input */}
              <CustomInput
                label="Email Address"
                icon="at-sign"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              {/* Password Input */}
              <CustomInput
                label="Password"
                icon="shield"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                isPassword
              />

              {/* Forgot Password */}
              <TouchableOpacity style={{ alignSelf: 'flex-end', marginBottom: 24 }}>
                <Text style={{ color: COLORS.primary, fontSize: 14, fontWeight: '600' }}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>

              {/* Login Button */}
              <CustomButton
                title="Log In"
                onPress={handleLogin}
                loading={loading}
              />

              {/* Sign Up Link */}
              <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
                <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>
                  Don't have an account?{' '}
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text style={{ color: COLORS.primary, fontSize: 14, fontWeight: 'bold' }}>
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Footer */}
            <Animated.View
              entering={FadeInDown.duration(600).delay(400).springify()}
              style={{ marginTop: 'auto', paddingTop: 32 }}
            >
              <Text style={{ color: COLORS.placeholder, fontSize: 12, textAlign: 'center' }}>
                AI-powered fitness tracking with real-time feedback
              </Text>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
