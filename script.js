async function fetchCurrentSong() {
  try {
    const response = await fetch('https://api.laut.fm/station/indie-hose/current_song');
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    
    const songTitle = data.title;
    const artist = data.artist.name;
    
    document.getElementById('song-title').textContent = `${artist} - ${songTitle}`;
  } catch (error) {
    console.error('Es gab ein Problem mit der Fetch-Operation:', error);
    document.getElementById('song-title').textContent = 'Fehler beim Laden der Songdaten';
  }
}

fetchCurrentSong();
setInterval(fetchCurrentSong, 30000); 

document.addEventListener('DOMContentLoaded', function() {
  const menuToggle = document.getElementById('menuToggle');
  menuToggle.addEventListener('click', function() {
      document.body.classList.toggle('nav-open');
  });
});

