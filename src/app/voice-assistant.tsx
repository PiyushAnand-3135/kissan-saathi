import { useConversation } from '@/context/conversation-context';
import { useFarmer } from '@/context/farmer-context';
import { useSettings } from '@/context/settings-context';
import { Ionicons } from '@expo/vector-icons';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

type Phase = 'idle' | 'recording' | 'transcribing' | 'thinking';

export default function VoiceAssistantScreen() {
  const router = useRouter();
  const { theme, t, currentLanguageOption } = useSettings();
  const { farmerId, farmer } = useFarmer();
  const { messages, addMessage } = useConversation();

  const [phase, setPhase] = useState<Phase>('idle');
  const listRef = useRef<FlatList>(null);
  const pulse = useRef(new Animated.Value(1)).current;

  // Tracks whether THIS screen is the one currently on top -- checked
  // right before auto-speaking a response. Needed because the request
  // that produces that response can still be in flight when the farmer
  // navigates away (slow network, or they just didn't wait); without this
  // check, a late-arriving answer would start speaking on a screen the
  // farmer already left, seconds or longer after the fact.
  const isFocusedRef = useRef(true);

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (status.granted) {
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      }
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      isFocusedRef.current = true;
      return () => {
        isFocusedRef.current = false;
        Speech.stop();
      };
    }, [])
  );

  useEffect(() => {
    if (phase === 'recording') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.15, duration: 500, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulse.setValue(1);
    }
  }, [phase, pulse]);

  const scrollToEnd = () => setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);

  const handlePress = useCallback(async () => {
    if (phase === 'recording') {
      setPhase('transcribing');
      try {
        await audioRecorder.stop();
        const uri = audioRecorder.uri;
        if (!uri) {
          setPhase('idle');
          return;
        }

        const audioBase64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const transcribeRes = await fetch(`${API_BASE_URL}/transcribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audio_base64: audioBase64, mime_type: 'audio/mp4' }),
        });
        if (!transcribeRes.ok) {
          const errorBody = await transcribeRes.text();
          console.error('Transcribe failed:', transcribeRes.status, errorBody);
          throw new Error(`Transcribe failed: ${transcribeRes.status}`);
        }
        const { text: spokenText } = await transcribeRes.json();
        if (!spokenText) {
          setPhase('idle');
          return;
        }

        const historyForRequest = messages.map((m) => ({ role: m.role, text: m.text }));
        addMessage({ id: `f-${Date.now()}`, role: 'farmer', text: spokenText });
        scrollToEnd();
        setPhase('thinking');

        const chatRes = await fetch(`${API_BASE_URL}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            farmer_id: farmerId,
            message: spokenText,
            crop: farmer?.primaryCrops?.[0],
            history: historyForRequest,
          }),
        });
        if (!chatRes.ok) throw new Error(`Chat failed: ${chatRes.status}`);
        const data = await chatRes.json();

        addMessage({ id: `a-${Date.now()}`, role: 'assistant', text: data.answer, usedMemory: data.used_memory });
        // Only speak if this screen is still the one on top -- see
        // isFocusedRef comment above for why this check is necessary.
        if (isFocusedRef.current) {
          Speech.speak(data.answer, { language: currentLanguageOption?.code });
        }
      } catch (error) {
        console.error('Voice assistant error:', error);
        addMessage({ id: `err-${Date.now()}`, role: 'assistant', text: t('chatConnectionError') });
      } finally {
        setPhase('idle');
        scrollToEnd();
      }
    } else if (phase === 'idle') {
      Speech.stop();
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setPhase('recording');
    }
  }, [phase, audioRecorder, messages, addMessage, farmerId, farmer, currentLanguageOption, t]);

  const statusLabel =
    phase === 'recording' ? t('listening')
    : phase === 'transcribing' ? t('voiceProcessing')
    : phase === 'thinking' ? t('chatThinking')
    : t('tapToSpeak');

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backButton, { backgroundColor: theme.surface }]}>
          <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>{t('voiceAssistantTitle')}</Text>
        <Pressable onPress={() => router.push('/chat')} hitSlop={8}>
          <Text style={[styles.typeInsteadLink, { color: theme.primaryGreen }]}>{t('typeInsteadLink')}</Text>
        </Pressable>
      </View>

      {messages.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="mic-outline" size={40} color={theme.textMuted} />
          <Text style={[styles.emptyStateText, { color: theme.textMuted }]}>{t('chatEmptyState')}</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View
              style={[
                styles.bubble,
                item.role === 'farmer'
                  ? [styles.bubbleFarmer, { backgroundColor: theme.primaryGreen }]
                  : [styles.bubbleAssistant, { backgroundColor: theme.surface, borderColor: theme.border }],
              ]}
            >
              <Text style={{ color: item.role === 'farmer' ? '#FFFFFF' : theme.textPrimary, fontSize: 15, lineHeight: 21 }}>
                {item.text}
              </Text>
              {item.role === 'assistant' && (
                <Pressable onPress={() => Speech.speak(item.text, { language: currentLanguageOption?.code })} hitSlop={8} style={styles.replayButton}>
                  <Ionicons name="volume-medium-outline" size={16} color={theme.textMuted} />
                </Pressable>
              )}
            </View>
          )}
        />
      )}

      <View style={styles.micArea}>
        <Text style={[styles.statusLabel, { color: theme.textMuted }]}>{statusLabel}</Text>
        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          <Pressable
            onPress={handlePress}
            disabled={phase === 'transcribing' || phase === 'thinking'}
            style={[
              styles.micButton,
              { backgroundColor: phase === 'recording' ? '#DC2626' : theme.primaryGreen },
            ]}
          >
            {phase === 'transcribing' || phase === 'thinking' ? (
              <ActivityIndicator size="large" color="#FFFFFF" />
            ) : (
              <Ionicons name={phase === 'recording' ? 'stop' : 'mic'} size={42} color="#FFFFFF" />
            )}
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.2 },
  typeInsteadLink: { fontSize: 13, fontWeight: '600' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40 },
  emptyStateText: { fontSize: 14, textAlign: 'center' },
  list: { padding: 16, gap: 10 },
  bubble: { maxWidth: '82%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 4 },
  bubbleFarmer: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  bubbleAssistant: { alignSelf: 'flex-start', borderBottomLeftRadius: 4, borderWidth: 1 },
  replayButton: { marginTop: 6, alignSelf: 'flex-start' },
  micArea: { alignItems: 'center', paddingVertical: 28, gap: 14 },
  statusLabel: { fontSize: 14, fontWeight: '500' },
  micButton: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
});
