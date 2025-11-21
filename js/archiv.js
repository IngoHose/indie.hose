// Helper function to parse German date format (DD.MM.YYYY) to Date object
function parseGermanDate(dateString) {
  if (!dateString) return new Date(0);
  const [day, month, year] = dateString.split('.').map(Number);
  return new Date(year, month - 1, day);
}

// Function to format date to German format (DD.MM.YYYY)
function formatGermanDate(date) {
  if (!(date instanceof Date) || isNaN(date)) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

// Function to extract excerpt from markdown
function getExcerpt(mdText, maxLength = 150) {
  // Remove HTML tags and markdown syntax
  const plainText = mdText
    .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
    .replace(/[#*_`\[\]]/g, '') // Remove markdown formatting
    .replace(/\n/g, ' ') // Replace newlines with spaces
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim();

  // Return excerpt with ellipsis if needed
  return plainText.length > maxLength 
    ? plainText.substring(0, maxLength) + '...' 
    : plainText;
}

// Function to load and display article cards in the archive
async function loadArchiveCards(articles) {
  try {
    const cardsContainer = document.querySelector(".archive-cards-container");
    if (!cardsContainer) {
      console.error("Archive cards container not found");
      return;
    }

    // Clear loading indicator
    cardsContainer.innerHTML = '';

    // Add article cards (no limit on archive page)
    for (const articleEntry of articles) {
      try {
        const html = marked.parse(articleEntry.mdText);
        const wrapper = document.createElement("div");
        wrapper.innerHTML = html.trim();
        const artikel = wrapper.querySelector(".artikel");
        
        if (!artikel) continue;

        // Extract article data
        const img = artikel.querySelector("img");
        const artist = artikel.querySelector(".artist");
        const title = artikel.querySelector(".title");

        // Create card element
        const cardArticle = document.createElement("div");
        cardArticle.className = "archive-card";
        
        const preview = document.createElement("div");
        preview.className = "preview";
        
        // Add image if available
        if (img) {
          const cardImg = document.createElement("img");
          cardImg.src = img.src;
          cardImg.alt = img.alt || "Artikel Bild";
          cardImg.style.cursor = "pointer";
          // Make image clickable
          cardImg.addEventListener("click", (e) => {
            e.stopPropagation();
            window.open(`article.html?file=${encodeURIComponent(articleEntry.file)}`, "_blank");
          });
          preview.appendChild(cardImg);
        }
        
        // Add meta data
        const cardMeta = document.createElement("div");
        cardMeta.className = "card-meta";
        
        if (artist) {
          const cardArtist = document.createElement("h2");
          cardArtist.className = "card-artist";
          cardArtist.textContent = artist.textContent;
          cardMeta.appendChild(cardArtist);
        }
        
        if (title) {
          const cardTitle = document.createElement("h2");
          cardTitle.className = "card-title";
          cardTitle.textContent = title.textContent;
          cardMeta.appendChild(cardTitle);
        }
        
        preview.appendChild(cardMeta);
        cardArticle.appendChild(preview);

        // Add click event for the whole card
        cardArticle.style.cursor = "pointer";
        cardArticle.addEventListener("click", () => {
          window.open(`article.html?file=${encodeURIComponent(articleEntry.file)}`, "_blank");
        });

        cardsContainer.appendChild(cardArticle);
        
      } catch (error) {
        console.error('Error creating article card:', error);
      }
    }
    
    if (cardsContainer.children.length === 0) {
      cardsContainer.innerHTML = '<p>Keine Artikel gefunden.</p>';
    }
    
  } catch (error) {
    console.error('Error loading article cards:', error);
    const cardsContainer = document.querySelector(".archive-cards-container");
    if (cardsContainer) {
      cardsContainer.innerHTML = '<p>Fehler beim Laden der Artikel. Bitte versuchen Sie es später erneut.</p>';
    }
  }
}

// Load all articles on the Lesen page
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Load index.json to get the list of all articles
    const res = await fetch("content/index.json");
    if (!res.ok) throw new Error("Index.json konnte nicht geladen werden");

    const files = await res.json();
    let entries = [];

    // Load metadata from each file
    for (const file of files) {
      try {
        const resp = await fetch(file);
        if (!resp.ok) {
          console.warn(`Datei nicht gefunden: ${file}`);
          continue;
        }
        const mdText = await resp.text();
        const meta = await parseMeta(mdText);
        // Only include articles (not shorts)
        if ((meta.type || "").toLowerCase() === "article") {
          entries.push({ file, meta, mdText });
        }
      } catch (error) {
        console.error(`Fehler beim Laden von ${file}:`, error);
      }
    }

    // Sort articles by date (newest first)
    entries.sort((a, b) => parseGermanDate(b.meta.date) - parseGermanDate(a.meta.date));

    // Load all articles as cards
    if (entries.length > 0) {
      console.log(`Lade ${entries.length} Artikel für die Lesen-Seite`);
      await loadArchiveCards(entries);
    } else {
      console.log("Keine Artikel gefunden!");
      const cardsContainer = document.querySelector(".archive-cards-container");
      if (cardsContainer) {
        cardsContainer.innerHTML = "<p>Keine Artikel gefunden.</p>";
      }
    }

  } catch (err) {
    console.error("Fehler beim Laden der Artikel:", err);
    const cardsContainer = document.querySelector(".archive-cards-container");
    if (cardsContainer) {
      cardsContainer.innerHTML = "<p>Fehler beim Laden der Artikel. Bitte versuchen Sie es später erneut.</p>";
    }
  }
});
