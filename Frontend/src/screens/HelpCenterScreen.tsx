import React, { useMemo } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';
import { useTheme } from '../context/ThemeContext';
import { Card, SectionHeader, SimpleIcon } from '../components/ui';
import { FontWeight, Radius, Spacing, Typography } from '../theme/tokens';

type Props = NativeStackScreenProps<HomeStackParamList, 'HelpCenter'>;

const FAQ_ITEMS = [
  {
    id: 'workout-start',
    question: 'How do I start a workout?',
    answer: 'Open Home, choose a body focus card, then tap Start Workout. You can also use the Workout tab for direct exercise flow.',
  },
  {
    id: 'ai-camera',
    question: 'How does AI posture tracking work?',
    answer: 'During AI-supported sessions, camera frames are analyzed on-device to detect exercise form and count reps in real time.',
  },
  {
    id: 'progress-sync',
    question: 'Why is my progress not updated instantly?',
    answer: 'Progress syncs after a workout session is saved. Ensure internet access and sign in with the same account.',
  },
  {
    id: 'theme-mode',
    question: 'How can I switch light and dark mode?',
    answer: 'Go to Profile, open Appearance, and toggle theme mode. Your preference is saved automatically.',
  },
];

export const HelpCenterScreen: React.FC<Props> = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerWrap}>
          <Text style={styles.title}>Help Center</Text>
          <Text style={styles.subtitle}>Quick answers for using Flexora smoothly.</Text>
        </View>

        <SectionHeader title="FAQs" subtitle="Most common questions" style={styles.sectionTop} />

        <View style={styles.faqList}>
          {FAQ_ITEMS.map((item) => (
            <Card key={item.id} style={styles.faqCard}>
              <View style={styles.faqHeaderRow}>
                <View style={styles.faqIconWrap}>
                  <SimpleIcon name="life-buoy" size={14} color={colors.primary} />
                </View>
                <Text style={styles.faqQuestion}>{item.question}</Text>
              </View>
              <Text style={styles.faqAnswer}>{item.answer}</Text>
            </Card>
          ))}
        </View>

        <Card style={styles.contactCard}>
          <View style={styles.contactHeaderRow}>
            <View style={styles.faqIconWrap}>
              <SimpleIcon name="mail" size={14} color={colors.primary} />
            </View>
            <Text style={styles.faqQuestion}>Need direct help?</Text>
          </View>
          <Text style={styles.faqAnswer}>Email us and we will respond as soon as possible.</Text>
          <Text style={styles.supportEmail}>support@flexora.app</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: {
  background: string;
  textPrimary: string;
  textSecondary: string;
  card: string;
  border: string;
  primary: string;
  primaryLightA16: string;
}) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.x3,
      paddingBottom: Spacing.x2,
    },
    headerWrap: {
      marginBottom: Spacing.md,
    },
    title: {
      color: colors.textPrimary,
      fontSize: Typography.heading,
      fontWeight: FontWeight.heavy,
    },
    subtitle: {
      marginTop: Spacing.xs,
      color: colors.textSecondary,
      fontSize: Typography.subtitle,
    },
    sectionTop: {
      marginTop: Spacing.md,
    },
    faqList: {
      gap: Spacing.md,
    },
    faqCard: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: Radius.xl,
    },
    faqHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    faqIconWrap: {
      width: 28,
      height: 28,
      borderRadius: Radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.primaryLightA16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    faqQuestion: {
      flex: 1,
      color: colors.textPrimary,
      fontSize: Typography.subtitle,
      fontWeight: FontWeight.bold,
    },
    faqAnswer: {
      marginTop: Spacing.sm,
      color: colors.textSecondary,
      fontSize: Typography.body,
      lineHeight: 20,
    },
    contactCard: {
      marginTop: Spacing.md,
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: Radius.xl,
      marginBottom: Spacing.xl,
    },
    contactHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    supportEmail: {
      marginTop: Spacing.sm,
      color: colors.primary,
      fontSize: Typography.subtitle,
      fontWeight: FontWeight.bold,
    },
  });
