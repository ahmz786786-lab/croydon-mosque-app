import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  RefreshControl,
  Image,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useNotifications } from '@/hooks/useNotifications';
import { useIslamicDate } from '@/hooks/useIslamicDate';
import { usePrayerTimes, PrayerTime } from '@/hooks/usePrayerTimes';
import { fetchPrayerTimes, PrayerTimesData } from '@/services/prayerTimesApi';
import RamadanBanner from '@/components/RamadanBanner';
import AnnouncementTicker from '@/components/AnnouncementTicker';
import { getStatusBar, subscribeToStatusBar, StatusBar, getAppSetting, subscribeToAppSettings } from '@/services/supabase';

interface CombinedPrayerTime {
  name: string;
  arabicName: string;
  icon: string;
  adhan: string;
  jamaat: string;
}

function parseTime(timeStr: string): Date {
  const date = new Date();
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
  if (!match) {
    date.setHours(0, 0, 0, 0);
    return date;
  }
  let hour = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3]?.toUpperCase();
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  date.setHours(hour, minutes, 0, 0);
  return date;
}

function getCurrentPrayerFromList(prayers: PrayerTime[]): string | null {
  if (prayers.length === 0) return null;
  const now = new Date();
  for (let i = prayers.length - 1; i >= 0; i--) {
    const prayerTime = parseTime(prayers[i].time);
    if (now >= prayerTime) {
      return prayers[i].name;
    }
  }
  return prayers[prayers.length - 1].name;
}

function getNextPrayerFromList(prayers: PrayerTime[]): PrayerTime | null {
  if (prayers.length === 0) return null;
  const now = new Date();
  for (const prayer of prayers) {
    const prayerTime = parseTime(prayer.time);
    if (now < prayerTime) {
      return prayer;
    }
  }
  return prayers[0];
}

function formatClock12Hr(date: Date): string {
  let hours = date.getHours();
  const mins = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${mins.toString().padStart(2, '0')} ${ampm}`;
}

function formatTo12Hr(timeStr: string): string {
  if (!timeStr || timeStr === '--:--' || timeStr === '--') return timeStr;
  // Strip existing am/pm and normalize
  const cleaned = timeStr.replace(/\s*(am|pm|AM|PM)\s*/g, '').trim();
  const hasAmPm = /am|pm|AM|PM/.test(timeStr);
  const parts = cleaned.split(':');
  if (parts.length < 2) return timeStr;
  let hour = parseInt(parts[0], 10);
  const min = parts[1].replace(/\D/g, '').padStart(2, '0');
  if (isNaN(hour)) return timeStr;

  if (hasAmPm) {
    // Was already 12hr — convert to 24hr first for consistent handling
    const isPm = /pm|PM/.test(timeStr);
    if (isPm && hour !== 12) hour += 12;
    if (!isPm && hour === 12) hour = 0;
  }

  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${min} ${ampm}`;
}

function addMinutesToTimeString(timeStr: string, minutes: number): string {
  try {
    const date = parseTime(timeStr);
    date.setMinutes(date.getMinutes() + minutes);
    let hours = date.getHours();
    const mins = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${mins.toString().padStart(2, '0')} ${ampm}`;
  } catch {
    return '--:--';
  }
}

export default function PrayerTimesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [currentPrayer, setCurrentPrayer] = useState<string | null>(null);
  const [nextPrayer, setNextPrayer] = useState<PrayerTime | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [adhanTimes, setAdhanTimes] = useState<PrayerTimesData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [statusBar, setStatusBar] = useState<StatusBar | null>(null);
  const [ramadanBannerEnabled, setRamadanBannerEnabled] = useState(false);

  const { settings, isEnabled, togglePrayer, toggleAll } = useNotifications();
  const { hijriDate, ramadanInfo } = useIslamicDate();
  const { prayerTimes: adminPrayerTimes, jumaTimes: adminJumaTimes, refresh: refreshPrayerTimes } = usePrayerTimes();

  useEffect(() => {
    loadApiData();
    loadStatusBar();
    loadRamadanSetting();
    const statusSub = subscribeToStatusBar(setStatusBar);
    const settingsSub = subscribeToAppSettings((key, value) => {
      if (key === 'ramadan_banner_enabled') {
        setRamadanBannerEnabled(value === 'true');
      }
    });
    return () => { statusSub.unsubscribe(); settingsSub.unsubscribe(); };
  }, []);

  useEffect(() => {
    setCurrentPrayer(getCurrentPrayerFromList(adminPrayerTimes));
    setNextPrayer(getNextPrayerFromList(adminPrayerTimes));

    const interval = setInterval(() => {
      setCurrentTime(new Date());
      setCurrentPrayer(getCurrentPrayerFromList(adminPrayerTimes));
      setNextPrayer(getNextPrayerFromList(adminPrayerTimes));
    }, 1000);

    return () => clearInterval(interval);
  }, [adminPrayerTimes]);

  const loadStatusBar = async () => {
    try {
      const data = await getStatusBar();
      setStatusBar(data);
    } catch (error) {
      console.error('Error loading status bar:', error);
    }
  };

  const loadRamadanSetting = async () => {
    const value = await getAppSetting('ramadan_banner_enabled');
    setRamadanBannerEnabled(value === 'true');
  };

  const loadApiData = async () => {
    try {
      setApiError(false);
      const prayerData = await fetchPrayerTimes();
      setAdhanTimes(prayerData);
      if (prayerData.date.hijri.formatted === 'Offline Mode') {
        setApiError(true);
      }
    } catch (error) {
      console.error('Error loading API data:', error);
      setApiError(true);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadApiData(), refreshPrayerTimes(), loadStatusBar()]);
    setRefreshing(false);
  };

  const getCombinedTimes = (): CombinedPrayerTime[] => {
    const apiAdhanMap: { [key: string]: string } = adhanTimes ? {
      'Fajr': adhanTimes.fajr,
      'Zohr': adhanTimes.dhuhr,
      'Asr': adhanTimes.asr,
      'Maghrib': adhanTimes.maghrib,
      'Isha': adhanTimes.isha,
    } : {};

    return adminPrayerTimes.map(prayer => ({
      name: prayer.name,
      arabicName: prayer.arabicName,
      icon: prayer.icon,
      adhan: prayer.azaanTime || apiAdhanMap[prayer.name] || '--:--',
      jamaat: prayer.time,
    }));
  };

  const combinedTimes = getCombinedTimes();

  // Compute Sunrise, Ishraq, Zawaal
  const sunriseTime = adhanTimes?.sunrise ? formatTo12Hr(adhanTimes.sunrise) : '--:--';
  const ishraqTime = adhanTimes?.sunrise
    ? addMinutesToTimeString(adhanTimes.sunrise, 15)
    : '--:--';
  const zawaalTime = adhanTimes?.dhuhr
    ? addMinutesToTimeString(adhanTimes.dhuhr, -10)
    : '--:--';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header — Clock & Dates */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.clockText}>
          {formatClock12Hr(currentTime)}
        </Text>
        <Text style={styles.dateText}>
          {currentTime.toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </Text>
        <Text style={styles.hijriDate}>
          {hijriDate.formattedArabic || hijriDate.formatted || adhanTimes?.date?.hijri?.formatted || (apiError ? 'Pull down to refresh' : 'Loading...')}
        </Text>
      </View>

      {/* Ramadan Banner or Next Prayer Highlight */}
      {ramadanBannerEnabled ? (
        <RamadanBanner colors={colors} ramadanInfo={ramadanInfo} />
      ) : nextPrayer ? (
        <View style={[styles.nextPrayerBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.nextPrayerIcon, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="time-outline" size={22} color={colors.primary} />
          </View>
          <View style={styles.nextPrayerContent}>
            <Text style={[styles.nextPrayerLabel, { color: colors.textSecondary }]}>Next Prayer</Text>
            <Text style={[styles.nextPrayerName, { color: colors.text }]}>
              {nextPrayer.name} — {formatTo12Hr(nextPrayer.time)}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </View>
      ) : null}

      {/* Status Bar Ticker */}
      {(() => {
        const tickerMessages = statusBar?.is_active
          ? [statusBar.message, statusBar.message_2, statusBar.message_3, statusBar.message_4]
          : [
              'Welcome to Croydon Mosque & Islamic Centre',
              'Jumu\'ah prayers every Friday - All welcome',
              'Madrasah classes Mon-Fri 5-7pm & Sat-Sun 10am-12:30pm',
              'Download our app and stay connected with the community',
            ];
        return <AnnouncementTicker messages={tickerMessages} colors={colors} />;
      })()}

      {/* Prayer Times Card */}
      <View style={[styles.prayerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* Table Header */}
        <View style={[styles.tableHeader, { backgroundColor: colors.primary }]}>
          <Text style={[styles.colPrayer, styles.headerText]} />
          <Text style={[styles.colTime, styles.headerText]}>Start</Text>
          <Text style={[styles.colTime, styles.headerText]}>Iqamah</Text>
        </View>

        {/* Prayer Rows */}
        {combinedTimes.map((prayer, index) => {
          const isNextPrayer = nextPrayer?.name === prayer.name;

          return (
            <View
              key={prayer.name}
              style={[
                styles.tableRow,
                index < combinedTimes.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                isNextPrayer && [styles.activeRow, { borderLeftColor: colors.accent }],
              ]}
            >
              <View style={[styles.colPrayer, styles.prayerCell]}>
                <View style={styles.prayerNameBlock}>
                  <Text style={[styles.prayerName, { color: colors.text }]}>
                    {prayer.name}
                  </Text>
                  <Text style={[styles.prayerArabic, { color: colors.textSecondary }]}>
                    {prayer.arabicName}
                  </Text>
                </View>
                {isNextPrayer && (
                  <View style={[styles.nextBadge, { backgroundColor: colors.success }]}>
                    <Text style={styles.nextBadgeText}>NEXT</Text>
                  </View>
                )}
              </View>
              <View style={[styles.colTime, styles.timeCell]}>
                <Text style={[styles.startTimeText, { color: colors.textSecondary }]}>
                  {formatTo12Hr(prayer.adhan)}
                </Text>
              </View>
              <View style={[styles.colTime, styles.timeCell]}>
                <Text style={[styles.iqamahTimeText, { color: colors.primary }]}>
                  {formatTo12Hr(prayer.jamaat)}
                </Text>
              </View>
            </View>
          );
        })}

        {/* Jumu'ah Row */}
        <View style={[styles.tableRow, styles.jumahRow, { borderTopWidth: 2, borderTopColor: colors.border }]}>
          <View style={[styles.colPrayer, styles.prayerCell]}>
            <View style={styles.prayerNameBlock}>
              <Text style={[styles.prayerName, { color: colors.primary }]}>Jumu'ah</Text>
              <Text style={[styles.prayerArabic, { color: colors.textSecondary }]}>الجمعة</Text>
            </View>
          </View>
          <View style={[styles.colTime, styles.timeCell]}>
            <View style={styles.jumaTimeBlock}>
              <Text style={[styles.jumaLabel, { color: colors.textSecondary }]}>1st</Text>
              <Text style={[styles.iqamahTimeText, { color: colors.primary }]}>
                {formatTo12Hr(adminJumaTimes[0]?.time || '--')}
              </Text>
            </View>
          </View>
          <View style={[styles.colTime, styles.timeCell]}>
            <View style={styles.jumaTimeBlock}>
              <Text style={[styles.jumaLabel, { color: colors.textSecondary }]}>2nd</Text>
              <Text style={[styles.iqamahTimeText, { color: colors.primary }]}>
                {formatTo12Hr(adminJumaTimes[1]?.time || '--')}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Bottom Row — Sunrise, Ishraq, Zawaal */}
      <View style={styles.bottomRow}>
        <View style={[styles.bottomCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.bottomCardLabel, { color: colors.primary }]}>Sunrise</Text>
          <Text style={[styles.bottomCardTime, { color: colors.text }]}>{sunriseTime}</Text>
        </View>
        <View style={[styles.bottomCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.bottomCardLabel, { color: colors.primary }]}>Ishraq</Text>
          <Text style={[styles.bottomCardTime, { color: colors.text }]}>{ishraqTime}</Text>
        </View>
        <View style={[styles.bottomCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.bottomCardLabel, { color: colors.primary }]}>Zawaal</Text>
          <Text style={[styles.bottomCardTime, { color: colors.text }]}>{zawaalTime}</Text>
        </View>
      </View>

      {/* Notification Settings */}
      <View style={styles.notificationSection}>
        <TouchableOpacity
          style={[
            styles.notificationBtn,
            { backgroundColor: showNotificationSettings ? colors.primary : colors.surface, borderColor: colors.border }
          ]}
          onPress={() => setShowNotificationSettings(!showNotificationSettings)}
        >
          <Ionicons
            name={isEnabled ? "notifications" : "notifications-outline"}
            size={18}
            color={showNotificationSettings ? '#FFFFFF' : colors.primary}
          />
          <Text style={[
            styles.notificationBtnText,
            { color: showNotificationSettings ? '#FFFFFF' : colors.text }
          ]}>
            Prayer Reminders
          </Text>
        </TouchableOpacity>

        {showNotificationSettings && (
          <View style={[styles.notificationPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.notificationHeader}>
              <Text style={[styles.notificationTitle, { color: colors.text }]}>
                Enable Reminders
              </Text>
              <Switch
                value={isEnabled}
                onValueChange={toggleAll}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
            {isEnabled && (
              <View style={styles.prayerToggles}>
                {adminPrayerTimes.map((prayer) => (
                  <TouchableOpacity
                    key={prayer.name}
                    style={[
                      styles.prayerToggleItem,
                      {
                        backgroundColor: settings[prayer.name] ? colors.primary : 'transparent',
                        borderColor: settings[prayer.name] ? colors.primary : colors.border,
                      }
                    ]}
                    onPress={() => togglePrayer(prayer.name)}
                  >
                    <Text style={[
                      styles.prayerToggleText,
                      { color: settings[prayer.name] ? '#FFFFFF' : colors.text }
                    ]}>
                      {prayer.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </View>

      <Text style={[styles.tableNote, { color: apiError ? colors.accent : colors.textSecondary }]}>
        {apiError ? 'Unable to fetch times \u2022 Pull down to refresh' : 'Start times sourced from croydonmosque.com \u2022 Pull down to refresh'}
      </Text>

      {/* Parking QR Code Card */}
      <View style={[styles.parkingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.parkingHeader}>
          <Ionicons name="car-outline" size={24} color={colors.primary} />
          <Text style={[styles.parkingTitle, { color: colors.text }]}>Parking Registration</Text>
        </View>
        <Text style={[styles.parkingDescription, { color: colors.textSecondary }]}>
          Tap the QR code or scan it to register your vehicle at IBIZ Croydon Park Hotel car park
        </Text>
        <TouchableOpacity
          style={styles.qrContainer}
          onPress={() => Linking.openURL('https://www.pilgrimmediaproductions.com/croydon-masjid-parking')}
          activeOpacity={0.8}
        >
          <Image
            source={require('@/assets/images/parking-qr.png')}
            style={styles.qrImage}
            resizeMode="contain"
          />
          <View style={[styles.tapHint, { backgroundColor: colors.primary }]}>
            <Ionicons name="open-outline" size={12} color="#FFFFFF" />
            <Text style={styles.tapHintText}>Tap to open</Text>
          </View>
        </TouchableOpacity>
        <View style={[styles.parkingNote, { backgroundColor: colors.accent + '15' }]}>
          <Ionicons name="time-outline" size={16} color={colors.accent} />
          <Text style={[styles.parkingNoteText, { color: colors.textSecondary }]}>
            Max 1 hour {'\u2022'} Available for daily Salah only (not Jummah)
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 30,
  },

  // ── Header ──
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    alignItems: 'center',
  },
  clockText: {
    color: '#FFFFFF',
    fontSize: 72,
    fontWeight: '200',
    letterSpacing: -2,
    lineHeight: 80,
  },
  dateText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 4,
  },
  hijriDate: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 6,
  },

  // ── Prayer Card ──
  nextPrayerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  nextPrayerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  nextPrayerContent: {
    flex: 1,
  },
  nextPrayerLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nextPrayerName: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  prayerCard: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  colPrayer: {
    flex: 1.8,
  },
  colTime: {
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  activeRow: {
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderLeftWidth: 4,
  },
  prayerCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prayerNameBlock: {
    flexShrink: 1,
  },
  prayerName: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  prayerArabic: {
    fontSize: 11,
    marginTop: 1,
  },
  nextBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginLeft: 6,
  },
  nextBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timeCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  startTimeText: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  iqamahTimeText: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },

  // ── Jumu'ah Row ──
  jumahRow: {
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
  },
  jumaTimeBlock: {
    alignItems: 'center',
  },
  jumaLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },

  // ── Bottom Row ──
  bottomRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginTop: 12,
  },
  bottomCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  bottomCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  bottomCardTime: {
    fontSize: 16,
    fontWeight: '700',
  },

  // ── Notifications ──
  notificationSection: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  notificationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  notificationBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  notificationPanel: {
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  prayerToggles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  prayerToggleItem: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  prayerToggleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tableNote: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
  },

  // ── Parking ──
  parkingCard: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  parkingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  parkingTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 10,
  },
  parkingDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  qrContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  qrImage: {
    width: 180,
    height: 180,
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 10,
    gap: 4,
  },
  tapHintText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  parkingNote: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  parkingNoteText: {
    flex: 1,
    fontSize: 12,
  },
});
