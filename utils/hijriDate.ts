// Hijri date calculation
// This is an approximation - for precise dates, an API or library should be used

import { getIslamicDateSettings, IslamicDateSettings } from '@/services/supabase';

const HIJRI_MONTHS = [
  'Muharram',
  'Safar',
  'Rabi al-Awwal',
  'Rabi al-Thani',
  'Jumada al-Awwal',
  'Jumada al-Thani',
  'Rajab',
  'Sha\'ban',
  'Ramadan',
  'Shawwal',
  'Dhu al-Qi\'dah',
  'Dhu al-Hijjah',
];

const HIJRI_MONTHS_ARABIC = [
  'محرم',
  'صفر',
  'ربيع الأول',
  'ربيع الثاني',
  'جمادى الأولى',
  'جمادى الثانية',
  'رجب',
  'شعبان',
  'رمضان',
  'شوال',
  'ذو القعدة',
  'ذو الحجة',
];

interface HijriDate {
  day: number;
  month: number;
  monthName: string;
  monthNameArabic: string;
  year: number;
  formatted: string;
  formattedArabic: string;
}

export function gregorianToHijri(date: Date = new Date()): HijriDate {
  // Julian Day calculation
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  let jd: number;
  if (month <= 2) {
    const adjustedYear = year - 1;
    const adjustedMonth = month + 12;
    jd = Math.floor(365.25 * (adjustedYear + 4716)) +
         Math.floor(30.6001 * (adjustedMonth + 1)) +
         day - 1524.5;
  } else {
    jd = Math.floor(365.25 * (year + 4716)) +
         Math.floor(30.6001 * (month + 1)) +
         day - 1524.5;
  }

  // Gregorian correction
  const a = Math.floor((year - 100) / 100);
  const b = 2 - a + Math.floor(a / 4);
  jd += b;

  // Convert Julian Day to Hijri
  const l = Math.floor(jd - 1948439.5) + 10632;
  const n = Math.floor((l - 1) / 10631);
  const lPrime = l - 10631 * n + 354;
  const j = Math.floor((10985 - lPrime) / 5316) *
            Math.floor((50 * lPrime) / 17719) +
            Math.floor(lPrime / 5670) *
            Math.floor((43 * lPrime) / 15238);
  const lDoublePrime = lPrime - Math.floor((30 - j) / 15) *
                       Math.floor((17719 * j) / 50) -
                       Math.floor(j / 16) *
                       Math.floor((15238 * j) / 43) + 29;

  const hijriMonth = Math.floor((24 * lDoublePrime) / 709);
  const hijriDay = lDoublePrime - Math.floor((709 * hijriMonth) / 24);
  const hijriYear = 30 * n + j - 30;

  return {
    day: hijriDay,
    month: hijriMonth,
    monthName: HIJRI_MONTHS[hijriMonth - 1] || 'Unknown',
    monthNameArabic: HIJRI_MONTHS_ARABIC[hijriMonth - 1] || '',
    year: hijriYear,
    formatted: `${hijriDay} ${HIJRI_MONTHS[hijriMonth - 1]} ${hijriYear} AH`,
    formattedArabic: `${hijriDay} ${HIJRI_MONTHS_ARABIC[hijriMonth - 1]} ${hijriYear} هـ`,
  };
}

export function isRamadan(): boolean {
  const hijri = gregorianToHijri();
  return hijri.month === 9;
}

export function getRamadanInfo(): { isRamadan: boolean; daysRemaining?: number; dayOfRamadan?: number } {
  const hijri = gregorianToHijri();

  if (hijri.month === 9) {
    return {
      isRamadan: true,
      dayOfRamadan: hijri.day,
    };
  }

  // Calculate approximate days until Ramadan
  if (hijri.month < 9) {
    const monthsUntil = 9 - hijri.month - 1;
    const daysRemaining = monthsUntil * 29.5 + (30 - hijri.day);
    return {
      isRamadan: false,
      daysRemaining: Math.round(daysRemaining),
    };
  }

  // After Ramadan, calculate days until next year's Ramadan
  const monthsUntil = 12 - hijri.month + 8;
  const daysRemaining = monthsUntil * 29.5 + (30 - hijri.day);
  return {
    isRamadan: false,
    daysRemaining: Math.round(daysRemaining),
  };
}

// Apply admin settings to a Hijri date
export function applyDateSettings(
  baseDate: HijriDate,
  settings: IslamicDateSettings | null
): HijriDate {
  if (!settings) return baseDate;

  // If manual override is enabled, use the manual date
  if (settings.manual_date_enabled && settings.manual_day && settings.manual_month && settings.manual_year) {
    const monthName = HIJRI_MONTHS[settings.manual_month - 1] || 'Unknown';
    const monthNameArabic = HIJRI_MONTHS_ARABIC[settings.manual_month - 1] || '';

    return {
      day: settings.manual_day,
      month: settings.manual_month,
      monthName,
      monthNameArabic,
      year: settings.manual_year,
      formatted: `${settings.manual_day} ${monthName} ${settings.manual_year} AH`,
      formattedArabic: `${settings.manual_day} ${monthNameArabic} ${settings.manual_year} هـ`,
    };
  }

  // Apply day adjustment
  if (settings.day_adjustment && settings.day_adjustment !== 0) {
    let adjustedDay = baseDate.day + settings.day_adjustment;
    let adjustedMonth = baseDate.month;
    let adjustedYear = baseDate.year;

    // Handle day overflow (simple approximation - months have ~30 days)
    if (adjustedDay > 30) {
      adjustedDay = adjustedDay - 30;
      adjustedMonth++;
      if (adjustedMonth > 12) {
        adjustedMonth = 1;
        adjustedYear++;
      }
    } else if (adjustedDay < 1) {
      adjustedDay = 30 + adjustedDay; // e.g., -1 becomes 29
      adjustedMonth--;
      if (adjustedMonth < 1) {
        adjustedMonth = 12;
        adjustedYear--;
      }
    }

    const monthName = HIJRI_MONTHS[adjustedMonth - 1] || 'Unknown';
    const monthNameArabic = HIJRI_MONTHS_ARABIC[adjustedMonth - 1] || '';

    return {
      day: adjustedDay,
      month: adjustedMonth,
      monthName,
      monthNameArabic,
      year: adjustedYear,
      formatted: `${adjustedDay} ${monthName} ${adjustedYear} AH`,
      formattedArabic: `${adjustedDay} ${monthNameArabic} ${adjustedYear} هـ`,
    };
  }

  return baseDate;
}

// Get Hijri date with admin settings applied
export async function getAdjustedHijriDate(date: Date = new Date()): Promise<HijriDate> {
  const baseDate = gregorianToHijri(date);

  try {
    const settings = await getIslamicDateSettings();
    return applyDateSettings(baseDate, settings);
  } catch (error) {
    console.error('Error fetching Islamic date settings:', error);
    return baseDate;
  }
}

// Check if it's Ramadan with admin settings applied
export async function isRamadanWithSettings(): Promise<boolean> {
  const hijri = await getAdjustedHijriDate();
  return hijri.month === 9;
}

// Get Ramadan info with admin settings applied
export async function getRamadanInfoWithSettings(): Promise<{
  isRamadan: boolean;
  daysRemaining?: number;
  dayOfRamadan?: number;
}> {
  const hijri = await getAdjustedHijriDate();

  if (hijri.month === 9) {
    return {
      isRamadan: true,
      dayOfRamadan: hijri.day,
    };
  }

  // Calculate approximate days until Ramadan
  if (hijri.month < 9) {
    const monthsUntil = 9 - hijri.month - 1;
    const daysRemaining = monthsUntil * 29.5 + (30 - hijri.day);
    return {
      isRamadan: false,
      daysRemaining: Math.round(daysRemaining),
    };
  }

  // After Ramadan, calculate days until next year's Ramadan
  const monthsUntil = 12 - hijri.month + 8;
  const daysRemaining = monthsUntil * 29.5 + (30 - hijri.day);
  return {
    isRamadan: false,
    daysRemaining: Math.round(daysRemaining),
  };
}
