// Main app orchestration

document.addEventListener('DOMContentLoaded', function() {
  // Theme
  initTheme();

  // Clock
  updateClock();
  setInterval(updateClock, 1000);

  // Gregorian date
  updateGregorianDate();

  // Hijri date
  renderHijriDate();

  // Ramadan banner
  initRamadan();

  // Prayer times
  initPrayerTimes();

  // Mobile menu
  initMobileMenu();

  // Active nav highlighting
  initScrollSpy();

  // Event filters
  initEventFilters();

  // Article search
  initArticleSearch();
});

// ==========================================
// Theme Toggle
// ==========================================
function initTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else if (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
  updateThemeIcon();
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  if (current === 'dark') {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('theme', 'light');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  }
  updateThemeIcon();
}

function updateThemeIcon() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  btn.textContent = isDark ? '\u2600\uFE0F' : '\uD83C\uDF19';
}

// ==========================================
// Clock
// ==========================================
function updateClock() {
  const now = new Date();
  let h = now.getHours();
  const m = now.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const timeStr = h + ':' + (m < 10 ? '0' : '') + m + ' ' + ampm;

  const clockEl = document.getElementById('hero-clock');
  if (clockEl) clockEl.textContent = timeStr;
}

function updateGregorianDate() {
  const now = new Date();
  const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const dateStr = now.toLocaleDateString('en-GB', options);
  const el = document.getElementById('hero-date');
  if (el) el.textContent = dateStr;
}

// ==========================================
// Mobile Menu
// ==========================================
function initMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  if (!hamburger || !mobileMenu) return;

  hamburger.addEventListener('click', function() {
    mobileMenu.classList.toggle('open');
    hamburger.textContent = mobileMenu.classList.contains('open') ? '\u2715' : '\u2630';
  });

  // Close menu on link click
  mobileMenu.querySelectorAll('a').forEach(function(link) {
    link.addEventListener('click', function() {
      mobileMenu.classList.remove('open');
      hamburger.textContent = '\u2630';
    });
  });
}

// ==========================================
// Scroll Spy for active nav
// ==========================================
function initScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a, .mobile-menu a');

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        navLinks.forEach(function(link) {
          link.classList.remove('active');
          if (link.getAttribute('href') === '#' + entry.target.id) {
            link.classList.add('active');
          }
        });
      }
    });
  }, { rootMargin: '-30% 0px -70% 0px' });

  sections.forEach(function(section) {
    observer.observe(section);
  });
}

// ==========================================
// Article Search
// ==========================================
function initArticleSearch() {
  const input = document.getElementById('article-search');
  const list = document.getElementById('articles-list');
  if (!input || !list) return;

  const articles = list.querySelectorAll('.article-item');
  input.addEventListener('input', function() {
    const query = input.value.toLowerCase().trim();
    articles.forEach(function(article) {
      var text = article.textContent.toLowerCase();
      article.style.display = text.indexOf(query) !== -1 ? '' : 'none';
    });
  });
}

// ==========================================
// Event Filters
// ==========================================
function initEventFilters() {
  const chips = document.querySelectorAll('.filter-chip');
  const cards = document.querySelectorAll('.event-card');

  chips.forEach(function(chip) {
    chip.addEventListener('click', function() {
      chips.forEach(function(c) { c.classList.remove('active'); });
      chip.classList.add('active');

      const filter = chip.getAttribute('data-filter');
      cards.forEach(function(card) {
        if (filter === 'all' || card.getAttribute('data-type') === filter) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}
