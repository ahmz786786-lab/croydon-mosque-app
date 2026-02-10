import { useState, useEffect } from 'react';
import { supabase, getPrayerTimeUpdates } from '@/services/supabase';
import { PRAYER_TIMES as DEFAULT_PRAYER_TIMES, JUMA_TIMES as DEFAULT_JUMA_TIMES } from '@/constants/prayerTimes';
import { fetchWebsitePrayerTimes } from '@/services/mosqueWebsiteScraper';

export interface PrayerTime {
  name: string;
  arabicName: string;
  time: string; // Jamaat/Salah time
  azaanTime?: string; // Adhan/Begins time
  icon: string;
}

export interface JumaTime {
  name: string;
  time: string;
}

interface UsePrayerTimesReturn {
  prayerTimes: PrayerTime[];
  jumaTimes: JumaTime[];
  loading: boolean;
  error: boolean;
  refresh: () => Promise<void>;
}

// Arabic names mapping
const ARABIC_NAMES: Record<string, string> = {
  Fajr: 'الفجر',
  Zohr: 'الظهر',
  Asr: 'العصر',
  Maghrib: 'المغرب',
  Isha: 'العشاء',
};

// Icons mapping
const ICONS: Record<string, string> = {
  Fajr: 'sunrise',
  Zohr: 'sun',
  Asr: 'sun',
  Maghrib: 'sunset',
  Isha: 'moon',
};

export function usePrayerTimes(): UsePrayerTimesReturn {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>(DEFAULT_PRAYER_TIMES);
  const [jumaTimes, setJumaTimes] = useState<JumaTime[]>(DEFAULT_JUMA_TIMES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadPrayerTimes = async () => {
    try {
      setError(false);

      // Fetch from both sources in parallel
      const [supabaseData, websiteData] = await Promise.all([
        getPrayerTimeUpdates().catch(() => []),
        fetchWebsitePrayerTimes().catch(() => null),
      ]);

      const prayerOrder = ['Fajr', 'Zohr', 'Asr', 'Maghrib', 'Isha'];
      const websiteMap: Record<string, { begins: string; jamaat: string }> = {};

      if (websiteData) {
        websiteMap['Fajr'] = websiteData.fajr;
        websiteMap['Zohr'] = websiteData.zohr;
        websiteMap['Asr'] = websiteData.asr;
        websiteMap['Maghrib'] = websiteData.maghrib;
        websiteMap['Isha'] = websiteData.isha;
      }

      // Priority: Website scrape > Supabase admin > Defaults
      // Website auto-updates daily from croydonmosque.com
      const dailyPrayers: PrayerTime[] = [];

      for (const prayerName of prayerOrder) {
        const supabaseEntry = supabaseData?.find((p) => p.prayer_name === prayerName);
        const websiteEntry = websiteMap[prayerName];
        const defaultPrayer = DEFAULT_PRAYER_TIMES.find((p) => p.name === prayerName);

        // Jamaat time: Website > Supabase > Default
        const jamaatTime =
          (websiteEntry?.jamaat) ||
          (supabaseEntry?.salah_time) ||
          defaultPrayer?.time ||
          '';

        // Begins/Azaan time: Website > Supabase > empty
        const azaanTime =
          (websiteEntry?.begins) ||
          (supabaseEntry?.azaan_time) ||
          undefined;

        dailyPrayers.push({
          name: prayerName,
          arabicName: ARABIC_NAMES[prayerName] || '',
          time: jamaatTime,
          azaanTime,
          icon: ICONS[prayerName] || 'time-outline',
        });
      }

      // Juma times: Website > Supabase > Default
      const jumaList: JumaTime[] = [];

      const juma1Supabase = supabaseData?.find((p) => p.prayer_name === 'Juma1');
      const juma2Supabase = supabaseData?.find((p) => p.prayer_name === 'Juma2');

      jumaList.push({
        name: 'Juma 1st',
        time: websiteData?.juma1 || juma1Supabase?.salah_time || DEFAULT_JUMA_TIMES[0].time,
      });
      jumaList.push({
        name: 'Juma 2nd',
        time: websiteData?.juma2 || juma2Supabase?.salah_time || DEFAULT_JUMA_TIMES[1].time,
      });

      setPrayerTimes(dailyPrayers);
      setJumaTimes(jumaList);
    } catch (err) {
      console.error('Error loading prayer times:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrayerTimes();

    // Subscribe to realtime updates from admin panel
    const subscription = supabase
      .channel('prayer_times_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'prayer_times' },
        () => {
          loadPrayerTimes();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    prayerTimes,
    jumaTimes,
    loading,
    error,
    refresh: loadPrayerTimes,
  };
}
