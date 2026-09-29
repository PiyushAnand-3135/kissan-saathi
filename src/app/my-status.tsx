import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSettings } from '@/context/settings-context';
import { useFarmer } from '@/context/farmer-context';
import { useSync } from '@/context/sync-context';
import { apiFetch } from '@/lib/api';
import { cachedGet } from '@/lib/cache';
import { enqueue } from '@/lib/outbox';

const POLL_MS = 15000;

type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed';
type Tab = 'money' | 'queue' | 'updates';

interface Payment {
  id: number;
  crop: string | null;
  quantity_qtl: number | null;
  amount: number | null;
  sold_on: string;
  status: PaymentStatus;
  days_waiting: number;
  can_escalate: boolean;
  mandi_name: string | null;
  timeline: { ts: string; status: string; note: string | null }[];
  complaint: { id: number; status: string; note: string | null } | null;
}

interface Slot {
  id: number;
  token: string;
  mandi_name: string | null;
  slot_date: string;
  window: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
  queue: { position: number; est_wait_minutes: number; estimate_is_measured: boolean } | null;
}

interface Notice {
  id: number;
  title: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

interface Complaint {
  id: number;
  ts: string;
  text: string;
  status: string;
  note: string | null;
}

interface Diagnosis {
  source: string;
  photo_needs_ai: boolean;
  diagnosis: {
    title: string;
    cause: string;
    steps: string[];
    carry: string[];
    official_channels: { name: string; site: string }[];
  };
}

const TEXT = {
  en: {
    title: 'My status',
    money: 'Money',
    queue: 'Queue',
    updates: 'Updates',
    offline: 'Showing saved information. Your actions will be sent when you are online.',
    waiting: '{n} action(s) waiting to send',
    loading: 'Loading...',
    loadError: 'Could not load. Check your connection.',
    noPayments: 'No payments recorded yet. When the centre records your sale, it will appear here.',
    soldOn: 'Sold on',
    days: '{n} days waiting',
    pending: 'Pending',
    processing: 'Processing',
    paid: 'Paid',
    failed: 'Failed',
    whyDelayed: 'Why is this delayed?',
    describe: 'What did the bank or centre tell you? (optional)',
    addPhoto: 'Add photo of the message',
    photoAdded: 'Photo added',
    explain: 'Explain',
    explaining: 'Checking...',
    reason: 'Likely reason',
    todo: 'What to do',
    carry: 'Carry with you',
    channels: 'Official places to check',
    src_centre_record: "From the centre's record",
    src_your_message: 'From what you wrote',
    src_ai_reading: 'Read from your photo',
    src_status: 'Based on the payment status',
    photoNeedsAi: 'Reading photos needs the AI service, which is not available right now. Type the message instead.',
    needsInternet: 'This needs an internet connection.',
    raise: 'Raise a complaint',
    queued: 'Saved. It will be sent when you are online.',
    registered: 'Complaint registered.',
    notYet: 'A complaint is not possible yet for this payment.',
    complaint: 'Complaint',
    cs_new: 'Received',
    cs_in_progress: 'In progress',
    cs_resolved: 'Resolved',
    officerNote: 'Officer note',
    others: 'Other complaints',
    queueEmpty: 'You have no upcoming slot in the queue.',
    position: 'You are number {n}',
    wait: 'About {n} minutes',
    estTypical: 'Estimate from typical service time',
    estMeasured: 'Estimate from recent real service times',
    token: 'Token',
    directions: 'Directions',
    updatesEmpty: 'No updates yet.',
  },
  hi: {
    title: 'मेरी स्थिति',
    money: 'पैसा',
    queue: 'कतार',
    updates: 'अपडेट',
    offline: 'सहेजी हुई जानकारी दिख रही है। आपके काम इंटरनेट आने पर भेजे जाएँगे।',
    waiting: '{n} काम भेजने के लिए रुके हैं',
    loading: 'लोड हो रहा है...',
    loadError: 'लोड नहीं हो सका। इंटरनेट जाँचें।',
    noPayments: 'अभी कोई भुगतान दर्ज नहीं है। केंद्र आपकी बिक्री दर्ज करेगा तो यहाँ दिखेगा।',
    soldOn: 'बिक्री की तारीख',
    days: '{n} दिन से इंतज़ार',
    pending: 'लंबित',
    processing: 'प्रक्रिया में',
    paid: 'भुगतान हो गया',
    failed: 'विफल',
    whyDelayed: 'देरी क्यों हो रही है?',
    describe: 'बैंक या केंद्र ने आपको क्या बताया? (वैकल्पिक)',
    addPhoto: 'संदेश की फ़ोटो जोड़ें',
    photoAdded: 'फ़ोटो जोड़ी गई',
    explain: 'समझाएँ',
    explaining: 'जाँच हो रही है...',
    reason: 'संभावित कारण',
    todo: 'क्या करें',
    carry: 'साथ ले जाएँ',
    channels: 'जाँचने की आधिकारिक जगहें',
    src_centre_record: 'केंद्र के रिकॉर्ड से',
    src_your_message: 'आपके लिखे से',
    src_ai_reading: 'आपकी फ़ोटो से पढ़ा गया',
    src_status: 'भुगतान की स्थिति के आधार पर',
    photoNeedsAi: 'फ़ोटो पढ़ने के लिए AI सेवा चाहिए, जो अभी उपलब्ध नहीं है। संदेश लिखकर बताएँ।',
    needsInternet: 'इसके लिए इंटरनेट चाहिए।',
    raise: 'शिकायत दर्ज करें',
    queued: 'सहेज लिया गया। इंटरनेट आने पर भेजा जाएगा।',
    registered: 'शिकायत दर्ज हो गई।',
    notYet: 'इस भुगतान के लिए अभी शिकायत संभव नहीं है।',
    complaint: 'शिकायत',
    cs_new: 'प्राप्त हुई',
    cs_in_progress: 'कार्रवाई जारी है',
    cs_resolved: 'हल हो गई',
    officerNote: 'अधिकारी की टिप्पणी',
    others: 'अन्य शिकायतें',
    queueEmpty: 'कतार में आपका कोई आने वाला स्लॉट नहीं है।',
    position: 'आप {n} नंबर पर हैं',
    wait: 'लगभग {n} मिनट',
    estTypical: 'सामान्य सेवा समय से अनुमान',
    estMeasured: 'हाल के असली सेवा समय से अनुमान',
    token: 'टोकन',
    directions: 'रास्ता देखें',
    updatesEmpty: 'अभी कोई अपडेट नहीं।',
  },
} as const;

type TextKey = keyof typeof TEXT.en;

const STATUS_COLOR: Record<PaymentStatus, { bg: string; fg: string }> = {
  pending: { bg: '#FFFBEB', fg: '#B45309' },
  processing: { bg: '#EFF6FF', fg: '#1D4ED8' },
  paid: { bg: '#ECFDF3', fg: '#15803D' },
  failed: { bg: '#FEF2F2', fg: '#B91C1C' },
};

const fill = (template: string, n: number | string) => template.replace('{n}', String(n));

export default function MyStatusScreen() {
  const router = useRouter();
  const { theme, currentLanguageOption } = useSettings();
  const { farmerId } = useFarmer();
  const { pendingCount, syncNow } = useSync();

  const language = currentLanguageOption?.code;
  const dict = TEXT[language === 'hi' ? 'hi' : 'en'];
  const tx = (key: TextKey) => dict[key];

  const [tab, setTab] = useState<Tab>('money');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stale, setStale] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [openId, setOpenId] = useState<number | null>(null);
  const [describe, setDescribe] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [diagnoses, setDiagnoses] = useState<Record<number, Diagnosis>>({});
  const [messages, setMessages] = useState<Record<number, string>>({});

  const loadAll = useCallback(async () => {
    if (!farmerId) return;
    try {
      const [p, s, n, c] = await Promise.all([
        cachedGet<Payment[]>(farmerId, 'payments', `/farmer/${farmerId}/payments`),
        cachedGet<Slot[]>(farmerId, 'slots', `/farmer/${farmerId}/slots`),
        cachedGet<Notice[]>(farmerId, 'notifications', `/farmer/${farmerId}/notifications`),
        cachedGet<Complaint[]>(farmerId, 'grievances', `/farmer/${farmerId}/grievances`),
      ]);
      setPayments(p.data);
      setSlots(s.data);
      setNotices(n.data);
      setComplaints(c.data);
      setStale(p.stale || s.stale || n.stale || c.stale);
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [farmerId]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
      const timer = setInterval(loadAll, POLL_MS);
      return () => clearInterval(timer);
    }, [loadAll])
  );

  const unread = notices.filter((notice) => !notice.read_at).length;
  useEffect(() => {
    if (tab !== 'updates' || unread === 0 || !farmerId) return;
    apiFetch(`/farmer/${farmerId}/notifications/read`, { method: 'POST' })
      .then(loadAll)
      .catch(() => undefined);
  }, [tab, unread, farmerId, loadAll]);

  const setMessage = (id: number, text: string) => setMessages((prev) => ({ ...prev, [id]: text }));

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.5, base64: true });
    const asset = result.assets?.[0];
    if (!result.canceled && asset?.base64) setPhoto(asset.base64);
  };

  const runDiagnosis = async (payment: Payment, text: string = describe, image: string | null = photo) => {
    if (!farmerId) return;
    setBusyId(payment.id);
    setMessage(payment.id, '');
    try {
      const result = await apiFetch<Diagnosis>(`/farmer/${farmerId}/payments/${payment.id}/diagnose`, {
        method: 'POST',
        timeoutMs: 45000,
        body: { text: text.trim() || undefined, image_base64: image ?? undefined, language },
      });
      setDiagnoses((prev) => ({ ...prev, [payment.id]: result }));
    } catch {
      setMessage(payment.id, tx('needsInternet'));
    } finally {
      setBusyId(null);
    }
  };

  const toggleOpen = (payment: Payment) => {
    setDescribe('');
    setPhoto(null);
    if (openId === payment.id) {
      setOpenId(null);
      return;
    }
    setOpenId(payment.id);
    if (!diagnoses[payment.id]) runDiagnosis(payment, '', null);
  };

  const raiseComplaint = async (payment: Payment) => {
    if (!farmerId) return;
    setBusyId(payment.id);
    const result = await enqueue({
      id: `escalate-${farmerId}-${payment.id}`,
      path: `/farmer/${farmerId}/payments/${payment.id}/escalate`,
      body: { language },
    });
    await syncNow();
    await loadAll();
    setBusyId(null);
    if (result.remaining > 0) setMessage(payment.id, tx('queued'));
    else if (result.dropped > 0 && result.sent === 0) setMessage(payment.id, tx('notYet'));
    else setMessage(payment.id, tx('registered'));
  };

  const linkedComplaintIds = new Set(payments.map((p) => p.complaint?.id).filter((id): id is number => id != null));
  const otherComplaints = complaints.filter((c) => !linkedComplaintIds.has(c.id));
  const csLabel = (status: string) => (TEXT.en as Record<string, string>)[`cs_${status}`] ? tx(`cs_${status}` as TextKey) : status;

  const renderDiagnosis = (payment: Payment) => {
    const result = diagnoses[payment.id];
    return (
      <View style={[styles.diagnosis, { backgroundColor: theme.background, borderColor: theme.borderSubtle }]}>
        <TextInput
          value={describe}
          onChangeText={setDescribe}
          placeholder={tx('describe')}
          placeholderTextColor={theme.textMuted}
          multiline
          style={[styles.input, { color: theme.textPrimary, borderColor: theme.borderSubtle, backgroundColor: theme.surface }]}
        />
        <View style={styles.row}>
          <Pressable onPress={pickPhoto} style={[styles.secondaryButton, { borderColor: theme.borderSubtle }]}>
            <Ionicons name="image-outline" size={20} color={theme.textSecondary} />
            <Text style={[styles.secondaryText, { color: theme.textSecondary }]}>{photo ? tx('photoAdded') : tx('addPhoto')}</Text>
          </Pressable>
          <Pressable
            onPress={() => runDiagnosis(payment)}
            disabled={busyId === payment.id}
            style={[styles.smallButton, { backgroundColor: theme.primaryGreen }]}
          >
            <Text style={styles.smallButtonText}>{busyId === payment.id ? tx('explaining') : tx('explain')}</Text>
          </Pressable>
        </View>

        {result?.photo_needs_ai && <Text style={styles.warning}>{tx('photoNeedsAi')}</Text>}
        {result && (
          <View style={styles.diagnosisBody}>
            <Text style={[styles.sourceTag, { color: theme.textMuted }]}>{tx(`src_${result.source}` as TextKey)}</Text>
            <Text style={[styles.diagTitle, { color: theme.textPrimary }]}>{result.diagnosis.title}</Text>
            <Text style={[styles.body, { color: theme.textSecondary }]}>{result.diagnosis.cause}</Text>
            <Text style={[styles.subHeading, { color: theme.textPrimary }]}>{tx('todo')}</Text>
            {result.diagnosis.steps.map((step, index) => (
              <View key={`${index}-${step}`} style={styles.stepRow}>
                <Text style={[styles.stepNumber, { color: theme.primaryGreen }]}>{index + 1}</Text>
                <Text style={[styles.body, { color: theme.textPrimary, flex: 1 }]}>{step}</Text>
              </View>
            ))}
            <Text style={[styles.subHeading, { color: theme.textPrimary }]}>{tx('carry')}</Text>
            <Text style={[styles.body, { color: theme.textSecondary }]}>{result.diagnosis.carry.join(', ')}</Text>
            <Text style={[styles.subHeading, { color: theme.textPrimary }]}>{tx('channels')}</Text>
            {result.diagnosis.official_channels.map((channel) => (
              <Text key={channel.site} style={[styles.body, { color: theme.textSecondary }]}>
                {channel.name} ({channel.site})
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderPayment = (payment: Payment) => {
    const color = STATUS_COLOR[payment.status];
    return (
      <View key={payment.id} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
              {payment.crop ?? '-'}
              {payment.quantity_qtl != null ? `  ${payment.quantity_qtl} q` : ''}
            </Text>
            <Text style={[styles.meta, { color: theme.textMuted }]}>
              {tx('soldOn')} {new Date(payment.sold_on).toLocaleDateString()}
              {payment.mandi_name ? `  |  ${payment.mandi_name}` : ''}
            </Text>
          </View>
          <View style={[styles.pill, { backgroundColor: color.bg }]}>
            <Text style={[styles.pillText, { color: color.fg }]}>{tx(payment.status)}</Text>
          </View>
        </View>

        {payment.amount != null && (
          <Text style={[styles.amount, { color: theme.textPrimary }]}>{`\u20B9${payment.amount.toLocaleString('en-IN')}`}</Text>
        )}
        {payment.status !== 'paid' && (
          <Text style={[styles.meta, { color: theme.textMuted }]}>{fill(tx('days'), payment.days_waiting)}</Text>
        )}

        <View style={styles.timeline}>
          {payment.timeline.map((event, index) => (
            <Text key={`${event.ts}-${index}`} style={[styles.meta, { color: theme.textMuted }]}>
              {new Date(event.ts).toLocaleDateString()}: {tx(event.status as PaymentStatus)}
              {event.note ? ` (${event.note})` : ''}
            </Text>
          ))}
        </View>

        {payment.complaint && (
          <View style={[styles.complaintBox, { borderColor: theme.primaryGreen, backgroundColor: theme.primaryGreenBg }]}>
            <Text style={[styles.diagTitle, { color: theme.primaryGreenDark }]}>
              {tx('complaint')} #{payment.complaint.id}: {csLabel(payment.complaint.status)}
            </Text>
            {!!payment.complaint.note && (
              <Text style={[styles.body, { color: theme.textSecondary }]}>
                {tx('officerNote')}: {payment.complaint.note}
              </Text>
            )}
          </View>
        )}

        {payment.status !== 'paid' && (
          <Pressable onPress={() => toggleOpen(payment)} style={[styles.linkButton, { borderColor: theme.primaryGreen }]}>
            <Ionicons name="help-circle-outline" size={22} color={theme.primaryGreen} />
            <Text style={[styles.linkText, { color: theme.primaryGreenDark }]}>{tx('whyDelayed')}</Text>
          </Pressable>
        )}
        {openId === payment.id && renderDiagnosis(payment)}

        {payment.can_escalate && (
          <Pressable
            onPress={() => raiseComplaint(payment)}
            disabled={busyId === payment.id}
            style={[styles.primaryButton, { backgroundColor: '#B45309' }]}
          >
            {busyId === payment.id ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>{tx('raise')}</Text>}
          </Pressable>
        )}
        {!!messages[payment.id] && <Text style={[styles.info, { color: theme.primaryGreenDark }]}>{messages[payment.id]}</Text>}
      </View>
    );
  };

  const renderSlot = (slot: Slot) => (
    <View key={slot.id} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
      <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>{slot.mandi_name ?? '-'}</Text>
      <Text style={[styles.meta, { color: theme.textMuted }]}>
        {new Date(slot.slot_date).toLocaleDateString()}  |  {slot.window}  |  {tx('token')} {slot.token}
      </Text>
      {slot.queue ? (
        <View style={[styles.queueBox, { backgroundColor: theme.primaryGreenBg }]}>
          <Text style={[styles.queueNumber, { color: theme.primaryGreenDark }]}>{fill(tx('position'), slot.queue.position)}</Text>
          <Text style={[styles.body, { color: theme.textSecondary }]}>{fill(tx('wait'), slot.queue.est_wait_minutes)}</Text>
          <Text style={[styles.meta, { color: theme.textMuted }]}>
            {slot.queue.estimate_is_measured ? tx('estMeasured') : tx('estTypical')}
          </Text>
        </View>
      ) : (
        <Text style={[styles.meta, { color: theme.textMuted }]}>{slot.status}</Text>
      )}
      {slot.latitude != null && slot.longitude != null && (
        <Pressable
          onPress={() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${slot.latitude},${slot.longitude}`)}
          style={[styles.linkButton, { borderColor: theme.primaryGreen }]}
        >
          <Ionicons name="navigate-outline" size={22} color={theme.primaryGreen} />
          <Text style={[styles.linkText, { color: theme.primaryGreenDark }]}>{tx('directions')}</Text>
        </Pressable>
      )}
    </View>
  );

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: 'money', label: tx('money') },
    { id: 'queue', label: tx('queue') },
    { id: 'updates', label: tx('updates'), badge: unread },
  ];

  const activeSlots = slots.filter((s) => s.queue);
  const pastSlots = slots.filter((s) => !s.queue);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backButton, { backgroundColor: theme.surface }]}>
          <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>{tx('title')}</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.tabBar}>
        {tabs.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => setTab(item.id)}
            style={[styles.tab, { backgroundColor: tab === item.id ? theme.primaryGreen : theme.surface, borderColor: theme.borderSubtle }]}
          >
            <Text style={[styles.tabText, { color: tab === item.id ? '#FFFFFF' : theme.textSecondary }]}>{item.label}</Text>
            {!!item.badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {(stale || pendingCount > 0) && (
          <View style={styles.banner}>
            <Ionicons name="cloud-offline-outline" size={20} color="#92400E" />
            <View style={{ flex: 1 }}>
              {stale && <Text style={styles.bannerText}>{tx('offline')}</Text>}
              {pendingCount > 0 && <Text style={styles.bannerText}>{fill(tx('waiting'), pendingCount)}</Text>}
            </View>
          </View>
        )}

        {loading && <ActivityIndicator color={theme.primaryGreen} style={{ marginTop: 40 }} />}
        {!loading && loadError && <Text style={[styles.empty, { color: theme.textMuted }]}>{tx('loadError')}</Text>}

        {!loading && !loadError && tab === 'money' && (
          <>
            {payments.length === 0 && <Text style={[styles.empty, { color: theme.textMuted }]}>{tx('noPayments')}</Text>}
            {payments.map(renderPayment)}
            {otherComplaints.length > 0 && <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{tx('others')}</Text>}
            {otherComplaints.map((c) => (
              <View key={c.id} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
                <Text style={[styles.diagTitle, { color: theme.textPrimary }]}>
                  {tx('complaint')} #{c.id}: {csLabel(c.status)}
                </Text>
                <Text style={[styles.body, { color: theme.textSecondary }]} numberOfLines={3}>{c.text}</Text>
                {!!c.note && <Text style={[styles.body, { color: theme.primaryGreenDark }]}>{tx('officerNote')}: {c.note}</Text>}
              </View>
            ))}
          </>
        )}

        {!loading && !loadError && tab === 'queue' && (
          <>
            {activeSlots.length === 0 && <Text style={[styles.empty, { color: theme.textMuted }]}>{tx('queueEmpty')}</Text>}
            {activeSlots.map(renderSlot)}
            {pastSlots.map(renderSlot)}
          </>
        )}

        {!loading && !loadError && tab === 'updates' && (
          <>
            {notices.length === 0 && <Text style={[styles.empty, { color: theme.textMuted }]}>{tx('updatesEmpty')}</Text>}
            {notices.map((notice) => (
              <View
                key={notice.id}
                style={[styles.card, { backgroundColor: theme.surface, borderColor: notice.read_at ? theme.borderSubtle : theme.primaryGreen }]}
              >
                <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>{notice.title}</Text>
                <Text style={[styles.body, { color: theme.textSecondary }]}>{notice.body}</Text>
                <Text style={[styles.meta, { color: theme.textMuted }]}>{new Date(notice.created_at).toLocaleString()}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  backButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  tabBar: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  tab: { flex: 1, minHeight: 48, borderRadius: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  tabText: { fontSize: 16, fontWeight: '700' },
  badge: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  badgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  content: { paddingHorizontal: 16, paddingBottom: 40, gap: 14 },
  banner: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: '#FFFBEB', borderRadius: 12, padding: 12 },
  bannerText: { color: '#92400E', fontSize: 14, lineHeight: 20 },
  empty: { textAlign: 'center', fontSize: 16, lineHeight: 23, marginTop: 40, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginTop: 8 },
  card: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardTitle: { fontSize: 18, fontWeight: '800' },
  meta: { fontSize: 14, lineHeight: 20 },
  amount: { fontSize: 22, fontWeight: '800' },
  pill: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  pillText: { fontSize: 14, fontWeight: '800' },
  timeline: { gap: 2, marginTop: 2 },
  body: { fontSize: 16, lineHeight: 23 },
  linkButton: { minHeight: 52, borderRadius: 14, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
  linkText: { fontSize: 16, fontWeight: '700' },
  primaryButton: { minHeight: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  primaryText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  smallButton: { minHeight: 48, borderRadius: 12, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  smallButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  secondaryButton: { flex: 1, minHeight: 48, borderRadius: 12, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 8 },
  secondaryText: { fontSize: 15, fontWeight: '600', flexShrink: 1 },
  input: { minHeight: 56, borderWidth: 1.5, borderRadius: 12, padding: 12, fontSize: 16, textAlignVertical: 'top' },
  diagnosis: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 10 },
  diagnosisBody: { gap: 6 },
  sourceTag: { fontSize: 13, fontWeight: '600' },
  diagTitle: { fontSize: 17, fontWeight: '800' },
  subHeading: { fontSize: 16, fontWeight: '800', marginTop: 6 },
  stepRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  stepNumber: { fontSize: 17, fontWeight: '800', width: 22 },
  warning: { color: '#B45309', fontSize: 15, lineHeight: 21 },
  info: { fontSize: 15, fontWeight: '600' },
  complaintBox: { borderWidth: 1.5, borderRadius: 14, padding: 12, gap: 4 },
  queueBox: { borderRadius: 14, padding: 14, gap: 4, alignItems: 'center' },
  queueNumber: { fontSize: 26, fontWeight: '800' },
});
