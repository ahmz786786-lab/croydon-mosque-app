// Ramadan banner logic - ported from app's components/RamadanBanner.tsx

function initRamadan() {
  const hijri = gregorianToHijri();
  const banner = document.getElementById('ramadan-banner');
  const downloadBtn = document.getElementById('ramadan-download');
  if (!banner) return;

  if (hijri.month === 9) {
    // It's Ramadan
    banner.innerHTML = '&#127769; Ramadan Mubarak! Day ' + hijri.day + ' of Ramadan';
    banner.classList.add('visible');
    if (downloadBtn) downloadBtn.style.display = 'block';
  } else {
    // Calculate days until Ramadan
    var daysRemaining;
    if (hijri.month < 9) {
      var monthsUntil = 9 - hijri.month - 1;
      daysRemaining = Math.round(monthsUntil * 29.5 + (30 - hijri.day));
    } else {
      var monthsUntil2 = 12 - hijri.month + 8;
      daysRemaining = Math.round(monthsUntil2 * 29.5 + (30 - hijri.day));
    }

    if (daysRemaining <= 60) {
      banner.innerHTML = '&#127769; Ramadan is Coming! ~' + daysRemaining + ' days until Ramadan';
      banner.classList.add('visible');
      if (downloadBtn) downloadBtn.style.display = 'block';
    }
  }
}
