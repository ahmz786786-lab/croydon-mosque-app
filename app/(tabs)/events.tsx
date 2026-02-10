import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  ImageSourcePropType,
  Modal,
  Dimensions,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getEvents, addEvent, subscribeToEvents, Event } from '@/services/supabase';

// Event images
const eventImages: { [key: string]: ImageSourcePropType } = {
  'weekly-dars': require('@/assets/images/events/cmicwd.jpg'),
  'tajwid-classes': require('@/assets/images/events/cmicbtc.jpg'),
  'boys-youth': require('@/assets/images/events/boyouth.jpg'),
  'girls-youth': require('@/assets/images/events/gyc.jpg'),
  'teachers-wanted': require('@/assets/images/events/cmicmteach.jpg'),
  'laylatul-baraah': require('@/assets/images/events/shaban15.jpg'),
  'free-parking': require('@/assets/images/events/free-parking.jpg'),
};

// Map event titles to local images (for database events without uploaded images)
const titleToImageKey: { [key: string]: string } = {
  'Weekly Dars - Gardens of the Righteous': 'weekly-dars',
  'Beginner Tajwid al Quran Classes': 'tajwid-classes',
  'Boys Youth Club': 'boys-youth',
  'Girls Youth Club': 'girls-youth',
  'Male Madrassah Teachers Wanted': 'teachers-wanted',
  'Laylatul Bara\'ah - 15th Shaban': 'laylatul-baraah',
  'Free Parking Available': 'free-parking',
};

interface SampleEvent extends Event {
  imageKey?: string;
  image_url?: string;
}

const SAMPLE_EVENTS: SampleEvent[] = [
  {
    id: '1',
    title: 'Laylatul Bara\'ah - 15th Shaban',
    description: 'Securing Forgiveness on Laylatul Bara\'ah. Talk by Mufti Inaam Ul Haq. "Allah Ta\'ala pays special attention to His entire creation on the fifteenth night of Sha\'baan and forgives all of them except one who ascribes partners to Him and one who harbours enmity in his heart."',
    date: '2026-02-03',
    time: 'After Maghrib',
    location: 'Croydon Mosque & Islamic Centre',
    type: 'special',
    created_at: '2026-01-01T00:00:00Z',
    imageKey: 'laylatul-baraah',
  },
  {
    id: '2',
    title: 'Weekly Dars - Gardens of the Righteous',
    description: 'By Mufti Inaam-ul-haq Malik, Imam of Croydon Mosque. Join us for spiritual enrichment every Saturday evening.',
    date: '2026-02-07',
    time: 'Every Saturday after Maghrib',
    location: 'Main Hall',
    type: 'lecture',
    created_at: '2026-01-01T00:00:00Z',
    imageKey: 'weekly-dars',
  },
  {
    id: '3',
    title: 'Live Friday Bayaan',
    description: 'Join us for LIVE religious lectures every Friday broadcast via Mixlr. Two sessions available before Jumu\'ah prayers. Listen online or attend in person.',
    date: '2026-02-06',
    time: 'Every Friday at 11:55 AM & 1:00 PM',
    location: 'Croydon Mosque & Islamic Centre',
    type: 'lecture',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: '4',
    title: 'Beginner Tajwid al Quran Classes',
    description: "For Men 18+. Taught by Mufti Inaam-ul-haq Malik. It's never too late to start your Tajwid journey! Contact: 07429559107 or inaam@croydonmosque.com",
    date: '2026-02-02',
    time: 'Monday & Tuesday Evenings',
    location: 'Croydon Mosque',
    type: 'class',
    created_at: '2026-01-01T00:00:00Z',
    imageKey: 'tajwid-classes',
  },
  {
    id: '5',
    title: 'Boys Youth Club',
    description: 'Ages 12-16 years. Activities include spiritual reminders, youth development, indoor games, outdoor fun, brotherhood, food & snacks! Fee: £10/month',
    date: '2026-02-08',
    time: 'Every Sunday 5:15PM - 7:15PM',
    location: 'Croydon Masjid',
    type: 'community',
    created_at: '2026-01-01T00:00:00Z',
    imageKey: 'boys-youth',
  },
  {
    id: '6',
    title: 'Girls Youth Club',
    description: 'Ages 10-19 years. Join us for jam packed sessions learning about Islam and building sisterhood. Scan QR code to register!',
    date: '2026-02-08',
    time: 'Every Sunday Fortnight 3PM - 5PM',
    location: 'Croydon Mosque',
    type: 'community',
    created_at: '2026-01-01T00:00:00Z',
    imageKey: 'girls-youth',
  },
  {
    id: '7',
    title: 'Male Madrassah Teachers Wanted',
    description: 'Join our team! Vacancies for Weekend & Weekday Madrassah. Requirements: Strong Tajweed & Quran Recitation, Islamic Studies, Good Communication Skills. Contact: 07957 446458 or 07351 889635',
    date: '2026-02-01',
    time: 'Weekdays 5-7PM | Weekends 10AM-12:30PM',
    location: 'Croydon Mosque',
    type: 'special',
    created_at: '2026-01-01T00:00:00Z',
    imageKey: 'teachers-wanted',
  },
  {
    id: '8',
    title: 'Sisters Majlis',
    description: 'Islamic study, Quran recitation, and Arabic classes for sisters.',
    date: '2026-02-02',
    time: 'Mon-Thu 10am-1pm',
    location: 'Sisters Section',
    type: 'class',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: '9',
    title: 'Free Parking Available',
    description: 'Parking is now available right next door at the IBIZ Croydon Park Hotel car park! Register your number plate with staff upon arrival. Max 1 hour per vehicle. Not available during Fajr and Jumma prayers. For Duhr salah, register at reception prior to parking. Failure to follow instructions will result in camera fine at facility.',
    date: '2026-02-09',
    time: 'During regular prayer times',
    location: 'IBIZ Croydon Park Hotel Car Park',
    type: 'community',
    created_at: '2026-01-01T00:00:00Z',
    imageKey: 'free-parking',
  },
];

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  }

  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'lecture':
      return '#4A90D9';
    case 'class':
      return '#27AE60';
    case 'special':
      return '#D4AF37';
    case 'community':
      return '#9B59B6';
    default:
      return '#6B1C23';
  }
}

function getTypeIcon(type: string): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'lecture':
      return 'mic-outline';
    case 'class':
      return 'school-outline';
    case 'special':
      return 'star-outline';
    case 'community':
      return 'people-outline';
    default:
      return 'calendar-outline';
  }
}

export default function EventsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [events, setEvents] = useState<SampleEvent[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ uri?: string; source?: ImageSourcePropType } | null>(null);

  const seedDefaultEvents = async () => {
    const SEED_KEY = 'events_seeded_v1';
    const hasSeeded = await AsyncStorage.getItem(SEED_KEY);
    if (hasSeeded) return;

    try {
      const existing = await getEvents();
      if (existing.length === 0) {
        for (const sample of SAMPLE_EVENTS) {
          await addEvent({
            title: sample.title,
            description: sample.description,
            date: sample.date,
            time: sample.time,
            location: sample.location,
            type: sample.type,
          });
        }
      }
      await AsyncStorage.setItem(SEED_KEY, 'true');
    } catch (err) {
      console.error('Error seeding default events:', err);
    }
  };

  const loadEvents = async () => {
    try {
      await seedDefaultEvents();
      const data = await getEvents();
      setEvents(data.length > 0 ? data : SAMPLE_EVENTS);
    } catch (error) {
      console.error('Error loading events:', error);
      setEvents(SAMPLE_EVENTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();

    // Subscribe to real-time updates
    const subscription = subscribeToEvents((newEvents) => {
      if (newEvents.length > 0) {
        setEvents(newEvents);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  const filteredEvents = filter === 'all'
    ? events
    : events.filter(e => e.type === filter);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Ionicons name="calendar-outline" size={48} color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading events...
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
        <Text style={[styles.title, { color: colors.text }]}>Events & Classes</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Upcoming activities at the mosque
        </Text>
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
      >
        {['all', 'lecture', 'class', 'community', 'special'].map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.filterChip,
              {
                backgroundColor: filter === type ? colors.primary : colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setFilter(type)}
          >
            <Text
              style={[
                styles.filterText,
                { color: filter === type ? '#FFFFFF' : colors.text },
              ]}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={64} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Events</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No events found for this category
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {filteredEvents.map((event) => {
            const isExpanded = expandedId === event.id;
            const sampleEvent = event as SampleEvent;
            // Database image takes priority, then local image as fallback
            const hasDbImage = event.image_url;
            const imageKey = sampleEvent.imageKey || titleToImageKey[event.title];
            const hasLocalImage = !hasDbImage && imageKey && eventImages[imageKey];

            return (
              <TouchableOpacity
                key={event.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
                activeOpacity={0.7}
                onPress={() => setExpandedId(isExpanded ? null : event.id)}
              >
                {/* Event Image - Database image first, local image as fallback */}
                {hasDbImage && (
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => setPreviewImage({ uri: hasDbImage })}
                  >
                    <Image
                      source={{ uri: hasDbImage }}
                      style={[styles.eventImage, styles.dbImage]}
                      resizeMode="contain"
                      onError={() => {}}
                    />
                  </TouchableOpacity>
                )}
                {hasLocalImage && (
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => setPreviewImage({ source: eventImages[imageKey!] })}
                  >
                    <Image
                      source={eventImages[imageKey!]}
                      style={styles.eventImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                )}

                <View style={styles.cardInner}>
                  {/* Date Badge */}
                  <View style={styles.dateColumn}>
                    <View style={[styles.dateBadge, { backgroundColor: getTypeColor(event.type) }]}>
                      <Text style={styles.dateText}>{formatDate(event.date)}</Text>
                    </View>
                  </View>

                  {/* Content */}
                  <View style={styles.cardContent}>
                    {/* Type Badge */}
                    <View style={styles.typeRow}>
                      <View
                        style={[
                          styles.typeBadge,
                          { backgroundColor: `${getTypeColor(event.type)}20` },
                        ]}
                      >
                        <Ionicons
                          name={getTypeIcon(event.type)}
                          size={12}
                          color={getTypeColor(event.type)}
                        />
                        <Text style={[styles.typeText, { color: getTypeColor(event.type) }]}>
                          {event.type.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.cardTitle, { color: colors.text }]}>
                      {event.title}
                    </Text>

                    <Text
                      style={[styles.cardBody, { color: colors.textSecondary }]}
                      numberOfLines={isExpanded ? undefined : 2}
                    >
                      {event.description}
                    </Text>

                    {/* Time & Location */}
                    <View style={styles.metaRow}>
                      {event.time && (
                        <View style={styles.metaItem}>
                          <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                            {event.time}
                          </Text>
                        </View>
                      )}
                    </View>
                    {event.location && (
                      <View style={[styles.metaItem, { marginTop: 4 }]}>
                        <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                          {event.location}
                        </Text>
                      </View>
                    )}

                    {/* Tap to expand indicator */}
                    <View style={styles.expandIndicator}>
                      <Text style={[styles.expandText, { color: colors.primary }]}>
                        {isExpanded ? 'Tap to collapse' : 'Tap for more'}
                      </Text>
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={colors.primary}
                      />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Info Card */}
      <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
        <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
        <View style={styles.infoContent}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>Weekly Schedule</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Regular classes and lectures run throughout the week. Check the Services section for full timings.
          </Text>
        </View>
      </View>

      {/* Full-screen Image Preview Modal */}
      <Modal
        visible={previewImage !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImage(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setPreviewImage(null)}>
          <TouchableOpacity style={styles.modalClose} onPress={() => setPreviewImage(null)}>
            <Ionicons name="close-circle" size={36} color="#FFFFFF" />
          </TouchableOpacity>
          {previewImage && (
            <Image
              source={previewImage.uri ? { uri: previewImage.uri } : previewImage.source!}
              style={styles.modalImage}
              resizeMode="contain"
            />
          )}
        </Pressable>
      </Modal>
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
  filterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  eventImage: {
    width: '100%',
    height: 220,
  },
  dbImage: {
    height: 300,
    backgroundColor: '#f0f0f0',
  },
  cardInner: {
    flexDirection: 'row',
  },
  dateColumn: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  dateBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  dateText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  cardContent: {
    flex: 1,
    padding: 12,
    paddingLeft: 0,
  },
  typeRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  expandIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 4,
  },
  expandText: {
    fontSize: 12,
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
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  modalImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.8,
  },
});
