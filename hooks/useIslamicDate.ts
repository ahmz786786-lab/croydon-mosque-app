import { useState, useEffect } from 'react';
import {
  getIslamicDateSettings,
  subscribeToIslamicDateSettings,
  IslamicDateSettings,
} from '@/services/supabase';
import {
  gregorianToHijri,
  applyDateSettings,
  getRamadanInfo,
} from '@/utils/hijriDate';

interface HijriDate {
  day: number;
  month: number;
  monthName: string;
  monthNameArabic: string;
  year: number;
  formatted: string;
  formattedArabic: string;
}

interface RamadanInfo {
  isRamadan: boolean;
  daysRemaining?: number;
  dayOfRamadan?: number;
}

interface UseIslamicDateReturn {
  hijriDate: HijriDate;
  ramadanInfo: RamadanInfo;
  settings: IslamicDateSettings | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useIslamicDate(): UseIslamicDateReturn {
  const [settings, setSettings] = useState<IslamicDateSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Calculate base Hijri date
  const baseHijri = gregorianToHijri();

  // Apply admin settings to get adjusted date
  const hijriDate = applyDateSettings(baseHijri, settings);

  // Calculate Ramadan info based on adjusted date
  const ramadanInfo: RamadanInfo = (() => {
    if (hijriDate.month === 9) {
      return {
        isRamadan: true,
        dayOfRamadan: hijriDate.day,
      };
    }

    // Calculate approximate days until Ramadan
    if (hijriDate.month < 9) {
      const monthsUntil = 9 - hijriDate.month - 1;
      const daysRemaining = monthsUntil * 29.5 + (30 - hijriDate.day);
      return {
        isRamadan: false,
        daysRemaining: Math.round(daysRemaining),
      };
    }

    // After Ramadan, calculate days until next year's Ramadan
    const monthsUntil = 12 - hijriDate.month + 8;
    const daysRemaining = monthsUntil * 29.5 + (30 - hijriDate.day);
    return {
      isRamadan: false,
      daysRemaining: Math.round(daysRemaining),
    };
  })();

  const loadSettings = async () => {
    try {
      const data = await getIslamicDateSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error loading Islamic date settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();

    // Subscribe to realtime updates
    const subscription = subscribeToIslamicDateSettings((newSettings) => {
      setSettings(newSettings);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    hijriDate,
    ramadanInfo,
    settings,
    loading,
    refresh: loadSettings,
  };
}
