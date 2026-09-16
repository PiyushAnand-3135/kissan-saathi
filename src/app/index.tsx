import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  Animated,
  ActivityIndicator,
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
import { useFarmerLocation } from '@/context/location-context';
import { useFarmer } from '@/context/farmer-context';
import { getNearbyMandisForLocation } from '@/constants/mandis';
import { LocationModal } from '@/components/location-modal';
import { AppThemePalette } from '@/constants/theme';

interface ActionCardProps {
  title: string;
  iconName: string;
  iconType: 'ionicons' | 'material' | 'font-awesome';
  theme: AppThemePalette;
  onPress: () => void;
}

function ActionCard({ title, iconName, iconType, theme, onPress }: ActionCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 30,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 4,
      tension: 40,
    }).start();
  };

  const renderIcon = () => {
    const iconSize = 32;
    const iconColor = theme.primaryGreen;

    if (iconType === 'ionicons') {
      return <Ionicons name={iconName as any} size={iconSize} color={iconColor} />;
    }
    if (iconType === 'font-awesome') {
      return <FontAwesome5 name={iconName} size={iconSize - 2} color={iconColor} />;
    }
    return <MaterialCommunityIcons name={iconName as any} size={iconSize + 2} color={iconColor} />;
  };

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        style={[
          styles.card,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={{ color: 'rgba(46, 125, 50, 0.08)', borderless: false }}
        accessibilityRole="button"
        accessibilityLabel={title}
      >
        <View
          style={[
            styles.cardIconContainer,
            { backgroundColor: theme.primaryGreenBg },
          ]}
        >
          {renderIcon()}
        </View>
        <Text
          style={[
            styles.cardTitle,
            { color: theme.textPrimary },
          ]}
          numberOfLines={2}
        >
          {title}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { theme, t, currentLanguageOption } = useSettings();
  const { location, isLoading: isLocationLoading, fetchCurrentLocation } = useFarmerLocation();
  const { farmer } = useFarmer();

  const [isListening, setIsListening] = useState(false);
  const [activeTab, setActiveTab] = useState<'Home' | 'Slots' | 'Help' | 'Profile'>('Home');

  // Pulse animation for mic outer glow
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.7)).current;
  const micButtonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.15,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(opacityAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0.6,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      opacityAnim.setValue(0.7);
    }
  }, [isListening]);

  const handleMicPress = () => {
    Animated.sequence([
      Animated.timing(micButtonScale, {
        toValue: 0.92,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(micButtonScale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    setIsListening((prev) => !prev);
    router.push('/voice-assistant');
  };

  const handleCardPress = (feature: string) => {
    if (feature === t('nearbyMandis')) {
      const mandis = getNearbyMandisForLocation(
        location.latitude,
        location.longitude,
        location.city || location.district,
        location.state
      );

      const mandiListText = mandis
        .map((m, i) => `${i + 1}. ${m.name} (${m.distance})\n   • ${m.gate} | ${m.availableSlots} ${t('slotsAvailableSuffix')}`)
        .join('\n\n');

      Alert.alert(
        t('nearbyMandisTitle'),
        `${t('mandisClosestTo')} ${location.formattedAddress}:\n\n${mandiListText}`,
        [
          { text: t('close'), style: 'cancel' },
          { text: t('bookDeliverySlot'), onPress: () => router.push('/slots') },
        ]
      );
    } else {
      if (Platform.OS === 'web') {
        console.log(`Navigating to ${feature}`);
      } else {
        Alert.alert(feature, `${feature}...`);
      }
    }
  };

  const navigateToProfile = () => {
    router.push('/profile');
  };

  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);

  const handleLocationPress = () => {
    setIsLocationModalVisible(true);
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
      edges={['top', 'left', 'right']}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header: Branding, Language Selector & Profile */}
        <View style={styles.header}>
          <View style={styles.brandingContainer}>
            <View
              style={[
                styles.brandIconBadge,
                { backgroundColor: theme.primaryGreen },
              ]}
            >
              <MaterialCommunityIcons name="sprout" size={20} color="#FFFFFF" />
            </View>
            <View>
              <Text style={[styles.brandTitle, { color: theme.textPrimary }]}>
                {t('appName')}
              </Text>
              <Text style={[styles.brandSubtitle, { color: theme.primaryGreen }]}>
                {t('appSubtitle')}
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            {/* Language Selector Pill */}
            <Pressable
              style={[
                styles.languagePill,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
              onPress={navigateToProfile}
              accessibilityRole="button"
              accessibilityLabel="Select Language"
            >
              <Ionicons
                name="globe-outline"
                size={16}
                color={theme.textPrimary}
                style={styles.globeIcon}
              />
              <Text style={[styles.languageText, { color: theme.textPrimary }]}>
                {currentLanguageOption.nativeName}
              </Text>
              <Ionicons name="chevron-down" size={14} color={theme.textMuted} />
            </Pressable>

            {/* Profile Avatar */}
            <Pressable
              style={[
                styles.profileAvatar,
                {
                  backgroundColor: theme.primaryGreenBg,
                  borderColor: theme.primaryGreen,
                },
              ]}
              onPress={navigateToProfile}
              accessibilityRole="button"
              accessibilityLabel="Farmer Profile and Settings"
            >
              <Ionicons name="person" size={18} color={theme.primaryGreen} />
            </Pressable>
          </View>
        </View>

        {/* Greeting Section & Location Pill */}
        <View style={styles.greetingContainer}>
          <View style={styles.greetingHeaderRow}>
            <View>
              <Text style={[styles.greetingSalutation, { color: theme.textSecondary }]}>
                {t('greetingSalutation')}
              </Text>
              <View style={styles.greetingNameRow}>
                <Text style={[styles.greetingName, { color: theme.textPrimary }]}>
                  {farmer?.name || t('greetingName')}
                </Text>
                <Text style={styles.greetingEmoji}> 👋</Text>
              </View>
            </View>

            {/* Live Location Pill Button */}
            <Pressable
              style={[
                styles.locationBadge,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
              onPress={handleLocationPress}
              accessibilityRole="button"
              accessibilityLabel={`Location: ${location.formattedAddress}. Tap to update via GPS.`}
            >
              {isLocationLoading ? (
                <ActivityIndicator size="small" color={theme.primaryGreen} />
              ) : (
                <Ionicons
                  name="location"
                  size={15}
                  color={theme.primaryGreen}
                />
              )}
              <View style={styles.locationTextWrapper}>
                <Text
                  style={[styles.locationName, { color: theme.textPrimary }]}
                  numberOfLines={1}
                >
                  {location.city || location.district || 'Nagpur'}
                </Text>
                <Text style={[styles.locationState, { color: theme.textMuted }]}>
                  {location.state || 'Maharashtra'}
                </Text>
              </View>
              <Ionicons
                name="refresh-outline"
                size={13}
                color={theme.textMuted}
              />
            </Pressable>
          </View>
        </View>

        {/* Hero Voice Microphone Section */}
        <View style={styles.voiceSection}>
          <View style={styles.micRippleContainer}>
            {/* Outer Soft Coral Ripple Circle */}
            <Animated.View
              style={[
                styles.micOuterRipple,
                {
                  backgroundColor: theme.micRippleOuter,
                  transform: [{ scale: pulseAnim }],
                  opacity: opacityAnim,
                },
              ]}
            />

            {/* Middle Soft Coral Ripple Circle */}
            <View
              style={[
                styles.micMiddleRipple,
                { backgroundColor: theme.micRippleMiddle },
              ]}
            />

            {/* Core Circular Red/Coral Microphone Button */}
            <Animated.View style={{ transform: [{ scale: micButtonScale }] }}>
              <Pressable
                style={[
                  styles.micButton,
                  { backgroundColor: isListening ? theme.micCoralActive : theme.micCoral },
                ]}
                onPress={handleMicPress}
                accessibilityRole="button"
                accessibilityLabel="Tap to speak with Kissan Saathi voice assistant"
              >
                <Ionicons
                  name={isListening ? 'mic' : 'mic-outline'}
                  size={52}
                  color="#FFFFFF"
                />
              </Pressable>
            </Animated.View>
          </View>

          {/* Voice Prompt Label */}
          <Pressable onPress={handleMicPress}>
            <Text style={[styles.tapToSpeakText, { color: theme.textSecondary }]}>
              {isListening ? t('listening') : t('tapToSpeak')}
            </Text>
          </Pressable>
        </View>

        {/* Quick Action Cards (2x2 Grid) */}
        <View style={styles.gridContainer}>
          <View style={styles.gridRow}>
            <ActionCard
              title={t('bookSlot')}
              iconName="calendar-month-outline"
              iconType="material"
              theme={theme}
              onPress={() => router.push('/slots')}
            />
            <ActionCard
              title={t('paymentStatus')}
              iconName="currency-inr"
              iconType="material"
              theme={theme}
              onPress={() => router.push('/payments')}
            />
          </View>

          <View style={styles.gridRow}>
            <ActionCard
              title={t('nearbyMandis')}
              iconName="location-sharp"
              iconType="ionicons"
              theme={theme}
              onPress={() => router.push('/mandis')}
            />
            <ActionCard
              title={t('myCrops')}
              iconName="file-document-outline"
              iconType="material"
              theme={theme}
              onPress={() => router.push('/crops')}
            />
          </View>
        </View>
      </ScrollView>

      {/* Simple Bottom Navigation */}
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
            onPress={() => setActiveTab('Home')}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'Home' }}
          >
            <View
              style={[
                styles.navIconWrapper,
                activeTab === 'Home' && {
                  backgroundColor: theme.primaryGreenBg,
                },
              ]}
            >
              <Ionicons
                name={activeTab === 'Home' ? 'home' : 'home-outline'}
                size={22}
                color={activeTab === 'Home' ? theme.primaryGreen : theme.textMuted}
              />
            </View>
            <Text
              style={[
                styles.navLabel,
                { color: theme.textMuted },
                activeTab === 'Home' && {
                  color: theme.primaryGreen,
                  fontWeight: '700',
                },
              ]}
            >
              {t('tabHome')}
            </Text>
          </Pressable>

          {/* Slots Tab */}
          <Pressable
            style={styles.navItem}
            onPress={() => router.push('/slots')}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'Slots' }}
          >
            <View
              style={[
                styles.navIconWrapper,
                activeTab === 'Slots' && {
                  backgroundColor: theme.primaryGreenBg,
                },
              ]}
            >
              <Ionicons
                name={activeTab === 'Slots' ? 'calendar' : 'calendar-outline'}
                size={22}
                color={activeTab === 'Slots' ? theme.primaryGreen : theme.textMuted}
              />
            </View>
            <Text
              style={[
                styles.navLabel,
                { color: theme.textMuted },
                activeTab === 'Slots' && {
                  color: theme.primaryGreen,
                  fontWeight: '700',
                },
              ]}
            >
              {t('tabSlots')}
            </Text>
          </Pressable>

          {/* Help Tab */}
          <Pressable
            style={styles.navItem}
            onPress={() => {
              setActiveTab('Help');
              if (Platform.OS === 'web') {
                console.log('Help clicked');
              } else {
                Alert.alert(t('tabHelp'), 'Kissan Saathi Farmer Helpline: 1800-180-1551');
              }
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'Help' }}
          >
            <View
              style={[
                styles.navIconWrapper,
                activeTab === 'Help' && {
                  backgroundColor: theme.primaryGreenBg,
                },
              ]}
            >
              <Ionicons
                name={
                  activeTab === 'Help'
                    ? 'help-circle'
                    : 'help-circle-outline'
                }
                size={23}
                color={activeTab === 'Help' ? theme.primaryGreen : theme.textMuted}
              />
            </View>
            <Text
              style={[
                styles.navLabel,
                { color: theme.textMuted },
                activeTab === 'Help' && {
                  color: theme.primaryGreen,
                  fontWeight: '700',
                },
              ]}
            >
              {t('tabHelp')}
            </Text>
          </Pressable>

          {/* Profile Tab */}
          <Pressable
            style={styles.navItem}
            onPress={navigateToProfile}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'Profile' }}
          >
            <View
              style={[
                styles.navIconWrapper,
                activeTab === 'Profile' && {
                  backgroundColor: theme.primaryGreenBg,
                },
              ]}
            >
              <Ionicons
                name={activeTab === 'Profile' ? 'person' : 'person-outline'}
                size={22}
                color={activeTab === 'Profile' ? theme.primaryGreen : theme.textMuted}
              />
            </View>
            <Text
              style={[
                styles.navLabel,
                { color: theme.textMuted },
                activeTab === 'Profile' && {
                  color: theme.primaryGreen,
                  fontWeight: '700',
                },
              ]}
            >
              {t('tabProfile')}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Farm Location Selection Modal */}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    maxWidth: 540,
    alignSelf: 'center',
    width: '100%',
  },

  /* Header Styles */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 12,
  },
  brandingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: -1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  languagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  globeIcon: {
    marginRight: 6,
  },
  languageText: {
    fontSize: 13,
    fontWeight: '600',
    marginRight: 4,
  },
  profileAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  /* Greeting Styles */
  greetingContainer: {
    marginTop: 2,
    marginBottom: 20,
    paddingHorizontal: 2,
  },
  greetingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingSalutation: {
    fontSize: 20,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  greetingNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  greetingName: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  greetingEmoji: {
    fontSize: 26,
  },

  /* Location Badge */
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  locationTextWrapper: {
    flex: 1,
  },
  locationName: {
    fontSize: 12,
    fontWeight: '700',
  },
  locationState: {
    fontSize: 10,
    fontWeight: '500',
  },

  /* Voice / Mic Section */
  voiceSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  micRippleContainer: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  micOuterRipple: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
  },
  micMiddleRipple: {
    position: 'absolute',
    width: 165,
    height: 165,
    borderRadius: 82.5,
  },
  micButton: {
    width: 124,
    height: 124,
    borderRadius: 62,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  tapToSpeakText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 14,
    letterSpacing: 0.2,
  },

  /* 2x2 Grid Section */
  gridContainer: {
    marginTop: 24,
    marginBottom: 10,
    gap: 14,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 14,
  },
  cardWrapper: {
    flex: 1,
  },
  card: {
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 112,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 19,
  },

  /* Bottom Navigation Styles */
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
