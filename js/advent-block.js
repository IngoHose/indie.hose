// ============================================
// ADVENT CALENDAR GRID FUNCTIONALITY
// Creates and manages the interactive advent calendar grid
// ============================================

document.addEventListener('DOMContentLoaded', function() {
  const grid = document.getElementById('advent-grid');
  if (!grid) return;

  // Get current date
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // 1-12
  const currentDay = currentDate.getDate();
  
  // Check if we're in December of the current year
  const isDecember = currentMonth === 12;
  
  // Create 24 doors in numeric order
  const doorNumbers = Array.from({length: 24}, (_, i) => i + 1);
  
  // Create door elements
  doorNumbers.forEach(number => {
    const door = document.createElement('a');
    door.className = 'door';
    door.href = `tuerchen.html?day=${number}`;
    
    const doorNumber = document.createElement('div');
    doorNumber.className = 'door-number';
    doorNumber.textContent = number;
    
    door.appendChild(doorNumber);
    
    // Check if the door should be locked or opened
    if (!isDecember || number > currentDay) {
      door.classList.add('locked');
      door.removeAttribute('href');
      door.style.cursor = 'not-allowed';
    } else {
      // For opened doors, fetch the cover image
      fetchDoorCover(door, number);
    }
    
    grid.appendChild(door);
  });
  
  // Add click handler for doors
  grid.addEventListener('click', function(e) {
    const door = e.target.closest('.door');
    if (!door || door.classList.contains('locked')) {
      e.preventDefault();
    }
  });
});

// Helper function to shuffle an array
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Function to fetch and set door cover image
async function fetchDoorCover(door, day) {
  try {
    const dayPadded = String(day).padStart(2, '0');
    const response = await fetch(`content/advent/day${dayPadded}.md`);
    if (!response.ok) {
      console.error(`Fehler beim Laden von Tag ${day}:`, response.status);
      return;
    }
    
    const text = await response.text();
    console.log(`Inhalt von Tag ${day}:`, text.substring(0, 100) + '...');
    
    // Suche nach dem Cover im Frontmatter
    const coverMatch = text.match(/cover:\s*['"]?([^'"\n]+)['"]?/);
    
    if (coverMatch && coverMatch[1]) {
      let coverPath = coverMatch[1].trim();
      // Entferne Anführungszeichen, falls vorhanden
      coverPath = coverPath.replace(/^['"]|['"]$/g, '');
      console.log(`Cover für Tag ${day} gefunden:`, coverPath);
      
      // Stelle sicher, dass der Pfad korrekt ist
      if (!coverPath.startsWith('http') && !coverPath.startsWith('/')) {
        coverPath = coverPath.startsWith('covers/') ? coverPath : `covers/${coverPath}`;
      }
      
      door.style.backgroundImage = `url('${coverPath}')`;
      door.classList.add('opened');
      
      // Füge einen Event-Listener für Klicks hinzu
      door.onclick = (e) => {
        e.preventDefault();
        window.location.href = `tuerchen.html?day=${day}`;
      };
    } else {
      console.warn(`Kein Cover für Tag ${day} gefunden`);
    }
  } catch (error) {
    console.error('Error fetching door cover:', error);
  }
}