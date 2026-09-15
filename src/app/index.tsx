import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  Animated,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
  Feather,
} from '@expo/vector-icons';

interface ActionCardProps {
  title: string;
  iconName: string;
  iconType: 'ionicons' | 'material' | 'font-awesome';
  onPress: () => void;
}

function ActionCard({ title, iconName, iconType, onPress }: ActionCardProps) {
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
    const iconSize = 34;
    const iconColor = '#2E7D32';

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
        style={styles.card}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={{ color: 'rgba(46, 125, 50, 0.08)', borderless: false }}
        accessibilityRole="button"
        accessibilityLabel={title}
      >
        <View style={styles.cardIconContainer}>
          {renderIcon()}
        </View>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {title}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen() {
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
  };

  const handleCardPress = (feature: string) => {
    // Action handler placeholder
    if (Platform.OS === 'web') {
      console.log(`Navigating to ${feature}`);
    } else {
      Alert.alert(feature, `Opening ${feature}...`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header: Branding, Language Selector & Profile */}
        <View style={styles.header}>
          <View style={styles.brandingContainer}>
            <View style={styles.brandIconBadge}>
              <MaterialCommunityIcons name="sprout" size={20} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.brandTitle}>Kissan Saathi</Text>
              <Text style={styles.brandSubtitle}>Farmer Assistant</Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            {/* Language Selector Pill */}
            <Pressable
              style={styles.languagePill}
              onPress={() => {
                if (Platform.OS === 'web') {
                  console.log('Switch Language');
                } else {
                  Alert.alert('Language', 'Language selection: English');
                }
              }}
              accessibilityRole="button"
              accessibilityLabel="Select Language"
            >
              <Ionicons name="globe-outline" size={16} color="#374151" style={styles.globeIcon} />
              <Text style={styles.languageText}>English</Text>
              <Ionicons name="chevron-down" size={14} color="#6B7280" />
            </Pressable>

            {/* Profile Avatar */}
            <Pressable
              style={styles.profileAvatar}
              onPress={() => setActiveTab('Profile')}
              accessibilityRole="button"
              accessibilityLabel="Farmer Profile"
            >
              <Ionicons name="person" size={18} color="#4B5563" />
            </Pressable>
          </View>
        </View>

        {/* Greeting Section */}
        <View style={styles.greetingContainer}>
          <Text style={styles.greetingSalutation}>Good morning,</Text>
          <View style={styles.greetingNameRow}>
            <Text style={styles.greetingName}>Ramu</Text>
            <Text style={styles.greetingEmoji}> 👋</Text>
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
                  transform: [{ scale: pulseAnim }],
                  opacity: opacityAnim,
                },
              ]}
            />

            {/* Middle Soft Coral Ripple Circle */}
            <View style={styles.micMiddleRipple} />

            {/* Core Circular Red/Coral Microphone Button */}
            <Animated.View style={{ transform: [{ scale: micButtonScale }] }}>
              <Pressable
                style={[
                  styles.micButton,
                  isListening && styles.micButtonActive,
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
            <Text style={styles.tapToSpeakText}>
              {isListening ? 'Listening... Speak now' : 'Tap to speak'}
            </Text>
          </Pressable>
        </View>

        {/* Quick Action Cards (2x2 Grid) */}
        <View style={styles.gridContainer}>
          <View style={styles.gridRow}>
            <ActionCard
              title="Book a Slot"
              iconName="calendar-month-outline"
              iconType="material"
              onPress={() => handleCardPress('Book a Slot')}
            />
            <ActionCard
              title="Payment Status"
              iconName="currency-inr"
              iconType="material"
              onPress={() => handleCardPress('Payment Status')}
            />
          </View>

          <View style={styles.gridRow}>
            <ActionCard
              title="Nearby Mandis"
              iconName="location-sharp"
              iconType="ionicons"
              onPress={() => handleCardPress('Nearby Mandis')}
            />
            <ActionCard
              title="My Crops"
              iconName="file-document-outline"
              iconType="material"
              onPress={() => handleCardPress('My Crops')}
            />
          </View>
        </View>
      </ScrollView>

      {/* Simple Bottom Navigation */}
      <View style={styles.bottomNavContainer}>
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
                activeTab === 'Home' && styles.navIconWrapperActive,
              ]}
            >
              <Ionicons
                name={activeTab === 'Home' ? 'home' : 'home-outline'}
                size={22}
                color={activeTab === 'Home' ? '#2E7D32' : '#6B7280'}
              />
            </View>
            <Text
              style={[
                styles.navLabel,
                activeTab === 'Home' && styles.navLabelActive,
              ]}
            >
              Home
            </Text>
          </Pressable>

          {/* Slots Tab */}
          <Pressable
            style={styles.navItem}
            onPress={() => setActiveTab('Slots')}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'Slots' }}
          >
            <View
              style={[
                styles.navIconWrapper,
                activeTab === 'Slots' && styles.navIconWrapperActive,
              ]}
            >
              <Ionicons
                name={activeTab === 'Slots' ? 'calendar' : 'calendar-outline'}
                size={22}
                color={activeTab === 'Slots' ? '#2E7D32' : '#6B7280'}
              />
            </View>
            <Text
              style={[
                styles.navLabel,
                activeTab === 'Slots' && styles.navLabelActive,
              ]}
            >
              Slots
            </Text>
          </Pressable>

          {/* Help Tab */}
          <Pressable
            style={styles.navItem}
            onPress={() => setActiveTab('Help')}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'Help' }}
          >
            <View
              style={[
                styles.navIconWrapper,
                activeTab === 'Help' && styles.navIconWrapperActive,
              ]}
            >
              <Ionicons
                name={
                  activeTab === 'Help'
                    ? 'help-circle'
                    : 'help-circle-outline'
                }
                size={23}
                color={activeTab === 'Help' ? '#2E7D32' : '#6B7280'}
              />
            </View>
            <Text
              style={[
                styles.navLabel,
                activeTab === 'Help' && styles.navLabelActive,
              ]}
            >
              Help
            </Text>
          </Pressable>

          {/* Profile Tab */}
          <Pressable
            style={styles.navItem}
            onPress={() => setActiveTab('Profile')}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'Profile' }}
          >
            <View
              style={[
                styles.navIconWrapper,
                activeTab === 'Profile' && styles.navIconWrapperActive,
              ]}
            >
              <Ionicons
                name={activeTab === 'Profile' ? 'person' : 'person-outline'}
                size={22}
                color={activeTab === 'Profile' ? '#2E7D32' : '#6B7280'}
              />
            </View>
            <Text
              style={[
                styles.navLabel,
                activeTab === 'Profile' && styles.navLabelActive,
              ]}
            >
              Profile
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
    backgroundColor: '#F7F9F6',
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
    marginBottom: 16,
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
    backgroundColor: '#2E7D32',
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
    color: '#1B3820',
    letterSpacing: -0.2,
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#527958',
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    color: '#374151',
    marginRight: 4,
  },
  profileAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  /* Greeting Styles */
  greetingContainer: {
    marginTop: 4,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  greetingSalutation: {
    fontSize: 22,
    fontWeight: '500',
    color: '#374151',
    letterSpacing: -0.2,
  },
  greetingNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  greetingName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  greetingEmoji: {
    fontSize: 28,
  },

  /* Voice / Mic Section */
  voiceSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
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
    backgroundColor: 'rgba(254, 205, 211, 0.45)', // very soft light pink/coral
  },
  micMiddleRipple: {
    position: 'absolute',
    width: 165,
    height: 165,
    borderRadius: 82.5,
    backgroundColor: 'rgba(254, 202, 202, 0.65)', // soft pink/coral
  },
  micButton: {
    width: 124,
    height: 124,
    borderRadius: 62,
    backgroundColor: '#F87171', // warm coral/red matching reference photo
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
  micButtonActive: {
    backgroundColor: '#EF4444',
    shadowOpacity: 0.5,
  },
  tapToSpeakText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 14,
    letterSpacing: 0.2,
  },

  /* 2x2 Grid Section */
  gridContainer: {
    marginTop: 28,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 112,
    borderWidth: 1,
    borderColor: '#EEF2F0',
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
    backgroundColor: '#F0F7F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2D3748',
    textAlign: 'center',
    lineHeight: 19,
  },

  /* Bottom Navigation Styles */
  bottomNavContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EBECEE',
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
  navIconWrapperActive: {
    backgroundColor: '#E8F5E9',
  },
  navLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  navLabelActive: {
    color: '#2E7D32',
    fontWeight: '700',
  },
});
