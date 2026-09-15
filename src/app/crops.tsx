import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Ionicons,
  MaterialCommunityIcons,
} from '@expo/vector-icons';
import { useSettings } from '@/context/settings-context';
import { getCropTranslationKey } from '@/constants/translations';

interface CropRecord {
  id: string;
  name: string;
  nativeName: string;
  acresSown: number;
  sowingDate: string;
  harvestWindow: string;
  stage: 'growing' | 'ready_to_harvest' | 'harvested';
  expectedYieldQuintals: number;
  mspPrice: number;
  estTotalValue: number;
  healthStatus: 'Excellent' | 'Good' | 'Needs Attention';
}

const INITIAL_CROPS: CropRecord[] = [
  {
    id: 'crop_wheat',
    name: 'Wheat',
    nativeName: 'गेहूं (Sharbati)',
    acresSown: 2.5,
    sowingDate: '15 Nov 2025',
    harvestWindow: 'Ready Now',
    stage: 'harvested',
    expectedYieldQuintals: 45,
    mspPrice: 2275,
    estTotalValue: 102375,
    healthStatus: 'Excellent',
  },
  {
    id: 'crop_soybean',
    name: 'Soybean',
    nativeName: 'सोयाबीन (JS-335)',
    acresSown: 1.5,
    sowingDate: '20 Jun 2026',
    harvestWindow: 'Mid October',
    stage: 'growing',
    expectedYieldQuintals: 30,
    mspPrice: 4892,
    estTotalValue: 146760,
    healthStatus: 'Good',
  },
  {
    id: 'crop_cotton',
    name: 'Cotton',
    nativeName: 'कपास (Bt Cotton)',
    acresSown: 1.0,
    sowingDate: '10 Jun 2026',
    harvestWindow: 'Ready to Harvest',
    stage: 'ready_to_harvest',
    expectedYieldQuintals: 20,
    mspPrice: 7121,
    estTotalValue: 142420,
    healthStatus: 'Good',
  },
];

const SELECTABLE_CROPS = [
  { name: 'Wheat', nativeName: 'गेहूं', msp: 2275, avgYieldPerAcre: 18 },
  { name: 'Soybean', nativeName: 'सोयाबीन', msp: 4892, avgYieldPerAcre: 20 },
  { name: 'Cotton', nativeName: 'कपास', msp: 7121, avgYieldPerAcre: 15 },
  { name: 'Paddy / Rice', nativeName: 'धान', msp: 2300, avgYieldPerAcre: 22 },
  { name: 'Mustard', nativeName: 'सरसों', msp: 5650, avgYieldPerAcre: 14 },
  { name: 'Maize', nativeName: 'मक्का', msp: 2090, avgYieldPerAcre: 25 },
];

export default function MyCropsScreen() {
  const router = useRouter();
  const { theme, t } = useSettings();

  const [cropsList, setCropsList] = useState<CropRecord[]>(INITIAL_CROPS);
  const [isAddCropModalVisible, setIsAddCropModalVisible] = useState(false);

  // Form State
  const [selectedCropInfo, setSelectedCropInfo] = useState(SELECTABLE_CROPS[0]);
  const [acresInput, setAcresInput] = useState('1.5');

  const totalLandSown = cropsList.reduce((acc, c) => acc + c.acresSown, 0);
  const totalEstCropValue = cropsList.reduce((acc, c) => acc + c.estTotalValue, 0);

  const handleAddCrop = () => {
    const acresNum = parseFloat(acresInput) || 1;
    const estYield = Math.round(acresNum * selectedCropInfo.avgYieldPerAcre);
    const estVal = estYield * selectedCropInfo.msp;

    const newCrop: CropRecord = {
      id: `crop_${Date.now()}`,
      name: selectedCropInfo.name,
      nativeName: `${selectedCropInfo.nativeName}`,
      acresSown: acresNum,
      sowingDate: 'This Month',
      harvestWindow: 'In 90 Days',
      stage: 'growing',
      expectedYieldQuintals: estYield,
      mspPrice: selectedCropInfo.msp,
      estTotalValue: estVal,
      healthStatus: 'Good',
    };

    setCropsList([newCrop, ...cropsList]);
    setIsAddCropModalVisible(false);
  };

  const getStageBadge = (stage: CropRecord['stage']) => {
    switch (stage) {
      case 'harvested':
        return {
          label: t('readyToSellMandi'),
          color: theme.primaryGreen,
          bgColor: theme.primaryGreenBg,
          icon: 'checkbox-marked-circle',
        };
      case 'ready_to_harvest':
        return {
          label: t('readyForHarvesting'),
          color: '#D97706',
          bgColor: theme.isDark ? '#2E2718' : '#FEF3C7',
          icon: 'clock-outline',
        };
      case 'growing':
      default:
        return {
          label: t('growingInField'),
          color: '#0284C7',
          bgColor: theme.isDark ? '#182C36' : '#E0F2FE',
          icon: 'sprout',
        };
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
          style={styles.backBtn}
          onPress={() => router.push('/')}
          accessibilityRole="button"
          accessibilityLabel="Back to Home"
        >
          <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
        </Pressable>

        <View style={styles.headerTitleCenter}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            {t('myCropsTitle')}
          </Text>
          <Text style={[styles.headerSub, { color: theme.primaryGreen }]}>
            {t('farmProduceHarvest')}
          </Text>
        </View>

        <Pressable
          style={[
            styles.addCropBtn,
            { backgroundColor: theme.primaryGreen },
          ]}
          onPress={() => setIsAddCropModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Add crop"
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addCropBtnText}>{t('addCropHeaderBtn')}</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Simple Farm Land Summary */}
        <View
          style={[
            styles.farmSummaryCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.summaryTopRow}>
            <View>
              <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>
                {t('totalCultivatedLand')}
              </Text>
              <Text
                style={[styles.summaryMainText, { color: theme.textPrimary }]}
              >
                {totalLandSown} {t('acresSownText')}
              </Text>
            </View>
            <View
              style={[
                styles.sproutBadge,
                { backgroundColor: theme.primaryGreenBg },
              ]}
            >
              <MaterialCommunityIcons
                name="sprout"
                size={26}
                color={theme.primaryGreen}
              />
            </View>
          </View>

          <View
            style={[styles.summaryDivider, { backgroundColor: theme.border }]}
          />

          <View style={styles.summaryBottomRow}>
            <View>
              <Text style={[styles.subStatLabel, { color: theme.textMuted }]}>
                {t('totalEstHarvestValue')}
              </Text>
              <Text
                style={[styles.subStatValue, { color: theme.primaryGreen }]}
              >
                ₹{totalEstCropValue.toLocaleString('en-IN')} {t('atGovtMspText')}
              </Text>
            </View>
          </View>
        </View>

        {/* Crops List */}
        <View style={styles.cropsListSection}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            {t('activeSownCrops')} ({cropsList.length})
          </Text>

          {cropsList.map((crop) => {
            const stageBadge = getStageBadge(crop.stage);

            return (
              <View
                key={crop.id}
                style={[
                  styles.cropCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              >
                {/* Crop Header */}
                <View style={styles.cropCardHeader}>
                  <View style={styles.cropLeft}>
                    <View
                      style={[
                        styles.cropIconCircle,
                        { backgroundColor: theme.primaryGreenBg },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="grain"
                        size={24}
                        color={theme.primaryGreen}
                      />
                    </View>
                    <View>
                      <Text
                        style={[
                          styles.cropCardTitle,
                          { color: theme.textPrimary },
                        ]}
                      >
                        {t(getCropTranslationKey(crop.name))}
                      </Text>
                      <Text
                        style={[
                          styles.cropCardNative,
                          { color: theme.textMuted },
                        ]}
                      >
                        {crop.nativeName}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.acresBadge,
                      {
                        backgroundColor: theme.isDark ? '#222824' : '#F3F4F6',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.acresBadgeText,
                        { color: theme.textPrimary },
                      ]}
                    >
                      {crop.acresSown} {t('acres')}
                    </Text>
                  </View>
                </View>

                {/* Stage Badge */}
                <View
                  style={[
                    styles.stageBadgeRow,
                    { backgroundColor: stageBadge.bgColor },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={stageBadge.icon as any}
                    size={15}
                    color={stageBadge.color}
                  />
                  <Text
                    style={[
                      styles.stageBadgeText,
                      { color: stageBadge.color },
                    ]}
                  >
                    {stageBadge.label}
                  </Text>
                </View>

                <View
                  style={[styles.cardDivider, { backgroundColor: theme.border }]}
                />

                {/* Key Numbers Grid */}
                <View style={styles.cropNumbersGrid}>
                  <View style={styles.numberCol}>
                    <Text style={[styles.numberLabel, { color: theme.textMuted }]}>
                      {t('estYieldLabel')}
                    </Text>
                    <Text
                      style={[styles.numberValue, { color: theme.textPrimary }]}
                    >
                      {crop.expectedYieldQuintals} {t('quintals')}
                    </Text>
                  </View>

                  <View style={styles.numberCol}>
                    <Text style={[styles.numberLabel, { color: theme.textMuted }]}>
                      {t('govtMspRate')}
                    </Text>
                    <Text
                      style={[styles.numberValue, { color: theme.textPrimary }]}
                    >
                      ₹{crop.mspPrice}/{t('quintals')}
                    </Text>
                  </View>

                  <View style={styles.numberCol}>
                    <Text style={[styles.numberLabel, { color: theme.textMuted }]}>
                      {t('estPayoutLabel')}
                    </Text>
                    <Text
                      style={[
                        styles.numberValue,
                        { color: theme.primaryGreen, fontWeight: '800' },
                      ]}
                    >
                      ₹{crop.estTotalValue.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>

                {/* Action: Book Mandi Slot */}
                {crop.stage === 'harvested' && (
                  <Pressable
                    style={[
                      styles.bookSlotActionBtn,
                      { backgroundColor: theme.primaryGreen },
                    ]}
                    onPress={() => router.push('/slots')}
                  >
                    <Ionicons
                      name="calendar"
                      size={16}
                      color="#FFFFFF"
                    />
                    <Text style={styles.bookSlotActionText}>
                      {t('bookMandiSlotCropBtn')}
                    </Text>
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Add Crop Modal */}
      <Modal
        visible={isAddCropModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsAddCropModalVisible(false)}
      >
        <SafeAreaView
          style={[styles.modalSafeArea, { backgroundColor: theme.background }]}
        >
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
              <Text
                style={[styles.modalTitle, { color: theme.textPrimary }]}
              >
                {t('addSownCropTitle')}
              </Text>
              <Text
                style={[styles.modalSubtitle, { color: theme.primaryGreen }]}
              >
                {t('registerCropFarmSub')}
              </Text>
            </View>
            <Pressable
              style={[
                styles.closeModalBtn,
                { backgroundColor: theme.isDark ? '#272E29' : '#F3F4F6' },
              ]}
              onPress={() => setIsAddCropModalVisible(false)}
            >
              <Ionicons name="close" size={22} color={theme.textPrimary} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. Crop Selection */}
            <View style={styles.modalSection}>
              <Text
                style={[styles.modalSectionTitle, { color: theme.textPrimary }]}
              >
                {t('selectCropStep')}
              </Text>
              <View style={styles.cropSelectGrid}>
                {SELECTABLE_CROPS.map((c) => {
                  const isSelected = selectedCropInfo.name === c.name;
                  return (
                    <Pressable
                      key={c.name}
                      style={[
                        styles.cropSelectPill,
                        {
                          backgroundColor: theme.surface,
                          borderColor: isSelected
                            ? theme.primaryGreen
                            : theme.border,
                        },
                        isSelected && {
                          backgroundColor: theme.primaryGreenBg,
                          borderWidth: 2,
                        },
                      ]}
                      onPress={() => setSelectedCropInfo(c)}
                    >
                      <Text
                        style={[
                          styles.cropSelectPillName,
                          { color: theme.textPrimary },
                          isSelected && {
                            color: theme.primaryGreen,
                            fontWeight: '700',
                          },
                        ]}
                      >
                        {t(getCropTranslationKey(c.name))} ({c.nativeName})
                      </Text>
                      <Text
                        style={[
                          styles.cropSelectPillMsp,
                          { color: theme.primaryGreen },
                        ]}
                      >
                        MSP: ₹{c.msp}/{t('quintals')}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* 2. Acres Sown */}
            <View style={styles.modalSection}>
              <Text
                style={[styles.modalSectionTitle, { color: theme.textPrimary }]}
              >
                {t('acresInputTitle')}
              </Text>
              <View
                style={[
                  styles.acresInputCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Pressable
                  style={[
                    styles.stepperBtn,
                    { backgroundColor: theme.primaryGreenBg },
                  ]}
                  onPress={() => {
                    const val = Math.max(0.5, (parseFloat(acresInput) || 0) - 0.5);
                    setAcresInput(val.toString());
                  }}
                >
                  <Ionicons name="remove" size={20} color={theme.primaryGreen} />
                </Pressable>

                <View style={styles.acresCenter}>
                  <TextInput
                    style={[styles.acresTextInput, { color: theme.textPrimary }]}
                    keyboardType="numeric"
                    value={acresInput}
                    onChangeText={setAcresInput}
                  />
                  <Text style={[styles.acresUnit, { color: theme.textMuted }]}>
                    {t('acres')}
                  </Text>
                </View>

                <Pressable
                  style={[
                    styles.stepperBtn,
                    { backgroundColor: theme.primaryGreenBg },
                  ]}
                  onPress={() => {
                    const val = (parseFloat(acresInput) || 0) + 0.5;
                    setAcresInput(val.toString());
                  }}
                >
                  <Ionicons name="add" size={20} color={theme.primaryGreen} />
                </Pressable>
              </View>
            </View>

            {/* Live Estimation Card */}
            <View
              style={[
                styles.liveEstCard,
                {
                  backgroundColor: theme.primaryGreenBg,
                  borderColor: theme.primaryGreen,
                },
              ]}
            >
              <View style={styles.liveEstRow}>
                <Text
                  style={[styles.liveEstLabel, { color: theme.textSecondary }]}
                >
                  {t('expectedYieldModalLabel')}
                </Text>
                <Text
                  style={[styles.liveEstVal, { color: theme.primaryGreen }]}
                >
                  ~
                  {Math.round(
                    (parseFloat(acresInput) || 1) *
                      selectedCropInfo.avgYieldPerAcre
                  )}{' '}
                  {t('quintals')}
                </Text>
              </View>
              <View style={styles.liveEstRow}>
                <Text
                  style={[styles.liveEstLabel, { color: theme.textSecondary }]}
                >
                  {t('estimatedPayout')}:
                </Text>
                <Text
                  style={[styles.liveEstTotal, { color: theme.primaryGreen }]}
                >
                  ₹
                  {(
                    Math.round(
                      (parseFloat(acresInput) || 1) *
                        selectedCropInfo.avgYieldPerAcre
                    ) * selectedCropInfo.msp
                  ).toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Confirm Add Button */}
          <View
            style={[
              styles.modalFooter,
              {
                backgroundColor: theme.surface,
                borderTopColor: theme.border,
              },
            ]}
          >
            <Pressable
              style={[
                styles.confirmAddBtn,
                { backgroundColor: theme.primaryGreen },
              ]}
              onPress={handleAddCrop}
            >
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.confirmAddBtnText}>{t('saveCropDetailsBtn')}</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Bottom Navigation */}
      <View
        style={[
          styles.bottomNavContainer,
          {
            backgroundColor: theme.bottomNavBg,
            borderTopColor: theme.bottomNavBorder,
          },
        ]}
      >
        <View style={styles.bottomNav}>
          {/* Home Tab */}
          <Pressable
            style={styles.navItem}
            onPress={() => router.push('/')}
            accessibilityRole="tab"
          >
            <View style={styles.navIconWrapper}>
              <Ionicons name="home-outline" size={22} color={theme.textMuted} />
            </View>
            <Text style={[styles.navLabel, { color: theme.textMuted }]}>
              {t('tabHome')}
            </Text>
          </Pressable>

          {/* Slots Tab */}
          <Pressable
            style={styles.navItem}
            onPress={() => router.push('/slots')}
            accessibilityRole="tab"
          >
            <View style={styles.navIconWrapper}>
              <Ionicons
                name="calendar-outline"
                size={22}
                color={theme.textMuted}
              />
            </View>
            <Text style={[styles.navLabel, { color: theme.textMuted }]}>
              {t('tabSlots')}
            </Text>
          </Pressable>

          {/* Help Tab */}
          <Pressable
            style={styles.navItem}
            onPress={() => router.push('/')}
            accessibilityRole="tab"
          >
            <View style={styles.navIconWrapper}>
              <Ionicons
                name="help-circle-outline"
                size={23}
                color={theme.textMuted}
              />
            </View>
            <Text style={[styles.navLabel, { color: theme.textMuted }]}>
              {t('tabHelp')}
            </Text>
          </Pressable>

          {/* Profile Tab */}
          <Pressable
            style={styles.navItem}
            onPress={() => router.push('/profile')}
            accessibilityRole="tab"
          >
            <View style={styles.navIconWrapper}>
              <Ionicons
                name="person-outline"
                size={22}
                color={theme.textMuted}
              />
            </View>
            <Text style={[styles.navLabel, { color: theme.textMuted }]}>
              {t('tabProfile')}
            </Text>
          </Pressable>
        </View>
      </View>
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
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  addCropBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  addCropBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 28,
    maxWidth: 540,
    alignSelf: 'center',
    width: '100%',
  },

  /* Farm Summary */
  farmSummaryCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  summaryMainText: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 2,
  },
  sproutBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryDivider: {
    height: 1,
    width: '100%',
  },
  summaryBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subStatLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  subStatValue: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },

  /* Crops List */
  cropsListSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 2,
  },
  cropCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  cropCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cropLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cropIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cropCardTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  cropCardNative: {
    fontSize: 13,
    marginTop: 1,
  },
  acresBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  acresBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  stageBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  stageBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardDivider: {
    height: 1,
    width: '100%',
  },
  cropNumbersGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  numberCol: {
    gap: 2,
  },
  numberLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  numberValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  bookSlotActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 12,
    marginTop: 2,
  },
  bookSlotActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  /* Modal */
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
    fontWeight: '600',
    marginTop: 2,
  },
  closeModalBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScroll: {
    flex: 1,
  },
  modalContent: {
    padding: 16,
    gap: 20,
    paddingBottom: 36,
    maxWidth: 540,
    alignSelf: 'center',
    width: '100%',
  },
  modalSection: {
    gap: 10,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  cropSelectGrid: {
    gap: 8,
  },
  cropSelectPill: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  cropSelectPillName: {
    fontSize: 14,
    fontWeight: '600',
  },
  cropSelectPillMsp: {
    fontSize: 12,
    fontWeight: '700',
  },
  acresInputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acresCenter: {
    alignItems: 'center',
  },
  acresTextInput: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  acresUnit: {
    fontSize: 12,
    fontWeight: '500',
  },
  liveEstCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    gap: 6,
  },
  liveEstRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  liveEstLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  liveEstVal: {
    fontSize: 13,
    fontWeight: '700',
  },
  liveEstTotal: {
    fontSize: 16,
    fontWeight: '900',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
  },
  confirmAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  confirmAddBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  /* Bottom Navigation */
  bottomNavContainer: {
    borderTopWidth: 1,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 8,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    maxWidth: 540,
    alignSelf: 'center',
    width: '100%',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 16,
    minWidth: 64,
  },
  navIconWrapper: {
    width: 36,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  navLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
});
