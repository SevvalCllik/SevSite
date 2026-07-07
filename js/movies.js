function initMovies(container) {
  const API_KEY = CONFIG.OMDB_API_KEY;
  const { section, input, results } = createSection(
    "Filmler",
    "Film ara... (örn: Inception)",
    (query, resultsEl) => searchMovies(query, resultsEl)
  );

  container.appendChild(section);

  results.innerHTML = `
    <div class="empty">
      <p>🎬 Bir film adı yazıp arayın.</p>
      <p style="font-size:0.85rem;margin-top:8px">IMDb, Rotten Tomatoes ve Metacritic puanlarıyla birlikte.</p>
    </div>
  `;
}

function renderStars(imdbRating) {
  if (!imdbRating) return "";

  const score5 = imdbRating / 2;
  let html = '<div class="stars">';

  for (let i = 1; i <= 5; i++) {
    if (score5 >= i) {
      html += '<span class="star filled">★</span>';
    } else if (score5 >= i - 0.5) {
      html += '<span class="star half">★</span>';
    } else {
      html += '<span class="star">★</span>';
    }
  }

  html += "</div>";
  return html;
}

async function searchMovies(query, resultsEl) {
  const API_KEY = CONFIG.OMDB_API_KEY;

  if (API_KEY === "BURAYA_OMDB_API_KEY_YAZ" || !API_KEY) {
    resultsEl.innerHTML = `
      <div class="error">
        <p>OMDb API key tanımlanmamış.</p>
        <p style="font-size:0.85rem">
          <a href="http://www.omdbapi.com/apikey.aspx" target="_blank" style="color:#f0c040">
            OMDb
          </a>'ye git, email'ini yaz, "Free" seç. Gelen key'i <code>js/config.js</code> dosyasına yaz.
        </p>
      </div>`;
    return;
  }

  showLoading(true);

  try {
    const searchRes = await fetch(
      `https://www.omdbapi.com/?apikey=${API_KEY}&s=${encodeURIComponent(query)}&type=movie`
    );

    const searchData = await searchRes.json();

    if (searchData.Response === "False") {
      resultsEl.innerHTML = `<div class="empty"><p>"${query}" için film bulunamadı.</p></div>`;
      return;
    }

    const movies = searchData.Search.slice(0, 15);

    const detailPromises = movies.map((m) =>
      fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&i=${m.imdbID}&plot=full`)
        .then((r) => r.json())
    );

    const details = await Promise.all(detailPromises);
    renderMovies(movies, details, resultsEl);
  } catch (err) {
    resultsEl.innerHTML = `<div class="error"><p>Hata: ${err.message}</p></div>`;
  } finally {
    showLoading(false);
  }
}

function getIMDbRating(detail) {
  if (!detail?.Ratings) return null;
  const imdb = detail.Ratings.find(
    (r) => r.Source === "Internet Movie Database"
  );
  if (!imdb) return null;

  const match = imdb.Value.match(/^([\d.]+)\/10/);
  return match ? parseFloat(match[1]) : null;
}

function getOtherRatings(detail) {
  if (!detail?.Ratings) return [];
  return detail.Ratings.filter(
    (r) => r.Source !== "Internet Movie Database"
  );
}

function renderMovies(movies, details, resultsEl) {
  let html = "";

  movies.forEach((movie, i) => {
    const detail = details[i];
    const poster = movie.Poster && movie.Poster !== "N/A"
      ? movie.Poster
      : "";
    const title = movie.Title || "Bilinmeyen";
    const year = movie.Year || "—";

    const imdbRating = getIMDbRating(detail);
    const otherRatings = getOtherRatings(detail);

    const plot = detail.Plot || "";
    const director = detail.Director || "";
    const genre = detail.Genre || "";
    const runtime = detail.Runtime || "";

    let metaParts = [];
    if (year !== "—") metaParts.push(`📅 ${year}`);
    if (runtime && runtime !== "N/A") metaParts.push(`⏱ ${runtime}`);

    let otherHTML = "";
    if (otherRatings.length > 0) {
      const sources = { "Rotten Tomatoes": "🍅", "Metacritic": "🎯" };
      otherHTML = otherRatings.map((r) => {
        const icon = sources[r.Source] || "⭐";
        return `<span style="display:inline-flex;align-items:center;gap:3px;font-size:0.75rem;padding:2px 8px;background:var(--bg);border-radius:12px;border:1px solid var(--border)">${icon} ${r.Value}</span>`;
      }).join(" ");
    }

    html += `
      <div class="media-card">
        ${poster ? `<img class="media-poster" src="${poster}" alt="${title}" loading="lazy">` : ""}
        <div class="media-info">
          <p class="media-title">${title}</p>
          <div class="media-meta">
            ${metaParts.map((p) => `<span>${p}</span>`).join("")}
            ${genre && genre !== "N/A" ? `<span>${genre}</span>` : ""}
          </div>
          ${imdbRating ? `
            <div class="star-rating">
              ${renderStars(imdbRating)}
              <span class="rating-number">${imdbRating.toFixed(1)}</span>
              <span class="rating-count">/10</span>
            </div>
          ` : ""}
          ${otherHTML ? `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px">${otherHTML}</div>` : ""}
          ${plot ? `<p class="overview">${plot}</p>` : ""}
          ${director && director !== "N/A" ? `<p class="card-subtitle">🎬 ${director}</p>` : ""}
        </div>
      </div>
    `;
  });

  resultsEl.innerHTML = html;
}
