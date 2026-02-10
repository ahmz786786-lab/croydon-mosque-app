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
import { getAppSetting } from '@/services/supabase';

const DEFAULT_CONTACTS = {
  phone1: '07737198776',
  phone2: '07949176780',
};

const PROCEDURE_STEPS = [
  {
    step: 1,
    title: 'Inform the Mosque',
    description: 'Contact Croydon Masjid as soon as possible. The deceased could be at home, hospice, hospital, or coroner\'s office. The aim is to ensure burial takes place within 24 hours.',
  },
  {
    step: 2,
    title: 'Fill in the Janazah Form',
    description: 'Complete a Masjid Janazah form with as much detail as possible. The form is available from Masjid reception. Next-of-kin should provide the required information.',
  },
  {
    step: 3,
    title: 'Register the Death',
    description: 'Register the death at the relevant Registry Office and obtain a Green Burial Certificate. The hospital will provide a \'letter for informant\' with necessary details.',
  },
  {
    step: 4,
    title: 'Funeral Expenses',
    description: 'The Masjid will provide details of expenses including fees for out-of-borough burial if requested.',
  },
  {
    step: 5,
    title: 'Cemetery Booking',
    description: 'For Croydon cemeteries, the Masjid will make the booking. For other boroughs, the family should book directly and provide the Masjid with details.',
  },
  {
    step: 6,
    title: 'Confirm Booking',
    description: 'The Masjid will fax the Green Burial Certificate and Interment form to the cemetery office, indicating SHROUD on the form with the proposed burial date and time.',
  },
  {
    step: 7,
    title: 'Ghusl (Ritual Washing)',
    description: 'Males perform Ghusl for males and females for females. Check with the family if next-of-kin wish to participate. Usually 2-3 persons are needed.',
  },
  {
    step: 8,
    title: 'Inform Imam & Family',
    description: 'After confirming the burial date and time, inform the Imam and the family. Remind the family of timings and the need to be punctual.',
  },
  {
    step: 9,
    title: 'Janazah Prayer & Burial',
    description: 'The Janaza prayer will usually be held at the Masjid and the deceased taken to the cemetery in the Masjid van. One of the Imaams will perform the last rites.',
  },
  {
    step: 10,
    title: 'Contact Us',
    description: 'For more information, call 07737198776 or 07949176780 at any time of the day or night.',
  },
];

export default function JanazahScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const [contacts, setContacts] = useState(DEFAULT_CONTACTS);

  useEffect(() => {
    const load = async () => {
      const [p1, p2] = await Promise.all([
        getAppSetting('janazah_phone1'),
        getAppSetting('janazah_phone2'),
      ]);
      setContacts({
        phone1: p1 || DEFAULT_contacts.phone1,
        phone2: p2 || DEFAULT_contacts.phone2,
      });
    };
    load();
  }, []);

  const callNumber = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Error', 'Could not open phone dialer');
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Janazah Service</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Emergency Contact Card */}
        <View style={[styles.emergencyCard, { backgroundColor: colors.primary }]}>
          <Ionicons name="call" size={24} color="#FFFFFF" />
          <Text style={styles.emergencyTitle}>24/7 Emergency Contact</Text>
          <Text style={styles.emergencySubtitle}>
            Contact us immediately when a death occurs
          </Text>
          <View style={styles.phoneRow}>
            <TouchableOpacity
              style={styles.phoneBtn}
              onPress={() => callNumber(contacts.phone1)}
            >
              <Ionicons name="call-outline" size={18} color={colors.primary} />
              <Text style={[styles.phoneBtnText, { color: colors.primary }]}>
                {contacts.phone1}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.phoneBtn}
              onPress={() => callNumber(contacts.phone2)}
            >
              <Ionicons name="call-outline" size={18} color={colors.primary} />
              <Text style={[styles.phoneBtnText, { color: colors.primary }]}>
                {contacts.phone2}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Intro */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>About Our Service</Text>
          <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
            Croydon Masjid provides a high-quality, compassionate and comprehensive funeral service to individuals of Islamic faith in the community. Our aim is to ensure that Islamic funeral rites are correctly and swiftly followed.
          </Text>
        </View>

        {/* Procedure Steps */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Procedure</Text>
          {PROCEDURE_STEPS.map((item) => (
            <View
              key={item.step}
              style={[styles.stepCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                <Text style={styles.stepNumberText}>{item.step}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>{item.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Guidance for Next-of-Kin */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Guidance for Next-of-Kin</Text>

          <View style={[styles.guideCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.guideTitle, { color: colors.text }]}>When Someone Dies</Text>
            <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
              Contact Croydon Masjid as soon as possible so staff can start the funeral arrangements quickly. You will be asked where the deceased should rest before the funeral (at the Masjid mortuary or your home) and which cemetery to use.
            </Text>
            <Text style={[styles.bodyText, { color: colors.textSecondary, marginTop: 8 }]}>
              The Masjid currently uses Greenlawns Cemetery in Warlingham and Queens Road Cemetery in West Croydon, but other borough cemeteries are possible.
            </Text>
          </View>

          <View style={[styles.guideCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.guideTitle, { color: colors.text }]}>Registering the Death</Text>
            <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
              Registration should take place prior to the funeral. A relative usually carries out this duty. The hospital will provide a 'letter for informant' containing the cause of death and other details.
            </Text>
            <Text style={[styles.guideSubtitle, { color: colors.text }]}>The Registrar will need:</Text>
            <View style={styles.bulletList}>
              {[
                'Date and place of death',
                'Full name, date and place of birth',
                'Occupation and home address',
                'Medical Certificate of Cause of Death',
                'NHS medical card (if available)',
                'Birth and Marriage certificates (if applicable)',
              ].map((item, i) => (
                <View key={i} style={styles.bulletItem}>
                  <Text style={[styles.bullet, { color: colors.accent }]}>{'\u2022'}</Text>
                  <Text style={[styles.bulletText, { color: colors.textSecondary }]}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.guideCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.guideTitle, { color: colors.text }]}>Visiting the Deceased</Text>
            <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
              With prior arrangement, the deceased can rest in one of the Masjid halls for visits, usually before the funeral prayer. Alternatively, visits can take place at the family home.
            </Text>
          </View>

          <View style={[styles.guideCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.guideTitle, { color: colors.text }]}>Legal Support</Text>
            <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
              The Masjid can arrange free legal advice to help with the Will and organising the affairs of the deceased. A legal advisor will contact you after funeral arrangements to answer any concerns. In some cases, funeral costs may be paid from the estate.
            </Text>
          </View>

          <View style={[styles.guideCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.guideTitle, { color: colors.text }]}>The Burial</Text>
            <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
              The deceased will be taken to the Masjid for the Janaza prayer at the agreed time, then to the cemetery in the Masjid van. One or two family members may travel in the van. One of the Masjid Imaams will perform the last rites at the cemetery.
            </Text>
          </View>

          <View style={[styles.guideCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.guideTitle, { color: colors.text }]}>After the Funeral</Text>
            <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
              There are many pressing issues to address after a death. Consider notifying relevant organisations, dealing with insurance, property, benefits, bank accounts, standing orders, and other administrative matters.
            </Text>
            <Text style={[styles.bodyText, { color: colors.textSecondary, marginTop: 8 }]}>
              If you have trouble meeting funeral costs, you may be eligible for a Social Fund Funeral Payment from the Department of Work and Pensions (www.dwp.gov.uk or 020 7712 2171).
            </Text>
          </View>
        </View>

        {/* Bottom Contact */}
        <View style={[styles.bottomContact, { backgroundColor: colors.accent + '15', borderColor: colors.accent + '30' }]}>
          <Ionicons name="information-circle-outline" size={20} color={colors.accent} />
          <Text style={[styles.bottomContactText, { color: colors.textSecondary }]}>
            For immediate assistance with Janazah arrangements, please call us at any time — day or night.
          </Text>
        </View>

        <View style={styles.callBtnsBottom}>
          <TouchableOpacity
            style={[styles.callBtn, { backgroundColor: colors.primary }]}
            onPress={() => callNumber(contacts.phone1)}
          >
            <Ionicons name="call" size={20} color="#FFFFFF" />
            <Text style={styles.callBtnText}>Call {contacts.phone1}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.callBtn, { backgroundColor: colors.primary }]}
            onPress={() => callNumber(contacts.phone2)}
          >
            <Ionicons name="call" size={20} color="#FFFFFF" />
            <Text style={styles.callBtnText}>Call {contacts.phone2}</Text>
          </TouchableOpacity>
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

  // Emergency Card
  emergencyCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  emergencyTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 10,
  },
  emergencySubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  phoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 6,
  },
  phoneBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Sections
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 22,
  },

  // Steps
  stepCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 13,
    lineHeight: 20,
  },

  // Guide Cards
  guideCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  guideSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 6,
  },
  bulletList: {
    gap: 4,
  },
  bulletItem: {
    flexDirection: 'row',
    gap: 8,
  },
  bullet: {
    fontSize: 16,
    lineHeight: 22,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 22,
  },

  // Bottom
  bottomContact: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginBottom: 12,
  },
  bottomContactText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  callBtnsBottom: {
    gap: 10,
    marginBottom: 16,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  callBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
