import React, { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Logo, CustomInput, CustomButton, SimpleIcon } from '../../components/ui';
import { COLORS } from '../../constants/theme';
import { AuthStackParamList } from '../../types/navigation';
import { useAuth } from '../../context/AuthContext';

type RegisterScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'>;
};

const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'];

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // Validate required fields
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Validation Error', 'Please provide a valid email address');
      return;
    }

    // Validate password length
    if (password.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters');
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // Use auth context to register
      await register(email, password, fullName);

      // Registration successful - navigation handled automatically by App context
      Alert.alert('Success', 'Account created successfully!');
    } catch (error: any) {
      // Handle error
      const errorMessage = error?.message || 'Registration failed. Please try again.';
      Alert.alert('Registration Error', errorMessage);
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectGender = (selectedGender: string) => {
    setGender(selectedGender);
    setShowGenderModal(false);
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
            <Animated.View entering={FadeInUp.duration(600).springify()}>
              <Logo />
              <Text style={{ color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 8 }}>
                Create your account to train smarter
              </Text>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.duration(600).delay(200).springify()}
              style={{ marginTop: 32 }}
            >
              <CustomInput
                label="Full Name"
                icon="user-check"
                placeholder="Enter your full name"
                value={fullName}
                onChangeText={setFullName}
              />

              <CustomInput
                label="Email Address"
                icon="at-sign"
                placeholder="Enter your email address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <CustomInput
                label="Password"
                icon="shield"
                placeholder="Create a strong password"
                value={password}
                onChangeText={setPassword}
                isPassword
              />

              <CustomInput
                label="Confirm Password"
                icon="shield"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                isPassword
              />

              <View style={{ 
                backgroundColor: COLORS.card, 
                borderRadius: 12, 
                padding: 16, 
                marginTop: 8,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: COLORS.border 
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <SimpleIcon name="alert-circle" size={16} color={COLORS.primary} style={{ marginRight: 8 }} />
                  <Text style={{ color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' }}>
                    Optional Information
                  </Text>
                </View>

                <CustomInput
                  label="Age"
                  icon="activity"
                  placeholder="Enter Age"
                  value={age}
                  onChangeText={setAge}
                  keyboardType="number-pad"
                />

                <View style={{ marginBottom: 0 }}>
                  <Text style={{ color: 'white', fontSize: 14, fontWeight: '500', marginBottom: 8 }}>
                    Gender
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowGenderModal(true)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: COLORS.input,
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 16,
                      borderWidth: 2,
                      borderColor: COLORS.border,
                    }}
                  >
                    <SimpleIcon name="users" size={20} color={COLORS.placeholder} style={{ marginRight: 12 }} />
                    <Text style={{ 
                      flex: 1, 
                      color: gender ? 'white' : COLORS.placeholder,
                      fontSize: 16 
                    }}>
                      {gender || 'Select'}
                    </Text>
                    <SimpleIcon name="arrow-down" size={20} color={COLORS.placeholder} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{ marginTop: 8 }}>
                <CustomButton
                  title="Create Account"
                  onPress={handleRegister}
                  loading={loading}
                />
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
                <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>
                  Already have an account?{' '}
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={{ color: COLORS.primary, fontSize: 14, fontWeight: 'bold' }}>
                    Log In
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.duration(600).delay(400).springify()}
              style={{ marginTop: 'auto', paddingTop: 32 }}
            >
              <Text style={{ color: COLORS.placeholder, fontSize: 11, textAlign: 'center' }}>
                By signing up, you agree to our Terms & Conditions
              </Text>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showGenderModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGenderModal(false)}
      >
        <Pressable 
          style={{ 
            flex: 1, 
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}
          onPress={() => setShowGenderModal(false)}
        >
          <Pressable
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 16,
              width: '100%',
              maxWidth: 400,
              padding: 24,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={{ 
              color: 'white', 
              fontSize: 20, 
              fontWeight: 'bold',
              marginBottom: 8 
            }}>
              Select Gender
            </Text>
            <Text style={{ 
              color: COLORS.textSecondary, 
              fontSize: 14,
              marginBottom: 24 
            }}>
              Choose the option that best describes you
            </Text>

            {GENDER_OPTIONS.map((option, index) => (
              <TouchableOpacity
                key={option}
                onPress={() => selectGender(option)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  borderRadius: 12,
                  backgroundColor: gender === option ? COLORS.primary + '20' : COLORS.input,
                  marginBottom: index < GENDER_OPTIONS.length - 1 ? 12 : 0,
                  borderWidth: 2,
                  borderColor: gender === option ? COLORS.primary : 'transparent',
                }}
              >
                <View style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: gender === option ? COLORS.primary : COLORS.border,
                  backgroundColor: gender === option ? COLORS.primary : 'transparent',
                  marginRight: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {gender === option && (
                    <SimpleIcon name="check" size={12} color="white" />
                  )}
                </View>
                <Text style={{ 
                  color: gender === option ? COLORS.primary : 'white',
                  fontSize: 16,
                  fontWeight: gender === option ? '600' : '400',
                }}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              onPress={() => setShowGenderModal(false)}
              style={{
                marginTop: 24,
                padding: 16,
                borderRadius: 12,
                backgroundColor: COLORS.input,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: COLORS.textSecondary, fontSize: 16, fontWeight: '600' }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};
