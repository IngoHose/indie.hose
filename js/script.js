document.addEventListener("DOMContentLoaded", () => {
  const header = document.getElementById("main-header");
  const hamburger = document.getElementById("hamburger");

  // Overlay-Elemente
  const overlay = document.getElementById("overlay-nav");
  const closeOverlay = document.getElementById("close-overlay");
  const overlayMenu = document.getElementById("overlay-menu");

  // Hauptnavigation aus dem Header (Quelle für Links)
  const mainNav = document.getElementById("main-nav");

  // --- Navigation: Links aus dem Header ins Overlay kopieren ---
  if (mainNav && overlayMenu) {
    overlayMenu.innerHTML = mainNav.innerHTML;
  }

  // --- Overlay steuern ---
  function openOverlay() {
    overlay.classList.add("active");
    document.body.classList.add("no-scroll");
  }
  function closeOverlayFn() {
    overlay.classList.remove("active");
    document.body.classList.remove("no-scroll");
  }

  // Hamburger öffnet Overlay
  if (hamburger) {
    hamburger.addEventListener("click", openOverlay);
  }

  // X-Button schließt Overlay
  if (closeOverlay) {
    closeOverlay.addEventListener("click", closeOverlayFn);
  }

  // Klick auf dunklen Hintergrund (nicht auf die Links) schließt Overlay
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeOverlayFn();
  });

  // ESC-Taste schließt Overlay
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeOverlayFn();
  });

  // --- Header schrumpfen beim Scrollen (Nav blendet aus) ---
  // Erweitere dein bestehendes Script um Touch-Support:
window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
        header.classList.add("shrink");
    } else {
        header.classList.remove("shrink");
    }
}, { passive: true }); // passive: true für bessere Touch-Performance

// Zusätzlich für Touch-Geräte:
window.addEventListener("touchmove", () => {
    if (window.scrollY > 50) {
        header.classList.add("shrink");
    } else {
        header.classList.remove("shrink");
    }
}, { passive: true });

  async function fetchCurrentSong() {
  try {
    const response = await fetch('https://api.laut.fm/station/indie-hose/current_song');
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const data = await response.json();
    const songTitle = data.title;
    const artist = data.artist.name;
    
    // HIER IST DIE ÄNDERUNG:
    document.getElementById('currentSong').textContent = `${artist} - ${songTitle}`;
    
  } catch (error) {
    console.error('Es gab ein Problem mit der Fetch-Operation:', error);
    
    // HIER AUCH ÄNDERN:
    document.getElementById('currentSong').textContent = 'Fehler beim Laden der Songdaten';
  }
}

  fetchCurrentSong();
  setInterval(fetchCurrentSong, 30000);
});

// Hören-Sektion

        const API_KEY = 'AIzaSyBcy1DQQHI9Rm0HkUNcpHq7I9tHj22kIuU';
        
        const playlistIds = [
            'PLTYzuzCviO5XjVfh06XTt_Hzr4Y9nTyBi'
        ];

        let expandedPlaylists = {};

        async function fetchPlaylistInfo(playlistId) {
            const url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&id=${playlistId}&key=${API_KEY}`;
            const response = await fetch(url);
            const data = await response.json();
            return data.items[0];
        }

        async function fetchPlaylistVideos(playlistId) {
            let videos = [];
            let pageToken = '';
            
            do {
                const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50&pageToken=${pageToken}&key=${API_KEY}`;
                const response = await fetch(url);
                const data = await response.json();
                
                if (data.items) {
                    videos = videos.concat(data.items);
                }
                
                pageToken = data.nextPageToken || '';
            } while (pageToken);
            
            return videos;
        }

        function createPlaylistCard(playlistInfo, videos, index) {
            const card = document.createElement('div');
            card.className = 'playlist-card';
            card.id = `playlist-${index}`;
            
            const snippet = playlistInfo.snippet;
            const playlistUrl = `https://youtube.com/playlist?list=${playlistInfo.id}`;
            const thumbnailUrl = snippet.thumbnails.medium.url;
            
            card.innerHTML = `
                <div class="playlist-header">
                    <div class="playlist-thumbnail">
                        <img src="${thumbnailUrl}" alt="${snippet.title}">
                        <div class="play-icon-small">▶</div>
                    </div>
                    <div class="playlist-info">
                        <div class="playlist-title">${snippet.title}</div>
                        <div class="playlist-description">${snippet.description || 'Keine Beschreibung verfügbar'}</div>
                        <div class="playlist-meta">${videos.length} Videos</div>
                    </div>
                    <a href="${playlistUrl}" target="_blank" class="youtube-button" onclick="event.stopPropagation()">
                        YouTube öffnen
                    </a>
                    <div class="expand-button" onclick="togglePlaylist(${index})">
                        ▼
                    </div>
                </div>
                <div class="songs-container" id="songs-${index}">
                    ${videos.map((video, i) => createSongItem(video, i + 1, playlistInfo.id)).join('')}
                </div>
            `;
            
            return card;
        }

        function createSongItem(item, number, playlistId) {
            const snippet = item.snippet;
            const videoId = snippet.resourceId.videoId;
            const videoUrl = `https://www.youtube.com/watch?v=${videoId}&list=${playlistId}`;
            const thumbnailUrl = snippet.thumbnails.medium.url;
            
            return `
                <a href="${videoUrl}" target="_blank" class="song-item" onclick="event.stopPropagation()">
                    <div class="song-number">${number}</div>
                    <div class="song-thumbnail">
                        <img src="${thumbnailUrl}" alt="${snippet.title}">
                    </div>
                    <div class="song-info">
                        <div class="song-title">${snippet.title}</div>
                        <div class="song-channel">${snippet.videoOwnerChannelTitle || snippet.channelTitle}</div>
                    </div>
                </a>
            `;
        }

        function togglePlaylist(index) {
            const card = document.getElementById(`playlist-${index}`);
            const songsContainer = document.getElementById(`songs-${index}`);
            const expandButton = card.querySelector('.expand-button');
            
            const isExpanded = expandedPlaylists[index];
            expandedPlaylists[index] = !isExpanded;
            
            card.classList.toggle('expanded');
            songsContainer.classList.toggle('expanded');
            expandButton.classList.toggle('rotated');
        }

        async function loadPlaylists() {
            const container = document.getElementById('playlistsContainer');
            container.innerHTML = '<div class="loading">Lade Playlists von YouTube...</div>';
            
            try {
                for (let i = 0; i < playlistIds.length; i++) {
                    const playlistId = playlistIds[i];
                    
                    const playlistInfo = await fetchPlaylistInfo(playlistId);
                    const videos = await fetchPlaylistVideos(playlistId);
                    
                    if (i === 0) {
                        container.innerHTML = '';
                    }
                    
                    const card = createPlaylistCard(playlistInfo, videos, i);
                    container.appendChild(card);
                }
            } catch (error) {
                console.error('Fehler beim Laden der Playlists:', error);
                container.innerHTML = '<div class="error">Fehler beim Laden der Playlists. Bitte überprüfe deinen API Key und stelle sicher, dass die YouTube Data API aktiviert ist.</div>';
            }
        }

        loadPlaylists();
