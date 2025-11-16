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
