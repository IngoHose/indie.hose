// ============================================
// RELEASE-KALENDER - KOMPAKTER LIST-VIEW
// ============================================

let allReleases = [];
let currentDate = new Date();

// Initialisierung
async function initReleaseCalendar() {
  await loadReleases();
  setupNavigation();
  renderCalendar();
}

// Releases aus releases.md laden
async function loadReleases() {
  try {
    const response = await fetch('content/releases.md');
    if (!response.ok) throw new Error('releases.md nicht gefunden');
    
    const mdText = await response.text();
    allReleases = parseReleasesFromMarkdown(mdText);
    
    console.log('Releases geladen:', allReleases);
  } catch (error) {
    console.error('Fehler beim Laden der Releases:', error);
    document.getElementById('release-list').innerHTML = 
      '<div class="empty-state">Keine Releases gefunden</div>';
  }
}

// Markdown parsen
function parseReleasesFromMarkdown(mdText) {
  const releases = [];
  const content = mdText.replace(/^---[\s\S]*?---/, '').trim();
  const lines = content.split('\n');
  
  lines.forEach(line => {
    line = line.trim();
    if (!line || !line.startsWith('-')) return;
    
    line = line.substring(1).trim();
    
    // Verschiedene Regex-Patterns
    const patterns = [
      /^(.+?)\s*-\s*(.+?)\s*\((\d{1,2}\.\d{1,2}\.(?:\d{4})?)\)/,
      /^\*\*(.+?)\*\*\s*-\s*\*(.+?)\*\s*\((\d{1,2}\.\d{1,2}\.(?:\d{4})?)\)/,
      /^(.+?):\s*(.+?)\s*-\s*(\d{1,2}\.\d{1,2}\.(?:\d{4})?)/,
    ];
    
    let match = null;
    for (const pattern of patterns) {
      match = line.match(pattern);
      if (match) break;
    }
    
    if (match) {
      const [, artist, title, dateStr] = match;
      const dateParts = dateStr.split('.');
      let day = parseInt(dateParts[0], 10);
      let month = parseInt(dateParts[1], 10) - 1;
      let year = dateParts[2] ? parseInt(dateParts[2], 10) : new Date().getFullYear();
      
      const releaseDate = new Date(year, month, day);
      
      releases.push({
        artist: artist.replace(/\*\*/g, '').trim(),
        title: title.replace(/\*/g, '').trim(),
        date: releaseDate,
        dateString: dateStr
      });
    }
  });
  
  // Sortiere nach Datum (älteste zuerst für chronologische Liste)
  releases.sort((a, b) => a.date - b.date);
  return releases;
}

// Navigation einrichten
function setupNavigation() {
  document.getElementById('prev-month').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
  });
  
  document.getElementById('next-month').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
  });
}

// Kalender rendern
function renderCalendar() {
  updateMonthDisplay();
  renderReleaseList();
}

// Monat-Display aktualisieren
function updateMonthDisplay() {
  const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
                      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  
  const display = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  document.getElementById('current-month-display').textContent = display;
}

// Release-Liste rendern
function renderReleaseList() {
  const container = document.getElementById('release-list');
  
  // Releases für aktuellen Monat filtern
  const monthReleases = allReleases.filter(r => {
    return r.date.getMonth() === currentDate.getMonth() &&
           r.date.getFullYear() === currentDate.getFullYear();
  });
  
  if (monthReleases.length === 0) {
    container.innerHTML = '<div class="empty-state">Keine Releases in diesem Monat</div>';
    return;
  }
  
  let html = '';
  
  monthReleases.forEach(release => {
    html += renderReleaseItem(release);
  });
  
  container.innerHTML = html;
}

// Einzelnen Release-Eintrag rendern
function renderReleaseItem(release) {
  // Formatiere Datum als "05.Nov" oder "12.Dez"
  const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  
  const day = String(release.date.getDate()).padStart(2, '0');
  const month = monthNames[release.date.getMonth()];
  const formattedDate = `${day}.${month}`;
  
  return `
    <div class="release-item">
      <div class="release-date-badge">${formattedDate}</div>
      <div class="release-artist">${release.artist}</div>
      <div class="release-title">${release.title}</div>
    </div>
  `;
}

// Initialisierung beim Laden
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('release-list')) {
    initReleaseCalendar();
  }
});
