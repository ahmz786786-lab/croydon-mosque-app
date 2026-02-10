import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { PRAYER_TIMES } from '@/constants/prayerTimes';
import { fetchPrayerTimes } from '@/services/prayerTimesApi';

const NOTIFICATION_SETTINGS_KEY = '@prayer_notifications';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface NotificationSettings {
  [key: string]: boolean;
}

interface UseNotificationsReturn {
  settings: NotificationSettings;
  isEnabled: boolean;
  togglePrayer: (prayerName: string) => Promise<void>;
  toggleAll: (enabled: boolean) => Promise<void>;
  requestPermission: () => Promise<boolean>;
}

export function useNotifications(): UseNotificationsReturn {
  const [settings, setSettings] = useState<NotificationSettings>({});
  const [isEnabled, setIsEnabled] = useState(false);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    loadSettings();
    registerForPushNotifications();

    notificationListener.current = Notifications.addNotificationReceivedListener(_notification => {
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(_response => {
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings(parsed);
        const hasEnabled = Object.values(parsed).some(v => v);
        setIsEnabled(hasEnabled);
        // Reschedule notifications with current Adhan times on app start
        if (hasEnabled) {
          await scheduleNotifications(parsed);
        }
      } else {
        // Default: all prayers disabled (user must opt-in)
        const defaultSettings: NotificationSettings = {};
        PRAYER_TIMES.forEach(prayer => {
          defaultSettings[prayer.name] = false;
        });
        setSettings(defaultSettings);
        setIsEnabled(false);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const saveSettings = async (newSettings: NotificationSettings) => {
    try {
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
      setIsEnabled(Object.values(newSettings).some(v => v));
      await scheduleNotifications(newSettings);
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  };

  const registerForPushNotifications = async () => {
    if (!Device.isDevice) {
      console.warn('Push notifications require a physical device');
      return;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('prayer-reminders', {
        name: 'Prayer Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6B1C23',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('announcements', {
        name: 'Announcements',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'default',
      });
    }

    // Push token registration for announcements requires EAS build
    // Skipped in development/Expo Go - will work in production builds
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!Device.isDevice) {
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  };

  const togglePrayer = async (prayerName: string) => {
    const hasPermission = await requestPermission();
    if (!hasPermission) {
      return;
    }

    const newSettings = {
      ...settings,
      [prayerName]: !settings[prayerName],
    };
    await saveSettings(newSettings);
  };

  const toggleAll = async (enabled: boolean) => {
    if (enabled) {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        return;
      }
    }

    const newSettings: NotificationSettings = {};
    PRAYER_TIMES.forEach(prayer => {
      newSettings[prayer.name] = enabled;
    });
    await saveSettings(newSettings);
  };

  const scheduleNotifications = async (notificationSettings: NotificationSettings) => {
    // Cancel all existing notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Fetch Adhan (begins) times from API (returns fallback if offline)
    const adhanTimes = await fetchPrayerTimes();

    // Map prayer names to API field names
    const adhanTimeMap: { [key: string]: string } = {
      'Fajr': adhanTimes.fajr,
      'Zohr': adhanTimes.dhuhr,
      'Asr': adhanTimes.asr,
      'Maghrib': adhanTimes.maghrib,
      'Isha': adhanTimes.isha,
    };

    // Schedule notifications for enabled prayers using Adhan times
    for (const prayer of PRAYER_TIMES) {
      if (notificationSettings[prayer.name] && adhanTimeMap[prayer.name]) {
        await scheduleDailyNotification(prayer.name, adhanTimeMap[prayer.name]);
      }
    }
  };

  const scheduleDailyNotification = async (prayerName: string, timeStr: string) => {
    try {
      const [time, period] = timeStr.split(' ');
      const [hoursStr, minutesStr] = time.split(':');
      let hours = parseInt(hoursStr, 10);
      const minutes = parseInt(minutesStr, 10);

      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;

      // Schedule daily repeating notification based on Adhan (begins) time
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${prayerName} Adhan`,
          body: `It's time for ${prayerName} prayer - Adhan has begun`,
          sound: 'default',
          data: { prayer: prayerName },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: hours,
          minute: minutes,
        },
      });
    } catch (error) {
      console.error(`Error scheduling notification for ${prayerName}:`, error);
    }
  };

  return {
    settings,
    isEnabled,
    togglePrayer,
    toggleAll,
    requestPermission,
  };
}

// Utility function to get scheduled notifications (for debugging)
export async function getScheduledNotifications() {
  return await Notifications.getAllScheduledNotificationsAsync();
}

// Utility function to cancel all notifications
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
