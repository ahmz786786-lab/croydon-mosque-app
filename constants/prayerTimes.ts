export interface PrayerTime {
  name: string;
  arabicName: string;
  time: string;
  icon: string;
}

export const PRAYER_TIMES: PrayerTime[] = [
  { name: 'Fajr', arabicName: 'الفجر', time: '6:30 AM', icon: 'sunrise' },
  { name: 'Zohr', arabicName: 'الظهر', time: '1:30 PM', icon: 'sun' },
  { name: 'Asr', arabicName: 'العصر', time: '4:00 PM', icon: 'sun' },
  { name: 'Maghrib', arabicName: 'المغرب', time: '5:08 PM', icon: 'sunset' },
  { name: 'Isha', arabicName: 'العشاء', time: '8:00 PM', icon: 'moon' },
];

export const JUMA_TIMES = [
  { name: 'Juma 1st', time: '12:25 PM' },
  { name: 'Juma 2nd', time: '1:25 PM' },
];

export const MOSQUE_INFO = {
  name: 'Croydon Mosque & Islamic Centre',
  address: '525 London Road, Thornton Heath, Surrey CR7 6AR',
  phone: '020 8684 8200',
  email: 'enquiries@croydonmosque.com',
  website: 'https://www.croydonmosque.com',
  donateUrl: 'https://www.croydonmosque.com/?section=home',
  coordinates: {
    latitude: 51.3984,
    longitude: -0.1063,
  },
};

// Kaaba coordinates for Qibla direction
export const KAABA_COORDINATES = {
  latitude: 21.4225,
  longitude: 39.8262,
};
