import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Speech from 'expo-speech';
import * as FileSystem from 'expo-file-system/legacy';
import { useAudioRecorder, useAudioRecorderState, RecordingPresets, AudioModule, setAudioModeAsync } from 'expo-audio';
import { useSettings } from '@/context/settings-context';
import { useFarmer } from '@/context/farmer-context';
import { useConversation, ConversationMessage } from '@/context/conversation-context';

// Set this to your deployed backend, or your machine's LAN IP when testing
// on a physical device via Expo Go (localhost on the phone means the phone
// itself, not your laptop). Configure via EXPO_PUBLIC_API_URL in a .env
// file (already gitignored -- see the backend README for deploy options).
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

export default function ChatScreen() {
  const router = useRouter();
  const { theme, t, currentLanguageOption } = useSettings();
  const { farmerId, farmer } = useFarmer();
  const { messages, addMessage } = useConversation();

  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const listRef = useRef<FlatList>(null);

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

  // useFocusEffect (not a plain unmount effect) is required because
  // push() doesn't unmount the previous screen, so a plain unmount-cleanup
  // effect never fires when navigating forward to another screen.
  useFocusEffect(
    useCallback(() => {
      return () => {
        Speech.stop();
      };
    }, [])
  );

  const scrollToEnd = () => setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);

  const sendMessage = useCallback(
    async (overrideText?: string) => {
      const text = (overrideText ?? input).trim();
      if (!text || isSending || !farmerId) return;

      const historyForRequest = messages.map((m) => ({ role: m.role, text: m.text }));
      addMessage({ id: `u-${Date.now()}`, role: 'farmer', text });
      if (overrideText === undefined) setInput('');
      setIsSending(true);

      try {
        const response = await fetch(`${API_BASE_URL}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            farmer_id: farmerId,
            message: text,
            crop: farmer?.primaryCrops?.[0],
            history: historyForRequest,
          }),
        });

        if (!response.ok) throw new Error(`Server responded with ${response.status}`);

        const data = await response.json();
        addMessage({ id: `a-${Date.now()}`, role: 'assistant', text: data.answer, usedMemory: data.used_memory });
      } catch (error) {
        addMessage({ id: `err-${Date.now()}`, role: 'assistant', text: t('chatConnectionError') });
      } finally {
        setIsSending(false);
        scrollToEnd();
      }
    },
    [input, isSending, farmerId, farmer, messages, addMessage, t]
  );

  // --- Voice input: record with expo-audio (works in plain Expo Go), read
  // the recording as base64, send it as a JSON string field to /transcribe
  // (not a multipart file -- a real device test hit "Unsupported
  // FormDataPart implementation" from RN's networking layer with the file
  // upload approach; base64-in-JSON sidesteps that entirely), then run the
  // transcribed text through the exact same sendMessage() flow as typing. ---
  const toggleRecording = useCallback(async () => {
    if (recorderState.isRecording) {
      setIsTranscribing(true);
      try {
        await audioRecorder.stop();
        const uri = audioRecorder.uri;
        if (!uri) {
          setIsTranscribing(false);
          return;
        }

        const audioBase64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const res = await fetch(`${API_BASE_URL}/transcribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audio_base64: audioBase64, mime_type: 'audio/mp4' }),
        });
        if (!res.ok) {
          const errorBody = await res.text();
          console.error('Transcribe failed:', res.status, errorBody);
          throw new Error(`Transcribe failed: ${res.status}`);
        }
        const data = await res.json();
        if (data.text) await sendMessage(data.text);
      } catch (error) {
        console.error('Voice recording error:', error);
        addMessage({ id: `err-${Date.now()}`, role: 'assistant', text: t('chatConnectionError') });
      } finally {
        setIsTranscribing(false);
      }
    } else {
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    }
  }, [recorderState.isRecording, audioRecorder, sendMessage, addMessage, t]);

  // --- Image input: pick from library WITH base64 (avoids needing a
  // separate file-system read), upload as base64-in-JSON to /chat/image,
  // same reasoning as voice above. ---
  const pickAndSendImage = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.5,
      base64: true,
    });
    if (result.canceled || !result.assets?.[0] || !result.assets[0].base64) return;

    const asset = result.assets[0];
    addMessage({
      id: `u-${Date.now()}`,
      role: 'farmer',
      text: input.trim() || t('chatImageSentLabel'),
      imageUri: asset.uri,
    });
    const caption = input.trim();
    setInput('');
    setIsUploadingImage(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chat/image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmer_id: farmerId,
          message: caption || undefined,
          crop: farmer?.primaryCrops?.[0],
          image_base64: asset.base64,
          mime_type: 'image/jpeg',
        }),
      });
      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Image chat failed:', response.status, errorBody);
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      addMessage({ id: `a-${Date.now()}`, role: 'assistant', text: data.answer, usedMemory: data.used_memory });
    } catch (error) {
      console.error('Image upload error:', error);
      addMessage({ id: `err-${Date.now()}`, role: 'assistant', text: t('chatConnectionError') });
    } finally {
      setIsUploadingImage(false);
      scrollToEnd();
    }
  }, [input, farmerId, farmer, addMessage, t]);

  const speakText = useCallback(
    (text: string) => {
      Speech.speak(text, { language: currentLanguageOption?.code });
    },
    [currentLanguageOption]
  );

  const isBusy = isSending || isTranscribing || isUploadingImage;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backButton, { backgroundColor: theme.surface }]}>
          <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>{t('chatTitle')}</Text>
        <Pressable onPress={() => router.push('/voice-assistant')} style={[styles.backButton, { backgroundColor: theme.surface }]}>
          <Ionicons name="mic-outline" size={20} color={theme.textPrimary} />
        </Pressable>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubble-ellipses-outline" size={40} color={theme.textMuted} />
            <Text style={[styles.emptyStateText, { color: theme.textMuted }]}>{t('chatEmptyState')}</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.bubble,
                  item.role === 'farmer'
                    ? [styles.bubbleFarmer, { backgroundColor: theme.primaryGreen }]
                    : [styles.bubbleAssistant, { backgroundColor: theme.surface, borderColor: theme.border }],
                ]}
              >
                {item.imageUri && (
                  <Image source={{ uri: item.imageUri }} style={styles.messageImage} resizeMode="cover" />
                )}
                <Text style={{ color: item.role === 'farmer' ? '#FFFFFF' : theme.textPrimary, fontSize: 15, lineHeight: 21 }}>
                  {item.text}
                </Text>
                <View style={styles.bubbleFooterRow}>
                  {item.usedMemory && (
                    <View style={styles.memoryTag}>
                      <Ionicons name="time-outline" size={11} color={theme.textMuted} />
                      <Text style={[styles.memoryTagText, { color: theme.textMuted }]}>{t('chatUsedHistory')}</Text>
                    </View>
                  )}
                  {item.role === 'assistant' && (
                    <Pressable onPress={() => speakText(item.text)} hitSlop={8} style={styles.listenButton}>
                      <Ionicons name="volume-medium-outline" size={16} color={theme.textMuted} />
                    </Pressable>
                  )}
                </View>
              </View>
            )}
          />
        )}

        {isSending && (
          <View style={styles.typingRow}>
            <ActivityIndicator size="small" color={theme.primaryGreen} />
            <Text style={[styles.typingText, { color: theme.textMuted }]}>{t('chatThinking')}</Text>
          </View>
        )}
        {isTranscribing && (
          <View style={styles.typingRow}>
            <ActivityIndicator size="small" color={theme.primaryGreen} />
            <Text style={[styles.typingText, { color: theme.textMuted }]}>{t('chatTranscribing')}</Text>
          </View>
        )}
        {isUploadingImage && (
          <View style={styles.typingRow}>
            <ActivityIndicator size="small" color={theme.primaryGreen} />
            <Text style={[styles.typingText, { color: theme.textMuted }]}>{t('chatAnalyzingImage')}</Text>
          </View>
        )}

        <View style={[styles.inputRow, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
          <Pressable
            onPress={pickAndSendImage}
            disabled={isBusy}
            style={[styles.iconButton, { backgroundColor: theme.surface }]}
          >
            <Ionicons name="image-outline" size={26} color={theme.textPrimary} />
          </Pressable>

          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={t('chatInputPlaceholder')}
            placeholderTextColor={theme.textMuted}
            style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.textPrimary }]}
            multiline
            editable={!isBusy}
          />

          <Pressable
            onPress={toggleRecording}
            disabled={isSending || isTranscribing || isUploadingImage}
            style={[
              styles.iconButton,
              { backgroundColor: recorderState.isRecording ? '#DC2626' : theme.surface },
            ]}
          >
            <Ionicons name={recorderState.isRecording ? 'stop' : 'mic-outline'} size={26} color={recorderState.isRecording ? '#FFFFFF' : theme.textPrimary} />
          </Pressable>

          <Pressable
            onPress={() => sendMessage()}
            disabled={!input.trim() || isBusy}
            style={[styles.sendButton, { backgroundColor: input.trim() && !isBusy ? theme.primaryGreen : theme.border }]}
          >
            <Ionicons name="send" size={22} color="#FFFFFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
  headerRightPlaceholder: { width: 40 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40 },
  emptyStateText: { fontSize: 14, textAlign: 'center' },
  messagesList: { padding: 16, gap: 10 },
  bubble: { maxWidth: '82%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 4 },
  bubbleFarmer: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  bubbleAssistant: { alignSelf: 'flex-start', borderBottomLeftRadius: 4, borderWidth: 1 },
  messageImage: { width: 200, height: 150, borderRadius: 10, marginBottom: 8 },
  bubbleFooterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  memoryTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  memoryTagText: { fontSize: 11 },
  listenButton: { padding: 2 },
  typingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingBottom: 6 },
  typingText: { fontSize: 12 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  iconButton: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, borderWidth: 1, borderRadius: 24, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, maxHeight: 110 },
  sendButton: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
});
