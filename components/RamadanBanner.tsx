import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getRamadanInfo } from '@/utils/hijriDate';

interface RamadanInfo {
  isRamadan: boolean;
  daysRemaining?: number;
  dayOfRamadan?: number;
}

interface RamadanBannerProps {
  colors: {
    primary: string;
    accent: string;
    text: string;
    textSecondary: string;
    card: string;
  };
  ramadanInfo?: RamadanInfo; // Optional - if not provided, will calculate internally
  onPress?: () => void;
}

// Ramadan times for Croydon Mosque (these would ideally come from a database)
const RAMADAN_TIMES = {
  suhoor_end: '5:15 AM', // Fajr begins
  iftar: '6:30 PM', // Maghrib
  taraweeh: '8:30 PM',
};

export default function RamadanBanner({ colors, ramadanInfo: propRamadanInfo, onPress }: RamadanBannerProps) {
  // Use prop if provided (with admin settings), otherwise calculate locally
  const ramadanInfo = propRamadanInfo || getRamadanInfo();

  if (!ramadanInfo.isRamadan) {
    if (ramadanInfo.daysRemaining && ramadanInfo.daysRemaining <= 60) {
      return (
        <View style={[styles.countdownBanner, { backgroundColor: colors.accent }]}>
          <Ionicons name="moon" size={24} color="#FFFFFF" />
          <View style={styles.countdownContent}>
            <Text style={styles.countdownTitle}>Ramadan is Coming!</Text>
            <Text style={styles.countdownText}>
              ~{ramadanInfo.daysRemaining} days until Ramadan
            </Text>
          </View>
        </View>
      );
    }
    // Fallback message when admin toggle is on but not near Ramadan
    return (
      <View style={[styles.countdownBanner, { backgroundColor: colors.accent }]}>
        <Ionicons name="moon" size={24} color="#FFFFFF" />
        <View style={styles.countdownContent}>
          <Text style={styles.countdownTitle}>Prepare for Ramadan</Text>
          <Text style={styles.countdownText}>
            May Allah allow us to reach Ramadan
          </Text>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.accent }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <Ionicons name="moon" size={28} color="#FFFFFF" />
        <View style={styles.headerText}>
          <Text style={styles.title}>Ramadan Mubarak!</Text>
          <Text style={styles.subtitle}>Day {ramadanInfo.dayOfRamadan} of Ramadan</Text>
        </View>
      </View>

      <View style={styles.timesContainer}>
        <View style={styles.timeBox}>
          <Text style={styles.timeLabel}>Suhoor Ends</Text>
          <Text style={styles.timeValue}>{RAMADAN_TIMES.suhoor_end}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.timeBox}>
          <Text style={styles.timeLabel}>Iftar</Text>
          <Text style={styles.timeValue}>{RAMADAN_TIMES.iftar}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.timeBox}>
          <Text style={styles.timeLabel}>Taraweeh</Text>
          <Text style={styles.timeValue}>{RAMADAN_TIMES.taraweeh}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerText: {
    marginLeft: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginTop: 2,
  },
  timesContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 12,
  },
  timeBox: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginVertical: 4,
  },
  timeLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  countdownBanner: {
    margin: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  countdownContent: {
    marginLeft: 12,
  },
  countdownTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  countdownText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    marginTop: 2,
  },
});
