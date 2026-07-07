function initTV(container) {
  const { section, input, results } = createSection(
    "Diziler",
    "Dizi ara... (örn: The Boys)",
    (query, resultsEl) => searchTV(query, resultsEl)
  );

  container.appendChild(section);

  results.innerHTML = `
    <div class="empty">
      <p>📺 Bir dizi adı yazıp arayın.</p>
      <p style="font-size:0.85rem;margin-top:8px">Son bölüm, sıradaki bölüm ve yayın platformu bilgileriyle.</p>
    </div>
  `;
}

async function searchTV(query, resultsEl) {
  showLoading(true);

  try {
    const res = await fetch(
      `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`
    );

    if (!res.ok) throw new Error("Arama başarısız");

    const data = await res.json();

    if (data.length === 0) {
      resultsEl.innerHTML = `<div class="empty"><p>"${query}" için dizi bulunamadı.</p></div>`;
      return;
    }

    const shows = data.slice(0, 15);

    const episodePromises = shows.map((item) =>
      fetch(`https://api.tvmaze.com/shows/${item.show.id}?embed[]=nextepisode&embed[]=previousepisode`)
        .then((r) => r.json())
    );

    const episodeData = await Promise.all(episodePromises);
    renderTVShows(shows, episodeData, resultsEl);
  } catch (err) {
    resultsEl.innerHTML = `<div class="error"><p>Hata: ${err.message}</p></div>`;
  } finally {
    showLoading(false);
  }
}

function renderTVShows(shows, episodeData, resultsEl) {
  let html = "";

  shows.forEach((item, i) => {
    const show = item.show;
    const detail = episodeData[i];
    const poster = show.image?.medium || show.image?.original || "";
    const title = show.name || "Bilinmeyen";
    const premiered = show.premiered ? show.premiered.split("-")[0] : "—";
    const rating = show.rating?.average ? show.rating.average.toFixed(1) : "—";
    const summary = show.summary ? show.summary.replace(/<[^>]*>/g, "") : "Açıklama bulunamadı.";
    const status = show.status || "—";

    let seasonsInfo = "";
    if (detail._embedded?.previousepisode?.season) {
      seasonsInfo = `${detail._embedded.previousepisode.season} Sezon`;
    }

    let platformsHTML = "";
    if (show.network) {
      platformsHTML += `
        <span class="platform-badge">
          📡 ${show.network.name}
          ${show.network.country?.code ? `(${show.network.country.code})` : ""}
        </span>
      `;
    }
    if (show.webChannel) {
      platformsHTML += `
        <span class="platform-badge">
          🌐 ${show.webChannel.name}
        </span>
      `;
    }

    let episodeHTML = "";

    if (detail._embedded?.previousepisode) {
      const pe = detail._embedded.previousepisode;
      episodeHTML += `
        <div class="episode-info last-episode">
          <p class="label">Son Yayınlanan Bölüm</p>
          <p class="detail">S${pe.season} B${pe.number} — "${pe.name || "—"}"</p>
          <p class="card-subtitle">📅 ${pe.airdate || "—"}</p>
        </div>
      `;
    }

    if (detail._embedded?.nextepisode) {
      const ne = detail._embedded.nextepisode;
      episodeHTML += `
        <div class="episode-info next-episode">
          <p class="label">Sıradaki Bölüm</p>
          <p class="detail">S${ne.season} B${ne.number} — "${ne.name || "—"}"</p>
          <p class="card-subtitle">📅 ${ne.airdate || "—"}</p>
        </div>
      `;
    } else if (status === "Ended") {
      episodeHTML += `
        <div class="episode-info" style="border-left:3px solid var(--text-muted)">
          <p class="label">Durum</p>
          <p class="detail" style="color:var(--text-muted)">Dizi sona erdi</p>
        </div>
      `;
    } else if (detail._embedded?.previousepisode) {
      episodeHTML += `
        <div class="episode-info next-episode">
          <p class="label">Sıradaki Bölüm</p>
          <p class="detail" style="color:var(--text-muted)">Henüz açıklanmadı</p>
        </div>
      `;
    }

    html += `
      <div class="media-card">
        ${poster ? `<img class="media-poster" src="${poster}" alt="${title}" loading="lazy">` : ""}
        <div class="media-info">
          <p class="media-title">${title}</p>
          <div class="media-meta">
            <span>📅 ${premiered}</span>
            <span class="rating">⭐ ${rating}</span>
            ${seasonsInfo ? `<span>📺 ${seasonsInfo}</span>` : ""}
            <span style="color:${status === 'Running' ? 'var(--green)' : status === 'Ended' ? 'var(--text-muted)' : 'var(--text-muted)'}">${status === 'Running' ? '🟢 Devam ediyor' : status === 'Ended' ? '⏹ Sona erdi' : status}</span>
          </div>
          ${platformsHTML ? `<div class="platforms">${platformsHTML}</div>` : ""}
          <p class="overview">${summary}</p>
          ${episodeHTML}
        </div>
      </div>
    `;
  });

  resultsEl.innerHTML = html;
}
