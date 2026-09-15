import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from '@expo/vector-icons';
import { useSettings } from '@/context/settings-context';
import { getCropTranslationKey } from '@/constants/translations';

interface PaymentRecord {
  id: string;
  utrNumber: string;
  cropName: string;
  cropHindi: string;
  quantityQuintals: number;
  ratePerQuintal: number;
  totalAmount: number;
  mandiName: string;
  paymentDate: string;
  status: 'received' | 'processing' | 'pending';
  bankName: string;
  accountLast4: string;
  weighbridgeSlipNo: string;
}

const PAYMENT_RECORDS: PaymentRecord[] = [
  {
    id: 'PAY-8921',
    utrNumber: 'DBT/SBI/20260914/98421',
    cropName: 'Wheat',
    cropHindi: 'गेहूं',
    quantityQuintals: 45,
    ratePerQuintal: 2275,
    totalAmount: 102375,
    mandiName: 'Nagpur APMC Main Yard',
    paymentDate: '15 Sep 2026',
    status: 'processing',
    bankName: 'State Bank of India',
    accountLast4: '5521',
    weighbridgeSlipNo: 'WB-44019',
  },
  {
    id: 'PAY-7612',
    utrNumber: 'DBT/BOB/20260903/12094',
    cropName: 'Cotton',
    cropHindi: 'कपास',
    quantityQuintals: 25,
    ratePerQuintal: 7121,
    totalAmount: 178025,
    mandiName: 'Kalmeshwar Sub-Market',
    paymentDate: '03 Sep 2026',
    status: 'received',
    bankName: 'State Bank of India',
    accountLast4: '5521',
    weighbridgeSlipNo: 'WB-42190',
  },
  {
    id: 'PAY-6540',
    utrNumber: 'DBT/SBI/20260818/88410',
    cropName: 'Soybean',
    cropHindi: 'सोयाबीन',
    quantityQuintals: 30,
    ratePerQuintal: 4892,
    totalAmount: 146760,
    mandiName: 'Hingna Procurement Hub',
    paymentDate: '19 Aug 2026',
    status: 'received',
    bankName: 'State Bank of India',
    accountLast4: '5521',
    weighbridgeSlipNo: 'WB-39820',
  },
  {
    id: 'PAY-5120',
    utrNumber: 'DBT/SBI/20260710/33109',
    cropName: 'Paddy',
    cropHindi: 'धान',
    quantityQuintals: 50,
    ratePerQuintal: 2300,
    totalAmount: 115000,
    mandiName: 'Nagpur APMC Main Yard',
    paymentDate: '11 Jul 2026',
    status: 'received',
    bankName: 'State Bank of India',
    accountLast4: '5521',
    weighbridgeSlipNo: 'WB-31045',
  },
];

export default function PaymentsScreen() {
  const router = useRouter();
  const { theme, t } = useSettings();

  const [filter, setFilter] = useState<'all' | 'received' | 'processing'>('all');
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentRecord | null>(null);

  const filteredPayments = PAYMENT_RECORDS.filter((p) => {
    if (filter === 'received') return p.status === 'received';
    if (filter === 'processing') return p.status === 'processing';
    return true;
  });

  const totalReceived = PAYMENT_RECORDS.filter(
    (p) => p.status === 'received'
  ).reduce((acc, curr) => acc + curr.totalAmount, 0);

  const totalProcessing = PAYMENT_RECORDS.filter(
    (p) => p.status === 'processing'
  ).reduce((acc, curr) => acc + curr.totalAmount, 0);

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
            {t('paymentStatusTitle')}
          </Text>
          <Text style={[styles.headerSub, { color: theme.primaryGreen }]}>
            {t('directBenefitTransfer')}
          </Text>
        </View>

        <View style={styles.headerRightSpace} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Simple Summary Box */}
        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.summaryTopRow}>
            <View>
              <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>
                {t('totalReceivedSeason')}
              </Text>
              <Text
                style={[styles.summaryMainAmount, { color: theme.primaryGreen }]}
              >
                ₹{totalReceived.toLocaleString('en-IN')}
              </Text>
            </View>
            <View
              style={[
                styles.rupeeIconBadge,
                { backgroundColor: theme.primaryGreenBg },
              ]}
            >
              <MaterialCommunityIcons
                name="currency-inr"
                size={28}
                color={theme.primaryGreen}
              />
            </View>
          </View>

          <View
            style={[styles.summaryDivider, { backgroundColor: theme.border }]}
          />

          <View style={styles.summaryBottomRow}>
            <View style={styles.subStat}>
              <Text style={[styles.subStatLabel, { color: theme.textMuted }]}>
                {t('processingInBank')}
              </Text>
              <Text style={styles.subStatAmount}>
                ₹{totalProcessing.toLocaleString('en-IN')}
              </Text>
            </View>

            <View style={styles.bankTag}>
              <Ionicons
                name="shield-checkmark"
                size={14}
                color={theme.primaryGreen}
              />
              <Text
                style={[styles.bankTagText, { color: theme.textPrimary }]}
              >
                SBI ••5521
              </Text>
            </View>
          </View>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          <Pressable
            style={[
              styles.filterPill,
              {
                backgroundColor:
                  filter === 'all'
                    ? theme.primaryGreen
                    : theme.surface,
                borderColor:
                  filter === 'all' ? theme.primaryGreen : theme.border,
              },
            ]}
            onPress={() => setFilter('all')}
          >
            <Text
              style={[
                styles.filterPillText,
                {
                  color:
                    filter === 'all' ? '#FFFFFF' : theme.textPrimary,
                  fontWeight: filter === 'all' ? '700' : '500',
                },
              ]}
            >
              {t('allPayments')} ({PAYMENT_RECORDS.length})
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.filterPill,
              {
                backgroundColor:
                  filter === 'received'
                    ? theme.primaryGreen
                    : theme.surface,
                borderColor:
                  filter === 'received' ? theme.primaryGreen : theme.border,
              },
            ]}
            onPress={() => setFilter('received')}
          >
            <Text
              style={[
                styles.filterPillText,
                {
                  color:
                    filter === 'received' ? '#FFFFFF' : theme.textPrimary,
                  fontWeight: filter === 'received' ? '700' : '500',
                },
              ]}
            >
              {t('paidInBank')} ({PAYMENT_RECORDS.filter((p) => p.status === 'received').length})
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.filterPill,
              {
                backgroundColor:
                  filter === 'processing'
                    ? theme.primaryGreen
                    : theme.surface,
                borderColor:
                  filter === 'processing' ? theme.primaryGreen : theme.border,
              },
            ]}
            onPress={() => setFilter('processing')}
          >
            <Text
              style={[
                styles.filterPillText,
                {
                  color:
                    filter === 'processing' ? '#FFFFFF' : theme.textPrimary,
                  fontWeight: filter === 'processing' ? '700' : '500',
                },
              ]}
            >
              {t('inBankProcess')} ({PAYMENT_RECORDS.filter((p) => p.status === 'processing').length})
            </Text>
          </Pressable>
        </View>

        {/* Payments List */}
        <View style={styles.paymentsList}>
          {filteredPayments.map((payment) => {
            const isReceived = payment.status === 'received';
            const isProcessing = payment.status === 'processing';

            return (
              <View
                key={payment.id}
                style={[
                  styles.paymentCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              >
                {/* Card Header: Amount & Status */}
                <View style={styles.cardHeader}>
                  <View>
                    <Text
                      style={[styles.cropHeaderTitle, { color: theme.textPrimary }]}
                    >
                      {t(getCropTranslationKey(payment.cropName))} ({payment.cropHindi})
                    </Text>
                    <Text
                      style={[styles.cropQtyText, { color: theme.textMuted }]}
                    >
                      {payment.quantityQuintals} {t('quintals')} @ ₹{payment.ratePerQuintal}/{t('quintals')}
                    </Text>
                  </View>

                  <View style={styles.amountCol}>
                    <Text
                      style={[
                        styles.cardAmount,
                        {
                          color: isReceived ? theme.primaryGreen : '#D97706',
                        },
                      ]}
                    >
                      ₹{payment.totalAmount.toLocaleString('en-IN')}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        isReceived && {
                          backgroundColor: theme.primaryGreenBg,
                        },
                        isProcessing && {
                          backgroundColor: theme.isDark ? '#2E2718' : '#FEF3C7',
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          isReceived ? 'checkmark-circle' : 'time'
                        }
                        size={13}
                        color={isReceived ? theme.primaryGreen : '#D97706'}
                      />
                      <Text
                        style={[
                          styles.statusBadgeText,
                          {
                            color: isReceived ? theme.primaryGreen : '#D97706',
                          },
                        ]}
                      >
                        {isReceived ? t('paidInBank') : t('inBankProcess')}
                      </Text>
                    </View>
                  </View>
                </View>

                <View
                  style={[styles.cardDivider, { backgroundColor: theme.border }]}
                />

                {/* Mandi & Bank Info */}
                <View style={styles.cardBody}>
                  <View style={styles.bodyRow}>
                    <Text style={[styles.bodyKey, { color: theme.textMuted }]}>
                      {t('mandiLabel')}
                    </Text>
                    <Text style={[styles.bodyVal, { color: theme.textPrimary }]}>
                      {payment.mandiName}
                    </Text>
                  </View>

                  <View style={styles.bodyRow}>
                    <Text style={[styles.bodyKey, { color: theme.textMuted }]}>
                      {t('dateLabel')}
                    </Text>
                    <Text style={[styles.bodyVal, { color: theme.textPrimary }]}>
                      {payment.paymentDate}
                    </Text>
                  </View>

                  <View style={styles.bodyRow}>
                    <Text style={[styles.bodyKey, { color: theme.textMuted }]}>
                      {t('accountLabel')}
                    </Text>
                    <Text style={[styles.bodyVal, { color: theme.textPrimary }]}>
                      {payment.bankName} (••{payment.accountLast4})
                    </Text>
                  </View>
                </View>

                {/* View Receipt Button */}
                <Pressable
                  style={[
                    styles.viewReceiptBtn,
                    {
                      backgroundColor: theme.isDark ? '#1F2622' : '#F6FAF7',
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => setSelectedReceipt(payment)}
                >
                  <Ionicons
                    name="receipt-outline"
                    size={16}
                    color={theme.primaryGreen}
                  />
                  <Text
                    style={[styles.viewReceiptText, { color: theme.primaryGreen }]}
                  >
                    {t('viewMandiReceipt')}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Payment Receipt Modal */}
      {selectedReceipt && (
        <Modal
          visible={!!selectedReceipt}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedReceipt(null)}
        >
          <View style={styles.receiptModalBackdrop}>
            <View
              style={[
                styles.receiptCard,
                { backgroundColor: theme.surface },
              ]}
            >
              {/* Receipt Header */}
              <View
                style={[
                  styles.receiptHeader,
                  { backgroundColor: theme.primaryGreen },
                ]}
              >
                <View style={styles.receiptBrandRow}>
                  <MaterialCommunityIcons
                    name="receipt"
                    size={22}
                    color="#FFFFFF"
                  />
                  <Text style={styles.receiptHeaderTitle}>
                    {t('paymentReceiptTitle')}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setSelectedReceipt(null)}
                  style={styles.receiptCloseBtn}
                >
                  <Ionicons name="close" size={22} color="#FFFFFF" />
                </Pressable>
              </View>

              <View style={styles.receiptContent}>
                {/* Big Paid Amount */}
                <View
                  style={[
                    styles.receiptAmountBox,
                    { backgroundColor: theme.primaryGreenBg },
                  ]}
                >
                  <Text style={styles.receiptAmountLabel}>{t('totalAmountLabel')}</Text>
                  <Text
                    style={[
                      styles.receiptAmountNum,
                      { color: theme.primaryGreen },
                    ]}
                  >
                    ₹{selectedReceipt.totalAmount.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.receiptStatusText}>
                    {selectedReceipt.status === 'received'
                      ? t('creditedSuccess')
                      : t('processingDbt')}
                  </Text>
                </View>

                {/* Details Table */}
                <View
                  style={[
                    styles.receiptDetailsTable,
                    {
                      backgroundColor: theme.isDark ? '#191E1B' : '#F9FBFA',
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptKey}>{t('farmerName')}</Text>
                    <Text style={styles.receiptVal}>{t('greetingName')}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptKey}>{t('produce')}</Text>
                    <Text style={styles.receiptVal}>
                      {t(getCropTranslationKey(selectedReceipt.cropName))} ({selectedReceipt.quantityQuintals} {t('quintals')})
                    </Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptKey}>{t('govtMspRate')}</Text>
                    <Text style={styles.receiptVal}>
                      ₹{selectedReceipt.ratePerQuintal} / {t('quintals')}
                    </Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptKey}>{t('procurementMandi')}</Text>
                    <Text style={styles.receiptVal}>
                      {selectedReceipt.mandiName}
                    </Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptKey}>{t('weighbridgeSlipLabel')}</Text>
                    <Text style={styles.receiptVal}>
                      {selectedReceipt.weighbridgeSlipNo}
                    </Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptKey}>{t('paymentRefUtrLabel')}</Text>
                    <Text style={styles.receiptVal}>
                      {selectedReceipt.utrNumber}
                    </Text>
                  </View>
                </View>

                <Pressable
                  style={[
                    styles.receiptDoneBtn,
                    { backgroundColor: theme.primaryGreen },
                  ]}
                  onPress={() => setSelectedReceipt(null)}
                >
                  <Text style={styles.receiptDoneBtnText}>{t('done')}</Text>
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
  headerRightSpace: {
    width: 40,
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

  /* Summary Card */
  summaryCard: {
    borderRadius: 20,
    padding: 18,
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
  summaryMainAmount: {
    fontSize: 28,
    fontWeight: '900',
    marginTop: 2,
    letterSpacing: -0.5,
  },
  rupeeIconBadge: {
    width: 52,
    height: 52,
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subStatLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  subStatAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D97706',
  },
  bankTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bankTagText: {
    fontSize: 12,
    fontWeight: '600',
  },

  /* Filter Pills */
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 13,
  },

  /* Payments list */
  paymentsList: {
    gap: 14,
  },
  paymentCard: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cropHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cropQtyText: {
    fontSize: 12,
    marginTop: 2,
  },
  amountCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  cardAmount: {
    fontSize: 19,
    fontWeight: '800',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardDivider: {
    height: 1,
    width: '100%',
  },
  cardBody: {
    gap: 6,
  },
  bodyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bodyKey: {
    fontSize: 12,
    fontWeight: '500',
  },
  bodyVal: {
    fontSize: 12,
    fontWeight: '600',
  },
  viewReceiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 2,
  },
  viewReceiptText: {
    fontSize: 13,
    fontWeight: '700',
  },

  /* Receipt Modal */
  receiptModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  receiptCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  receiptBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  receiptHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  receiptCloseBtn: {
    padding: 4,
  },
  receiptContent: {
    padding: 18,
    gap: 14,
    alignItems: 'center',
  },
  receiptAmountBox: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    width: '100%',
  },
  receiptAmountLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
    letterSpacing: 0.8,
  },
  receiptAmountNum: {
    fontSize: 30,
    fontWeight: '900',
    marginVertical: 4,
  },
  receiptStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803D',
  },
  receiptDetailsTable: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  receiptKey: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  receiptVal: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '700',
  },
  receiptDoneBtn: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
  },
  receiptDoneBtnText: {
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
