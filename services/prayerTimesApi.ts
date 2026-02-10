// Prayer Times API Service using Aladhan API
// https://aladhan.com/prayer-times-api

// Croydon Mosque coordinates
const CROYDON_COORDS = {
  latitude: 51.3762,
  longitude: -0.0982,
};

// Calculation method: 2 = Islamic Society of North America (ISNA)
// You can change this based on mosque preference
// 1 = University of Islamic Sciences, Karachi
// 2 = Islamic Society of North America (ISNA)
// 3 = Muslim World League
// 4 = Umm Al-Qura University, Makkah
// 5 = Egyptian General Authority of Survey
// 15 = Moonsighting Committee Worldwide
const CALCULATION_METHOD = 2;

// Fallback times when API is unavailable (approximate for Croydon)
const FALLBACK_TIMES: PrayerTimesData = {
  fajr: '5:45 AM',
  sunrise: '7:15 AM',
  dhuhr: '12:15 PM',
  asr: '2:45 PM',
  maghrib: '5:00 PM',
  isha: '6:30 PM',
  date: {
    gregorian: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    hijri: {
      day: '--',
      month: '--',
      monthAr: '--',
      year: '--',
      formatted: 'Offline Mode',
    },
  },
};

export interface PrayerTimesData {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  date: {
    gregorian: string;
    hijri: {
      day: string;
      month: string;
      monthAr: string;
      year: string;
      formatted: string;
    };
  };
}

export interface HijriDateInfo {
  day: number;
  month: number;
  monthName: string;
  monthNameAr: string;
  year: number;
  formatted: string;
  weekday: string;
}

// Single fetch attempt with timeout
async function fetchPrayerTimesOnce(date: Date): Promise<PrayerTimesData | null> {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  const url = `https://api.aladhan.com/v1/timings/${day}-${month}-${year}?latitude=${CROYDON_COORDS.latitude}&longitude=${CROYDON_COORDS.longitude}&method=${CALCULATION_METHOD}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  const response = await fetch(url, { signal: controller.signal });
  clearTimeout(timeoutId);

  const data = await response.json();

  if (data.code === 200 && data.data) {
    const timings = data.data.timings;
    const hijriDate = data.data.date.hijri;
    const gregorianDate = data.data.date.gregorian;

    return {
      fajr: formatTime(timings.Fajr),
      sunrise: formatTime(timings.Sunrise),
      dhuhr: formatTime(timings.Dhuhr),
      asr: formatTime(timings.Asr),
      maghrib: formatTime(timings.Maghrib),
      isha: formatTime(timings.Isha),
      date: {
        gregorian: `${gregorianDate.day} ${gregorianDate.month.en} ${gregorianDate.year}`,
        hijri: {
          day: hijriDate.day,
          month: hijriDate.month.en,
          monthAr: hijriDate.month.ar,
          year: hijriDate.year,
          formatted: `${hijriDate.day} ${hijriDate.month.en} ${hijriDate.year} AH`,
        },
      },
    };
  }
  return null;
}

// Fetch prayer times from Aladhan API with retry
export async function fetchPrayerTimes(date?: Date): Promise<PrayerTimesData> {
  const d = date || new Date();
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await fetchPrayerTimesOnce(d);
      if (result) return result;
    } catch (error) {
      if (attempt < maxRetries) {
        // Wait before retrying (1s, 2s)
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      } else {
        console.warn('Prayer times API failed after retries, using fallback');
      }
    }
  }
  return FALLBACK_TIMES;
}

// Fetch Hijri date
export async function fetchHijriDate(date?: Date): Promise<HijriDateInfo | null> {
  try {
    const d = date || new Date();
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = d.getFullYear();

    const url = `https://api.aladhan.com/v1/gpiToH/${day}-${month}-${year}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.code === 200 && data.data) {
      const hijri = data.data.hijri;
      return {
        day: parseInt(hijri.day),
        month: parseInt(hijri.month.number),
        monthName: hijri.month.en,
        monthNameAr: hijri.month.ar,
        year: parseInt(hijri.year),
        formatted: `${hijri.day} ${hijri.month.en} ${hijri.year} AH`,
        weekday: hijri.weekday.en,
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching Hijri date:', error);
    return null;
  }
}

// Format time from 24h to 12h format
function formatTime(time24: string): string {
  const [hours, minutes] = time24.split(':');
  let hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour}:${minutes} ${ampm}`;
}

// Get month prayer times calendar
export async function fetchMonthPrayerTimes(month: number, year: number): Promise<PrayerTimesData[]> {
  try {
    const url = `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${CROYDON_COORDS.latitude}&longitude=${CROYDON_COORDS.longitude}&method=${CALCULATION_METHOD}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.code === 200 && data.data) {
      return data.data.map((day: any) => ({
        fajr: formatTime(day.timings.Fajr),
        sunrise: formatTime(day.timings.Sunrise),
        dhuhr: formatTime(day.timings.Dhuhr),
        asr: formatTime(day.timings.Asr),
        maghrib: formatTime(day.timings.Maghrib),
        isha: formatTime(day.timings.Isha),
        date: {
          gregorian: `${day.date.gregorian.day} ${day.date.gregorian.month.en} ${day.date.gregorian.year}`,
          hijri: {
            day: day.date.hijri.day,
            month: day.date.hijri.month.en,
            monthAr: day.date.hijri.month.ar,
            year: day.date.hijri.year,
            formatted: `${day.date.hijri.day} ${day.date.hijri.month.en} ${day.date.hijri.year} AH`,
          },
        },
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching month prayer times:', error);
    return [];
  }
}

// Check if today is Ramadan
export async function checkIsRamadan(): Promise<{ isRamadan: boolean; dayOfRamadan?: number }> {
  try {
    const hijriDate = await fetchHijriDate();
    if (hijriDate && hijriDate.month === 9) {
      return { isRamadan: true, dayOfRamadan: hijriDate.day };
    }
    return { isRamadan: false };
  } catch {
    return { isRamadan: false };
  }
}
