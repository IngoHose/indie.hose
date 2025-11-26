// ============================================
// ADVENTSKALENDER - TÜRCHEN SEITE LOGIK
// Lädt Markdown und rendert Seite
// ============================================

// Get day from URL parameter
const urlParams = new URLSearchParams(window.location.search);
const day = urlParams.get('day') || '1';
const dayPadded = day.toString().padStart(2, '0');

// Elements
const loading = document.getElementById('loading');
const content = document.getElementById('content');
const error = document.getElementById('error');
const errorMessage = document.getElementById('error-message');

// Load Markdown file
async function loadTuerchen() {
  try {
    // Fetch Markdown file
    const response = await fetch(`content/advent/day${String(day).padStart(2, '0')}.md`);
    console.log('Lade Datei:', `content/advent/day${String(day).padStart(2, '0')}.md`);
    
    if (!response.ok) {
      throw new Error('Türchen nicht gefunden');
    }
    
    const markdown = await response.text();
    
    // Parse Frontmatter und Content
    const { metadata, content: mdContent } = parseFrontmatter(markdown);
    
    // Update Meta Title
    document.title = `Türchen ${metadata.day} - indie.hose Adventskalender`;
    
    // Setze nur die Türchennummer
    document.getElementById('door-number').textContent = metadata.day;
    
    // Update Song Info
    document.getElementById('song-cover').src = metadata.cover;
    document.getElementById('song-cover').alt = `${metadata.artist} - ${metadata.title}`;
    document.getElementById('song-artist').textContent = metadata.artist;
    document.getElementById('song-title').textContent = metadata.title;
    
    // Convert Markdown to HTML
    const html = marked.parse(mdContent);
    document.getElementById('markdown-content').innerHTML = html;
    
    // Update YouTube
    if (metadata.youtube) {
      const youtubeContainer = document.createElement('div');
      youtubeContainer.className = 'youtube-container';
      const youtubeIframe = document.createElement('iframe');
      
      // Extract video ID from URL
      const youtubeId = metadata.youtube.includes('youtube.com') 
        ? new URL(metadata.youtube).searchParams.get('v') 
        : metadata.youtube;
      
      if (youtubeId) {
        youtubeIframe.src = `https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`;
        youtubeIframe.allowFullscreen = true;
        youtubeContainer.appendChild(youtubeIframe);
        
        // Insert after markdown content
        const markdownContent = document.getElementById('markdown-content');
        markdownContent.parentNode.insertBefore(youtubeContainer, markdownContent.nextSibling);
      }
    }
    
    // Update Share Meta Tags
    updateMetaTags(metadata);
    
    // Show content
    loading.style.display = 'none';
    content.style.display = 'block';
    
    console.log(`✅ Türchen ${metadata.day} geladen`);
    
  } catch (err) {
    console.error('❌ Fehler beim Laden:', err);
    showError(err.message);
  }
}

// Parse Frontmatter (YAML-like)
function parseFrontmatter(markdown) {
  const lines = markdown.split('\n');
  
  // Find the first and second ---
  const firstDivider = lines.findIndex(line => line.trim() === '---');
  const secondDivider = lines.slice(firstDivider + 1).findIndex(line => line.trim() === '---') + firstDivider + 1;
  
  if (firstDivider === -1 || secondDivider === -1) {
    throw new Error('Ungültiges Markdown-Format (Frontmatter fehlt)');
  }
  
  const metadata = {};
  
  // Parse metadata between the two --- lines
  for (let i = firstDivider + 1; i < secondDivider; i++) {
    const line = lines[i].trim();
    if (line) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > -1) {
        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim().replace(/^['"](.*)['"]$/, '$1'); // Remove surrounding quotes if present
        metadata[key] = value;
      }
    }
  }
  
  // Get content after the second ---
  const content = lines.slice(secondDivider + 1).join('\n').trim();
  
  return { metadata, content };
}

// Update Meta Tags for Social Sharing
function updateMetaTags(metadata) {
  // OG Title
  let ogTitle = document.querySelector('meta[property="og:title"]');
  if (!ogTitle) {
    ogTitle = document.createElement('meta');
    ogTitle.setAttribute('property', 'og:title');
    document.head.appendChild(ogTitle);
  }
  ogTitle.setAttribute('content', `Türchen ${metadata.day} - ${metadata.artist}`);
  
  // OG Description
  let ogDesc = document.querySelector('meta[property="og:description"]');
  if (!ogDesc) {
    ogDesc = document.createElement('meta');
    ogDesc.setAttribute('property', 'og:description');
    document.head.appendChild(ogDesc);
  }
  ogDesc.setAttribute('content', `${metadata.artist} - ${metadata.title}`);
  
  // OG Image
  let ogImage = document.querySelector('meta[property="og:image"]');
  if (!ogImage) {
    ogImage = document.createElement('meta');
    ogImage.setAttribute('property', 'og:image');
    document.head.appendChild(ogImage);
  }
  ogImage.setAttribute('content', `https://www.radio-indie-hose.de/${metadata.cover}`);
}

// Show Error
function showError(message) {
  loading.style.display = 'none';
  error.style.display = 'block';
  errorMessage.textContent = message || 'Dieses Türchen konnte nicht geöffnet werden.';
}

// Share Function
document.getElementById('shareBtn')?.addEventListener('click', async () => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: document.title,
        text: `Schau dir Türchen ${day} an! 🎄`,
        url: window.location.href
      });
      console.log('✅ Erfolgreich geteilt');
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.log('❌ Share error:', err);
      }
    }
  } else {
    // Fallback: Copy Link
    try {
      await navigator.clipboard.writeText(window.location.href);
      const btn = document.getElementById('shareBtn');
      const originalText = btn.textContent;
      btn.textContent = '✓ Link kopiert!';
      btn.style.background = '#10b981';
      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
      }, 2000);
    } catch (err) {
      alert('📋 Link: ' + window.location.href);
    }
  }
});

// Load on page load
window.addEventListener('DOMContentLoaded', loadTuerchen);