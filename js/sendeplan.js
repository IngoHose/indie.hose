// ============================================
// SENDEPLAN - indie.hose Custom Schedule + laut.fm API
// ============================================

const STATION = 'indie-hose';
const API_BASE = 'https://api.laut.fm/station';

// Hilfsfunktion: Datum formatieren
function formatDate(date) {
  const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const day = days[date.getDay()];
  const dateStr = date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  return `${day}, ${dateStr}`;
}

// Hilfsfunktion: Zeit formatieren
function formatTime(timeStr) {
  return timeStr; // Bereits im Format "HH:MM"
}

// Hilfsfunktion: Relative Zeit formatieren
function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date - now;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 0) {
    const agoMins = Math.abs(diffMins);
    if (agoMins < 60) return `vor ${agoMins} Min.`;
    const agoHours = Math.floor(agoMins / 60);
    return `vor ${agoHours} Std.`;
  } else {
    if (diffMins < 60) return `in ${diffMins} Min.`;
    const inHours = Math.floor(diffMins / 60);
    return `in ${inHours} Std.`;
  }
}

// Hilfsfunktion: Zeit-String zu Minuten konvertieren (für Vergleiche)
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Hilfsfunktion: Prüfen ob eine Zeit in einem Zeitraum liegt
function isTimeBetween(currentTime, startTime, endTime) {
  const current = timeToMinutes(currentTime);
  let start = timeToMinutes(startTime);
  let end = timeToMinutes(endTime);
  
  // Handle midnight crossing (z.B. 22:00 - 02:00)
  if (end < start) {
    end += 24 * 60;
    if (current < start) {
      return current + 24 * 60 >= start && current + 24 * 60 < end;
    }
  }
  
  return current >= start && current < end;
}

// ============================================
// EIGENEN SENDEPLAN LADEN
// ============================================

let scheduleData = [];

async function loadScheduleData() {
  try {
    const response = await fetch('content/sendeplan.json');
    if (!response.ok) throw new Error('Sendeplan konnte nicht geladen werden');
    scheduleData = await response.json();
    console.log('Sendeplan geladen:', scheduleData);
  } catch (error) {
    console.error('Fehler beim Laden des Sendeplans:', error);
    scheduleData = [];
  }
}

// Finde aktuelle Show basierend auf Wochentag und Uhrzeit
function getCurrentShow() {
  const now = new Date();
  const dayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const currentDay = dayNames[now.getDay()];
  const currentTime = now.toTimeString().substring(0, 5); // "HH:MM"
  
  // Suche nach passender Show
  for (const show of scheduleData) {
    if (show.isDefault) continue; // Rotation überspringen
    
    for (const slot of show.slots) {
      if (slot.day === currentDay && isTimeBetween(currentTime, slot.start, slot.end)) {
        return {
          name: show.name,
          description: show.description,
          starts_at: slot.start,
          ends_at: slot.end
        };
      }
    }
  }
  
  // Wenn keine Show gefunden, return Rotation
  const rotation = scheduleData.find(s => s.isDefault);
  return rotation ? {
    name: rotation.name,
    description: rotation.description,
    starts_at: '00:00',
    ends_at: '23:59'
  } : null;
}

// Finde vorherige Show
function getPreviousShow() {
  const now = new Date();
  const dayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  
  // Alle Shows in zeitlicher Reihenfolge sammeln
  let allSlots = [];
  for (const show of scheduleData) {
    if (show.isDefault) continue;
    for (const slot of show.slots) {
      allSlots.push({
        ...slot,
        showName: show.name,
        showDescription: show.description
      });
    }
  }
  
  // Nach Zeit sortieren und letzte Show vor jetzt finden
  const currentDay = dayNames[now.getDay()];
  const currentTime = now.toTimeString().substring(0, 5);
  
  // Filter Shows von heute, die schon vorbei sind
  const previousToday = allSlots.filter(slot => 
    slot.day === currentDay && timeToMinutes(slot.end) <= timeToMinutes(currentTime)
  ).sort((a, b) => timeToMinutes(b.end) - timeToMinutes(a.end));
  
  if (previousToday.length > 0) {
    const slot = previousToday[0];
    return {
      name: slot.showName,
      description: slot.showDescription,
      starts_at: slot.start,
      ends_at: slot.end
    };
  }
  
  // Sonst letzte Show von gestern
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayName = dayNames[yesterday.getDay()];
  
  const previousYesterday = allSlots.filter(slot => slot.day === yesterdayName)
    .sort((a, b) => timeToMinutes(b.end) - timeToMinutes(a.end));
  
  if (previousYesterday.length > 0) {
    const slot = previousYesterday[0];
    return {
      name: slot.showName,
      description: slot.showDescription,
      starts_at: slot.start,
      ends_at: slot.end
    };
  }
  
  return null;
}

// Finde nächste Show
function getNextShow() {
  const now = new Date();
  const dayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const currentDay = dayNames[now.getDay()];
  const currentTime = now.toTimeString().substring(0, 5);
  
  // Alle Shows sammeln
  let allSlots = [];
  for (const show of scheduleData) {
    if (show.isDefault) continue;
    for (const slot of show.slots) {
      allSlots.push({
        ...slot,
        showName: show.name,
        showDescription: show.description
      });
    }
  }
  
  // Nächste Show heute
  const nextToday = allSlots.filter(slot => 
    slot.day === currentDay && timeToMinutes(slot.start) > timeToMinutes(currentTime)
  ).sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
  
  if (nextToday.length > 0) {
    const slot = nextToday[0];
    return {
      name: slot.showName,
      description: slot.showDescription,
      starts_at: slot.start,
      ends_at: slot.end
    };
  }
  
  // Sonst erste Show von morgen
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowName = dayNames[tomorrow.getDay()];
  
  const nextTomorrow = allSlots.filter(slot => slot.day === tomorrowName)
    .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
  
  if (nextTomorrow.length > 0) {
    const slot = nextTomorrow[0];
    return {
      name: slot.showName,
      description: slot.showDescription,
      starts_at: slot.start,
      ends_at: slot.end
    };
  }
  
  return null;
}

// ============================================
// BEREICH 2: AKTUELLE SHOWS
// ============================================

async function loadCurrentShows() {
  if (scheduleData.length === 0) {
    await loadScheduleData();
  }
  
  // Vorherige Show
  const previous = getPreviousShow();
  if (previous) {
    displayShow(previous, 'previous-show');
  } else {
    document.getElementById('previous-show').innerHTML = '<div class="empty-state">Keine Daten</div>';
  }
  
  // Aktuelle Show
  const current = getCurrentShow();
  if (current) {
    displayShow(current, 'current-show');
  } else {
    document.getElementById('current-show').innerHTML = '<div class="empty-state">Rotation läuft</div>';
  }
  
  // Nächste Show
  const next = getNextShow();
  if (next) {
    displayShow(next, 'next-show');
  } else {
    document.getElementById('next-show').innerHTML = '<div class="empty-state">Keine Daten</div>';
  }
}

function displayShow(show, containerId) {
  const container = document.getElementById(containerId);
  
  let html = '';
  
  html += `<div class="show-name">${show.name || 'Unbekannte Show'}</div>`;
  
  // Zeit
  if (show.starts_at && show.ends_at) {
    html += `<div class="show-time">${formatTime(show.starts_at)} - ${formatTime(show.ends_at)}</div>`;
  }
  
  // Beschreibung
  if (show.description) {
    html += `<div class="show-description">${show.description}</div>`;
  }
  
  container.innerHTML = html;
}

// ============================================
// BEREICH 3: PLAYLIST (Last Played)
// ============================================

async function loadPlaylist() {
  await loadLastPlayed();
}

async function loadLastPlayed() {
  try {
    const response = await fetch(`${API_BASE}/${STATION}/last_songs`);
    if (!response.ok) throw new Error('API-Fehler');
    
    const songs = await response.json();
    const container = document.getElementById('last-songs');
    
    if (!songs || songs.length === 0) {
      container.innerHTML = '<div class="empty-state">Keine Songs verfügbar</div>';
      return;
    }
    
    // Zeige die letzten 10 Songs
    const displaySongs = songs.slice(0, 10);
    
    let html = '';
    displaySongs.forEach((song, index) => {
      html += `
        <div class="song-item">
          <div class="song-artist">${song.artist?.name || 'Unbekannter Künstler'}</div>
          <div class="song-title">${song.title || 'Unbekannter Titel'}</div>
          <div class="song-time">${formatRelativeTime(song.started_at)}</div>
        </div>
      `;
    });
    
    container.innerHTML = html;
    
  } catch (error) {
    console.error('Fehler beim Laden der letzten Songs:', error);
    document.getElementById('last-songs').innerHTML = '<div class="error">Fehler beim Laden</div>';
  }
}

// ============================================
// BEREICH 1: WOCHENÜBERSICHT
// ============================================

async function loadSchedule() {
  if (scheduleData.length === 0) {
    await loadScheduleData();
  }
  
  // Schedule anzeigen (immer die gleiche Woche)
  displaySchedule();
}

function displaySchedule() {
  const grid = document.getElementById('schedule-grid');
  
  const dayNames = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
  
  let html = '';
  
  dayNames.forEach(dayName => {
    // Sammle alle Shows für diesen Tag
    const dayShows = [];
    
    for (const show of scheduleData) {
      if (show.isDefault) continue; // Rotation überspringen
      
      for (const slot of show.slots) {
        if (slot.day === dayName) {
          dayShows.push({
            name: show.name,
            description: show.description,
            start: slot.start,
            end: slot.end
          });
        }
      }
    }
    
    // Nach Startzeit sortieren
    dayShows.sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
    
    html += `
      <div class="day-schedule">
        <div class="day-header">${dayName}</div>
        <div class="day-shows">
    `;
    
    if (dayShows.length === 0) {
      html += '<div class="empty-state">Rotation</div>';
    } else {
      dayShows.forEach(show => {
        html += `
          <div class="schedule-show">
            <div class="schedule-show-time">
              ${formatTime(show.start)} - ${formatTime(show.end)}
            </div>
            <div class="schedule-show-name">${show.name}</div>
            ${show.description ? `<div class="schedule-show-description">${show.description}</div>` : ''}
          </div>
        `;
      });
    }
    
    html += `
        </div>
      </div>
    `;
  });
  
  grid.innerHTML = html;
}

// ============================================
// INITIALISIERUNG & AUTO-REFRESH
// ============================================

function initSendeplan() {
  // Sendeplan-Daten laden
  loadScheduleData().then(() => {
    // Dann alles andere laden
    loadCurrentShows();
    loadPlaylist();
    loadSchedule();
  });
  
  // Aktuelle Shows alle 60 Sekunden aktualisieren
  setInterval(loadCurrentShows, 60000);
  
  // Playlist alle 60 Sekunden aktualisieren
  setInterval(loadPlaylist, 60000);
}

// Beim Laden der Seite starten
document.addEventListener('DOMContentLoaded', initSendeplan);