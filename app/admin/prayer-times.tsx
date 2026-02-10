import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { getPrayerTimeUpdates, updatePrayerTime, PrayerTimeUpdate } from '@/services/supabase';

const PRAYER_ORDER = ['Fajr', 'Zohr', 'Asr', 'Maghrib', 'Isha', 'Juma1', 'Juma2'];

const PRAYER_DISPLAY_NAMES: Record<string, string> = {
  Fajr: 'Fajr',
  Zohr: 'Zohr (Dhuhr)',
  Asr: 'Asr',
  Maghrib: 'Maghrib',
  Isha: 'Isha',
  Juma1: 'Juma (1st)',
  Juma2: 'Juma (2nd)',
};

interface EditablePrayerTime {
  prayer_name: string;
  azaan_time: string;
  salah_time: string;
}

export default function PrayerTimesAdmin() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const [prayerTimes, setPrayerTimes] = useState<EditablePrayerTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadPrayerTimes();
  }, []);

  const loadPrayerTimes = async () => {
    setLoading(true);
    try {
      const data = await getPrayerTimeUpdates();

      // Sort by predefined order
      const sorted = PRAYER_ORDER.map(name => {
        const found = data.find(p => p.prayer_name === name);
        return {
          prayer_name: name,
          azaan_time: found?.azaan_time || '',
          salah_time: found?.salah_time || '',
        };
      });

      setPrayerTimes(sorted);
    } catch (error) {
      console.error('Error loading prayer times:', error);
      Alert.alert('Error', 'Failed to load prayer times');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeChange = (prayerName: string, field: 'azaan_time' | 'salah_time', value: string) => {
    setPrayerTimes(prev =>
      prev.map(p =>
        p.prayer_name === prayerName ? { ...p, [field]: value } : p
      )
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Validate all times are filled
      for (const pt of prayerTimes) {
        if (!pt.azaan_time || !pt.salah_time) {
          Alert.alert('Validation Error', `Please fill both Azaan and Salah times for ${PRAYER_DISPLAY_NAMES[pt.prayer_name]}`);
          setSaving(false);
          return;
        }
      }

      // Save all prayer times
      for (const pt of prayerTimes) {
        const success = await updatePrayerTime(pt.prayer_name, pt.azaan_time, pt.salah_time);
        if (!success) {
          throw new Error(`Failed to update ${pt.prayer_name}`);
        }
      }

      setHasChanges(false);
      Alert.alert('Success', 'Prayer times updated successfully');
    } catch (error) {
      console.error('Error saving prayer times:', error);
      Alert.alert('Error', 'Failed to save prayer times. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading prayer times...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Prayer Times</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.saveBtn, !hasChanges && styles.saveBtnDisabled]}
          disabled={!hasChanges || saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Set both Azaan (call to prayer) and Salah (congregation) times for each prayer
          </Text>
        </View>

        {/* Daily Prayers */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Daily Prayers</Text>
        {prayerTimes.filter(p => !p.prayer_name.startsWith('Juma')).map(prayer => (
          <PrayerTimeCard
            key={prayer.prayer_name}
            prayer={prayer}
            colors={colors}
            onAzaanChange={(value) => handleTimeChange(prayer.prayer_name, 'azaan_time', value)}
            onSalahChange={(value) => handleTimeChange(prayer.prayer_name, 'salah_time', value)}
          />
        ))}

        {/* Juma Prayers */}
        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>Juma Prayers</Text>
        {prayerTimes.filter(p => p.prayer_name.startsWith('Juma')).map(prayer => (
          <PrayerTimeCard
            key={prayer.prayer_name}
            prayer={prayer}
            colors={colors}
            onAzaanChange={(value) => handleTimeChange(prayer.prayer_name, 'azaan_time', value)}
            onSalahChange={(value) => handleTimeChange(prayer.prayer_name, 'salah_time', value)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

interface PrayerTimeCardProps {
  prayer: EditablePrayerTime;
  colors: typeof Colors.light;
  onAzaanChange: (value: string) => void;
  onSalahChange: (value: string) => void;
}

function PrayerTimeCard({ prayer, colors, onAzaanChange, onSalahChange }: PrayerTimeCardProps) {
  return (
    <View style={[styles.prayerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.prayerName, { color: colors.text }]}>
        {PRAYER_DISPLAY_NAMES[prayer.prayer_name] || prayer.prayer_name}
      </Text>

      <View style={styles.timeInputsRow}>
        <View style={styles.timeInputContainer}>
          <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>Azaan</Text>
          <TextInput
            style={[
              styles.timeInput,
              {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={prayer.azaan_time}
            onChangeText={onAzaanChange}
            placeholder="e.g., 5:30 AM"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.timeInputContainer}>
          <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>Salah</Text>
          <TextInput
            style={[
              styles.timeInput,
              {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={prayer.salah_time}
            onChangeText={onSalahChange}
            placeholder="e.g., 6:00 AM"
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
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
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 15,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  prayerCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  prayerName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  timeInputsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeInputContainer: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  timeInput: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 15,
  },
});
