import React, { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Ionicons,
  MaterialCommunityIcons,
} from '@expo/vector-icons';
import { useSettings } from '@/context/settings-context';
import { useFarmerLocation } from '@/context/location-context';
import {
  getAllDatasetStates,
  getDistrictsForState,
  getMandisFromDataset,
  getNearbyMandisFromDataset,
  MandiDatasetItem,
} from '@/constants/mandis';
import { LocationModal } from '@/components/location-modal';
import { AppThemePalette } from '@/constants/theme';

interface MandiCardProps {
  mandi: MandiDatasetItem;
  theme: AppThemePalette;
  onCall: (contact: string, name: string) => void;
  onDirections: (mandi: MandiDatasetItem) => void;
  onBook: (mandi: MandiDatasetItem) => void;
  bookBtnText: string;
  directionsBtnText: string;
  badgeText?: string;
  defaultStateName?: string;
}

const MandiCard = React.memo(function MandiCard({
  mandi,
  theme,
  onCall,
  onDirections,
  onBook,
  bookBtnText,
  directionsBtnText,
  badgeText = 'Govt',
  defaultStateName,
}: MandiCardProps) {
  const displayState = mandi.state || defaultStateName || 'India';

  return (
    <View
      style={[
        styles.mandiCard,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}
    >
      {/* Mandi Card Top */}
      <View style={styles.mandiCardHeader}>
        <View style={styles.mandiNameCol}>
          <Text style={[styles.mandiNameText, { color: theme.textPrimary }]}>
            {mandi.mandi} APMC Mandi
          </Text>
          <View style={styles.mandiTagRow}>
            <View
              style={[
                styles.distTag,
                {
                  backgroundColor: theme.isDark ? '#1C2E22' : '#EBF7EE',
                },
              ]}
            >
              <Text
                style={[styles.distTagText, { color: theme.primaryGreen }]}
              >
                {mandi.district || 'APMC'}
              </Text>
            </View>
            <View
              style={[
                styles.stateTag,
                {
                  backgroundColor: theme.isDark ? '#26282E' : '#F1F3F9',
                },
              ]}
            >
              <Text style={[styles.stateTagText, { color: theme.textMuted }]}>
                {displayState}
              </Text>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.verifiedGovtBadge,
            { backgroundColor: theme.primaryGreenBg },
          ]}
        >
          <MaterialCommunityIcons
            name="check-decagram"
            size={14}
            color={theme.primaryGreen}
          />
          <Text
            style={[styles.verifiedGovtText, { color: theme.primaryGreen }]}
          >
            {badgeText}
          </Text>
        </View>
      </View>

      {/* Postal Address (Tap to open Directions) */}
      {Boolean(mandi.postal_address) && (
        <Pressable
          style={styles.addressRow}
          onPress={() => onDirections(mandi)}
          accessibilityRole="button"
          accessibilityLabel={`Open directions to ${mandi.mandi}`}
        >
          <Ionicons
            name="location"
            size={15}
            color={theme.primaryGreen}
            style={styles.addressIcon}
          />
          <Text
            style={[styles.addressText, { color: theme.textSecondary }]}
            numberOfLines={2}
          >
            {mandi.postal_address}
          </Text>
          <Ionicons
            name="open-outline"
            size={13}
            color={theme.primaryGreen}
            style={styles.addressOpenIcon}
          />
        </Pressable>
      )}

      {/* Divider */}
      <View style={[styles.cardDivider, { backgroundColor: theme.border }]} />

      {/* Actions: Call, Directions, Book Slot */}
      <View style={styles.cardActionsRow}>
        {Boolean(mandi.contact_number) && (
          <Pressable
            style={[
              styles.actionBtn,
              styles.callBtn,
              {
                backgroundColor: theme.isDark ? '#242B27' : '#F0FDF4',
                borderColor: theme.primaryGreen,
              },
            ]}
            onPress={() => onCall(mandi.contact_number, mandi.mandi)}
            accessibilityRole="button"
            accessibilityLabel={`Call ${mandi.mandi}`}
          >
            <Ionicons name="call" size={13} color={theme.primaryGreen} />
            <Text
              style={[styles.callBtnText, { color: theme.primaryGreen }]}
              numberOfLines={1}
            >
              {mandi.contact_number}
            </Text>
          </Pressable>
        )}

        <Pressable
          style={[
            styles.actionBtn,
            styles.directionsBtn,
            {
              backgroundColor: theme.isDark ? '#1E293B' : '#EFF6FF',
              borderColor: '#3B82F6',
            },
          ]}
          onPress={() => onDirections(mandi)}
          accessibilityRole="button"
          accessibilityLabel={`Directions to ${mandi.mandi}`}
        >
          <Ionicons name="navigate" size={13} color="#2563EB" />
          <Text style={[styles.directionsBtnText, { color: '#2563EB' }]}>
            {directionsBtnText}
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.actionBtn,
            styles.bookSlotBtn,
            { backgroundColor: theme.primaryGreen },
          ]}
          onPress={() => onBook(mandi)}
          accessibilityRole="button"
          accessibilityLabel={`Book Slot for ${mandi.mandi}`}
        >
          <Ionicons name="calendar-outline" size={13} color="#FFFFFF" />
          <Text style={styles.bookSlotBtnText}>{bookBtnText}</Text>
        </Pressable>
      </View>
    </View>
  );
});

export default function NearbyMandisScreen() {
  const router = useRouter();
  const { theme, t } = useSettings();
  const { location } = useFarmerLocation();

  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const [isFindMandiModalVisible, setIsFindMandiModalVisible] = useState(false);

  // States list strictly from mandis.json
  const availableStates = useMemo(() => getAllDatasetStates(), []);

  // Initial State matching farmer's location or default
  const [selectedState, setSelectedState] = useState<string>(() => {
    if (location.state) {
      const match = availableStates.find(
        (s) =>
          s.toLowerCase() === location.state.toLowerCase() ||
          location.state.toLowerCase().includes(s.toLowerCase()) ||
          s.toLowerCase().includes(location.state.toLowerCase())
      );
      if (match) return match;
    }
    return (
      availableStates.find((s) => s.toLowerCase() === 'maharashtra') ||
      availableStates[0] ||
      'Maharashtra'
    );
  });

  const availableDistricts = useMemo(() => {
    return getDistrictsForState(selectedState);
  }, [selectedState]);

  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [visibleLimit, setVisibleLimit] = useState<number>(15);

  // Pickers for State / District dropdowns
  const [isStatePickerVisible, setIsStatePickerVisible] = useState(false);
  const [isDistrictPickerVisible, setIsDistrictPickerVisible] = useState(false);
  const [stateSearchText, setStateSearchText] = useState('');
  const [districtSearchText, setDistrictSearchText] = useState('');

  // 1. Mandis Near You (from dataset matching user location)
  const nearbyMandis = useMemo(() => {
    const list = getNearbyMandisFromDataset(
      location.state,
      location.district,
      location.city
    );
    return list.slice(0, 10);
  }, [location.state, location.district, location.city]);

  // 2. Filtered Mandis for "Find a Mandi" modal
  const allFilteredMandis = useMemo(() => {
    return getMandisFromDataset(
      selectedState,
      selectedDistrict,
      searchQuery
    );
  }, [selectedState, selectedDistrict, searchQuery]);

  // Sliced for performance
  const renderedMandis = useMemo(() => {
    return allFilteredMandis.slice(0, visibleLimit);
  }, [allFilteredMandis, visibleLimit]);

  const hasMore = renderedMandis.length < allFilteredMandis.length;

  const handleStateChange = (stateName: string) => {
    setSelectedState(stateName);
    setSelectedDistrict('ALL');
    setVisibleLimit(15);
    setIsStatePickerVisible(false);
    setStateSearchText('');
  };

  const handleDistrictChange = (dist: string) => {
    setSelectedDistrict(dist);
    setVisibleLimit(15);
    setIsDistrictPickerVisible(false);
    setDistrictSearchText('');
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setVisibleLimit(15);
  };

  const handleLoadMore = () => {
    setVisibleLimit((prev) => prev + 15);
  };

  const handleCallMandi = useCallback(
    (contactNumber: string, mandiName: string) => {
      const cleanNum = contactNumber.replace(/[^0-9]/g, '');
      if (!cleanNum || cleanNum.length < 5) {
        Alert.alert(
          mandiName,
          `${t('contactNumberLabel')} ${contactNumber || '1800-180-1551'}`
        );
        return;
      }

      const telUrl = `tel:${cleanNum}`;
      Linking.canOpenURL(telUrl)
        .then((supported) => {
          if (supported) {
            Linking.openURL(telUrl);
          } else {
            Alert.alert(
              mandiName,
              `${t('contactNumberLabel')} ${contactNumber}`
            );
          }
        })
        .catch(() => {
          Alert.alert(mandiName, `${t('contactNumberLabel')} ${contactNumber}`);
        });
    },
    [t]
  );

  const handleOpenDirections = useCallback((mandi: MandiDatasetItem) => {
    const destQuery = `${mandi.mandi} APMC Mandi, ${mandi.postal_address || `${mandi.district}, ${mandi.state || ''}`}`;
    const encodedDest = encodeURIComponent(destQuery.trim());

    // Official Google Maps Route Overview URL (shows the route & distance on map without auto-starting navigation)
    const routeOverviewUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedDest}`;

    Linking.openURL(routeOverviewUrl).catch(() => {
      // Fallback to location search pin if needed
      const searchUrl = `https://www.google.com/maps/search/?api=1&query=${encodedDest}`;
      Linking.openURL(searchUrl).catch((err) => {
        console.warn('Could not open maps:', err);
      });
    });
  }, []);

  const handleBookSlot = useCallback(
    (_mandi: MandiDatasetItem) => {
      setIsFindMandiModalVisible(false);
      router.push('/slots');
    },
    [router]
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
      edges={['top', 'left', 'right']}
    >
      {/* Top Header */}
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
          style={styles.backBtn}
          onPress={() => router.push('/')}
          accessibilityRole="button"
          accessibilityLabel="Back to Home"
        >
          <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
        </Pressable>

        <View style={styles.headerTitleCenter}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            {t('nearbyMandisTitle')}
          </Text>
          <Text style={[styles.headerSub, { color: theme.primaryGreen }]}>
            {t('findGovernmentMandis')}
          </Text>
        </View>

        <View style={styles.headerRightSpace} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ========================================================= */}
        {/* MANDIS NEAR YOU SECTION WITH "FIND A MANDI" BUTTON ON RIGHT */}
        {/* ========================================================= */}
        <View style={styles.categorySection}>
          {/* Section Header with "Find a Mandi" Button on Right */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleLeft}>
              <View
                style={[
                  styles.categoryBadgeIcon,
                  { backgroundColor: theme.primaryGreenBg },
                ]}
              >
                <Ionicons
                  name="navigate-circle"
                  size={22}
                  color={theme.primaryGreen}
                />
              </View>
              <View style={styles.categoryTitleWrapper}>
                <Text
                  style={[styles.categoryTitle, { color: theme.textPrimary }]}
                >
                  {t('mandisNearYou')}
                </Text>
                <Text
                  style={[styles.categorySub, { color: theme.textMuted }]}
                  numberOfLines={1}
                >
                  {t('mandisClosestTo')}{' '}
                  {location.city || location.district || 'Nagpur'}
                </Text>
              </View>
            </View>

            {/* Find a Mandi Button on the Right */}
            <Pressable
              style={[
                styles.findMandiHeaderBtn,
                { backgroundColor: theme.primaryGreen },
              ]}
              onPress={() => setIsFindMandiModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Find a Mandi in other states and districts"
            >
              <Ionicons name="search" size={15} color="#FFFFFF" />
              <Text style={styles.findMandiHeaderBtnText}>
                {t('findMandiBtn')}
              </Text>
            </Pressable>
          </View>

          {/* Location Banner */}
          <View
            style={[
              styles.locationBanner,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.locationBannerLeft}>
              <Ionicons name="location" size={18} color={theme.primaryGreen} />
              <View style={styles.locationBannerTextCol}>
                <Text
                  style={[
                    styles.locationBannerAddress,
                    { color: theme.textPrimary },
                  ]}
                  numberOfLines={1}
                >
                  {location.formattedAddress}
                </Text>
              </View>
            </View>

            <Pressable
              style={[
                styles.changeLocationBtn,
                { backgroundColor: theme.primaryGreenBg },
              ]}
              onPress={() => setIsLocationModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Change Location"
            >
              <Text
                style={[
                  styles.changeLocationBtnText,
                  { color: theme.primaryGreen },
                ]}
              >
                {t('changeLocation')}
              </Text>
            </Pressable>
          </View>

          {/* Near You Mandis List */}
          <View style={styles.mandisList}>
            {nearbyMandis.map((mandi, idx) => (
              <MandiCard
                key={`near_${mandi.mandi}_${idx}`}
                mandi={mandi}
                theme={theme}
                onCall={handleCallMandi}
                onDirections={handleOpenDirections}
                onBook={handleBookSlot}
                bookBtnText={t('bookDeliverySlot')}
                directionsBtnText={t('getDirections')}
                badgeText="Govt"
                defaultStateName={location.state}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* ========================================================= */}
      {/* "FIND A MANDI" MODAL (STATE & DISTRICT STRICTLY DATASET)   */}
      {/* ========================================================= */}
      <Modal
        visible={isFindMandiModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsFindMandiModalVisible(false)}
      >
        <SafeAreaView
          style={[
            styles.modalSafeArea,
            { backgroundColor: theme.background },
          ]}
          edges={['top', 'left', 'right']}
        >
          {/* Modal Header */}
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
              style={styles.backBtn}
              onPress={() => setIsFindMandiModalVisible(false)}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={24} color={theme.textPrimary} />
            </Pressable>

            <View style={styles.headerTitleCenter}>
              <Text
                style={[styles.headerTitle, { color: theme.textPrimary }]}
              >
                {t('findMandiBtn')}
              </Text>
              <Text
                style={[styles.headerSub, { color: theme.primaryGreen }]}
              >
                {t('officialGovtDirectory')}
              </Text>
            </View>

            <View style={styles.headerRightSpace} />
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Filter Card (State & District Pickers) */}
            <View
              style={[
                styles.filterCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              {/* 1. State Selector */}
              <View style={styles.pickerField}>
                <Text
                  style={[styles.fieldLabel, { color: theme.textMuted }]}
                >
                  {t('selectState')}
                </Text>
                <Pressable
                  style={[
                    styles.dropdownTrigger,
                    {
                      backgroundColor: theme.isDark ? '#202422' : '#F9FBFA',
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => setIsStatePickerVisible(true)}
                  accessibilityRole="button"
                  accessibilityLabel={`State: ${selectedState}`}
                >
                  <View style={styles.dropdownLeft}>
                    <Ionicons
                      name="business-outline"
                      size={18}
                      color={theme.primaryGreen}
                    />
                    <Text
                      style={[
                        styles.dropdownValueText,
                        { color: theme.textPrimary },
                      ]}
                    >
                      {selectedState}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-down"
                    size={18}
                    color={theme.textMuted}
                  />
                </Pressable>
              </View>

              {/* 2. District Selector (Scoped to Selected State) */}
              <View style={styles.pickerField}>
                <Text
                  style={[styles.fieldLabel, { color: theme.textMuted }]}
                >
                  {t('selectDistrict')}
                </Text>
                <Pressable
                  style={[
                    styles.dropdownTrigger,
                    {
                      backgroundColor: theme.isDark ? '#202422' : '#F9FBFA',
                      borderColor: theme.border,
                      opacity: selectedState ? 1 : 0.6,
                    },
                  ]}
                  onPress={() => {
                    if (!selectedState) {
                      setIsStatePickerVisible(true);
                    } else {
                      setIsDistrictPickerVisible(true);
                    }
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={
                    selectedState
                      ? `District: ${selectedDistrict === 'ALL' ? t('allDistricts') : selectedDistrict}`
                      : t('selectStateFirst')
                  }
                >
                  <View style={styles.dropdownLeft}>
                    <Ionicons
                      name="map-outline"
                      size={18}
                      color={selectedState ? theme.primaryGreen : theme.textMuted}
                    />
                    <Text
                      style={[
                        styles.dropdownValueText,
                        {
                          color: selectedState
                            ? theme.textPrimary
                            : theme.textMuted,
                        },
                      ]}
                    >
                      {!selectedState
                        ? t('selectStateFirst')
                        : selectedDistrict === 'ALL'
                        ? `${t('allDistricts')} (${availableDistricts.length})`
                        : selectedDistrict}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-down"
                    size={18}
                    color={theme.textMuted}
                  />
                </Pressable>
              </View>

              {/* 3. Search Bar within selected state/district */}
              <View
                style={[
                  styles.searchBar,
                  {
                    backgroundColor: theme.isDark ? '#202422' : '#F9FBFA',
                    borderColor: theme.border,
                  },
                ]}
              >
                <Ionicons
                  name="search"
                  size={18}
                  color={theme.textMuted}
                />
                <TextInput
                  style={[
                    styles.searchInput,
                    { color: theme.textPrimary },
                  ]}
                  placeholder={t('searchMandiPlaceholder')}
                  placeholderTextColor={theme.textMuted}
                  value={searchQuery}
                  onChangeText={handleSearchChange}
                  clearButtonMode="while-editing"
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => handleSearchChange('')}>
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color={theme.textMuted}
                    />
                  </Pressable>
                )}
              </View>
            </View>

            {/* Results Count Header */}
            <View style={styles.resultsHeaderRow}>
              <Text
                style={[
                  styles.resultsCountText,
                  { color: theme.textPrimary },
                ]}
              >
                {allFilteredMandis.length} {t('mandisFoundCount')}
              </Text>
              <Text
                style={[
                  styles.resultsStateTag,
                  { color: theme.primaryGreen },
                ]}
              >
                {selectedState}{' '}
                {selectedDistrict !== 'ALL' ? `• ${selectedDistrict}` : ''}
              </Text>
            </View>

            {/* Results List */}
            {allFilteredMandis.length === 0 ? (
              <View
                style={[
                  styles.emptyCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="store-search-outline"
                  size={48}
                  color={theme.textMuted}
                />
                <Text
                  style={[
                    styles.emptyTitle,
                    { color: theme.textPrimary },
                  ]}
                >
                  {t('noMandisFound')}
                </Text>
                <Pressable
                  style={[
                    styles.resetFilterBtn,
                    { backgroundColor: theme.primaryGreenBg },
                  ]}
                  onPress={() => {
                    setSelectedDistrict('ALL');
                    setSearchQuery('');
                    setVisibleLimit(15);
                  }}
                >
                  <Text
                    style={[
                      styles.resetFilterText,
                      { color: theme.primaryGreen },
                    ]}
                  >
                    {t('allDistricts')}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.mandisList}>
                {renderedMandis.map((mandi, idx) => (
                  <MandiCard
                    key={`dir_modal_${mandi.mandi}_${idx}`}
                    mandi={mandi}
                    theme={theme}
                    onCall={handleCallMandi}
                    onDirections={handleOpenDirections}
                    onBook={handleBookSlot}
                    bookBtnText={t('bookDeliverySlot')}
                    directionsBtnText={t('getDirections')}
                    badgeText="e-NAM"
                    defaultStateName={selectedState}
                  />
                ))}

                {/* Show More Button */}
                {hasMore && (
                  <Pressable
                    style={[
                      styles.loadMoreBtn,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.primaryGreen,
                      },
                    ]}
                    onPress={handleLoadMore}
                    accessibilityRole="button"
                    accessibilityLabel="Load more mandis"
                  >
                    <Text
                      style={[
                        styles.loadMoreBtnText,
                        { color: theme.primaryGreen },
                      ]}
                    >
                      {t('loadMoreMandis')} (
                      {allFilteredMandis.length - renderedMandis.length})
                    </Text>
                    <Ionicons
                      name="chevron-down"
                      size={16}
                      color={theme.primaryGreen}
                    />
                  </Pressable>
                )}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ========================================================= */}
      {/* PICKER 1: STATE SELECTION MODAL (16 States from dataset)   */}
      {/* ========================================================= */}
      <Modal
        visible={isStatePickerVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsStatePickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.pickerModalContent,
              { backgroundColor: theme.surface },
            ]}
          >
            <View style={styles.pickerModalHeader}>
              <Text
                style={[
                  styles.pickerModalTitle,
                  { color: theme.textPrimary },
                ]}
              >
                {t('selectState')} ({availableStates.length})
              </Text>
              <Pressable
                onPress={() => setIsStatePickerVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={24} color={theme.textPrimary} />
              </Pressable>
            </View>

            {/* Search state */}
            <View
              style={[
                styles.modalSearchBox,
                {
                  backgroundColor: theme.isDark ? '#202422' : '#F3F4F6',
                  borderColor: theme.border,
                },
              ]}
            >
              <Ionicons name="search" size={16} color={theme.textMuted} />
              <TextInput
                style={[
                  styles.modalSearchInput,
                  { color: theme.textPrimary },
                ]}
                placeholder="Search state..."
                placeholderTextColor={theme.textMuted}
                value={stateSearchText}
                onChangeText={setStateSearchText}
              />
            </View>

            <ScrollView style={styles.pickerList}>
              {availableStates
                .filter((s) =>
                  s.toLowerCase().includes(stateSearchText.toLowerCase())
                )
                .map((stateName) => {
                  const isSelected = selectedState === stateName;
                  return (
                    <Pressable
                      key={stateName}
                      style={[
                        styles.pickerItem,
                        { borderBottomColor: theme.border },
                        isSelected && {
                          backgroundColor: theme.primaryGreenBg,
                        },
                      ]}
                      onPress={() => handleStateChange(stateName)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          { color: theme.textPrimary },
                          isSelected && {
                            color: theme.primaryGreen,
                            fontWeight: '700',
                          },
                        ]}
                      >
                        {stateName}
                      </Text>
                      {isSelected && (
                        <Ionicons
                          name="checkmark"
                          size={20}
                          color={theme.primaryGreen}
                        />
                      )}
                    </Pressable>
                  );
                })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* PICKER 2: DISTRICT SELECTION MODAL (From dataset)          */}
      {/* ========================================================= */}
      <Modal
        visible={isDistrictPickerVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsDistrictPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.pickerModalContent,
              { backgroundColor: theme.surface },
            ]}
          >
            <View style={styles.pickerModalHeader}>
              <Text
                style={[
                  styles.pickerModalTitle,
                  { color: theme.textPrimary },
                ]}
              >
                {t('selectDistrict')} - {selectedState}
              </Text>
              <Pressable
                onPress={() => setIsDistrictPickerVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={24} color={theme.textPrimary} />
              </Pressable>
            </View>

            {/* Search district */}
            <View
              style={[
                styles.modalSearchBox,
                {
                  backgroundColor: theme.isDark ? '#202422' : '#F3F4F6',
                  borderColor: theme.border,
                },
              ]}
            >
              <Ionicons name="search" size={16} color={theme.textMuted} />
              <TextInput
                style={[
                  styles.modalSearchInput,
                  { color: theme.textPrimary },
                ]}
                placeholder="Search district..."
                placeholderTextColor={theme.textMuted}
                value={districtSearchText}
                onChangeText={setDistrictSearchText}
              />
            </View>

            <ScrollView style={styles.pickerList}>
              {/* ALL DISTRICTS */}
              <Pressable
                style={[
                  styles.pickerItem,
                  { borderBottomColor: theme.border },
                  selectedDistrict === 'ALL' && {
                    backgroundColor: theme.primaryGreenBg,
                  },
                ]}
                onPress={() => handleDistrictChange('ALL')}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    { color: theme.textPrimary },
                    selectedDistrict === 'ALL' && {
                      color: theme.primaryGreen,
                      fontWeight: '700',
                    },
                  ]}
                >
                  {t('allDistricts')} ({availableDistricts.length})
                </Text>
                {selectedDistrict === 'ALL' && (
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color={theme.primaryGreen}
                  />
                )}
              </Pressable>

              {availableDistricts
                .filter((d) =>
                  d.toLowerCase().includes(districtSearchText.toLowerCase())
                )
                .map((dist) => {
                  const isSelected = selectedDistrict === dist;
                  return (
                    <Pressable
                      key={dist}
                      style={[
                        styles.pickerItem,
                        { borderBottomColor: theme.border },
                        isSelected && {
                          backgroundColor: theme.primaryGreenBg,
                        },
                      ]}
                      onPress={() => handleDistrictChange(dist)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          { color: theme.textPrimary },
                          isSelected && {
                            color: theme.primaryGreen,
                            fontWeight: '700',
                          },
                        ]}
                      >
                        {dist}
                      </Text>
                      {isSelected && (
                        <Ionicons
                          name="checkmark"
                          size={20}
                          color={theme.primaryGreen}
                        />
                      )}
                    </Pressable>
                  );
                })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Location Modal */}
      <LocationModal
        visible={isLocationModalVisible}
        onClose={() => setIsLocationModalVisible(false)}
        theme={theme}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  modalSafeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  headerRightSpace: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    maxWidth: 580,
    alignSelf: 'center',
    width: '100%',
    gap: 20,
  },

  /* Section Header Row with Button on Right */
  categorySection: {
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  sectionTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  categoryBadgeIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTitleWrapper: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  categorySub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  findMandiHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  findMandiHeaderBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Location Banner */
  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  locationBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  locationBannerTextCol: {
    flex: 1,
  },
  locationBannerAddress: {
    fontSize: 13,
    fontWeight: '600',
  },
  changeLocationBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  changeLocationBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },

  /* Mandis List */
  mandisList: {
    gap: 12,
  },
  mandiCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  mandiCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  mandiNameCol: {
    flex: 1,
    gap: 6,
  },
  mandiNameText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  mandiTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  distTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  distTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  stateTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stateTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  verifiedGovtBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  verifiedGovtText: {
    fontSize: 11,
    fontWeight: '700',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  addressIcon: {
    marginTop: 2,
  },
  addressText: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 17,
    flex: 1,
  },
  addressOpenIcon: {
    marginTop: 3,
    marginLeft: 4,
  },
  cardDivider: {
    height: 1,
    width: '100%',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 10,
    flex: 1,
  },
  callBtn: {
    borderWidth: 1,
  },
  callBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  directionsBtn: {
    borderWidth: 1,
  },
  directionsBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  bookSlotBtn: {
    flex: 1.1,
  },
  bookSlotBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Load More */
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    marginTop: 4,
  },
  loadMoreBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },

  /* Filter Card in Modal */
  filterCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  pickerField: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 2,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dropdownValueText: {
    fontSize: 14,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },

  /* Results Header */
  resultsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  resultsCountText: {
    fontSize: 15,
    fontWeight: '800',
  },
  resultsStateTag: {
    fontSize: 13,
    fontWeight: '700',
  },

  /* Empty State */
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  resetFilterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  resetFilterText: {
    fontSize: 13,
    fontWeight: '700',
  },

  /* Pickers Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  pickerModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    paddingBottom: 28,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },
  pickerModalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  pickerList: {
    paddingHorizontal: 20,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  pickerItemText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
