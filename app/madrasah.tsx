import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

const LINKS = {
  raziilLogin: 'https://cmic.raziil.com/screens/registration.aspx',
  registration: 'https://cmic.raziil.com/screens/registration.aspx',
  directDebit:
    'https://pay.gocardless.com/billing/static/collect-customer-details?id=BRF01KGYT3JYNXFCXT9FRV4D2839QA73&initial=%2Fcollect-customer-details',
};

async function fetchAcademicCalendarUrl(): Promise<{ url: string; title: string } | null> {
  try {
    const response = await fetch('https://www.croydonmosque.com/?section=madrasah');
    const html = await response.text();
    const match = html.match(/href="(https?:\/\/www\.croydonmosque\.com\/pdf\/[^"]*[Aa]cademic[^"]*\.pdf)"/);
    if (match) {
      const url = match[1];
      const yearMatch = url.match(/(\d{4})[_\s]to[_\s](\d{4})/i);
      const title = yearMatch ? `Academic Calendar ${yearMatch[1]}-${yearMatch[2]}` : 'Academic Calendar';
      return { url, title };
    }
    return null;
  } catch (error) {
    console.error('Error fetching academic calendar URL:', error);
    return null;
  }
}

export default function MadrasahScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const [calendarInfo, setCalendarInfo] = useState<{ url: string; title: string } | null>(null);
  const [loadingCalendar, setLoadingCalendar] = useState(true);

  useEffect(() => {
    fetchAcademicCalendarUrl().then((info) => {
      setCalendarInfo(info);
      setLoadingCalendar(false);
    });
  }, []);

  const openUrl = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open the link');
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Madrasah</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Our Aim */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Our Aim</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            Our aim is to educate the youth of the Ummah to inculcate the teachings of the
            Qur'an and Sunnah into their daily lives. In gaining Islamic knowledge and morals,
            students will be equipped to confidently transition into adulthood with a dignified
            character and respectable values that will further benefit the wider community and
            future generations.
          </Text>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            The Croydon Mosque and Islamic Centre Madrasah provides structured learning for boys
            and girls aged 4-17. Children are taught Qur'anic and Islamic studies alongside
            authentic du'a & adhkaar memorisation.
          </Text>
        </View>

        {/* Raziil Login */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Raziil Login</Text>
          <TouchableOpacity
            style={[styles.linkButton, { backgroundColor: colors.primary }]}
            onPress={() => openUrl(LINKS.raziilLogin)}
          >
            <Ionicons name="log-in-outline" size={20} color="#FFF" />
            <Text style={styles.linkButtonText}>Open Raziil Login Page</Text>
          </TouchableOpacity>
        </View>

        {/* Registration */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Registration for New Students
          </Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            Parents must register their child online to enrol in the Madrasah.
          </Text>
          <TouchableOpacity
            style={[styles.linkButton, { backgroundColor: '#4CAF50' }]}
            onPress={() => openUrl(LINKS.registration)}
          >
            <Ionicons name="person-add-outline" size={20} color="#FFF" />
            <Text style={styles.linkButtonText}>Register Now</Text>
          </TouchableOpacity>
        </View>

        {/* Direct Debit */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Direct Debit for Madrasah Fees
          </Text>
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="information-circle-outline" size={22} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Direct debit payments are now compulsory for paying fees at Croydon Mosque.
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.linkButton, { backgroundColor: '#3498DB' }]}
            onPress={() => openUrl(LINKS.directDebit)}
          >
            <Ionicons name="card-outline" size={20} color="#FFF" />
            <Text style={styles.linkButtonText}>Setup Direct Debit</Text>
          </TouchableOpacity>
        </View>

        {/* Timings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Madrasah Timings</Text>
          <View style={[styles.timingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.timingRow}>
              <View style={[styles.timingIcon, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.timingContent}>
                <Text style={[styles.timingLabel, { color: colors.text }]}>Weekdays</Text>
                <Text style={[styles.timingValue, { color: colors.textSecondary }]}>
                  Mon to Fri — 5pm to 7pm
                </Text>
              </View>
            </View>
            <View style={[styles.timingDivider, { backgroundColor: colors.border }]} />
            <View style={styles.timingRow}>
              <View style={[styles.timingIcon, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="sunny-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.timingContent}>
                <Text style={[styles.timingLabel, { color: colors.text }]}>Weekend</Text>
                <Text style={[styles.timingValue, { color: colors.textSecondary }]}>
                  Sat and Sun — 10am to 12:30pm
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Academic Calendar */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Academic Calendar</Text>
          {loadingCalendar ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : calendarInfo ? (
            <TouchableOpacity
              style={[styles.linkButton, { backgroundColor: '#8E44AD' }]}
              onPress={() => openUrl(calendarInfo.url)}
            >
              <Ionicons name="download-outline" size={20} color="#FFF" />
              <Text style={styles.linkButtonText}>{calendarInfo.title}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
              Calendar not available at the moment.
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  placeholder: {
    width: 32,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 10,
  },
  linkButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginBottom: 14,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  timingsCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  timingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  timingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timingContent: {
    flex: 1,
  },
  timingLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  timingValue: {
    fontSize: 14,
    marginTop: 2,
  },
  timingDivider: {
    height: 1,
    marginHorizontal: 16,
  },
});
