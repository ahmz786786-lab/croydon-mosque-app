import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase credentials
const SUPABASE_URL = 'https://yenesnuzsilofndsfeda.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllbmVzbnV6c2lsb2ZuZHNmZWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNzQ0NDksImV4cCI6MjA4NTY1MDQ0OX0.BLqe9cfdBQGr_pLjXyi-4kR3L4hm-9SpuCxHKnW8cXE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Types
export interface Announcement {
  id: string;
  title: string;
  body: string;
  type: 'announcement' | 'event' | 'article';
  image_url?: string;
  created_at: string;
  created_by?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  location?: string;
  type: 'class' | 'lecture' | 'special' | 'community';
  image_url?: string;
  created_at: string;
}

export interface PrayerTimeUpdate {
  id: string;
  prayer_name: string;
  azaan_time: string;
  salah_time: string;
  updated_at: string;
}

// ============ ANNOUNCEMENTS ============

export async function getAnnouncements(): Promise<Announcement[]> {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return [];
  }
}

// ============ NEWS ============

export interface News {
  id: string;
  title: string;
  body: string;
  type: string;
  image_url?: string;
  created_at: string;
}

export async function getNews(): Promise<News[]> {
  try {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching news:', error);
    return [];
  }
}

export async function getAnnouncementsAndNews(): Promise<Announcement[]> {
  try {
    const [announcements, news] = await Promise.all([
      getAnnouncements(),
      getNews(),
    ]);

    // Combine and sort by created_at
    const combined = [
      ...announcements,
      ...news.map(n => ({ ...n, type: 'news' as const })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return combined;
  } catch (error) {
    console.error('Error fetching announcements and news:', error);
    return [];
  }
}

export async function addAnnouncement(
  announcement: Omit<Announcement, 'id' | 'created_at'>
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .insert([announcement])
      .select('id')
      .single();

    if (error) throw error;
    return data?.id || null;
  } catch (error) {
    console.error('Error adding announcement:', error);
    throw error;
  }
}

export async function deleteAnnouncement(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return false;
  }
}

// ============ EVENTS ============

export async function getEvents(): Promise<Event[]> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
}

export async function getAllEvents(): Promise<Event[]> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching all events:', error);
    return [];
  }
}

export async function addEvent(
  event: Omit<Event, 'id' | 'created_at'>
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('events')
      .insert([event])
      .select('id')
      .single();

    if (error) throw error;
    return data?.id || null;
  } catch (error) {
    console.error('Error adding event:', error);
    throw error;
  }
}

export async function deleteEvent(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting event:', error);
    return false;
  }
}

// ============ PRAYER TIMES (for admin updates) ============

export async function getPrayerTimeUpdates(): Promise<PrayerTimeUpdate[]> {
  try {
    const { data, error } = await supabase
      .from('prayer_times')
      .select('*')
      .order('prayer_name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching prayer times:', error);
    return [];
  }
}

export async function updatePrayerTime(
  prayerName: string,
  azaanTime: string,
  salahTime: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('prayer_times')
      .upsert(
        {
          prayer_name: prayerName,
          azaan_time: azaanTime,
          salah_time: salahTime,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'prayer_name' }
      );

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating prayer time:', error);
    return false;
  }
}

// ============ AUTH ============

export async function loginAdmin(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data.user;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
}

export async function logoutAdmin() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  try {
    const { data, error } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (error) return false;
    return !!data;
  } catch {
    return false;
  }
}

// ============ REALTIME SUBSCRIPTIONS ============

export function subscribeToAnnouncements(
  callback: (announcements: Announcement[]) => void
) {
  return supabase
    .channel('announcements_channel')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'announcements' },
      async () => {
        const announcements = await getAnnouncements();
        callback(announcements);
      }
    )
    .subscribe();
}

export function subscribeToEvents(callback: (events: Event[]) => void) {
  return supabase
    .channel('events_channel')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'events' },
      async () => {
        const events = await getEvents();
        callback(events);
      }
    )
    .subscribe();
}

// ============ DONATION CAMPAIGNS ============

export interface DonationCampaign {
  id: string;
  name: string;
  description?: string;
  raised: number;
  goal: number;
  color: string;
  is_active: boolean;
  donate_url?: string;
  created_at: string;
}

export async function getDonationCampaigns(): Promise<DonationCampaign[]> {
  try {
    const { data, error } = await supabase
      .from('donation_campaigns')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching donation campaigns:', error);
    return [];
  }
}

export async function updateDonationAmount(
  campaignId: string,
  newAmount: number
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('donation_campaigns')
      .update({ raised: newAmount, updated_at: new Date().toISOString() })
      .eq('id', campaignId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating donation amount:', error);
    return false;
  }
}

export function subscribeToDonations(callback: (campaigns: DonationCampaign[]) => void) {
  return supabase
    .channel('donations_channel')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'donation_campaigns' },
      async () => {
        const campaigns = await getDonationCampaigns();
        callback(campaigns);
      }
    )
    .subscribe();
}

// ============ PUSH NOTIFICATIONS ============

export async function registerPushToken(token: string, platform: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('push_tokens')
      .upsert({ token, platform }, { onConflict: 'token' });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error registering push token:', error);
    return false;
  }
}

// ============ ISLAMIC DATE SETTINGS ============

export interface IslamicDateSettings {
  id: string;
  day_adjustment: number;
  manual_date_enabled: boolean;
  manual_day: number | null;
  manual_month: number | null;
  manual_year: number | null;
  updated_at: string;
}

export async function getIslamicDateSettings(): Promise<IslamicDateSettings | null> {
  try {
    const { data, error } = await supabase
      .from('islamic_date_settings')
      .select('*')
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching Islamic date settings:', error);
    return null;
  }
}

export async function updateIslamicDateSettings(
  settings: Partial<Omit<IslamicDateSettings, 'id' | 'updated_at'>>
): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    const { error } = await supabase
      .from('islamic_date_settings')
      .update({
        ...settings,
        updated_at: new Date().toISOString(),
        updated_by: user?.id
      })
      .not('id', 'is', null); // Update the single row

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating Islamic date settings:', error);
    return false;
  }
}

export function subscribeToIslamicDateSettings(
  callback: (settings: IslamicDateSettings | null) => void
) {
  return supabase
    .channel('islamic_date_settings_channel')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'islamic_date_settings' },
      async () => {
        const settings = await getIslamicDateSettings();
        callback(settings);
      }
    )
    .subscribe();
}

// ============ MONTHLY CALENDAR ============

export interface MonthlyCalendar {
  id: string;
  title: string;
  url: string;
  is_active: boolean;
  updated_at: string;
}

export async function getMonthlyCalendar(): Promise<MonthlyCalendar | null> {
  try {
    const { data, error } = await supabase
      .from('monthly_calendar')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error) return null;
    return data?.[0] || null;
  } catch {
    return null;
  }
}

export async function updateMonthlyCalendar(
  title: string,
  url: string,
  isActive: boolean
): Promise<boolean> {
  try {
    const user = await getCurrentUser();

    // Check if a row exists
    const { data: rows } = await supabase
      .from('monthly_calendar')
      .select('id')
      .limit(1);
    const existing = rows?.[0] || null;

    if (existing) {
      // Update existing row
      const { error } = await supabase
        .from('monthly_calendar')
        .update({
          title,
          url,
          is_active: isActive,
          updated_at: new Date().toISOString(),
          updated_by: user?.id,
        })
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      // Insert new row
      const { error } = await supabase
        .from('monthly_calendar')
        .insert({
          title,
          url,
          is_active: isActive,
          updated_at: new Date().toISOString(),
          updated_by: user?.id,
        });
      if (error) throw error;
    }

    return true;
  } catch (error) {
    console.error('Error updating monthly calendar:', error);
    return false;
  }
}

// ============ STATUS BAR (TICKER) ============

export interface StatusBar {
  id: string;
  message: string;
  message_2: string;
  message_3: string;
  message_4: string;
  is_active: boolean;
  updated_at: string;
}

export async function getStatusBar(): Promise<StatusBar | null> {
  try {
    const { data, error } = await supabase
      .from('status_bar')
      .select('*')
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching status bar:', error);
    return null;
  }
}

export async function updateStatusBar(
  messages: { message: string; message_2: string; message_3: string; message_4: string },
  isActive: boolean
): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    const { error } = await supabase
      .from('status_bar')
      .update({
        ...messages,
        is_active: isActive,
        updated_at: new Date().toISOString(),
        updated_by: user?.id,
      })
      .not('id', 'is', null);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating status bar:', error);
    return false;
  }
}

export function subscribeToStatusBar(
  callback: (statusBar: StatusBar | null) => void
) {
  return supabase
    .channel('status_bar_channel')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'status_bar' },
      async () => {
        const statusBar = await getStatusBar();
        callback(statusBar);
      }
    )
    .subscribe();
}

// ============ APP SETTINGS ============

export async function getAppSetting(key: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', key)
      .single();

    if (error) return null;
    return data?.value || null;
  } catch {
    return null;
  }
}

export function subscribeToAppSettings(
  callback: (key: string, value: string | null) => void
) {
  return supabase
    .channel('app_settings_channel')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'app_settings' },
      async (payload: any) => {
        const key = payload.new?.key || payload.old?.key;
        const value = payload.new?.value || null;
        callback(key, value);
      }
    )
    .subscribe();
}
