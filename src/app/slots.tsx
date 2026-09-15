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
  FontAwesome5,
} from '@expo/vector-icons';
import { useSettings } from '@/context/settings-context';
import { AppThemePalette } from '@/constants/theme';

interface SlotItem {
  id: string;
  tokenNumber: string;
  cropName: string;
  cropHindi: string;
  cropIcon: string;
  quantityQuintals: number;
  mandiName: string;
  mandiGate: string;
  date: string;
  timeWindow: string;
  vehicleType: string;
  vehicleNumber: string;
  status: 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  mspPrice: number;
  estTotalValue: number;
}

const INITIAL_SLOTS: SlotItem[] = [
  {
    id: 'SLOT-9021',
    tokenNumber: 'TK-48',
    cropName: 'Wheat',
    cropHindi: 'गेहूं',
    cropIcon: 'grain',
    quantityQuintals: 45,
    mandiName: 'Nagpur APMC Main Yard',
    mandiGate: 'Gate #3 (Grain Section)',
    date: 'Tomorrow, 16 Sep 2026',
    timeWindow: '08:30 AM - 11:30 AM',
    vehicleType: 'Tractor Trolley',
    vehicleNumber: 'MH 31 CZ 5521',
    status: 'confirmed',
    mspPrice: 2275,
    estTotalValue: 102375,
  },
  {
    id: 'SLOT-8842',
    tokenNumber: 'TK-12',
    cropName: 'Soybean',
    cropHindi: 'सोयाबीन',
    cropIcon: 'seed',
    quantityQuintals: 30,
    mandiName: 'Hingna Procurement Hub',
    mandiGate: 'Gate #1',
    date: 'Friday, 18 Sep 2026',
    timeWindow: '11:30 AM - 02:30 PM',
    vehicleType: 'Small Truck',
    vehicleNumber: 'MH 31 AG 4190',
    status: 'confirmed',
    mspPrice: 4892,
    estTotalValue: 146760,
  },
  {
    id: 'SLOT-7619',
    tokenNumber: 'TK-94',
    cropName: 'Cotton',
    cropHindi: 'कपास',
    cropIcon: 'feather',
    quantityQuintals: 25,
    mandiName: 'Kalmeshwar Cotton Sub-Market',
    mandiGate: 'Gate #2',
    date: '02 Sep 2026',
    timeWindow: '09:00 AM - 12:00 PM',
    vehicleType: 'Tractor Trolley',
    vehicleNumber: 'MH 31 CZ 5521',
    status: 'completed',
    mspPrice: 7121,
    estTotalValue: 178025,
  },
];

const AVAILABLE_CROPS = [
  { id: 'wheat', name: 'Wheat', native: 'गेहूं', icon: 'grain', msp: 2275 },
  { id: 'soybean', name: 'Soybean', native: 'सोयाबीन', icon: 'seed', msp: 4892 },
  { id: 'cotton', name: 'Cotton', native: 'कपास', icon: 'feather', msp: 7121 },
  { id: 'paddy', name: 'Paddy / Rice', native: 'धान', icon: 'grass', msp: 2300 },
  { id: 'mustard', name: 'Mustard', native: 'सरसों', icon: 'flower', msp: 5650 },
  { id: 'maize', name: 'Maize', native: 'मक्का', icon: 'corn', msp: 2090 },
];

const NEARBY_MANDIS = [
  {
    id: 'mandi_1',
    name: 'Nagpur APMC Main Yard',
    distance: '3.2 km away',
    availableSlots: 42,
    gate: 'Gate #3 (Grain Section)',
  },
  {
    id: 'mandi_2',
    name: 'Hingna Procurement Hub',
    distance: '8.5 km away',
    availableSlots: 26,
    gate: 'Gate #1',
  },
  {
    id: 'mandi_3',
    name: 'Kalmeshwar Sub-Market',
    distance: '14.0 km away',
    availableSlots: 58,
    gate: 'Gate #2',
  },
];

const TIME_WINDOWS = [
  { id: 'morning', label: 'Morning', time: '08:30 AM - 11:30 AM', slots: '18 left' },
  { id: 'afternoon', label: 'Afternoon', time: '11:30 AM - 02:30 PM', slots: '14 left' },
  { id: 'evening', label: 'Evening', time: '02:30 PM - 05:30 PM', slots: '9 left' },
];

const DATES_LIST = [
  { id: 'd1', label: 'Tomorrow', day: 'Wed', dateNum: '16', fullDate: 'Wed, 16 Sep 2026' },
  { id: 'd2', label: 'Day after', day: 'Thu', dateNum: '17', fullDate: 'Thu, 17 Sep 2026' },
  { id: 'd3', label: 'Friday', day: 'Fri', dateNum: '18', fullDate: 'Fri, 18 Sep 2026' },
  { id: 'd4', label: 'Saturday', day: 'Sat', dateNum: '19', fullDate: 'Sat, 19 Sep 2026' },
  { id: 'd5', label: 'Monday', day: 'Mon', dateNum: '21', fullDate: 'Mon, 21 Sep 2026' },
];

export default function SlotsScreen() {
  const router = useRouter();
  const { theme, t } = useSettings();

  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');
  const [slotsList, setSlotsList] = useState<SlotItem[]>(INITIAL_SLOTS);

  // Booking Modal State
  const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState(AVAILABLE_CROPS[0]);
  const [quantity, setQuantity] = useState('40');
  const [selectedMandi, setSelectedMandi] = useState(NEARBY_MANDIS[0]);
  const [selectedDate, setSelectedDate] = useState(DATES_LIST[0]);
  const [selectedTimeWindow, setSelectedTimeWindow] = useState(TIME_WINDOWS[0]);
  const [vehicleNumber, setVehicleNumber] = useState('MH 31 CZ 5521');
  const [vehicleType, setVehicleType] = useState('Tractor Trolley');

  // Gate Pass Modal
  const [selectedGatePass, setSelectedGatePass] = useState<SlotItem | null>(null);

  const filteredSlots = slotsList.filter((slot) => {
    if (activeTab === 'upcoming') {
      return slot.status === 'confirmed' || slot.status === 'in_progress';
    }
    return slot.status === 'completed' || slot.status === 'cancelled';
  });

  const handleCreateBooking = () => {
    const qtyNum = parseFloat(quantity) || 10;
    const estVal = qtyNum * selectedCrop.msp;
    const newSlotId = `SLOT-${Math.floor(1000 + Math.random() * 9000)}`;
    const newToken = `TK-${Math.floor(10 + Math.random() * 89)}`;

    const newSlot: SlotItem = {
      id: newSlotId,
      tokenNumber: newToken,
      cropName: selectedCrop.name,
      cropHindi: selectedCrop.native,
      cropIcon: selectedCrop.icon,
      quantityQuintals: qtyNum,
      mandiName: selectedMandi.name,
      mandiGate: selectedMandi.gate,
      date: selectedDate.fullDate,
      timeWindow: selectedTimeWindow.time,
      vehicleType: vehicleType,
      vehicleNumber: vehicleNumber || 'MH 31 AB 1234',
      status: 'confirmed',
      mspPrice: selectedCrop.msp,
      estTotalValue: estVal,
    };

    setSlotsList([newSlot, ...slotsList]);
    setIsBookingModalVisible(false);
    setSelectedGatePass(newSlot);
  };

  const handleCancelSlot = (slotId: string) => {
    Alert.alert(
      'Cancel Slot Booking',
      'Are you sure you want to cancel this mandi delivery slot?',
      [
        { text: 'Keep Slot', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            setSlotsList((prev) =>
              prev.map((s) => (s.id === slotId ? { ...s, status: 'cancelled' } : s))
            );
          },
        },
      ]
    );
  };

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
          style={styles.headerButton}
          onPress={() => router.push('/')}
          accessibilityRole="button"
          accessibilityLabel="Back to Home"
        >
          <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
        </Pressable>

        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            Mandi Delivery Slots
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.primaryGreen }]}>
            Direct APMC Gate Pass
          </Text>
        </View>

        <Pressable
          style={[styles.bookHeaderBtn, { backgroundColor: theme.primaryGreen }]}
          onPress={() => setIsBookingModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Book new slot"
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.bookHeaderBtnText}>Book</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Summary Banner */}
        <View
          style={[
            styles.bannerCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.bannerLeft}>
            <View
              style={[
                styles.bannerIconBadge,
                { backgroundColor: theme.primaryGreenBg },
              ]}
            >
              <MaterialCommunityIcons
                name="calendar-clock"
                size={26}
                color={theme.primaryGreen}
              />
            </View>
            <View style={styles.bannerTextCol}>
              <Text style={[styles.bannerTitle, { color: theme.textPrimary }]}>
                No Long Mandi Queues
              </Text>
              <Text style={[styles.bannerDesc, { color: theme.textMuted }]}>
                Pre-book your delivery token & get priority weighbridge entry
              </Text>
            </View>
          </View>

          <Pressable
            style={[
              styles.bannerActionBtn,
              { backgroundColor: theme.primaryGreenBg, borderColor: theme.primaryGreen },
            ]}
            onPress={() => setIsBookingModalVisible(true)}
          >
            <Text style={[styles.bannerActionText, { color: theme.primaryGreen }]}>
              + Book New Slot
            </Text>
          </Pressable>
        </View>

        {/* Tab Switcher: Upcoming vs Completed */}
        <View
          style={[
            styles.tabSwitchContainer,
            {
              backgroundColor: theme.isDark ? '#1C211E' : '#EAEFEA',
            },
          ]}
        >
          <Pressable
            style={[
              styles.tabSwitchBtn,
              activeTab === 'upcoming' && [
                styles.tabSwitchBtnActive,
                { backgroundColor: theme.surface },
              ],
            ]}
            onPress={() => setActiveTab('upcoming')}
          >
            <Ionicons
              name="calendar"
              size={16}
              color={activeTab === 'upcoming' ? theme.primaryGreen : theme.textMuted}
            />
            <Text
              style={[
                styles.tabSwitchText,
                { color: theme.textMuted },
                activeTab === 'upcoming' && {
                  color: theme.primaryGreen,
                  fontWeight: '700',
                },
              ]}
            >
              Upcoming ({slotsList.filter((s) => s.status === 'confirmed').length})
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.tabSwitchBtn,
              activeTab === 'completed' && [
                styles.tabSwitchBtnActive,
                { backgroundColor: theme.surface },
              ],
            ]}
            onPress={() => setActiveTab('completed')}
          >
            <Ionicons
              name="checkmark-done"
              size={17}
              color={activeTab === 'completed' ? theme.primaryGreen : theme.textMuted}
            />
            <Text
              style={[
                styles.tabSwitchText,
                { color: theme.textMuted },
                activeTab === 'completed' && {
                  color: theme.primaryGreen,
                  fontWeight: '700',
                },
              ]}
            >
              Past Deliveries ({slotsList.filter((s) => s.status === 'completed').length})
            </Text>
          </Pressable>
        </View>

        {/* Slots Cards List */}
        {filteredSlots.length === 0 ? (
          <View
            style={[
              styles.emptyStateCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="calendar-blank-outline"
              size={48}
              color={theme.textMuted}
            />
            <Text style={[styles.emptyStateTitle, { color: theme.textPrimary }]}>
              No {activeTab} slots found
            </Text>
            <Text style={[styles.emptyStateDesc, { color: theme.textMuted }]}>
              Book a slot to sell your crop at the nearest APMC Mandi without waiting.
            </Text>
            <Pressable
              style={[
                styles.emptyStateBtn,
                { backgroundColor: theme.primaryGreen },
              ]}
              onPress={() => setIsBookingModalVisible(true)}
            >
              <Text style={styles.emptyStateBtnText}>Book Your First Slot</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.slotsListContainer}>
            {filteredSlots.map((slot) => {
              const isConfirmed = slot.status === 'confirmed';
              const isCompleted = slot.status === 'completed';

              return (
                <View
                  key={slot.id}
                  style={[
                    styles.slotCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  {/* Card Header */}
                  <View style={styles.slotCardHeader}>
                    <View style={styles.cropBadgeRow}>
                      <View
                        style={[
                          styles.cropIconCircle,
                          { backgroundColor: theme.primaryGreenBg },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="sprout"
                          size={20}
                          color={theme.primaryGreen}
                        />
                      </View>
                      <View>
                        <View style={styles.cropTitleRow}>
                          <Text
                            style={[
                              styles.cropNameText,
                              { color: theme.textPrimary },
                            ]}
                          >
                            {slot.cropName}
                          </Text>
                          <Text
                            style={[
                              styles.cropHindiText,
                              { color: theme.textMuted },
                            ]}
                          >
                            ({slot.cropHindi})
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.quantityText,
                            { color: theme.primaryGreen },
                          ]}
                        >
                          {slot.quantityQuintals} Quintals • Est. ₹
                          {slot.estTotalValue.toLocaleString('en-IN')}
                        </Text>
                      </View>
                    </View>

                    {/* Status Badge */}
                    <View
                      style={[
                        styles.statusBadge,
                        isConfirmed && {
                          backgroundColor: theme.primaryGreenBg,
                        },
                        isCompleted && {
                          backgroundColor: theme.isDark ? '#22332A' : '#E0F2FE',
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor: isConfirmed
                              ? theme.primaryGreen
                              : '#0284C7',
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusBadgeText,
                          {
                            color: isConfirmed
                              ? theme.primaryGreen
                              : '#0284C7',
                          },
                        ]}
                      >
                        {isConfirmed ? 'Confirmed' : 'Completed'}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.slotDivider,
                      { backgroundColor: theme.border },
                    ]}
                  />

                  {/* Mandi & Time Info */}
                  <View style={styles.slotDetailsGrid}>
                    <View style={styles.slotDetailRow}>
                      <Ionicons
                        name="business-outline"
                        size={17}
                        color={theme.primaryGreen}
                      />
                      <View style={styles.slotDetailCol}>
                        <Text
                          style={[
                            styles.detailLabel,
                            { color: theme.textMuted },
                          ]}
                        >
                          Mandi / Yard
                        </Text>
                        <Text
                          style={[
                            styles.detailValue,
                            { color: theme.textPrimary },
                          ]}
                        >
                          {slot.mandiName}
                        </Text>
                        <Text
                          style={[
                            styles.detailSubValue,
                            { color: theme.textMuted },
                          ]}
                        >
                          {slot.mandiGate}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.slotDetailRow}>
                      <Ionicons
                        name="time-outline"
                        size={17}
                        color={theme.primaryGreen}
                      />
                      <View style={styles.slotDetailCol}>
                        <Text
                          style={[
                            styles.detailLabel,
                            { color: theme.textMuted },
                          ]}
                        >
                          Date & Time Slot
                        </Text>
                        <Text
                          style={[
                            styles.detailValue,
                            { color: theme.textPrimary },
                          ]}
                        >
                          {slot.date}
                        </Text>
                        <Text
                          style={[
                            styles.detailSubValue,
                            { color: theme.primaryGreen },
                          ]}
                        >
                          {slot.timeWindow}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.slotDetailRow}>
                      <MaterialCommunityIcons
                        name="truck-outline"
                        size={18}
                        color={theme.primaryGreen}
                      />
                      <View style={styles.slotDetailCol}>
                        <Text
                          style={[
                            styles.detailLabel,
                            { color: theme.textMuted },
                          ]}
                        >
                          Transport Vehicle
                        </Text>
                        <Text
                          style={[
                            styles.detailValue,
                            { color: theme.textPrimary },
                          ]}
                        >
                          {slot.vehicleType} ({slot.vehicleNumber})
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Token & Actions Footer */}
                  <View
                    style={[
                      styles.slotCardFooter,
                      {
                        backgroundColor: theme.isDark ? '#191E1B' : '#F6FAF7',
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <View style={styles.tokenContainer}>
                      <Text
                        style={[
                          styles.tokenPrefix,
                          { color: theme.textMuted },
                        ]}
                      >
                        Token No.
                      </Text>
                      <Text
                        style={[
                          styles.tokenText,
                          { color: theme.primaryGreen },
                        ]}
                      >
                        {slot.tokenNumber}
                      </Text>
                    </View>

                    <View style={styles.cardActionsRow}>
                      {isConfirmed && (
                        <>
                          <Pressable
                            style={[
                              styles.cancelBtn,
                              { borderColor: theme.borderSubtle },
                            ]}
                            onPress={() => handleCancelSlot(slot.id)}
                          >
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                          </Pressable>

                          <Pressable
                            style={[
                              styles.gatePassBtn,
                              { backgroundColor: theme.primaryGreen },
                            ]}
                            onPress={() => setSelectedGatePass(slot)}
                          >
                            <Ionicons
                              name="qr-code-outline"
                              size={16}
                              color="#FFFFFF"
                            />
                            <Text style={styles.gatePassBtnText}>
                              Gate Pass
                            </Text>
                          </Pressable>
                        </>
                      )}

                      {isCompleted && (
                        <Pressable
                          style={[
                            styles.gatePassBtn,
                            { backgroundColor: theme.primaryGreen },
                          ]}
                          onPress={() => setSelectedGatePass(slot)}
                        >
                          <Ionicons
                            name="document-text-outline"
                            size={16}
                            color="#FFFFFF"
                          />
                          <Text style={styles.gatePassBtnText}>
                            View Receipt
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Book New Slot Modal */}
      <Modal
        visible={isBookingModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsBookingModalVisible(false)}
      >
        <SafeAreaView
          style={[styles.modalSafeArea, { backgroundColor: theme.background }]}
        >
          {/* Modal Header */}
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
                style={[styles.modalHeaderTitle, { color: theme.textPrimary }]}
              >
                Book Mandi Slot
              </Text>
              <Text
                style={[styles.modalHeaderSub, { color: theme.primaryGreen }]}
              >
                Step-by-step Mandi Token
              </Text>
            </View>
            <Pressable
              style={[
                styles.modalCloseBtn,
                { backgroundColor: theme.isDark ? '#272E29' : '#F3F4F6' },
              ]}
              onPress={() => setIsBookingModalVisible(false)}
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
            <View style={styles.formSection}>
              <Text style={[styles.formSectionTitle, { color: theme.textPrimary }]}>
                1. Select Produce / Crop
              </Text>
              <View style={styles.cropGrid}>
                {AVAILABLE_CROPS.map((crop) => {
                  const isSelected = selectedCrop.id === crop.id;
                  return (
                    <Pressable
                      key={crop.id}
                      style={[
                        styles.cropSelectCard,
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
                      onPress={() => setSelectedCrop(crop)}
                    >
                      <View
                        style={[
                          styles.cropSelectIcon,
                          {
                            backgroundColor: isSelected
                              ? theme.primaryGreen
                              : theme.isDark
                              ? '#272E29'
                              : '#F0F7F2',
                          },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="sprout"
                          size={18}
                          color={isSelected ? '#FFFFFF' : theme.primaryGreen}
                        />
                      </View>
                      <Text
                        style={[
                          styles.cropSelectName,
                          { color: theme.textPrimary },
                          isSelected && {
                            color: theme.primaryGreen,
                            fontWeight: '700',
                          },
                        ]}
                      >
                        {crop.name}
                      </Text>
                      <Text
                        style={[
                          styles.cropSelectNative,
                          { color: theme.textMuted },
                        ]}
                      >
                        {crop.native}
                      </Text>
                      <Text
                        style={[
                          styles.cropSelectMsp,
                          { color: theme.primaryGreen },
                        ]}
                      >
                        ₹{crop.msp}/Qtl
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* 2. Quantity in Quintals */}
            <View style={styles.formSection}>
              <Text style={[styles.formSectionTitle, { color: theme.textPrimary }]}>
                2. Quantity (in Quintals)
              </Text>
              <View
                style={[
                  styles.quantityInputCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Pressable
                  style={[
                    styles.qtyStepBtn,
                    { backgroundColor: theme.primaryGreenBg },
                  ]}
                  onPress={() => {
                    const val = Math.max(5, (parseFloat(quantity) || 0) - 5);
                    setQuantity(val.toString());
                  }}
                >
                  <Ionicons name="remove" size={20} color={theme.primaryGreen} />
                </Pressable>

                <View style={styles.qtyInputCenter}>
                  <TextInput
                    style={[styles.qtyTextInput, { color: theme.textPrimary }]}
                    keyboardType="numeric"
                    value={quantity}
                    onChangeText={setQuantity}
                  />
                  <Text style={[styles.qtyUnit, { color: theme.textMuted }]}>
                    Quintals (~{(parseFloat(quantity) || 0) * 100} Kg)
                  </Text>
                </View>

                <Pressable
                  style={[
                    styles.qtyStepBtn,
                    { backgroundColor: theme.primaryGreenBg },
                  ]}
                  onPress={() => {
                    const val = (parseFloat(quantity) || 0) + 5;
                    setQuantity(val.toString());
                  }}
                >
                  <Ionicons name="add" size={20} color={theme.primaryGreen} />
                </Pressable>
              </View>
            </View>

            {/* 3. Mandi Selection */}
            <View style={styles.formSection}>
              <Text style={[styles.formSectionTitle, { color: theme.textPrimary }]}>
                3. Choose Procurement Mandi
              </Text>
              <View style={styles.mandiList}>
                {NEARBY_MANDIS.map((mandi) => {
                  const isSelected = selectedMandi.id === mandi.id;
                  return (
                    <Pressable
                      key={mandi.id}
                      style={[
                        styles.mandiOptionCard,
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
                      onPress={() => setSelectedMandi(mandi)}
                    >
                      <View style={styles.mandiOptionLeft}>
                        <Ionicons
                          name="location"
                          size={22}
                          color={
                            isSelected ? theme.primaryGreen : theme.textMuted
                          }
                        />
                        <View>
                          <Text
                            style={[
                              styles.mandiOptionName,
                              { color: theme.textPrimary },
                              isSelected && {
                                color: theme.primaryGreen,
                                fontWeight: '700',
                              },
                            ]}
                          >
                            {mandi.name}
                          </Text>
                          <Text
                            style={[
                              styles.mandiOptionDist,
                              { color: theme.textMuted },
                            ]}
                          >
                            {mandi.distance} • {mandi.gate}
                          </Text>
                        </View>
                      </View>
                      <View
                        style={[
                          styles.slotsAvailableBadge,
                          {
                            backgroundColor: isSelected
                              ? theme.primaryGreen
                              : theme.isDark
                              ? '#2A332C'
                              : '#E8F5E9',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.slotsAvailableText,
                            {
                              color: isSelected ? '#FFFFFF' : theme.primaryGreen,
                            },
                          ]}
                        >
                          {mandi.availableSlots} slots
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* 4. Date & Time Window */}
            <View style={styles.formSection}>
              <Text style={[styles.formSectionTitle, { color: theme.textPrimary }]}>
                4. Select Date & Arrival Time
              </Text>

              {/* Horizontal Date Picker */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.datesScroll}
                contentContainerStyle={styles.datesContainer}
              >
                {DATES_LIST.map((d) => {
                  const isSelected = selectedDate.id === d.id;
                  return (
                    <Pressable
                      key={d.id}
                      style={[
                        styles.dateBox,
                        {
                          backgroundColor: theme.surface,
                          borderColor: isSelected
                            ? theme.primaryGreen
                            : theme.border,
                        },
                        isSelected && {
                          backgroundColor: theme.primaryGreen,
                        },
                      ]}
                      onPress={() => setSelectedDate(d)}
                    >
                      <Text
                        style={[
                          styles.dateBoxDay,
                          { color: isSelected ? '#FFFFFF' : theme.textMuted },
                        ]}
                      >
                        {d.day}
                      </Text>
                      <Text
                        style={[
                          styles.dateBoxNum,
                          { color: isSelected ? '#FFFFFF' : theme.textPrimary },
                        ]}
                      >
                        {d.dateNum}
                      </Text>
                      <Text
                        style={[
                          styles.dateBoxLabel,
                          { color: isSelected ? '#E8F5E9' : theme.primaryGreen },
                        ]}
                      >
                        {d.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Time Slots */}
              <View style={styles.timeSlotsGrid}>
                {TIME_WINDOWS.map((tw) => {
                  const isSelected = selectedTimeWindow.id === tw.id;
                  return (
                    <Pressable
                      key={tw.id}
                      style={[
                        styles.timeSlotCard,
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
                      onPress={() => setSelectedTimeWindow(tw)}
                    >
                      <Ionicons
                        name="time-outline"
                        size={18}
                        color={
                          isSelected ? theme.primaryGreen : theme.textMuted
                        }
                      />
                      <View style={styles.timeSlotTextContainer}>
                        <Text
                          style={[
                            styles.timeSlotLabel,
                            { color: theme.textPrimary },
                            isSelected && {
                              color: theme.primaryGreen,
                              fontWeight: '700',
                            },
                          ]}
                        >
                          {tw.label}
                        </Text>
                        <Text
                          style={[
                            styles.timeSlotRange,
                            { color: theme.textMuted },
                          ]}
                        >
                          {tw.time}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* 5. Vehicle Info */}
            <View style={styles.formSection}>
              <Text style={[styles.formSectionTitle, { color: theme.textPrimary }]}>
                5. Vehicle Information
              </Text>
              <View
                style={[
                  styles.vehicleCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View style={styles.vehicleTypeRow}>
                  {['Tractor Trolley', 'Small Truck', 'Bolero Pickup'].map((v) => (
                    <Pressable
                      key={v}
                      style={[
                        styles.vehicleTypeBtn,
                        {
                          backgroundColor:
                            vehicleType === v
                              ? theme.primaryGreenBg
                              : theme.isDark
                              ? '#222824'
                              : '#F3F4F6',
                          borderColor:
                            vehicleType === v
                              ? theme.primaryGreen
                              : 'transparent',
                        },
                      ]}
                      onPress={() => setVehicleType(v)}
                    >
                      <Text
                        style={[
                          styles.vehicleTypeText,
                          {
                            color:
                              vehicleType === v
                                ? theme.primaryGreen
                                : theme.textMuted,
                            fontWeight: vehicleType === v ? '700' : '500',
                          },
                        ]}
                      >
                        {v}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <View
                  style={[
                    styles.vehicleInputWrapper,
                    {
                      backgroundColor: theme.isDark ? '#191E1B' : '#F9FBFA',
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Ionicons
                    name="car-outline"
                    size={18}
                    color={theme.primaryGreen}
                  />
                  <TextInput
                    style={[
                      styles.vehicleTextInput,
                      { color: theme.textPrimary },
                    ]}
                    value={vehicleNumber}
                    onChangeText={setVehicleNumber}
                    placeholder="e.g. MH 31 CZ 5521"
                    placeholderTextColor={theme.textMuted}
                    autoCapitalize="characters"
                  />
                </View>
              </View>
            </View>

            {/* Price Estimate Summary */}
            <View
              style={[
                styles.summaryCard,
                {
                  backgroundColor: theme.primaryGreenBg,
                  borderColor: theme.primaryGreen,
                },
              ]}
            >
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                  Govt. MSP Rate ({selectedCrop.name})
                </Text>
                <Text style={[styles.summaryValue, { color: theme.primaryGreen }]}>
                  ₹{selectedCrop.msp} / Quintal
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                  Estimated Payout
                </Text>
                <Text style={[styles.summaryTotal, { color: theme.primaryGreen }]}>
                  ₹
                  {(
                    (parseFloat(quantity) || 0) * selectedCrop.msp
                  ).toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Modal Footer Confirm Button */}
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
                styles.confirmBookingBtn,
                { backgroundColor: theme.primaryGreen },
              ]}
              onPress={handleCreateBooking}
            >
              <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
              <Text style={styles.confirmBookingBtnText}>
                Confirm & Generate Gate Pass
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Digital Gate Pass & QR Code Modal */}
      {selectedGatePass && (
        <Modal
          visible={!!selectedGatePass}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setSelectedGatePass(null)}
        >
          <View style={styles.passModalBackdrop}>
            <View
              style={[
                styles.gatePassCard,
                {
                  backgroundColor: theme.surface,
                },
              ]}
            >
              {/* Gate Pass Header */}
              <View style={styles.passHeader}>
                <View style={styles.passBrandRow}>
                  <MaterialCommunityIcons
                    name="sprout"
                    size={22}
                    color="#FFFFFF"
                  />
                  <Text style={styles.passBrandText}>
                    APMC E-GATE PASS
                  </Text>
                </View>
                <Pressable
                  style={styles.passCloseIcon}
                  onPress={() => setSelectedGatePass(null)}
                >
                  <Ionicons name="close" size={22} color="#FFFFFF" />
                </Pressable>
              </View>

              <View style={styles.passContent}>
                {/* Large Token Badge */}
                <View
                  style={[
                    styles.passTokenBadge,
                    { backgroundColor: theme.primaryGreenBg },
                  ]}
                >
                  <Text style={styles.passTokenLabel}>ENTRY TOKEN</Text>
                  <Text
                    style={[
                      styles.passTokenNumber,
                      { color: theme.primaryGreen },
                    ]}
                  >
                    {selectedGatePass.tokenNumber}
                  </Text>
                  <Text style={styles.passSlotId}>{selectedGatePass.id}</Text>
                </View>

                {/* Simulated QR Code Graphic */}
                <View style={styles.qrCodeBox}>
                  <Ionicons name="qr-code" size={130} color="#1F2937" />
                  <Text style={styles.qrScanPrompt}>
                    Scan at Mandi Entry Weighbridge
                  </Text>
                </View>

                {/* Key Details on Gate Pass */}
                <View style={styles.passDetailsList}>
                  <View style={styles.passDetailRow}>
                    <Text style={styles.passDetailKey}>Farmer Name:</Text>
                    <Text style={styles.passDetailVal}>Ramu Ji</Text>
                  </View>
                  <View style={styles.passDetailRow}>
                    <Text style={styles.passDetailKey}>Crop & Quantity:</Text>
                    <Text style={styles.passDetailVal}>
                      {selectedGatePass.cropName} ({selectedGatePass.quantityQuintals} Qtl)
                    </Text>
                  </View>
                  <View style={styles.passDetailRow}>
                    <Text style={styles.passDetailKey}>Mandi Center:</Text>
                    <Text style={styles.passDetailVal}>
                      {selectedGatePass.mandiName}
                    </Text>
                  </View>
                  <View style={styles.passDetailRow}>
                    <Text style={styles.passDetailKey}>Slot Window:</Text>
                    <Text style={styles.passDetailVal}>
                      {selectedGatePass.date} ({selectedGatePass.timeWindow})
                    </Text>
                  </View>
                  <View style={styles.passDetailRow}>
                    <Text style={styles.passDetailKey}>Vehicle Reg.:</Text>
                    <Text style={styles.passDetailVal}>
                      {selectedGatePass.vehicleNumber}
                    </Text>
                  </View>
                </View>

                <Pressable
                  style={[
                    styles.passDoneBtn,
                    { backgroundColor: theme.primaryGreen },
                  ]}
                  onPress={() => setSelectedGatePass(null)}
                >
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  <Text style={styles.passDoneBtnText}>Done</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

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

          {/* Slots Tab (Active) */}
          <Pressable
            style={styles.navItem}
            onPress={() => {}}
            accessibilityRole="tab"
            accessibilityState={{ selected: true }}
          >
            <View
              style={[
                styles.navIconWrapper,
                { backgroundColor: theme.primaryGreenBg },
              ]}
            >
              <Ionicons name="calendar" size={22} color={theme.primaryGreen} />
            </View>
            <Text
              style={[
                styles.navLabel,
                { color: theme.primaryGreen, fontWeight: '700' },
              ]}
            >
              {t('tabSlots')}
            </Text>
          </Pressable>

          {/* Help Tab */}
          <Pressable
            style={styles.navItem}
            onPress={() => {
              if (Platform.OS === 'web') {
                console.log('Help clicked');
              } else {
                Alert.alert(t('tabHelp'), 'Kissan Saathi Mandi Support: 1800-180-1551');
              }
            }}
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
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  bookHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  bookHeaderBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 28,
    maxWidth: 540,
    alignSelf: 'center',
    width: '100%',
    gap: 16,
  },

  /* Banner Card */
  bannerCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bannerIconBadge: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerTextCol: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  bannerDesc: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 2,
    lineHeight: 16,
  },
  bannerActionBtn: {
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerActionText: {
    fontSize: 14,
    fontWeight: '700',
  },

  /* Tab Switcher */
  tabSwitchContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  tabSwitchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  tabSwitchBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  tabSwitchText: {
    fontSize: 13,
    fontWeight: '600',
  },

  /* Slots List */
  slotsListContainer: {
    gap: 16,
  },
  slotCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  slotCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  cropBadgeRow: {
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
  cropTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cropNameText: {
    fontSize: 17,
    fontWeight: '700',
  },
  cropHindiText: {
    fontSize: 14,
    fontWeight: '500',
  },
  quantityText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  slotDivider: {
    height: 1,
    width: '100%',
  },
  slotDetailsGrid: {
    padding: 16,
    gap: 12,
  },
  slotDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  slotDetailCol: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 1,
  },
  detailSubValue: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  slotCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  tokenContainer: {
    justifyContent: 'center',
  },
  tokenPrefix: {
    fontSize: 11,
    fontWeight: '500',
  },
  tokenText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  gatePassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  gatePassBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },

  /* Empty State */
  emptyStateCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyStateTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 8,
  },
  emptyStateDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  emptyStateBtn: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emptyStateBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },

  /* Modal Styles */
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
  modalHeaderTitle: {
    fontSize: 19,
    fontWeight: '800',
  },
  modalHeaderSub: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  modalCloseBtn: {
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
    padding: 18,
    gap: 22,
    paddingBottom: 36,
    maxWidth: 540,
    alignSelf: 'center',
    width: '100%',
  },
  formSection: {
    gap: 10,
  },
  formSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  cropGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  cropSelectCard: {
    width: '48%',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropSelectIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  cropSelectName: {
    fontSize: 14,
    fontWeight: '600',
  },
  cropSelectNative: {
    fontSize: 12,
  },
  cropSelectMsp: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },

  /* Quantity input */
  quantityInputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  qtyStepBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyInputCenter: {
    alignItems: 'center',
    flex: 1,
  },
  qtyTextInput: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  qtyUnit: {
    fontSize: 12,
    fontWeight: '500',
  },

  /* Mandi list */
  mandiList: {
    gap: 10,
  },
  mandiOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  mandiOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  mandiOptionName: {
    fontSize: 14,
    fontWeight: '600',
  },
  mandiOptionDist: {
    fontSize: 12,
    marginTop: 2,
  },
  slotsAvailableBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  slotsAvailableText: {
    fontSize: 11,
    fontWeight: '700',
  },

  /* Dates & Times */
  datesScroll: {
    marginHorizontal: -4,
  },
  datesContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 4,
  },
  dateBox: {
    width: 72,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBoxDay: {
    fontSize: 11,
    fontWeight: '500',
  },
  dateBoxNum: {
    fontSize: 20,
    fontWeight: '800',
    marginVertical: 2,
  },
  dateBoxLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  timeSlotCard: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  timeSlotTextContainer: {
    flex: 1,
  },
  timeSlotLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  timeSlotRange: {
    fontSize: 11,
    marginTop: 2,
  },

  /* Vehicle Card */
  vehicleCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  vehicleTypeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  vehicleTypeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  vehicleTypeText: {
    fontSize: 11,
  },
  vehicleInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  vehicleTextInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },

  /* Summary Card */
  summaryCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  summaryTotal: {
    fontSize: 18,
    fontWeight: '800',
  },

  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
  },
  confirmBookingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 16,
  },
  confirmBookingBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  /* Gate Pass Modal */
  passModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  gatePassCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  passHeader: {
    backgroundColor: '#1B5E20',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  passBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  passBrandText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  passCloseIcon: {
    padding: 4,
  },
  passContent: {
    padding: 20,
    alignItems: 'center',
    gap: 16,
  },
  passTokenBadge: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 16,
    width: '100%',
  },
  passTokenLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
    letterSpacing: 1,
  },
  passTokenNumber: {
    fontSize: 32,
    fontWeight: '900',
    marginVertical: 2,
  },
  passSlotId: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  qrCodeBox: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    width: '100%',
  },
  qrScanPrompt: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 8,
    textAlign: 'center',
  },
  passDetailsList: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  passDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  passDetailKey: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  passDetailVal: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '700',
  },
  passDoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
    paddingVertical: 13,
    borderRadius: 14,
  },
  passDoneBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
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
