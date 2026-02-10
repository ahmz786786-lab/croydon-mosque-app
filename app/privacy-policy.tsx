import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

export default function PrivacyPolicyScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {children}
    </View>
  );

  const Paragraph = ({ children }: { children: React.ReactNode }) => (
    <Text style={[styles.paragraph, { color: colors.textSecondary }]}>{children}</Text>
  );

  const BulletPoint = ({ children }: { children: React.ReactNode }) => (
    <View style={styles.bulletRow}>
      <Text style={[styles.bullet, { color: colors.primary }]}>{'\u2022'}</Text>
      <Text style={[styles.bulletText, { color: colors.textSecondary }]}>{children}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Last Updated */}
        <Text style={[styles.lastUpdated, { color: colors.textSecondary }]}>
          Last Updated: 4 February 2026
        </Text>

        <Section title="Introduction">
          <Paragraph>
            Croydon Mosque & Islamic Centre ("we", "our", or "us") operates the Croydon Mosque
            mobile application. This Privacy Policy explains how we collect, use, and protect
            information when you use our App.
          </Paragraph>
          <Paragraph>
            We are committed to protecting your privacy. Our App is designed to serve the Muslim
            community with prayer times, Qibla direction, and mosque announcements while collecting
            minimal data.
          </Paragraph>
        </Section>

        <Section title="Information We Collect">
          <Text style={[styles.subheading, { color: colors.text }]}>Location Data</Text>
          <BulletPoint>What: Your device's location coordinates</BulletPoint>
          <BulletPoint>Why: To calculate and display the Qibla direction for prayer</BulletPoint>
          <BulletPoint>When: Only when you access the Qibla compass feature</BulletPoint>
          <BulletPoint>Storage: Processed on your device only - NOT transmitted or stored on our servers</BulletPoint>

          <Text style={[styles.subheading, { color: colors.text, marginTop: 16 }]}>Device Information</Text>
          <BulletPoint>Push Notification Tokens: If you enable prayer reminders, we store an anonymous device token</BulletPoint>
          <BulletPoint>Platform Type: iOS or Android, to ensure notifications are delivered correctly</BulletPoint>
        </Section>

        <Section title="No Personal Data Collection">
          <Paragraph>
            Your privacy is our priority. The Croydon Mosque App is designed to function without
            requiring any personal information from you.
          </Paragraph>
          <Paragraph>We do NOT collect:</Paragraph>
          <BulletPoint>Names or contact information</BulletPoint>
          <BulletPoint>Email addresses</BulletPoint>
          <BulletPoint>Phone numbers</BulletPoint>
          <BulletPoint>Photographs or media files</BulletPoint>
          <BulletPoint>Browsing history or app usage patterns</BulletPoint>
          <BulletPoint>IP addresses or device identifiers</BulletPoint>
          <BulletPoint>Any personally identifiable information</BulletPoint>
          <Paragraph>
            You can use all features of the app (prayer times, announcements, events, etc.)
            completely anonymously. No account or registration is required.
          </Paragraph>
        </Section>

        <Section title="Push Notifications">
          <Paragraph>
            Our App offers optional push notifications to remind you of prayer times and
            keep you informed about mosque announcements.
          </Paragraph>

          <Text style={[styles.subheading, { color: colors.text }]}>What We Collect</Text>
          <BulletPoint>An anonymous device token (a random string of characters)</BulletPoint>
          <BulletPoint>Your device platform (iOS or Android)</BulletPoint>

          <Text style={[styles.subheading, { color: colors.text, marginTop: 16 }]}>What We Do NOT Collect</Text>
          <BulletPoint>Your name or identity</BulletPoint>
          <BulletPoint>Your phone number</BulletPoint>
          <BulletPoint>Your location for notifications</BulletPoint>
          <BulletPoint>Any personal information linked to notifications</BulletPoint>

          <Text style={[styles.subheading, { color: colors.text, marginTop: 16 }]}>How Notifications Work</Text>
          <Paragraph>
            When you enable notifications, your device generates a random token. This token
            is not linked to your identity - it simply allows us to send reminders to your
            device. We cannot identify who you are from this token.
          </Paragraph>

          <Text style={[styles.subheading, { color: colors.text, marginTop: 16 }]}>Your Control</Text>
          <BulletPoint>Notifications are completely optional</BulletPoint>
          <BulletPoint>You can enable/disable them at any time in the app</BulletPoint>
          <BulletPoint>You can also control them in your device settings</BulletPoint>
          <BulletPoint>Disabling notifications removes your token from our system</BulletPoint>
        </Section>

        <Section title="How We Use Information">
          <BulletPoint>Location (on-device only): Calculate Qibla direction</BulletPoint>
          <BulletPoint>Push notification token: Send prayer reminders and mosque announcements</BulletPoint>
          <BulletPoint>Platform type: Deliver notifications correctly</BulletPoint>
        </Section>

        <Section title="Data Storage and Security">
          <BulletPoint>Location data is processed entirely on your device and never leaves your phone</BulletPoint>
          <BulletPoint>Notification tokens are stored securely with industry-standard encryption</BulletPoint>
          <BulletPoint>We do not sell, trade, or transfer any data to third parties</BulletPoint>
        </Section>

        <Section title="Third-Party Services">
          <Paragraph>Our App uses the following third-party services:</Paragraph>
          <BulletPoint>Aladhan API - For accurate prayer times calculation</BulletPoint>
          <BulletPoint>Supabase - For storing mosque announcements and events</BulletPoint>
          <BulletPoint>Expo Notifications - For delivering push notifications</BulletPoint>
        </Section>

        <Section title="Your Rights and Choices">
          <BulletPoint>Location Access: You can deny or revoke location permission in device settings</BulletPoint>
          <BulletPoint>Push Notifications: You can disable notifications at any time</BulletPoint>
          <BulletPoint>Uninstall: Removing the App deletes all locally stored data</BulletPoint>
        </Section>

        <Section title="Children's Privacy">
          <Paragraph>
            Our App does not knowingly collect any personal information from children under 13.
            The App is suitable for all ages as it does not require any personal information to function.
          </Paragraph>
        </Section>

        <Section title="Contact Us">
          <Paragraph>
            If you have any questions about this Privacy Policy, please contact us:
          </Paragraph>
          <View style={[styles.contactCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.contactText, { color: colors.text }]}>
              Croydon Mosque & Islamic Centre
            </Text>
            <Text style={[styles.contactText, { color: colors.textSecondary }]}>
              525 London Road, Thornton Heath
            </Text>
            <Text style={[styles.contactText, { color: colors.textSecondary }]}>
              Surrey CR7 6AR, United Kingdom
            </Text>
            <Text style={[styles.contactText, { color: colors.primary, marginTop: 8 }]}>
              enquiries@croydonmosque.com
            </Text>
            <Text style={[styles.contactText, { color: colors.primary }]}>
              020 8684 8200
            </Text>
          </View>
        </Section>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            By using the Croydon Mosque App, you consent to this Privacy Policy.
          </Text>
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
  lastUpdated: {
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  subheading: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingRight: 16,
  },
  bullet: {
    fontSize: 16,
    marginRight: 8,
    marginTop: -2,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  contactCard: {
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  contactText: {
    fontSize: 14,
    lineHeight: 22,
  },
  footer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  footerText: {
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
