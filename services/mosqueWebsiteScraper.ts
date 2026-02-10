// Scrape prayer times from Croydon Mosque website
// https://www.croydonmosque.com/?section=prayer

const PRAYER_PAGE_URL = 'https://www.croydonmosque.com/?section=prayer';

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

/**
 * Fetch and parse prayer times from croydonmosque.com
 */
export async function fetchWebsitePrayerTimes(): Promise<WebsitePrayerTimes | null> {
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(PRAYER_PAGE_URL, { signal: controller.signal });
      clearTimeout(timeoutId);

      const html = await response.text();
      const result = parsePrayerTimesFromHtml(html);
      if (result) return result;
    } catch (error) {
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      } else {
        console.warn('Error fetching mosque website prayer times after retries:', error);
      }
    }
  }
  return null;
}

/** Append am/pm to a time string if it doesn't already have one */
function withAmPm(time: string, suffix: 'am' | 'pm'): string {
  if (!time || time === '*' || /am|pm/i.test(time)) return time;
  return `${time.trim()}${suffix}`;
}

function parsePrayerTimesFromHtml(html: string): WebsitePrayerTimes | null {
  try {
    const result: Partial<WebsitePrayerTimes> = {};

    // ===== 1. Parse standing Jamaat times from top section =====
    // The website has a table in #prayer-time-wrapper with rows like:
    // <tr><td>Fajr</td><td>6:30am</td></tr>
    // Prayer name and time are in SEPARATE <td> cells.

    const standingTableMatch = html.match(
      /<div[^>]*id\s*=\s*["']prayer-time-wrapper["'][^>]*>([\s\S]*?)<\/div>/i
    );

    if (standingTableMatch) {
      // Strip HTML comments to avoid parsing commented-out rows
      const standingHtml = standingTableMatch[1].replace(/<!--[\s\S]*?-->/g, '');
      // Split into individual rows by </tr>, then parse cells in each row
      const rows = standingHtml.split(/<\/tr>/i);
      for (const row of rows) {
        const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
        const cells: string[] = [];
        let cellMatch;
        while ((cellMatch = cellRegex.exec(row)) !== null) {
          cells.push(cellMatch[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, '').trim());
        }
        // Only process rows with exactly 2 cells (name + time)
        if (cells.length !== 2) continue;
        const name = cells[0].toLowerCase();
        const time = cells[1].toUpperCase().replace('.', ':');
        if (!time) continue;

        if (name === 'fajr') result.fajr = { begins: '', jamaat: time };
        else if (/^(zohr|dhuhr|zuhr)$/.test(name)) result.zohr = { begins: '', jamaat: time };
        else if (name === 'asr') result.asr = { begins: '', jamaat: time };
        else if (name === 'maghrib') result.maghrib = { begins: '', jamaat: time };
        else if (name === 'isha') result.isha = { begins: '', jamaat: time };
        else if (/^juma\s*1$/.test(name)) result.juma1 = time;
        else if (/^juma\s*2$/.test(name)) result.juma2 = time;
      }
    }

    // ===== 2. Parse today's row from the monthly table for begin times =====
    // Table row format (13 cells):
    // 0: date | 1: day | 2: islamic date | 3: fajr begin | 4: fajr jamaat | 5: sunrise
    // 6: dhuhr begin | 7: dhuhr jamaat | 8: asr begin | 9: asr jamaat
    // 10: maghrib (begin=jamaat) | 11: isha begin | 12: isha jamaat

    const today = new Date().getDate();
    const todayStr = String(today);

    // Match a table row starting with today's date
    const rowRegex = new RegExp(
      `<tr[^>]*>\\s*<td[^>]*>\\s*${todayStr}\\s*</td>([\\s\\S]*?)</tr>`,
      'i'
    );
    const rowMatch = html.match(rowRegex);

    if (rowMatch) {
      const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      const cells: string[] = [];
      let tdMatch;
      while ((tdMatch = tdRegex.exec(rowMatch[0])) !== null) {
        cells.push(tdMatch[1].replace(/<[^>]+>/g, '').trim());
      }

      // 13 cells: date, day, islamic, fajr_b, fajr_j, sunrise, dhuhr_b, dhuhr_j, asr_b, asr_j, maghrib, isha_b, isha_j
      // Monthly table times have no AM/PM — add based on prayer context
      if (cells.length >= 13) {
        if (result.fajr) result.fajr.begins = withAmPm(cells[3], 'am');
        else result.fajr = { begins: withAmPm(cells[3], 'am'), jamaat: withAmPm(cells[4], 'am') };

        result.sunrise = withAmPm(cells[5], 'am');

        if (result.zohr) result.zohr.begins = withAmPm(cells[6], 'pm');
        else result.zohr = { begins: withAmPm(cells[6], 'pm'), jamaat: withAmPm(cells[7], 'pm') };

        if (result.asr) result.asr.begins = withAmPm(cells[8], 'pm');
        else result.asr = { begins: withAmPm(cells[8], 'pm'), jamaat: withAmPm(cells[9], 'pm') };

        if (result.maghrib) result.maghrib.begins = withAmPm(cells[10], 'pm');
        else result.maghrib = { begins: withAmPm(cells[10], 'pm'), jamaat: withAmPm(cells[10], 'pm') };

        if (result.isha) result.isha.begins = withAmPm(cells[11], 'pm');
        else result.isha = { begins: withAmPm(cells[11], 'pm'), jamaat: withAmPm(cells[12], 'pm') };
      }
    }

    // Validate we got at least the standing times
    if (result.fajr?.jamaat || result.zohr?.jamaat || result.maghrib?.jamaat) {
      return {
        fajr: result.fajr || { begins: '', jamaat: '' },
        sunrise: result.sunrise || '',
        zohr: result.zohr || { begins: '', jamaat: '' },
        asr: result.asr || { begins: '', jamaat: '' },
        maghrib: result.maghrib || { begins: '', jamaat: '' },
        isha: result.isha || { begins: '', jamaat: '' },
        juma1: result.juma1 || '',
        juma2: result.juma2 || '',
      };
    }

    return null;
  } catch (error) {
    console.warn('Error parsing prayer times from HTML:', error);
    return null;
  }
}
