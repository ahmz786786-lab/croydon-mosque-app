import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getAnnouncementsAndNews,
  addAnnouncement,
  subscribeToAnnouncements,
  Announcement,
} from '@/services/supabase';

// Sample data for when Supabase is not configured
const SAMPLE_ANNOUNCEMENTS: Announcement[] = [
  {
    id: '1',
    title: 'Ramadan 2025 Preparations',
    body: 'Join us for the blessed month of Ramadan. Taraweeh prayers will begin after Isha prayer. Please check the updated timetable.',
    type: 'announcement',
    created_at: '2025-02-01T10:00:00Z',
  },
  {
    id: '2',
    title: 'Weekly Dars - Every Friday',
    body: 'Live Bayaan every Friday at 11:55am and 2nd Bayan at 1pm via Mixlr. Join us for spiritual enrichment.',
    type: 'announcement',
    created_at: '2025-01-28T10:00:00Z',
  },
  {
    id: '3',
    title: 'Madrasah Registration Open',
    body: 'Registration for the new Madrasah term is now open. Both boys and girls classes available.',
    type: 'announcement',
    created_at: '2025-01-25T10:00:00Z',
  },
  {
    id: '4',
    title: 'Youth Club Activities',
    body: 'Weekly youth club sessions for boys and girls. Building community and Islamic values together.',
    type: 'announcement',
    created_at: '2025-01-20T10:00:00Z',
  },
];

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getTypeIcon(type: string): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'event':
      return 'calendar-outline';
    case 'article':
      return 'document-text-outline';
    case 'news':
      return 'newspaper-outline';
    default:
      return 'megaphone-outline';
  }
}

function getTypeColor(type: string, colors: any): string {
  switch (type) {
    case 'event':
      return colors.accent;
    case 'article':
      return '#4A90D9';
    case 'news':
      return '#FF9800';
    default:
      return colors.primary;
  }
}

export default function AnnouncementsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const seedDefaultAnnouncements = async () => {
    const SEED_KEY = 'announcements_seeded_v1';
    const hasSeeded = await AsyncStorage.getItem(SEED_KEY);
    if (hasSeeded) return;

    try {
      const existing = await getAnnouncementsAndNews();
      if (existing.length === 0) {
        for (const sample of SAMPLE_ANNOUNCEMENTS) {
          await addAnnouncement({
            title: sample.title,
            body: sample.body,
            type: sample.type,
          });
        }
      }
      await AsyncStorage.setItem(SEED_KEY, 'true');
    } catch (err) {
      console.error('Error seeding default announcements:', err);
    }
  };

  const loadAnnouncements = async () => {
    try {
      await seedDefaultAnnouncements();
      const data = await getAnnouncementsAndNews();
      setAnnouncements(data.length > 0 ? data : SAMPLE_ANNOUNCEMENTS);
    } catch (error) {
      console.error('Error loading announcements:', error);
      setAnnouncements(SAMPLE_ANNOUNCEMENTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();

    // Subscribe to real-time updates
    const subscription = subscribeToAnnouncements((newAnnouncements) => {
      setAnnouncements(newAnnouncements);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnnouncements();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Ionicons name="newspaper-outline" size={48} color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading announcements...
        </Text>
      </View>
    );
  }

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
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>News & Announcements</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Stay updated with mosque activities
        </Text>
      </View>

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="newspaper-outline" size={64} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Announcements</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Check back later for updates
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {announcements.map((item) => {
            const isExpanded = expandedId === item.id;

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
                activeOpacity={0.7}
                onPress={() => setExpandedId(isExpanded ? null : item.id)}
              >
                {/* Type Badge */}
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.typeBadge,
                      { backgroundColor: getTypeColor(item.type, colors) },
                    ]}
                  >
                    <Ionicons name={getTypeIcon(item.type)} size={12} color="#FFFFFF" />
                    <Text style={styles.typeText}>{item.type.toUpperCase()}</Text>
                  </View>
                  <Text style={[styles.date, { color: colors.textSecondary }]}>
                    {formatDate(item.created_at)}
                  </Text>
                </View>

                {/* Content */}
                <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
                <Text
                  style={[styles.cardBody, { color: colors.textSecondary }]}
                  numberOfLines={isExpanded ? undefined : 3}
                >
                  {item.body}
                </Text>

                {/* Read More / Collapse */}
                <View style={styles.cardFooter}>
                  <Text style={[styles.readMore, { color: colors.primary }]}>
                    {isExpanded ? 'Show less' : 'Read more'}
                  </Text>
                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-forward"}
                    size={16}
                    color={colors.primary}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingBottom: 30,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  list: {
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  typeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  date: {
    fontSize: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  readMore: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 8,
  },
});
