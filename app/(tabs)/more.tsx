import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Share,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useColorScheme } from '@/components/useColorScheme';
import { useTheme } from '@/contexts/ThemeContext';
import Colors from '@/constants/Colors';
import { MOSQUE_INFO } from '@/constants/prayerTimes';
import { getMonthlyCalendar, MonthlyCalendar, getAppSetting } from '@/services/supabase';

// Social Media Links
const SOCIAL_LINKS = {
  facebook: 'https://www.facebook.com/croydonmosque',
  instagram: 'https://www.instagram.com/croydonmosque',
  youtube: 'https://www.youtube.com/croydonmosque',
  mixlr: 'https://croydonmosque.mixlr.com/',
};

interface MenuItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  action: () => void;
  color?: string;
}

interface ServiceItem {
  name: string;
  timing?: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface DonationCampaign {
  id: string;
  name: string;
  raised: number;
  goal: number;
  color: string;
  url?: string;
}

// Mosque Capacity
const MOSQUE_CAPACITY = {
  men: 3000,
  women: 500,
};

// Donation Campaigns
const DONATION_CAMPAIGNS: DonationCampaign[] = [
  {
    id: 'sadqah',
    name: 'Sadqah / Fitrana / Zakaat',
    raised: 0,
    goal: 10000,
    color: '#8E44AD',
    url: 'https://donate.supportedgiving.com/Zakaat-Fitra-Sadaqa?qrCode=PEGp03BmEF4C&visitor=5d2345d0-e7a9-4d51-ba53-4ef737b55f64',
  },
  {
    id: 'daytoday',
    name: 'Day to Day Running',
    raised: 0,
    goal: 20000,
    color: '#27AE60',
    url: 'https://donate.supportedgiving.com/general-donations?qrCode=qClTpxbQmEfP&visitor=f2ee4c34-ba13-4b1c-89b6-4cdd33628597',
  },
  {
    id: 'building',
    name: 'Help Towards Building Cost',
    raised: 0,
    goal: 50000,
    color: '#3498DB',
    url: 'https://donate.supportedgiving.com/construction?qrCode=7MFOzMhJq5ZE&visitor=53dbd4b8-5257-4c47-9f59-3fbbbb1701cb',
  },
];

// Facilities
const FACILITIES = [
  { name: 'Wudu Area', men: true, women: true },
  { name: 'Toilets', men: true, women: true },
  { name: 'Parking', available: true },
  { name: 'Wheelchair Access', available: true },
  { name: 'Lift Access (3 Lifts)', available: true },
];

const SERVICES: ServiceItem[] = [
  {
    name: 'Madrasa Classes',
    timing: 'Mon-Fri 5-6:45pm | Sat-Sun 10am-12:30pm',
    description: 'Islamic education for ages 5-12',
    icon: 'book-outline',
  },
  {
    name: 'Alimah Classes',
    timing: 'Mon-Fri 5-7:30pm',
    description: 'Islamic studies for young women',
    icon: 'school-outline',
  },
  {
    name: 'Sisters Majlis',
    timing: 'Mon-Thu 10am-1pm',
    description: 'Islamic study, Quran recitation, Arabic',
    icon: 'people-outline',
  },
  {
    name: 'Weekly Lectures',
    timing: 'Wednesday & Saturday evenings',
    description: 'Dars e Hadith, Fiqh, English lectures',
    icon: 'mic-outline',
  },
  {
    name: 'Nikah Services',
    description: 'Islamic marriage & registration',
    icon: 'heart-outline',
  },
  {
    name: 'Janazah Service',
    description: 'Funeral services - 24/7 emergency line',
    icon: 'ribbon-outline',
  },
  {
    name: 'Free Legal Advice',
    timing: 'Sundays from Zohr',
    description: 'Walk-in legal consultation',
    icon: 'shield-checkmark-outline',
  },
  {
    name: 'Hall Hire',
    description: 'Rental space available for events',
    icon: 'business-outline',
  },
];

export default function MoreScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { themeMode, setThemeMode } = useTheme();
  const router = useRouter();
  const [calendar, setCalendar] = useState<MonthlyCalendar | null>(null);
  const [janazahPhone, setJanazahPhone] = useState('07404050893');
  // Using hardcoded donation campaigns for reliability
  const donationCampaigns = DONATION_CAMPAIGNS;

  const loadSettings = useCallback(() => {
    getMonthlyCalendar().then((data) => {
      setCalendar(data);
    });
    getAppSetting('janazah_emergency_line').then((val) => {
      if (val) setJanazahPhone(val);
    });
  }, []);

  // Re-fetch every time the screen comes into focus
  useFocusEffect(loadSettings);

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

  const openMaps = () => {
    const address = encodeURIComponent(MOSQUE_INFO.address);
    Linking.openURL(`https://maps.google.com/?q=${address}`).catch(() => {
      Alert.alert('Error', 'Could not open maps');
    });
  };

  const shareApp = async () => {
    try {
      await Share.share({
        message: 'Download the Croydon Mosque app for prayer times, events, and more! https://croydonmosque.com/app',
        title: 'Croydon Mosque App',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const menuItems: MenuItem[] = [
    {
      id: 'about',
      title: 'About Us',
      subtitle: 'History, community & services',
      icon: 'information-circle-outline',
      action: () => router.push('/about'),
      color: '#2C3E50',
    },
    {
      id: 'madrasah',
      title: 'Madrasah',
      subtitle: 'Registration, timings & info',
      icon: 'book-outline',
      action: () => router.push('/madrasah'),
      color: '#8E44AD',
    },
    {
      id: 'janazah',
      title: 'Janazah Service',
      subtitle: 'Funeral procedures & contacts',
      icon: 'flower-outline',
      action: () => router.push('/janazah'),
      color: '#607D8B',
    },
    ...(calendar?.is_active && calendar.url ? [{
      id: 'calendar',
      title: calendar.title || 'Islamic Calendar',
      subtitle: 'Download monthly calendar',
      icon: 'calendar-outline',
      action: () => openUrl(calendar.url),
      color: '#795548',
    }] : []),
    {
      id: 'livestream',
      title: 'Live Stream',
      subtitle: 'Listen to Friday Bayaan',
      icon: 'radio-outline',
      action: () => router.push('/livestream'),
      color: '#E91E63',
    },
    {
      id: 'donate',
      title: 'Donate',
      subtitle: 'Support the mosque',
      icon: 'heart',
      action: () => openUrl(MOSQUE_INFO.donateUrl),
      color: colors.primary,
    },
    {
      id: 'website',
      title: 'Visit Website',
      subtitle: 'Full mosque website',
      icon: 'globe-outline',
      action: () => openUrl(MOSQUE_INFO.website),
    },
    {
      id: 'articles',
      title: 'Islamic Articles',
      subtitle: 'Read educational content',
      icon: 'document-text-outline',
      action: () => openUrl('https://www.croydonmosque.com/?section=articles'),
    },
    {
      id: 'share',
      title: 'Share App',
      subtitle: 'Invite friends & family',
      icon: 'share-social-outline',
      action: shareApp,
      color: '#25D366',
    },
    {
      id: 'privacy',
      title: 'Privacy Policy',
      subtitle: 'How we protect your data',
      icon: 'shield-outline',
      action: () => router.push('/privacy-policy'),
      color: '#607D8B',
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Mosque Info Card */}
      <View style={[styles.mosqueCard, { backgroundColor: colors.primary }]}>
        <Text style={styles.mosqueName}>{MOSQUE_INFO.name}</Text>
        <TouchableOpacity style={styles.addressRow} onPress={openMaps}>
          <Ionicons name="location-outline" size={16} color="rgba(255,255,255,0.9)" />
          <Text style={styles.addressText}>{MOSQUE_INFO.address}</Text>
        </TouchableOpacity>
      </View>

      {/* Mosque Capacity */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>Mosque Capacity</Text>
        <View style={[styles.capacityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.capacityRow}>
            <View style={styles.capacityItem}>
              <Text style={[styles.capacityNumber, { color: colors.text }]}>{MOSQUE_CAPACITY.men}</Text>
              <Text style={[styles.capacityLabel, { color: colors.textSecondary }]}>MEN</Text>
            </View>
            <View style={[styles.capacityDivider, { backgroundColor: colors.border }]} />
            <View style={styles.capacityItem}>
              <Text style={[styles.capacityNumber, { color: colors.text }]}>{MOSQUE_CAPACITY.women}</Text>
              <Text style={[styles.capacityLabel, { color: colors.textSecondary }]}>WOMEN</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Facilities */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>Facilities</Text>
        <View style={[styles.facilitiesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {FACILITIES.map((facility, index) => (
            <View key={index} style={[styles.facilityRow, index < FACILITIES.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <Text style={[styles.facilityName, { color: colors.text }]}>{facility.name}</Text>
              {'men' in facility ? (
                <View style={styles.facilityBadges}>
                  {facility.men && <Text style={[styles.facilityBadge, { color: colors.primary }]}>Men</Text>}
                  {facility.women && <Text style={[styles.facilityBadge, { color: colors.primary }]}>Women</Text>}
                </View>
              ) : (
                <Ionicons name="checkmark-circle" size={20} color="#27AE60" />
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Donation Campaigns */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>Support the Mosque</Text>
        <View style={styles.donationList}>
          {donationCampaigns.map((campaign) => {
            return (
              <TouchableOpacity
                key={campaign.id}
                style={[styles.donationCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => openUrl(campaign.url || MOSQUE_INFO.donateUrl)}
              >
                <View style={[styles.donationHeader, { backgroundColor: campaign.color }]}>
                  <Text style={styles.donationName}>{campaign.name}</Text>
                </View>
                <View style={styles.donationContent}>
                  <TouchableOpacity
                    style={[styles.donateButton, { backgroundColor: campaign.color }]}
                    onPress={() => openUrl(campaign.url || MOSQUE_INFO.donateUrl)}
                  >
                    <Text style={styles.donateButtonText}>Donate Now</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => callPhone(MOSQUE_INFO.phone)}
          >
            <Ionicons name="call" size={24} color="#FFFFFF" />
            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.accent }]}
            onPress={() => sendEmail(MOSQUE_INFO.email)}
          >
            <Ionicons name="mail" size={24} color="#FFFFFF" />
            <Text style={styles.actionText}>Email</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#4A90D9' }]}
            onPress={openMaps}
          >
            <Ionicons name="navigate" size={24} color="#FFFFFF" />
            <Text style={styles.actionText}>Directions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#25D366' }]}
            onPress={() => openUrl(MOSQUE_INFO.donateUrl)}
          >
            <Ionicons name="heart" size={24} color="#FFFFFF" />
            <Text style={styles.actionText}>Donate</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Services Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Our Services</Text>
        <View style={styles.servicesList}>
          {SERVICES.map((service, index) => (
            <View
              key={index}
              style={[
                styles.serviceCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={[styles.serviceIcon, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name={service.icon} size={24} color={colors.primary} />
              </View>
              <View style={styles.serviceContent}>
                <Text style={[styles.serviceName, { color: colors.text }]}>
                  {service.name}
                </Text>
                {service.timing && (
                  <Text style={[styles.serviceTiming, { color: colors.primary }]}>
                    {service.timing}
                  </Text>
                )}
                <Text style={[styles.serviceDesc, { color: colors.textSecondary }]}>
                  {service.description}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Links</Text>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.menuItem,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={item.action}
          >
            <View style={[styles.menuIcon, { backgroundColor: `${item.color || colors.primary}15` }]}>
              <Ionicons
                name={item.icon}
                size={22}
                color={item.color || colors.primary}
              />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>
                {item.title}
              </Text>
              {item.subtitle && (
                <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
                  {item.subtitle}
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Contact Info */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact</Text>
        <View style={[styles.contactCard, { backgroundColor: colors.surface }]}>
          <View style={styles.contactRow}>
            <Ionicons name="call-outline" size={18} color={colors.primary} />
            <Text style={[styles.contactText, { color: colors.text }]}>
              {MOSQUE_INFO.phone}
            </Text>
          </View>
          <View style={styles.contactRow}>
            <Ionicons name="mail-outline" size={18} color={colors.primary} />
            <Text style={[styles.contactText, { color: colors.text }]}>
              {MOSQUE_INFO.email}
            </Text>
          </View>
          <View style={styles.contactRow}>
            <Ionicons name="globe-outline" size={18} color={colors.primary} />
            <Text style={[styles.contactText, { color: colors.text }]}>
              croydonmosque.com
            </Text>
          </View>
        </View>
      </View>

      {/* Emergency Janazah Contact */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.emergencyCard, { backgroundColor: colors.primary }]}
          onPress={() => callPhone(janazahPhone)}
        >
          <Ionicons name="alert-circle" size={24} color="#FFFFFF" />
          <View style={styles.emergencyContent}>
            <Text style={styles.emergencyTitle}>Janazah Emergency Line</Text>
            <Text style={styles.emergencyNumber}>{janazahPhone.replace(/(\d{5})(\d{3})(\d{3})/, '$1 $2 $3')}</Text>
          </View>
          <Ionicons name="call" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Settings Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Settings</Text>

        {/* Theme Toggle */}
        <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="moon-outline" size={22} color={colors.primary} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>Dark Mode</Text>
            </View>
            <View style={styles.themeButtons}>
              {(['light', 'dark', 'system'] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.themeButton,
                    {
                      backgroundColor: themeMode === mode ? colors.primary : 'transparent',
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setThemeMode(mode)}
                >
                  <Text
                    style={[
                      styles.themeButtonText,
                      { color: themeMode === mode ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Admin Access */}
        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push('/admin')}
        >
          <View style={[styles.menuIcon, { backgroundColor: `${colors.accent}15` }]}>
            <Ionicons name="shield-checkmark-outline" size={22} color={colors.accent} />
          </View>
          <View style={styles.menuContent}>
            <Text style={[styles.menuTitle, { color: colors.text }]}>Admin Panel</Text>
            <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
              Manage announcements & events
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          Croydon Mosque App v1.0.0
        </Text>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          Made with love for the community
        </Text>
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
  mosqueCard: {
    padding: 24,
    marginBottom: 8,
  },
  mosqueName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    marginLeft: 6,
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  servicesList: {
    gap: 10,
  },
  serviceCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceContent: {
    flex: 1,
    marginLeft: 12,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '600',
  },
  serviceTiming: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  serviceDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: {
    flex: 1,
    marginLeft: 12,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  menuSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  contactCard: {
    padding: 16,
    borderRadius: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  contactText: {
    fontSize: 14,
    marginLeft: 12,
  },
  emergencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  emergencyContent: {
    flex: 1,
    marginLeft: 12,
  },
  emergencyTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emergencyNumber: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  footerText: {
    fontSize: 12,
    marginTop: 4,
  },
  // Calendar styles
  calendarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  calendarIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarContent: {
    flex: 1,
    marginLeft: 14,
  },
  calendarTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  calendarSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginTop: 2,
  },
  // Capacity styles
  capacityCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  capacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  capacityItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
  },
  capacityNumber: {
    fontSize: 36,
    fontWeight: '700',
  },
  capacityLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 1,
  },
  capacityDivider: {
    width: 1,
    height: 50,
  },
  // Facilities styles
  facilitiesCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  facilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  facilityName: {
    fontSize: 15,
  },
  facilityBadges: {
    flexDirection: 'row',
    gap: 12,
  },
  facilityBadge: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Donation styles
  donationList: {
    gap: 16,
  },
  donationCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  donationHeader: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  donationName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  donationContent: {
    padding: 16,
    alignItems: 'center',
  },
  donationRaised: {
    fontSize: 28,
    fontWeight: '700',
  },
  donationGoal: {
    fontSize: 14,
    marginTop: 4,
  },
  progressBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  donateButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  donateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Settings styles
  settingsCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'column',
    gap: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  themeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  themeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  themeButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
