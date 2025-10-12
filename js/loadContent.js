// --------------------
// Meta auslesen
// --------------------
async function parseMeta(mdText) {
  const metaMatch = mdText.match(/^---([\s\S]*?)---/);
  let meta = {};
  if (metaMatch) {
    metaMatch[1].split("\n").forEach(line => {
      const [key, ...rest] = line.split(":");
      if (key && rest.length) {
        meta[key.trim()] = rest.join(":").trim();
      }
    });
  }
  return meta;
}

// --------------------
// Datum von DD.MM.YYYY zu Date-Objekt konvertieren
// --------------------
function parseGermanDate(dateString) {
  if (!dateString) return new Date(0); // Fallback: sehr altes Datum
  
  // Format: DD.MM.YYYY oder D.M.YYYY
  const parts = dateString.trim().split('.');
  if (parts.length !== 3) return new Date(0);
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Monat ist 0-basiert
  const year = parseInt(parts[2], 10);
  
  return new Date(year, month, day);
}

// --------------------
// Badge-HTML generieren (nur für Featured Article und Article.html)
// --------------------
function createBadges(meta) {
  const row1 = []; // Kategorie, Autor, Datum
  const row2 = []; // Artist
  
  // Reihe 1
  if (meta.kategorie) {
    row1.push(`<span class="badge">${meta.kategorie}</span>`);
  }
  
  if (meta.author) {
    row1.push(`<span class="badge">${meta.author}</span>`);
  }
  
  if (meta.date) {
    row1.push(`<span class="badge">${meta.date}</span>`);
  }
  
  // Reihe 2
  if (meta.artist) {
    row2.push(`<span class="badge">${meta.artist}</span>`);
  }
  
  // Wenn keine Badges vorhanden, return empty
  if (row1.length === 0 && row2.length === 0) return '';
  
  // HTML zusammenbauen
  let html = '<div class="meta-badges">';
  
  if (row1.length > 0) {
    html += `<div class="badge-row">${row1.join('\n')}</div>`;
  }
  
  if (row2.length > 0) {
    html += `<div class="badge-row">${row2.join('\n')}</div>`;
  }
  
  html += '</div>';
  
  return html;
}

function isReleases(file) {
  return /(^|\/)releases\.md$/i.test(file);
}

// --------------------
// Index.json laden & automatisch Artikel platzieren
// --------------------
async function loadIndex() {
  try {
    const res = await fetch("content/index.json");
    if (!res.ok) throw new Error("Index.json konnte nicht geladen werden");

    const files = await res.json();
    let entries = [];

    // Metadaten aus jeder Datei holen
    for (const file of files) {
      try {
        const resp = await fetch(file);
        if (!resp.ok) {
          console.warn(`Datei nicht gefunden: ${file}`);
          continue;
        }
        const mdText = await resp.text();
        const meta = await parseMeta(mdText);
        entries.push({ file, meta, mdText });
        console.log(`Datei geladen: ${file}`, meta);
      } catch (error) {
        console.error(`Fehler beim Laden von ${file}:`, error);
      }
    }

    // Artikel und Shorts trennen
    const articles = entries.filter(e => (e.meta.type || "").toLowerCase() === "article");
    const shorts = entries.filter(e => (e.meta.type || "").toLowerCase() !== "article");
    
    // Artikel nach Datum sortieren (neueste zuerst) - mit deutschem Datumsformat
    articles.sort((a, b) => parseGermanDate(b.meta.date) - parseGermanDate(a.meta.date));

    // Neuesten Artikel als Feature platzieren
    if (articles.length > 0) {
      console.log("Lade Feature-Artikel:", articles[0].file, "Datum:", articles[0].meta.date);
      await loadFeatureArticle(articles[0]);
    } else {
      console.log("Keine Artikel gefunden!");
    }

    // Ältere Artikel in Cards-Container platzieren (OHNE Badges)
    if (articles.length > 1) {
      console.log("Lade weitere Artikel als Cards:", articles.slice(1).map(a => a.file));
      await loadArticleCards(articles.slice(1));
    }

    // Shorts in die Shorts-Section laden
    if (shorts.length > 0) {
      await loadShortsToSection(shorts);
    }

  } catch (err) {
    console.error("Fehler beim Laden der Index-Datei:", err);
  }
}

// --------------------
// Feature-Artikel laden und anzeigen (MIT Badges)
// --------------------
async function loadFeatureArticle(articleEntry) {
  try {
    const html = marked.parse(articleEntry.mdText);
    const wrapper = document.createElement("div");
    wrapper.innerHTML = html.trim();
    const artikel = wrapper.querySelector(".artikel");
    
    if (!artikel) return;

    // Feature-Section finden
    const featureSection = document.querySelector(".article-feature-section");
    const featureMeta = featureSection?.querySelector(".article-feature-meta");
    const featureContent = featureSection?.querySelector(".article-feature");
    
    console.log("Feature-Section gefunden:", !!featureSection);
    console.log("Feature-Meta gefunden:", !!featureMeta);
    console.log("Feature-Content gefunden:", !!featureContent);
    
    if (!featureSection || !featureMeta || !featureContent) {
      console.error("Feature-Section Elemente nicht gefunden");
      return;
    }

    // Badges generieren und am Anfang von featureContent einfügen
    const badgesHtml = createBadges(articleEntry.meta);
    if (badgesHtml) {
      // Entferne alte Badges falls vorhanden
      const oldBadges = featureContent.querySelector(".meta-badges");
      if (oldBadges) oldBadges.remove();
      
      // Füge neue Badges am Anfang ein
      featureContent.insertAdjacentHTML('afterbegin', badgesHtml);
    }

    // Bild aus dem Artikel extrahieren
    const img = artikel.querySelector("img");
    const artist = artikel.querySelector(".artist");
    const title = artikel.querySelector(".title");
    const headline = artikel.querySelector(".headline");
    const introText = artikel.querySelector("p");

    // Feature-Meta aktualisieren (bestehende Elemente überschreiben)
    if (img) {
      let featureImg = featureMeta.querySelector("img");
      if (featureImg) {
        featureImg.src = img.src;
        featureImg.alt = img.alt || "Artikel Bild";
      }
    }

    if (artist) {
      let featureArtist = featureMeta.querySelector(".artist");
      if (featureArtist) {
        featureArtist.textContent = artist.textContent;
      }
    }

    if (title) {
      let featureTitle = featureMeta.querySelector(".title");
      if (featureTitle) {
        featureTitle.textContent = title.textContent;
      }
    }

    // Headline und Intro-Text aktualisieren (bestehende Elemente überschreiben)
    if (headline) {
      let featureHeadline = featureContent.querySelector(".headline");
      if (featureHeadline) {
        featureHeadline.textContent = headline.textContent;
      }
    }

    if (introText) {
      let featureIntroText = featureContent.querySelector(".intro-text");
      if (featureIntroText) {
        featureIntroText.innerHTML = introText.innerHTML;
      }
    }

    // "Weiterlesen" Button hinzufügen
    // Erst alten Button entfernen falls vorhanden
    const oldButton = featureContent.querySelector(".weiterlesen-button");
    if (oldButton) oldButton.remove();
    
    // Neuen Button erstellen
    const weiterlesenButton = document.createElement("a");
    weiterlesenButton.href = `article.html?file=${encodeURIComponent(articleEntry.file)}`;
    weiterlesenButton.className = "weiterlesen-button";
    weiterlesenButton.textContent = "Weiterlesen →";
    weiterlesenButton.target = "_blank";
    featureContent.appendChild(weiterlesenButton);

    // Klick-Event für Feature-Artikel (auf das ganze Feature-Element, außer Button)
    featureContent.style.cursor = "pointer";
    featureContent.addEventListener("click", (e) => {
      // Nicht öffnen wenn auf Button geklickt wurde
      if (e.target.classList.contains("weiterlesen-button")) return;
      window.open(`article.html?file=${encodeURIComponent(articleEntry.file)}`, "_blank");
    });

  } catch (err) {
    console.error(`Fehler beim Laden des Feature-Artikels:`, err);
  }
}

// --------------------
// Artikel-Cards laden (OHNE Badges)
// --------------------
async function loadArticleCards(articles) {
  try {
    const cardsContainer = document.querySelector(".cards-container");
    if (!cardsContainer) {
      console.error("Cards-Container nicht gefunden");
      return;
    }

    // Bestehende dynamische Cards löschen (statische bleiben)
    const existingCards = cardsContainer.querySelectorAll(".card-article.dynamic");
    existingCards.forEach(card => card.remove());

    // Neue Artikel-Cards hinzufügen
    for (const articleEntry of articles.slice(0, 8)) { // Maximal 8 zusätzliche Cards
      const html = marked.parse(articleEntry.mdText);
      const wrapper = document.createElement("div");
      wrapper.innerHTML = html.trim();
      const artikel = wrapper.querySelector(".artikel");
      
      if (!artikel) continue;

      // Daten aus dem Artikel extrahieren
      const img = artikel.querySelector("img");
      const artist = artikel.querySelector(".artist");
      const title = artikel.querySelector(".title");

      // Card erstellen
      const cardArticle = document.createElement("div");
      cardArticle.className = "card-article dynamic";
      
      const preview = document.createElement("div");
      preview.className = "preview";
      
      // Bild hinzufügen
      if (img) {
        const cardImg = document.createElement("img");
        cardImg.src = img.src;
        cardImg.alt = img.alt || "Artikel Bild";
        cardImg.style.cursor = "pointer";
        cardImg.addEventListener("click", () => {
          window.open(`article.html?file=${encodeURIComponent(articleEntry.file)}`, "_blank");
        });
        preview.appendChild(cardImg);
      }
      
      // Meta-Daten hinzufügen
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
      
      // KEINE Badges bei Cards!
      
      cardArticle.appendChild(preview);

      // Klick-Event für Card
      cardArticle.style.cursor = "pointer";
      cardArticle.addEventListener("click", () => {
        window.open(`article.html?file=${encodeURIComponent(articleEntry.file)}`, "_blank");
      });

      cardsContainer.appendChild(cardArticle);
    }

  } catch (err) {
    console.error("Fehler beim Laden der Artikel-Cards:", err);
  }
}

// --------------------
// Shorts in die Shorts-Section laden (OHNE Badges)
// releases.md immer an erster Stelle
// --------------------
async function loadShortsToSection(shortsEntries) {
  try {
    const shortsSection = document.querySelector(".shorts-section");
    if (!shortsSection) {
      console.error("Shorts-Section nicht gefunden");
      return;
    }

    // releases.md finden und separieren
    const releasesIndex = shortsEntries.findIndex(e => isReleases(e.file));
    let releasesEntry = null;
    let otherShorts = shortsEntries;
    
    if (releasesIndex !== -1) {
      releasesEntry = shortsEntries[releasesIndex];
      otherShorts = shortsEntries.filter((e, i) => i !== releasesIndex);
    }

    // Andere Shorts nach Datum sortieren (neueste zuerst)
    otherShorts.sort((a, b) => parseGermanDate(b.meta.date) - parseGermanDate(a.meta.date));

    // releases.md als erstes laden
    if (releasesEntry) {
      await loadSingleShort(releasesEntry, shortsSection);
    }

    // Dann die anderen Shorts laden
    for (const shortEntry of otherShorts) {
      await loadSingleShort(shortEntry, shortsSection);
    }

  } catch (err) {
    console.error("Fehler beim Laden der Shorts:", err);
  }
}

// Hilfsfunktion zum Laden eines einzelnen Shorts
async function loadSingleShort(shortEntry, shortsSection) {
  const html = marked.parse(shortEntry.mdText);
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html.trim();
  
  // Prüfen ob bereits ein .short Container vorhanden ist
  let shortEl = wrapper.querySelector(".short");
  
  if (!shortEl) {
    // Wenn kein .short Container da ist, einen erstellen
    const contentOnly = shortEntry.mdText.replace(/^---[\s\S]*?---/, "").trim();
    const contentHtml = marked.parse(contentOnly).trim();
    
    shortEl = document.createElement("div");
    shortEl.className = "short dynamic";
    shortEl.innerHTML = contentHtml;
  } else {
    shortEl.classList.add("dynamic");
  }
  
  // KEINE Badges bei Shorts!

  shortsSection.appendChild(shortEl);
}

// --------------------
// Artikel laden (für article.html - MIT Badges)
// --------------------
async function loadArticle(mdPath, container, isPreview = false) {
  try {
    const response = await fetch(mdPath);
    if (!response.ok) return;

    const mdText = await response.text();
    const meta = await parseMeta(mdText);
    const html = marked.parse(mdText);

    const wrapper = document.createElement("div");
    wrapper.innerHTML = html.trim();
    const artikel = wrapper.querySelector(".artikel");
    if (!artikel) return;

    if (isPreview) {
      const previewDiv = artikel.cloneNode(true);

      // Headline entfernen, falls vorhanden
      const headline = previewDiv.querySelector(".headline");
      if (headline) {
        headline.remove();
      }

      const author = previewDiv.querySelector(".author");
      if (author) {
        author.remove();
      }

      // Alles NACH dem ersten <p> entfernen (Preview bleibt Kopfteil)
      const firstP = previewDiv.querySelector("p");
      if (firstP) {
        let node = firstP;
        while (node) {
          const next = node.nextSibling;
          node.remove();
          node = next;
        }
      }

      previewDiv.classList.add("artikel-preview");
      previewDiv.style.cursor = "pointer";
      previewDiv.addEventListener("click", () => {
        window.open(`article.html?file=${encodeURIComponent(mdPath)}`, "_blank");
      });

      container.appendChild(previewDiv);
    } else {
      // Badges am Anfang des Artikels einfügen (nur bei Volltext)
      const badgesHtml = createBadges(meta);
      if (badgesHtml) {
        artikel.insertAdjacentHTML('afterbegin', badgesHtml);
      }
      
      // Volltext
      container.appendChild(artikel);
    }
  } catch (err) {
    console.error(`Fehler beim Laden von Artikel: ${mdPath}`, err);
  }
}

async function loadShorts(mdPath, container) {
  try {
    const response = await fetch(mdPath);
    if (!response.ok) return;

    const mdText = await response.text();
    const contentOnly = mdText.replace(/^---[\s\S]*?---/, "").trim();
    const html = marked.parse(contentOnly).trim();

    // HTML parsen und existierende .shorts übernehmen, sonst wrappen
    const temp = document.createElement("div");
    temp.innerHTML = html;

    let shortEl = temp.querySelector(".shorts");
    if (!shortEl) {
      shortEl = document.createElement("div");
      shortEl.className = "shorts";
      shortEl.innerHTML = html;
    }

    // KEINE Badges bei Shorts!

    container.appendChild(shortEl);
  } catch (err) {
    console.error(`Fehler beim Laden von Shorts: ${mdPath}`, err);
  }
}

// --------------------
// Init - automatisches Laden auf Index-Seite
// --------------------
document.addEventListener("DOMContentLoaded", () => {
  // Prüfen ob wir auf der Index-Seite sind
  if (document.querySelector(".article-feature-section") && document.querySelector(".cards-container")) {
    // Erst bestehende dynamische Inhalte löschen
    const existingDynamicCards = document.querySelectorAll(".card-article.dynamic");
    existingDynamicCards.forEach(card => card.remove());
    
    const existingDynamicShorts = document.querySelectorAll(".short.dynamic");
    existingDynamicShorts.forEach(short => short.remove());
    
    // Dann neue Inhalte laden
    loadIndex();
  }
});