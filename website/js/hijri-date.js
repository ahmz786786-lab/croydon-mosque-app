// Hijri date calculation - ported from app's utils/hijriDate.ts

const HIJRI_MONTHS = [
  'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
  'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', "Sha'ban",
  'Ramadan', 'Shawwal', "Dhu al-Qi'dah", "Dhu al-Hijjah"
];

const HIJRI_MONTHS_ARABIC = [
  'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني',
  'جمادى الأولى', 'جمادى الثانية', 'رجب', 'شعبان',
  'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
];

function gregorianToHijri(date) {
  if (!date) date = new Date();

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  let jd;
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

  const a = Math.floor((year - 100) / 100);
  const b = 2 - a + Math.floor(a / 4);
  jd += b;

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
    formatted: hijriDay + ' ' + (HIJRI_MONTHS[hijriMonth - 1] || '') + ' ' + hijriYear + ' AH',
    formattedArabic: hijriDay + ' ' + (HIJRI_MONTHS_ARABIC[hijriMonth - 1] || '') + ' ' + hijriYear + ' هـ'
  };
}

function renderHijriDate() {
  const hijri = gregorianToHijri();
  const el = document.getElementById('hijri-date');
  if (el) el.textContent = hijri.formattedArabic;
  const heroHijri = document.getElementById('hero-hijri');
  if (heroHijri) heroHijri.textContent = hijri.formattedArabic;
  return hijri;
}
