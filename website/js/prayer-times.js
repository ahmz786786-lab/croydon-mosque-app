// Prayer Times - Aladhan API integration
// Croydon Mosque & Islamic Centre

const CROYDON_COORDS = { latitude: 51.3734, longitude: -0.1038 };
const CALCULATION_METHOD = 1; // University of Islamic Sciences, Karachi

// Jamaat offsets in minutes from adhan/start time
const JAMAAT_OFFSETS = {
  Fajr: 47,
  Dhuhr: 62,
  Asr: 41,
  Maghrib: null,  // Iqamah = start time (pray shortly after adhan)
  Isha: null       // Iqamah = start time
};

const JUMA_TIMES = { first: '12:25 PM', second: '1:25 PM' };

const FALLBACK_TIMES = {
  Fajr: '5:45 AM', Sunrise: '7:15 AM', Dhuhr: '12:15 PM',
  Asr: '2:45 PM', Maghrib: '5:00 PM', Isha: '6:30 PM'
};

function formatTime(time24) {
  const parts = time24.split(':');
  let hour = parseInt(parts[0]);
  const minutes = parts[1].replace(/\s*\(.*\)/, ''); // Remove timezone info
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return hour + ':' + minutes + ' ' + ampm;
}

function parseTimeTo24(timeStr) {
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 0;
  let h = parseInt(match[1]);
  const m = parseInt(match[2]);
  const period = match[3].toUpperCase();
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return h * 60 + m;
}

function addMinutes(timeStr, mins) {
  const total = parseTimeTo24(timeStr) + mins;
  let h = Math.floor(total / 60) % 24;
  const m = total % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return h + ':' + (m < 10 ? '0' : '') + m + ' ' + ampm;
}

// Calculate jamaat/iqamah time from start time + offset
function getIqamahTime(prayerName, startTime) {
  var offset = JAMAAT_OFFSETS[prayerName];
  if (offset === null || offset === undefined) {
    return startTime; // No offset = iqamah at start time
  }
  return addMinutes(startTime, offset);
}

async function fetchPrayerTimes() {
  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const url = 'https://api.aladhan.com/v1/timings/' + day + '-' + month + '-' + year +
    '?latitude=' + CROYDON_COORDS.latitude +
    '&longitude=' + CROYDON_COORDS.longitude +
    '&method=' + CALCULATION_METHOD;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(function() { controller.abort(); }, 10000);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      const data = await response.json();

      if (data.code === 200 && data.data) {
        const t = data.data.timings;
        return {
          Fajr: formatTime(t.Fajr),
          Sunrise: formatTime(t.Sunrise),
          Dhuhr: formatTime(t.Dhuhr),
          Asr: formatTime(t.Asr),
          Maghrib: formatTime(t.Maghrib),
          Isha: formatTime(t.Isha)
        };
      }
    } catch (e) {
      if (attempt < 3) {
        await new Promise(function(r) { setTimeout(r, attempt * 1000); });
      }
    }
  }
  return FALLBACK_TIMES;
}

function getNextPrayer(times) {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const prayers = [
    { name: 'Fajr', arabicName: 'الفجر', time: times.Fajr },
    { name: 'Sunrise', arabicName: 'الشروق', time: times.Sunrise },
    { name: 'Zohr', arabicName: 'الظهر', time: times.Dhuhr },
    { name: 'Asr', arabicName: 'العصر', time: times.Asr },
    { name: 'Maghrib', arabicName: 'المغرب', time: times.Maghrib },
    { name: 'Isha', arabicName: 'العشاء', time: times.Isha }
  ];

  for (var i = 0; i < prayers.length; i++) {
    if (parseTimeTo24(prayers[i].time) > currentMinutes) {
      return prayers[i];
    }
  }
  return prayers[0]; // Fajr next day
}

function renderPrayerTimes(times) {
  const tbody = document.getElementById('prayer-tbody');
  if (!tbody) return;

  const next = getNextPrayer(times);

  const prayers = [
    { name: 'Fajr', key: 'Fajr', ar: 'الفجر', start: times.Fajr },
    { name: 'Zohr', key: 'Dhuhr', ar: 'الظهر', start: times.Dhuhr },
    { name: 'Asr', key: 'Asr', ar: 'العصر', start: times.Asr },
    { name: 'Maghrib', key: 'Maghrib', ar: 'المغرب', start: times.Maghrib },
    { name: 'Isha', key: 'Isha', ar: 'العشاء', start: times.Isha }
  ];

  let html = '';
  prayers.forEach(function(p) {
    var iqamah = getIqamahTime(p.key, p.start);
    const isNext = p.name === next.name && next.name !== 'Sunrise';
    html += '<tr class="' + (isNext ? 'active-prayer' : '') + '">';
    html += '<td><div class="prayer-name">' + p.name +
      (isNext ? ' <span class="next-badge">Next</span>' : '') +
      '</div><div class="prayer-name-ar">' + p.ar + '</div></td>';
    html += '<td class="prayer-time">' + p.start + '</td>';
    html += '<td class="prayer-iqamah">' + iqamah + '</td>';
    html += '</tr>';
  });

  // Jumu'ah row
  html += '<tr class="prayer-juma">';
  html += '<td><div class="prayer-name" style="color:var(--primary)">Jumu\'ah</div><div class="prayer-name-ar">الجمعة</div></td>';
  html += '<td class="prayer-time">1st: ' + JUMA_TIMES.first + '</td>';
  html += '<td class="prayer-iqamah">2nd: ' + JUMA_TIMES.second + '</td>';
  html += '</tr>';

  tbody.innerHTML = html;

  // Update next prayer banner
  var nextEl = document.getElementById('next-prayer-name');
  var nextTimeEl = document.getElementById('next-prayer-time');
  if (nextEl && next.name !== 'Sunrise') {
    nextEl.textContent = next.name;
    // Map display name to key for iqamah lookup
    var keyMap = { 'Fajr': 'Fajr', 'Zohr': 'Dhuhr', 'Asr': 'Asr', 'Maghrib': 'Maghrib', 'Isha': 'Isha' };
    var nextKey = keyMap[next.name] || next.name;
    var startTime = times[nextKey] || next.time;
    var iqamah = getIqamahTime(nextKey, startTime);
    if (nextTimeEl) nextTimeEl.textContent = iqamah;
  } else if (nextEl) {
    nextEl.textContent = 'Sunrise';
    if (nextTimeEl) nextTimeEl.textContent = next.time;
  }

  // Extra times
  var sunriseEl = document.getElementById('sunrise-time');
  var ishraqEl = document.getElementById('ishraq-time');
  var zawaalEl = document.getElementById('zawaal-time');
  if (sunriseEl) sunriseEl.textContent = times.Sunrise;
  if (ishraqEl) ishraqEl.textContent = addMinutes(times.Sunrise, 15);
  if (zawaalEl) zawaalEl.textContent = addMinutes(times.Dhuhr, -10);
}

async function initPrayerTimes() {
  const times = await fetchPrayerTimes();
  renderPrayerTimes(times);
  // Re-render every 60 seconds to update "next prayer"
  setInterval(function() { renderPrayerTimes(times); }, 60000);
}
