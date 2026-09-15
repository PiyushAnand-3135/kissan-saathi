import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Ionicons,
  MaterialCommunityIcons,
} from '@expo/vector-icons';
import { useSettings } from '@/context/settings-context';
import { LanguageDropdown } from '@/components/language-dropdown';

export default function ProfileScreen() {
  const router = useRouter();
  const {
    themeMode,
    setThemeMode,
    theme,
    t,
  } = useSettings();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
      edges={['top', 'left', 'right']}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.surface,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <Pressable
          style={styles.backButton}
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
        </Pressable>

        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          {t('settingsTitle')}
        </Text>

        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 1. Farmer Profile Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.profileHeader}>
            <View
              style={[
                styles.avatarCircle,
                {
                  backgroundColor: theme.primaryGreenBg,
                  borderColor: theme.primaryGreen,
                },
              ]}
            >
              <Ionicons name="person" size={32} color={theme.primaryGreen} />
            </View>

            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.profileName, { color: theme.textPrimary }]}>
                  {t('greetingName')}
                </Text>
                <View
                  style={[
                    styles.verifiedBadge,
                    { backgroundColor: theme.primaryGreenBg },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="check-decagram"
                    size={15}
                    color={theme.primaryGreen}
                  />
                  <Text
                    style={[
                      styles.verifiedText,
                      { color: theme.primaryGreen },
                    ]}
                  >
                    {t('verifiedFarmer')}
                  </Text>
                </View>
              </View>

              <Text style={[styles.profileSubtitle, { color: theme.textSecondary }]}>
                {t('farmerProfile')}
              </Text>
            </View>
          </View>

          {/* Profile Meta Info Details */}
          <View
            style={[
              styles.metaContainer,
              {
                backgroundColor: theme.isDark ? '#181D1A' : '#F9FBFA',
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.metaItem}>
              <View style={styles.metaIconRow}>
                <Ionicons
                  name="call-outline"
                  size={16}
                  color={theme.primaryGreen}
                />
                <Text style={[styles.metaLabel, { color: theme.textMuted }]}>
                  {t('phone')}
                </Text>
              </View>
              <Text style={[styles.metaValue, { color: theme.textPrimary }]}>
                {t('samplePhone')}
              </Text>
            </View>

            <View
              style={[
                styles.metaDivider,
                { backgroundColor: theme.border },
              ]}
            />

            <View style={styles.metaItem}>
              <View style={styles.metaIconRow}>
                <Ionicons
                  name="location-outline"
                  size={16}
                  color={theme.primaryGreen}
                />
                <Text style={[styles.metaLabel, { color: theme.textMuted }]}>
                  {t('location')}
                </Text>
              </View>
              <Text style={[styles.metaValue, { color: theme.textPrimary }]}>
                {t('sampleLocation')}
              </Text>
            </View>

            <View
              style={[
                styles.metaDivider,
                { backgroundColor: theme.border },
              ]}
            />

            <View style={styles.metaItem}>
              <View style={styles.metaIconRow}>
                <MaterialCommunityIcons
                  name="sprout-outline"
                  size={16}
                  color={theme.primaryGreen}
                />
                <Text style={[styles.metaLabel, { color: theme.textMuted }]}>
                  {t('landHolding')}
                </Text>
              </View>
              <Text style={[styles.metaValue, { color: theme.textPrimary }]}>
                {t('sampleLand')}
              </Text>
            </View>
          </View>
        </View>

        {/* 2. App Language Section (Dropdown) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View
              style={[
                styles.sectionIconBadge,
                { backgroundColor: theme.primaryGreenBg },
              ]}
            >
              <Ionicons
                name="language"
                size={18}
                color={theme.primaryGreen}
              />
            </View>
            <View>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                {t('appLanguage')}
              </Text>
              <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>
                {t('languageSubtitle')}
              </Text>
            </View>
          </View>

          {/* Expandable Dropdown Component */}
          <LanguageDropdown theme={theme} />
        </View>

        {/* 3. Theme Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View
              style={[
                styles.sectionIconBadge,
                { backgroundColor: theme.primaryGreenBg },
              ]}
            >
              <Ionicons
                name="color-palette-outline"
                size={18}
                color={theme.primaryGreen}
              />
            </View>
            <View>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                {t('theme')}
              </Text>
              <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>
                {t('themeSubtitle')}
              </Text>
            </View>
          </View>

          <View style={styles.optionsList}>
            {/* Light Theme */}
            <Pressable
              style={[
                styles.optionCard,
                {
                  backgroundColor: theme.surface,
                  borderColor:
                    themeMode === 'light'
                      ? theme.primaryGreen
                      : theme.border,
                },
                themeMode === 'light' && {
                  backgroundColor: theme.primaryGreenBg,
                },
              ]}
              onPress={() => setThemeMode('light')}
              accessibilityRole="radio"
              accessibilityState={{ selected: themeMode === 'light' }}
            >
              <View style={styles.themeOptionRow}>
                <View
                  style={[
                    styles.themeIconWrapper,
                    {
                      backgroundColor: theme.isDark ? '#2B322D' : '#FEF3C7',
                    },
                  ]}
                >
                  <Ionicons
                    name="sunny"
                    size={20}
                    color="#D97706"
                  />
                </View>
                <View style={styles.themeTextContainer}>
                  <Text
                    style={[
                      styles.themeOptionTitle,
                      { color: theme.textPrimary },
                      themeMode === 'light' && {
                        color: theme.primaryGreen,
                        fontWeight: '700',
                      },
                    ]}
                  >
                    {t('themeLight')}
                  </Text>
                  <Text
                    style={[
                      styles.themeOptionDesc,
                      { color: theme.textMuted },
                    ]}
                  >
                    {t('themeLightDesc')}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.radioCircle,
                  {
                    borderColor:
                      themeMode === 'light'
                        ? theme.primaryGreen
                        : theme.borderSubtle,
                  },
                  themeMode === 'light' && {
                    backgroundColor: theme.primaryGreen,
                  },
                ]}
              >
                {themeMode === 'light' && (
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                )}
              </View>
            </Pressable>

            {/* Dark Theme */}
            <Pressable
              style={[
                styles.optionCard,
                {
                  backgroundColor: theme.surface,
                  borderColor:
                    themeMode === 'dark'
                      ? theme.primaryGreen
                      : theme.border,
                },
                themeMode === 'dark' && {
                  backgroundColor: theme.primaryGreenBg,
                },
              ]}
              onPress={() => setThemeMode('dark')}
              accessibilityRole="radio"
              accessibilityState={{ selected: themeMode === 'dark' }}
            >
              <View style={styles.themeOptionRow}>
                <View
                  style={[
                    styles.themeIconWrapper,
                    {
                      backgroundColor: theme.isDark ? '#2B322D' : '#EDE9FE',
                    },
                  ]}
                >
                  <Ionicons
                    name="moon"
                    size={19}
                    color="#7C3AED"
                  />
                </View>
                <View style={styles.themeTextContainer}>
                  <Text
                    style={[
                      styles.themeOptionTitle,
                      { color: theme.textPrimary },
                      themeMode === 'dark' && {
                        color: theme.primaryGreen,
                        fontWeight: '700',
                      },
                    ]}
                  >
                    {t('themeDark')}
                  </Text>
                  <Text
                    style={[
                      styles.themeOptionDesc,
                      { color: theme.textMuted },
                    ]}
                  >
                    {t('themeDarkDesc')}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.radioCircle,
                  {
                    borderColor:
                      themeMode === 'dark'
                        ? theme.primaryGreen
                        : theme.borderSubtle,
                  },
                  themeMode === 'dark' && {
                    backgroundColor: theme.primaryGreen,
                  },
                ]}
              >
                {themeMode === 'dark' && (
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                )}
              </View>
            </Pressable>

            {/* System Default */}
            <Pressable
              style={[
                styles.optionCard,
                {
                  backgroundColor: theme.surface,
                  borderColor:
                    themeMode === 'system'
                      ? theme.primaryGreen
                      : theme.border,
                },
                themeMode === 'system' && {
                  backgroundColor: theme.primaryGreenBg,
                },
              ]}
              onPress={() => setThemeMode('system')}
              accessibilityRole="radio"
              accessibilityState={{ selected: themeMode === 'system' }}
            >
              <View style={styles.themeOptionRow}>
                <View
                  style={[
                    styles.themeIconWrapper,
                    {
                      backgroundColor: theme.isDark ? '#2B322D' : '#E0E7FF',
                    },
                  ]}
                >
                  <Ionicons
                    name="phone-portrait-outline"
                    size={19}
                    color="#4F46E5"
                  />
                </View>
                <View style={styles.themeTextContainer}>
                  <Text
                    style={[
                      styles.themeOptionTitle,
                      { color: theme.textPrimary },
                      themeMode === 'system' && {
                        color: theme.primaryGreen,
                        fontWeight: '700',
                      },
                    ]}
                  >
                    {t('themeSystem')}
                  </Text>
                  <Text
                    style={[
                      styles.themeOptionDesc,
                      { color: theme.textMuted },
                    ]}
                  >
                    {t('themeSystemDesc')}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.radioCircle,
                  {
                    borderColor:
                      themeMode === 'system'
                        ? theme.primaryGreen
                        : theme.borderSubtle,
                  },
                  themeMode === 'system' && {
                    backgroundColor: theme.primaryGreen,
                  },
                ]}
              >
                {themeMode === 'system' && (
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                )}
              </View>
            </Pressable>
          </View>
        </View>

        {/* 4. Footer & Version Information */}
        <View style={styles.footer}>
          <Text style={[styles.footerVersion, { color: theme.textMuted }]}>
            {t('version')}
          </Text>
          <Text style={[styles.footerTagline, { color: theme.textMuted }]}>
            {t('footerTagline')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headerRightPlaceholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 36,
    maxWidth: 540,
    alignSelf: 'center',
    width: '100%',
    gap: 20,
  },

  /* Card General */
  card: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },

  /* Profile Header */
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
  },
  profileSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },

  /* Meta details */
  metaContainer: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    gap: 10,
  },
  metaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  metaDivider: {
    height: 1,
    width: '100%',
  },

  /* Sections */
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 4,
  },
  sectionIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  optionsList: {
    gap: 10,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Theme options */
  themeOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  themeIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeTextContainer: {
    flex: 1,
  },
  themeOptionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  themeOptionDesc: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 2,
  },

  /* Footer */
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 4,
  },
  footerVersion: {
    fontSize: 12,
    fontWeight: '600',
  },
  footerTagline: {
    fontSize: 11,
    fontWeight: '500',
  },
});
