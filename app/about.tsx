import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { MOSQUE_INFO } from '@/constants/prayerTimes';

export default function AboutScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const openUrl = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open the link');
    });
  };

  const callPhone = (phone: string) => {
    Linking.openURL(`tel:${phone.replace(/\s/g, '')}`).catch(() => {
      Alert.alert('Error', 'Could not make the call');
    });
  };

  const sendEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`).catch(() => {
      Alert.alert('Error', 'Could not open email client');
    });
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Us</Text>
        <Text style={styles.headerSubtitle}>Croydon Mosque & Islamic Centre</Text>
      </View>

      {/* History Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="time-outline" size={22} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Our History</Text>
        </View>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.bodyText, { color: colors.text }]}>
            The Croydon Mosque & Islamic Centre (CMIC) emerged in the early 1970s, beginning in a small ground-floor hall in West Croydon before evolving over two decades into its present structure.
          </Text>
          <Text style={[styles.bodyText, { color: colors.text, marginTop: 10 }]}>
            The facility now comprises seven large halls with capacity for 3,500 people, expandable to 4,000.
          </Text>
        </View>
      </View>

      {/* Community Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="people-outline" size={22} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Our Community</Text>
        </View>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.bodyText, { color: colors.text }]}>
            The centre welcomes approximately 9,000 weekly visitors under normal circumstances, surging to 30,000 during Ramadan.
          </Text>
          <Text style={[styles.bodyText, { color: colors.text, marginTop: 10 }]}>
            It serves a diverse Muslim population of roughly 20,000 across the London Borough of Croydon, including communities from Pakistan, India, Bangladesh, East Africa, Somalia, Turkey, Afghanistan, the Middle East, and Bosnia.
          </Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.primary }]}>
            <Text style={styles.statNumber}>9,000+</Text>
            <Text style={styles.statLabel}>Weekly Visitors</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.accent }]}>
            <Text style={styles.statNumber}>30,000</Text>
            <Text style={styles.statLabel}>Ramadan Visitors</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#4A90D9' }]}>
            <Text style={styles.statNumber}>3,500</Text>
            <Text style={styles.statLabel}>Capacity</Text>
          </View>
        </View>
      </View>

      {/* Governance Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="business-outline" size={22} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Governance</Text>
        </View>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.bodyText, { color: colors.text }]}>
            Management operates through two parallel structures: strategic (via Executive Committee) determining service provision, and operational (via Management Committee) handling implementation details.
          </Text>
        </View>
      </View>

      {/* Education Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="school-outline" size={22} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Education</Text>
        </View>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.bodyText, { color: colors.text }]}>
            The madrassah enrolls over 500 children, combining Quranic instruction with behavioural and citizenship education.
          </Text>
          <Text style={[styles.bodyText, { color: colors.text, marginTop: 10 }]}>
            Additional offerings include English language classes, GCSE tutoring in Science, Mathematics, and English, plus youth programmes and elderly welfare support.
          </Text>
        </View>
      </View>

      {/* Services Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="heart-outline" size={22} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Community Services</Text>
        </View>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[
            'Marriage introductory services',
            'Mortuary & funeral services (Muslim Burial Protocol)',
            'Weekly Islamic lectures',
            'Legal, medical & police surgeries (monthly)',
            'Interfaith group participation',
            'Annual Islamic exhibitions',
            'Islamic awareness courses for local authorities',
          ].map((service, index) => (
            <View key={index} style={styles.bulletRow}>
              <View style={[styles.bullet, { backgroundColor: colors.primary }]} />
              <Text style={[styles.bulletText, { color: colors.text }]}>{service}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Contact Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="call-outline" size={22} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Contact Us</Text>
        </View>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(MOSQUE_INFO.address)}`)}>
            <Ionicons name="location-outline" size={20} color={colors.primary} />
            <Text style={[styles.contactText, { color: colors.text }]}>{MOSQUE_INFO.address}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactRow} onPress={() => callPhone(MOSQUE_INFO.phone)}>
            <Ionicons name="call-outline" size={20} color={colors.primary} />
            <Text style={[styles.contactText, { color: colors.text }]}>{MOSQUE_INFO.phone}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactRow} onPress={() => sendEmail(MOSQUE_INFO.email)}>
            <Ionicons name="mail-outline" size={20} color={colors.primary} />
            <Text style={[styles.contactText, { color: colors.text }]}>{MOSQUE_INFO.email}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactRow} onPress={() => openUrl(MOSQUE_INFO.website)}>
            <Ionicons name="globe-outline" size={20} color={colors.primary} />
            <Text style={[styles.contactText, { color: colors.text }]}>www.croydonmosque.com</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer} />
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
  header: {
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 24,
  },
  backButton: {
    marginBottom: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  statNumber: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
    gap: 10,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  contactText: {
    fontSize: 14,
    flex: 1,
  },
  footer: {
    height: 20,
  },
});
