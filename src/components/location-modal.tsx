import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFarmerLocation } from '@/context/location-context';
import { useSettings } from '@/context/settings-context';
import { AppThemePalette } from '@/constants/theme';
import {
  POPULAR_INDIAN_LOCATIONS,
  IndianLocationItem,
} from '@/constants/locations';

interface LocationModalProps {
  visible: boolean;
  onClose: () => void;
  theme: AppThemePalette;
}

export function LocationModal({ visible, onClose, theme }: LocationModalProps) {
  const { t } = useSettings();
  const {
    location,
    isLoading: isGpsLoading,
    fetchCurrentLocation,
    setManualLocation,
  } = useFarmerLocation();

  const [searchQuery, setSearchQuery] = useState('');

  const handleGpsSelect = async () => {
    const res = await fetchCurrentLocation();
    if (res) {
      onClose();
    }
  };

  const handleSelectLocationItem = (item: IndianLocationItem) => {
    setManualLocation({
      city: item.city,
      district: item.district,
      state: item.state,
      latitude: item.latitude,
      longitude: item.longitude,
      formattedAddress: `${item.city}, ${item.state}`,
      isAutoDetected: false,
    });
    setSearchQuery('');
    onClose();
  };

  const handleCustomSubmit = () => {
    if (!searchQuery.trim()) return;
    const parts = searchQuery.split(',').map((p) => p.trim());
    const city = parts[0] || searchQuery.trim();
    const state = parts[1] || 'India';

    setManualLocation({
      city: city,
      district: city,
      state: state,
      formattedAddress: searchQuery.includes(',')
        ? searchQuery.trim()
        : `${city}, India`,
      isAutoDetected: false,
    });
    setSearchQuery('');
    onClose();
  };

  const filteredLocations = POPULAR_INDIAN_LOCATIONS.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.city.toLowerCase().includes(q) ||
      item.district.toLowerCase().includes(q) ||
      item.state.toLowerCase().includes(q) ||
      item.region.toLowerCase().includes(q)
    );
  });

  const popularChips = [
    'Noida',
    'Nagpur',
    'Ludhiana',
    'Indore',
    'Jaipur',
    'Ahmedabad',
    'Patna',
    'Nashik',
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[styles.modalSafeArea, { backgroundColor: theme.background }]}
      >
        {/* Header */}
        <View
          style={[
            styles.modalHeader,
            {
              backgroundColor: theme.surface,
              borderBottomColor: theme.border,
            },
          ]}
        >
          <View>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
              {t('selectFarmLocation')}
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.textMuted }]}>
              {t('locationSubtitle')}
            </Text>
          </View>
          <Pressable
            style={[
              styles.closeBtn,
              {
                backgroundColor: theme.isDark ? '#272E29' : '#F3F4F6',
              },
            ]}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close location modal"
          >
            <Ionicons name="close" size={22} color={theme.textPrimary} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.modalScroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 1. GPS Auto-Detect Button */}
          <Pressable
            style={[
              styles.gpsButton,
              {
                backgroundColor: theme.primaryGreenBg,
                borderColor: theme.primaryGreen,
              },
            ]}
            onPress={handleGpsSelect}
            disabled={isGpsLoading}
          >
            <View style={styles.gpsButtonLeft}>
              <View
                style={[
                  styles.gpsIconBadge,
                  { backgroundColor: theme.primaryGreen },
                ]}
              >
                {isGpsLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="locate" size={22} color="#FFFFFF" />
                )}
              </View>
              <View style={styles.gpsTextCol}>
                <Text
                  style={[styles.gpsButtonTitle, { color: theme.primaryGreen }]}
                >
                  {t('useCurrentGps')}
                </Text>
                <Text style={[styles.gpsButtonSub, { color: theme.textMuted }]}>
                  {isGpsLoading
                    ? t('detectingGps')
                    : t('autoDetectGps')}
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.primaryGreen}
            />
          </Pressable>

          {/* Current Selected Location Card */}
          <View
            style={[
              styles.currentLocationCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.currentLocLeft}>
              <Ionicons
                name="pin"
                size={20}
                color={theme.primaryGreen}
              />
              <View>
                <Text
                  style={[styles.currentLocLabel, { color: theme.textMuted }]}
                >
                  {t('currentActiveLoc')}
                </Text>
                <Text
                  style={[styles.currentLocValue, { color: theme.textPrimary }]}
                >
                  {location.formattedAddress}
                </Text>
              </View>
            </View>
            {location.isAutoDetected && (
              <View
                style={[
                  styles.gpsActiveBadge,
                  { backgroundColor: theme.primaryGreenBg },
                ]}
              >
                <Text
                  style={[
                    styles.gpsActiveText,
                    { color: theme.primaryGreen },
                  ]}
                >
                  {t('gpsActive')}
                </Text>
              </View>
            )}
          </View>

          {/* 2. Manual Search Input */}
          <View style={styles.searchSection}>
            <Text
              style={[styles.searchSectionTitle, { color: theme.textPrimary }]}>
              {t('orSearchCity')}
            </Text>

            <View
              style={[
                styles.searchInputWrapper,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <Ionicons
                name="search"
                size={18}
                color={theme.textMuted}
                style={styles.searchIcon}
              />
              <TextInput
                style={[styles.searchInput, { color: theme.textPrimary }]}
                placeholder={t('searchCityPlaceholder')}
                placeholderTextColor={theme.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
                onSubmitEditing={handleCustomSubmit}
                clearButtonMode="while-editing"
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={theme.textMuted}
                  />
                </Pressable>
              )}
            </View>
          </View>

          {/* Quick Popular Chips */}
          <View style={styles.chipsSection}>
            <Text style={[styles.chipsTitle, { color: theme.textMuted }]}>
              {t('popularAgriHubs')}
            </Text>
            <View style={styles.chipsRow}>
              {popularChips.map((chip) => {
                const isSelected =
                  location.city.toLowerCase() === chip.toLowerCase();
                return (
                  <Pressable
                    key={chip}
                    style={[
                      styles.chipItem,
                      {
                        backgroundColor: isSelected
                          ? theme.primaryGreenBg
                          : theme.surface,
                        borderColor: isSelected
                          ? theme.primaryGreen
                          : theme.border,
                      },
                    ]}
                    onPress={() => {
                      const found = POPULAR_INDIAN_LOCATIONS.find(
                        (l) => l.city.toLowerCase() === chip.toLowerCase()
                      );
                      if (found) {
                        handleSelectLocationItem(found);
                      } else {
                        setSearchQuery(chip);
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        {
                          color: isSelected
                            ? theme.primaryGreen
                            : theme.textPrimary,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {chip}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Results List */}
          <View style={styles.resultsSection}>
            <Text style={[styles.resultsTitle, { color: theme.textPrimary }]}>
              {searchQuery.trim()
                ? `Results for "${searchQuery}" (${filteredLocations.length})`
                : t('allMajorDistricts')}
            </Text>

            <View style={styles.locationsList}>
              {filteredLocations.map((item) => {
                const isCurrent =
                  location.city.toLowerCase() === item.city.toLowerCase() &&
                  location.state.toLowerCase() === item.state.toLowerCase();

                return (
                  <Pressable
                    key={item.id}
                    style={[
                      styles.locationRow,
                      {
                        backgroundColor: theme.surface,
                        borderColor: isCurrent
                          ? theme.primaryGreen
                          : theme.border,
                      },
                      isCurrent && {
                        backgroundColor: theme.primaryGreenBg,
                        borderWidth: 1.5,
                      },
                    ]}
                    onPress={() => handleSelectLocationItem(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`${item.city}, ${item.state}`}
                  >
                    <View style={styles.locRowLeft}>
                      <View
                        style={[
                          styles.locRowIcon,
                          {
                            backgroundColor: isCurrent
                              ? theme.primaryGreen
                              : theme.isDark
                              ? '#272E29'
                              : '#F0F7F2',
                          },
                        ]}
                      >
                        <Ionicons
                          name="location-sharp"
                          size={18}
                          color={
                            isCurrent ? '#FFFFFF' : theme.primaryGreen
                          }
                        />
                      </View>
                      <View>
                        <View style={styles.locRowNameRow}>
                          <Text
                            style={[
                              styles.locRowCity,
                              { color: theme.textPrimary },
                              isCurrent && {
                                color: theme.primaryGreen,
                                fontWeight: '700',
                              },
                            ]}
                          >
                            {item.city}
                          </Text>
                          <Text
                            style={[
                              styles.locRowRegion,
                              { color: theme.textMuted },
                            ]}
                          >
                            • {item.region}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.locRowDistrict,
                            { color: theme.textMuted },
                          ]}
                        >
                          {item.district}, {item.state}
                        </Text>
                      </View>
                    </View>

                    {isCurrent ? (
                      <View
                        style={[
                          styles.checkedCircle,
                          { backgroundColor: theme.primaryGreen },
                        ]}
                      >
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      </View>
                    ) : (
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={theme.textMuted}
                      />
                    )}
                  </Pressable>
                );
              })}

              {/* If no exact match, allow saving custom entered location */}
              {searchQuery.trim().length > 1 && filteredLocations.length === 0 && (
                <Pressable
                  style={[
                    styles.customAddBtn,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.primaryGreen,
                    },
                  ]}
                  onPress={handleCustomSubmit}
                >
                  <Ionicons
                    name="add-circle"
                    size={22}
                    color={theme.primaryGreen}
                  />
                  <View style={styles.customAddTextCol}>
                    <Text
                      style={[
                        styles.customAddTitle,
                        { color: theme.primaryGreen },
                      ]}
                    >
                      {t('useCustomLocBtn')}
                    </Text>
                    <Text
                      style={[
                        styles.customAddSub,
                        { color: theme.textMuted },
                      ]}
                    >
                      {t('tapToSetFarmLoc')}
                    </Text>
                  </View>
                </Pressable>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalSafeArea: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 36,
    maxWidth: 540,
    alignSelf: 'center',
    width: '100%',
  },

  /* GPS button */
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  gpsButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  gpsIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gpsTextCol: {
    flex: 1,
  },
  gpsButtonTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  gpsButtonSub: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },

  /* Current Location Card */
  currentLocationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  currentLocLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  currentLocLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  currentLocValue: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 1,
  },
  gpsActiveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  gpsActiveText: {
    fontSize: 10,
    fontWeight: '700',
  },

  /* Search input */
  searchSection: {
    gap: 8,
  },
  searchSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  searchIcon: {
    marginRight: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },

  /* Chips */
  chipsSection: {
    gap: 8,
  },
  chipsTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
  },

  /* Results */
  resultsSection: {
    gap: 10,
    marginTop: 4,
  },
  resultsTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  locationsList: {
    gap: 10,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  locRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  locRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locRowNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locRowCity: {
    fontSize: 14,
    fontWeight: '600',
  },
  locRowRegion: {
    fontSize: 11,
  },
  locRowDistrict: {
    fontSize: 12,
    marginTop: 2,
  },
  checkedCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  customAddTextCol: {
    flex: 1,
  },
  customAddTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  customAddSub: {
    fontSize: 12,
    marginTop: 2,
  },
});
