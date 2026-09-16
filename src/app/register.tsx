import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSettings } from '@/context/settings-context';
import { useFarmer } from '@/context/farmer-context';
import { useFarmerLocation } from '@/context/location-context';
import type { AppThemePalette } from '@/constants/theme';

const CROP_OPTIONS = ['Wheat', 'Paddy', 'Mustard', 'Moong', 'Cotton', 'Maize', 'Sugarcane'];

export default function RegisterScreen() {
  const router = useRouter();
  const { theme, t } = useSettings();
  const { registerFarmer } = useFarmer();
  const { location, isLoading: isLocationLoading, fetchCurrentLocation } = useFarmerLocation();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-detect location as part of registration, once -- the whole point
  // of using the existing GPS system here instead of a typed field. If the
  // farmer already has an auto-detected location from a previous session,
  // don't re-prompt for permission on every registration screen visit.
  useEffect(() => {
    if (!location.isAutoDetected) {
      fetchCurrentLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleCrop = (crop: string) => {
    setSelectedCrops((prev) =>
      prev.includes(crop) ? prev.filter((c) => c !== crop) : [...prev, crop]
    );
  };

  const isPhoneValid = /^[6-9]\d{9}$/.test(phone.trim());
  const canSubmit = name.trim().length > 1 && isPhoneValid && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      // Village/district are NOT collected here -- they live entirely in
      // location-context (useFarmerLocation), already fetched above via
      // real GPS + reverse geocoding, already persisted on its own.
      await registerFarmer({
        name: name.trim(),
        phone: phone.trim(),
        primaryCrops: selectedCrops,
      });
      router.replace('/');
    } catch (error) {
      Alert.alert(t('registerErrorTitle'), t('registerErrorBody'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
      edges={['top', 'left', 'right']}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerBlock}>
            <View
              style={[
                styles.avatarCircle,
                { backgroundColor: theme.primaryGreenBg, borderColor: theme.primaryGreen },
              ]}
            >
              <Ionicons name="person-add" size={30} color={theme.primaryGreen} />
            </View>
            <Text style={[styles.title, { color: theme.textPrimary }]}>
              {t('registerTitle')}
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {t('registerSubtitle')}
            </Text>
          </View>

          <View
            style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <Field
              label={t('fieldName')}
              value={name}
              onChangeText={setName}
              placeholder={t('fieldNamePlaceholder')}
              theme={theme}
            />

            <Field
              label={t('fieldPhone')}
              value={phone}
              onChangeText={(v) => setPhone(v.replace(/[^0-9]/g, '').slice(0, 10))}
              placeholder={t('fieldPhonePlaceholder')}
              keyboardType="phone-pad"
              theme={theme}
              helperText={
                phone.length > 0 && !isPhoneValid ? t('fieldPhoneInvalid') : undefined
              }
            />

            {/* Location: read-only, filled from real GPS -- not typed */}
            <View style={styles.fieldBlock}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                {t('fieldLocation')}
              </Text>
              <Pressable
                onPress={fetchCurrentLocation}
                style={[
                  styles.locationBox,
                  { backgroundColor: theme.background, borderColor: theme.border },
                ]}
              >
                <Ionicons name="location" size={18} color={theme.primaryGreen} />
                {isLocationLoading ? (
                  <ActivityIndicator size="small" color={theme.primaryGreen} style={{ marginLeft: 8 }} />
                ) : (
                  <Text style={[styles.locationText, { color: theme.textPrimary }]} numberOfLines={1}>
                    {location.city}, {location.district ? `${location.district}, ` : ''}{location.state}
                  </Text>
                )}
                <Ionicons
                  name="refresh"
                  size={16}
                  color={theme.textMuted}
                  style={styles.locationRefreshIcon}
                />
              </Pressable>
              <Text style={[styles.helperText, { color: theme.textMuted }]}>
                {location.isAutoDetected ? t('fieldLocationDetected') : t('fieldLocationTapToDetect')}
              </Text>
            </View>

            <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginTop: 4 }]}>
              {t('fieldCrops')}
            </Text>
            <View style={styles.cropChipsRow}>
              {CROP_OPTIONS.map((crop) => {
                const active = selectedCrops.includes(crop);
                return (
                  <Pressable
                    key={crop}
                    onPress={() => toggleCrop(crop)}
                    style={[
                      styles.cropChip,
                      {
                        backgroundColor: active ? theme.primaryGreenBg : theme.background,
                        borderColor: active ? theme.primaryGreen : theme.border,
                      },
                    ]}
                  >
                    {active && (
                      <MaterialCommunityIcons
                        name="check"
                        size={14}
                        color={theme.primaryGreen}
                        style={{ marginRight: 4 }}
                      />
                    )}
                    <Text
                      style={{
                        color: active ? theme.primaryGreenDark : theme.textSecondary,
                        fontSize: 13,
                        fontWeight: active ? '700' : '500',
                      }}
                    >
                      {crop}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit}
            style={[
              styles.submitButton,
              { backgroundColor: canSubmit ? theme.primaryGreen : theme.border },
            ]}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? t('registerSubmitting') : t('registerSubmit')}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  theme,
  keyboardType,
  helperText,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  theme: AppThemePalette;
  keyboardType?: 'default' | 'phone-pad';
  helperText?: string;
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        keyboardType={keyboardType ?? 'default'}
        style={[
          styles.input,
          {
            backgroundColor: theme.background,
            borderColor: theme.border,
            color: theme.textPrimary,
          },
        ]}
      />
      {helperText && (
        <Text style={[styles.helperText, { color: theme.micCoral }]}>{helperText}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 36,
    maxWidth: 540,
    alignSelf: 'center',
    width: '100%',
    gap: 20,
  },
  headerBlock: { alignItems: 'center', gap: 6, marginBottom: 4 },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: { fontSize: 20, fontWeight: '700', letterSpacing: -0.2 },
  subtitle: { fontSize: 14, textAlign: 'center', paddingHorizontal: 12 },
  card: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  fieldBlock: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  locationText: { flex: 1, fontSize: 15 },
  locationRefreshIcon: { marginLeft: 4 },
  helperText: { fontSize: 12 },
  cropChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cropChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  submitButton: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
