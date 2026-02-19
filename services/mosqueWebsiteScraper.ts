// Fetch prayer times from Croydon Mosque via Techtronix API
// https://techtronix.co.uk/shared/salaah_api.php?partner_id=5

const TECHTRONIX_API_URL = 'https://techtronix.co.uk/shared/salaah_api.php?partner_id=5';

export interface WebsitePrayerTimes {
  fajr: { begins: string; jamaat: string };
  sunrise: string;
  zohr: { begins: string; jamaat: string };
  asr: { begins: string; jamaat: string };
  maghrib: { begins: string; jamaat: string };
  isha: { begins: string; jamaat: string };
  juma1: string;
  juma2: string;
}

interface TechtronixApiResponse {
  date: string;
  fajr_begins: string;
  fajr_jamat: string;
  sunrise: string;
  zuhr_begins: string;
  zuhr_jamat: string;
  asr_begins: string;
  asr_jamat: string;
  maghrib_begins: string;
  maghrib_jamat: string;
  isha_begins: string;
  isha_jamat: string;
  ishraq_begins: string;
  zawal_begins: string;
  juma_1st: string;
  juma_2nd: string;
  juma_3rd: string;
}

/**
 * Convert 24h "HH:MM:SS" to 12h "H:MM AM/PM"
 */
function formatTime24to12(time24: string): string {
  const parts = time24.split(':');
  let hour = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour}:${minutes} ${ampm}`;
}

/**
 * Map API response to the WebsitePrayerTimes interface
 */
function mapApiResponse(data: TechtronixApiResponse): WebsitePrayerTimes {
  return {
    fajr: {
      begins: formatTime24to12(data.fajr_begins),
      jamaat: formatTime24to12(data.fajr_jamat),
    },
    sunrise: formatTime24to12(data.sunrise),
    zohr: {
      begins: formatTime24to12(data.zuhr_begins),
      jamaat: formatTime24to12(data.zuhr_jamat),
    },
    asr: {
      begins: formatTime24to12(data.asr_begins),
      jamaat: formatTime24to12(data.asr_jamat),
    },
    maghrib: {
      begins: formatTime24to12(data.maghrib_begins),
      jamaat: formatTime24to12(data.maghrib_jamat),
    },
    isha: {
      begins: formatTime24to12(data.isha_begins),
      jamaat: formatTime24to12(data.isha_jamat),
    },
    juma1: formatTime24to12(data.juma_1st),
    juma2: formatTime24to12(data.juma_2nd),
  };
}

/**
 * Fetch prayer times from Techtronix API (Croydon Mosque timetable)
 */
export async function fetchWebsitePrayerTimes(): Promise<WebsitePrayerTimes | null> {
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(TECHTRONIX_API_URL, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      const data: TechtronixApiResponse = await response.json();
      return mapApiResponse(data);
    } catch (error) {
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      } else {
        console.warn('Error fetching prayer times from API after retries:', error);
      }
    }
  }
  return null;
}
