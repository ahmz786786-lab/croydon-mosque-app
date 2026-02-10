import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Switch,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { supabase, logoutAdmin, getCurrentUser } from '@/services/supabase';
import AdminLogin from '@/components/AdminLogin';

interface Stats {
  announcements: number;
  events: number;
}

export default function AdminDashboard() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);
  const [stats, setStats] = useState<Stats>({ announcements: 0, events: 0 });
  const [ramadanEnabled, setRamadanEnabled] = useState(false);
  const [togglingRamadan, setTogglingRamadan] = useState(false);
  const [janazahPhone1, setJanazahPhone1] = useState('07737198776');
  const [janazahPhone2, setJanazahPhone2] = useState('07949176780');
  const [janazahEmergency, setJanazahEmergency] = useState('07404050893');
  const [savingPhones, setSavingPhones] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      loadStats();
    }
  }, [isLoggedIn]);

  const checkAuth = async () => {
    try {
      const user = await getCurrentUser();
      setIsLoggedIn(!!user);
    } catch {
      setIsLoggedIn(false);
    } finally {
      setChecking(false);
    }
  };

  const loadStats = async () => {
    try {
      const getCount = async (table: string) => {
        try {
          const { count, error } = await supabase.from(table).select('id', { count: 'exact', head: true });
          if (error) return 0;
          return count || 0;
        } catch {
          return 0;
        }
      };

      const [announcementsCount, eventsCount] = await Promise.all([
        getCount('announcements'),
        getCount('events'),
      ]);

      setStats({
        announcements: announcementsCount,
        events: eventsCount,
      });

      // Load app settings
      try {
        const { data } = await supabase
          .from('app_settings')
          .select('key, value')
          .in('key', ['ramadan_banner_enabled', 'janazah_phone1', 'janazah_phone2', 'janazah_emergency_line']);

        if (data) {
          for (const row of data) {
            if (row.key === 'ramadan_banner_enabled') setRamadanEnabled(row.value === 'true');
            if (row.key === 'janazah_phone1') setJanazahPhone1(row.value);
            if (row.key === 'janazah_phone2') setJanazahPhone2(row.value);
            if (row.key === 'janazah_emergency_line') setJanazahEmergency(row.value);
          }
        }
      } catch {
        // Use defaults
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logoutAdmin();
          router.back();
        },
      },
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const toggleRamadanBanner = async () => {
    setTogglingRamadan(true);
    const newValue = !ramadanEnabled;
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ key: 'ramadan_banner_enabled', value: String(newValue), updated_at: new Date().toISOString() }, { onConflict: 'key' });
      if (error) throw error;
      setRamadanEnabled(newValue);
    } catch (error) {
      Alert.alert('Error', 'Failed to update Ramadan banner setting');
    } finally {
      setTogglingRamadan(false);
    }
  };

  const saveJanazahPhones = async () => {
    setSavingPhones(true);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('app_settings')
        .upsert([
          { key: 'janazah_phone1', value: janazahPhone1.trim(), updated_at: now },
          { key: 'janazah_phone2', value: janazahPhone2.trim(), updated_at: now },
          { key: 'janazah_emergency_line', value: janazahEmergency.trim(), updated_at: now },
        ], { onConflict: 'key' });
      if (error) throw error;
      Alert.alert('Saved', 'Janazah numbers updated successfully');
    } catch {
      Alert.alert('Error', 'Failed to update phone numbers');
    } finally {
      setSavingPhones(false);
    }
  };

  // Loading state
  if (checking) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Checking authentication...
        </Text>
      </View>
    );
  }

  // Login screen
  if (!isLoggedIn) {
    return <AdminLogin onLogin={() => setIsLoggedIn(true)} onBack={() => router.back()} />;
  }

  const StatCard = ({
    icon,
    label,
    count,
    color,
    onPress,
  }: {
    icon: string;
    label: string;
    count: number;
    color: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <Text style={[styles.statCount, { color: colors.text }]}>{count}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );

  const QuickAction = ({
    icon,
    label,
    color,
    onPress,
  }: {
    icon: string;
    label: string;
    color: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.quickAction, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon as any} size={22} color={color} />
      </View>
      <Text style={[styles.quickActionLabel, { color: colors.text }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Welcome Section */}
        <View style={[styles.welcomeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.welcomeTitle, { color: colors.text }]}>Welcome, Admin</Text>
          <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
            Manage your mosque content
          </Text>
        </View>

        {/* Stats Grid */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard
            icon="megaphone-outline"
            label="Announcements"
            count={stats.announcements}
            color="#4CAF50"
            onPress={() => router.push('/admin/announcements')}
          />
          <StatCard
            icon="calendar-outline"
            label="Events"
            count={stats.events}
            color="#2196F3"
            onPress={() => router.push('/admin/events')}
          />
        </View>

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <QuickAction
            icon="time-outline"
            label="Prayer Times"
            color="#00BCD4"
            onPress={() => router.push('/admin/prayer-times')}
          />
          <QuickAction
            icon="moon-outline"
            label="Islamic Date"
            color="#D4AF37"
            onPress={() => router.push('/admin/islamic-date')}
          />
          <QuickAction
            icon="megaphone-outline"
            label="Status Bar"
            color="#E91E63"
            onPress={() => router.push('/admin/status-bar')}
          />
          <QuickAction
            icon="add-circle-outline"
            label="New Announcement"
            color="#4CAF50"
            onPress={() => router.push('/admin/announcements')}
          />
          <QuickAction
            icon="calendar-number-outline"
            label="Add Event"
            color="#2196F3"
            onPress={() => router.push('/admin/events')}
          />
          <QuickAction
            icon="calendar-outline"
            label="Monthly Calendar"
            color="#795548"
            onPress={() => router.push('/admin/monthly-calendar')}
          />
        </View>

        {/* Ramadan Banner Toggle */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Ramadan Banner</Text>
        <View style={[styles.toggleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.toggleRow}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#D4AF3715' }]}>
              <Ionicons name="moon" size={22} color="#D4AF37" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.toggleLabel, { color: colors.text }]}>Ramadan is Coming</Text>
              <Text style={[styles.toggleSubLabel, { color: colors.textSecondary }]}>
                {ramadanEnabled ? 'Banner visible to all users' : 'Banner hidden from users'}
              </Text>
            </View>
            {togglingRamadan ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Switch
                value={ramadanEnabled}
                onValueChange={toggleRamadanBanner}
                trackColor={{ false: colors.border, true: '#D4AF37' }}
                thumbColor="#FFF"
              />
            )}
          </View>
        </View>

        {/* Janazah Emergency Numbers */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Janazah Emergency Line</Text>
        <View style={[styles.toggleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.phoneLabel, { color: colors.textSecondary }]}>Phone Number 1</Text>
          <TextInput
            style={[styles.phoneInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            value={janazahPhone1}
            onChangeText={setJanazahPhone1}
            placeholder="07737198776"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
          />
          <Text style={[styles.phoneLabel, { color: colors.textSecondary, marginTop: 12 }]}>Phone Number 2</Text>
          <TextInput
            style={[styles.phoneInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            value={janazahPhone2}
            onChangeText={setJanazahPhone2}
            placeholder="07949176780"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
          />
          <Text style={[styles.phoneLabel, { color: colors.textSecondary, marginTop: 12 }]}>Emergency Line (More Page)</Text>
          <TextInput
            style={[styles.phoneInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            value={janazahEmergency}
            onChangeText={setJanazahEmergency}
            placeholder="07404050893"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
          />
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            onPress={saveJanazahPhones}
            disabled={savingPhones}
          >
            {savingPhones ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.saveBtnText}>Save Numbers</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={[styles.infoCard, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Changes are published immediately to all app users
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
  logoutBtn: {
    padding: 4,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  welcomeCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  welcomeSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statCount: {
    fontSize: 28,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 13,
    marginTop: 4,
  },
  quickActions: {
    gap: 10,
    marginBottom: 24,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  quickActionLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  toggleCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 24,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  toggleSubLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  phoneLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  phoneInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  saveBtn: {
    marginTop: 14,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
  },
});
