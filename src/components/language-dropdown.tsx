import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '@/context/settings-context';
import { LanguageCode, LanguageOption } from '@/constants/translations';
import { AppThemePalette } from '@/constants/theme';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface LanguageDropdownProps {
  theme: AppThemePalette;
}

export function LanguageDropdown({ theme }: LanguageDropdownProps) {
  const { language, setLanguage, languages, currentLanguageOption, t } =
    useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Animation for chevron rotation
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const toggleDropdown = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const nextState = !isOpen;
    setIsOpen(nextState);

    Animated.timing(rotateAnim, {
      toValue: nextState ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();

    if (!nextState) {
      setSearchQuery('');
    }
  };

  const handleSelect = (langCode: LanguageCode) => {
    setLanguage(langCode);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsOpen(false);
    setSearchQuery('');
    Animated.timing(rotateAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const chevronInterpolation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const filteredLanguages = languages.filter((item: LanguageOption) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.nativeName.toLowerCase().includes(query) ||
      (item.region && item.region.toLowerCase().includes(query))
    );
  });

  return (
    <View style={styles.container}>
      {/* Dropdown Header Trigger */}
      <Pressable
        style={[
          styles.triggerCard,
          {
            backgroundColor: theme.surface,
            borderColor: isOpen ? theme.primaryGreen : theme.border,
            shadowColor: '#000',
          },
          isOpen && {
            borderBottomLeftRadius: 8,
            borderBottomRightRadius: 8,
          },
        ]}
        onPress={toggleDropdown}
        accessibilityRole="button"
        accessibilityLabel={`${t('appLanguage')}: ${currentLanguageOption.name}. Tap to change language.`}
        accessibilityState={{ expanded: isOpen }}
      >
        <View style={styles.triggerLeft}>
          <View
            style={[
              styles.globeBadge,
              { backgroundColor: theme.primaryGreenBg },
            ]}
          >
            <Ionicons
              name="globe-outline"
              size={20}
              color={theme.primaryGreen}
            />
          </View>
          <View style={styles.triggerTextContainer}>
            <View style={styles.selectedRow}>
              <Text
                style={[
                  styles.selectedNativeName,
                  { color: theme.textPrimary },
                ]}
              >
                {currentLanguageOption.nativeName}
              </Text>
              <Text
                style={[
                  styles.selectedEnglishName,
                  { color: theme.textMuted },
                ]}
              >
                ({currentLanguageOption.name})
              </Text>
            </View>
            <Text style={[styles.regionText, { color: theme.textMuted }]}>
              {currentLanguageOption.region || t('selectedLanguage')}
            </Text>
          </View>
        </View>

        <Animated.View style={{ transform: [{ rotate: chevronInterpolation }] }}>
          <View
            style={[
              styles.chevronCircle,
              {
                backgroundColor: isOpen
                  ? theme.primaryGreenBg
                  : theme.isDark
                  ? '#2B322D'
                  : '#F3F4F6',
              },
            ]}
          >
            <Ionicons
              name="chevron-down"
              size={18}
              color={isOpen ? theme.primaryGreen : theme.textMuted}
            />
          </View>
        </Animated.View>
      </Pressable>

      {/* Expandable Dropdown Menu Container */}
      {isOpen && (
        <View
          style={[
            styles.dropdownMenu,
            {
              backgroundColor: theme.surface,
              borderColor: theme.primaryGreen,
              borderTopColor: theme.borderSubtle,
            },
          ]}
        >
          {/* Search Input for fast navigation across multiple languages */}
          {languages.length > 5 && (
            <View
              style={[
                styles.searchContainer,
                {
                  backgroundColor: theme.isDark ? '#181D1A' : '#F9FBFA',
                  borderColor: theme.border,
                },
              ]}
            >
              <Ionicons
                name="search"
                size={16}
                color={theme.textMuted}
                style={styles.searchIcon}
              />
              <TextInput
                style={[
                  styles.searchInput,
                  { color: theme.textPrimary },
                ]}
                placeholder={t('searchLanguagePlaceholder') || 'Search language...'}
                placeholderTextColor={theme.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={false}
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <Ionicons
                    name="close-circle"
                    size={16}
                    color={theme.textMuted}
                  />
                </Pressable>
              )}
            </View>
          )}

          {/* Languages Scroll List */}
          <ScrollView
            style={styles.listScrollView}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
          >
            {filteredLanguages.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                  No languages found
                </Text>
              </View>
            ) : (
              filteredLanguages.map((item: LanguageOption, index: number) => {
                const isSelected = language === item.code;
                const isLast = index === filteredLanguages.length - 1;

                return (
                  <Pressable
                    key={item.code}
                    style={[
                      styles.optionRow,
                      isSelected && {
                        backgroundColor: theme.primaryGreenBg,
                      },
                      !isLast && {
                        borderBottomWidth: 1,
                        borderBottomColor: theme.border,
                      },
                    ]}
                    onPress={() => handleSelect(item.code)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`${item.name} (${item.nativeName})`}
                  >
                    <View style={styles.optionInfo}>
                      <View style={styles.optionTitleRow}>
                        <Text
                          style={[
                            styles.optionNativeName,
                            { color: theme.textPrimary },
                            isSelected && {
                              color: theme.primaryGreen,
                              fontWeight: '700',
                            },
                          ]}
                        >
                          {item.nativeName}
                        </Text>
                        <Text
                          style={[
                            styles.optionEnglishName,
                            { color: theme.textMuted },
                            isSelected && {
                              color: theme.primaryGreen,
                              fontWeight: '600',
                            },
                          ]}
                        >
                          • {item.name}
                        </Text>
                      </View>
                      {item.region && (
                        <Text
                          style={[
                            styles.optionRegion,
                            { color: theme.textMuted },
                          ]}
                        >
                          {item.region}
                        </Text>
                      )}
                    </View>

                    <View
                      style={[
                        styles.radioIndicator,
                        {
                          borderColor: isSelected
                            ? theme.primaryGreen
                            : theme.borderSubtle,
                        },
                        isSelected && {
                          backgroundColor: theme.primaryGreen,
                        },
                      ]}
                    >
                      {isSelected && (
                        <Ionicons
                          name="checkmark"
                          size={13}
                          color="#FFFFFF"
                        />
                      )}
                    </View>
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  triggerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  triggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  globeBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  triggerTextContainer: {
    flex: 1,
  },
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  selectedNativeName: {
    fontSize: 16,
    fontWeight: '700',
  },
  selectedEnglishName: {
    fontSize: 14,
    fontWeight: '500',
  },
  regionText: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 2,
  },
  chevronCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  dropdownMenu: {
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    marginTop: -2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  listScrollView: {
    maxHeight: 250,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  optionInfo: {
    flex: 1,
    paddingRight: 12,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  optionNativeName: {
    fontSize: 15,
    fontWeight: '600',
  },
  optionEnglishName: {
    fontSize: 13,
    fontWeight: '400',
  },
  optionRegion: {
    fontSize: 11,
    marginTop: 2,
  },
  radioIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
