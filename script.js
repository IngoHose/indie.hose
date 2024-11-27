document.addEventListener('DOMContentLoaded', async function () {
    // Funktion, um den aktuellen Song zu laden
    async function fetchCurrentSong() {
        try {
            const response = await fetch('https://api.laut.fm/station/indie-hose/current_song');
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            const songTitle = data.title;
            const artist = data.artist.name;

            document.querySelectorAll('.song-title').forEach(element => {
                element.textContent = `${artist} - ${songTitle}`;
            });
        } catch (error) {
            console.error('Es gab ein Problem mit der Fetch-Operation:', error);
            document.querySelectorAll('.song-title').forEach(element => {
                element.textContent = 'Fehler beim Laden der Songdaten';
            });
        }
    }

    fetchCurrentSong();
    setInterval(fetchCurrentSong, 30000);

    // Navigation umschalten
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', function () {
            document.body.classList.toggle('nav-open');
        });
    }

    // Funktion, um Artikel aus JSON zu laden
    async function loadArticles() {
        try {
            const response = await fetch('articles.json');
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error loading articles:', error);
            return [];
        }
    }

    // Render-Funktion
    function renderArticles(filteredArticles) {
        const container = document.querySelector(".articles");
        container.innerHTML = ""; // Vorherige Artikel entfernen

        filteredArticles.forEach(article => {
            const articleDiv = document.createElement("div");
            articleDiv.className = "article";

            articleDiv.innerHTML = `
                <article>${article.content}</article> <!-- HTML-Content einfügen -->
            `;

            container.appendChild(articleDiv);
        });
    }

    // Filter-Funktion nach Anfangsbuchstabe
    function filterByArtistLetter(letter, articles) {
        const filteredArticles = articles.filter(article =>
            article.artists.some(artist => artist[0].toUpperCase() === letter)
        );
        renderArticles(filteredArticles);
    }

    // Filter-Funktion für Zahlen
    function filterByNumber(articles) {
        const filteredArticles = articles.filter(article =>
            article.artists.some(artist => /^\d/.test(artist))
        );
        renderArticles(filteredArticles);
    }

    // Filter-Buttons generieren
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const container = document.getElementById("artist-filter");

    container.innerHTML = "";

    const allButton = document.createElement("button");
    allButton.textContent = "Alle";
    allButton.onclick = () => renderArticles(articles);
    container.appendChild(allButton);

    const numberButton = document.createElement("button");
    numberButton.textContent = "#";
    numberButton.onclick = () => filterByNumber(articles);
    container.appendChild(numberButton);

    alphabet.split("").forEach(letter => {
        const button = document.createElement("button");
        button.textContent = letter;
        button.onclick = () => filterByArtistLetter(letter, articles);
        container.appendChild(button);
    });

    // Artikel laden und verarbeiten
    const articles = await loadArticles();

    // Seite erkennen (Hauptseite oder Archiv)
    const isIndexPage = document.body.classList.contains('index-page');

   if (isIndexPage) {
    // Hauptseite: Zeige nur die 3 neuesten Artikel
    const latestArticles = articles
        .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sortiere nach Datum (neueste zuerst)
        .slice(0, 3); // Nimm die 3 neuesten
    renderArticles(latestArticles);
} else {
    // Archiv: Zeige alle Artikel, sortiert nach Datum
    const sortedArticles = articles.sort((a, b) => new Date(b.date) - new Date(a.date)); // Sortiere nach Datum (neueste zuerst)
    renderArticles(sortedArticles);
}
});
