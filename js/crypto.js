const TRACKED_COINS = [
  "bitcoin", "ethereum", "solana", "cardano", "ripple",
  "dogecoin", "polkadot", "avalanche-2", "litecoin", "chainlink",
  "tether-gold", "pax-gold"
];

let cryptoInterval = null;

function initCrypto(container) {
  const { section, input, results } = createSection(
    `Kripto Paralar <span class="auto-refresh"><span class="pulse"></span>Canlı</span>`,
    "Coin ara... (örn: bitcoin, altın, xrp)",
    (query, resultsEl) => searchCoins(query, resultsEl)
  );

  container.appendChild(section);

  showTrackedCoins(results);

  cryptoInterval = setInterval(() => {
    showTrackedCoins(results);
  }, 60000);

  input.addEventListener("input", (e) => {
    if (!e.target.value.trim()) {
      showTrackedCoins(results);
    }
  });
}

async function showTrackedCoins(resultsEl) {
  try {
    const ids = TRACKED_COINS.join(",");
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`
    );

    if (!res.ok) throw new Error("API hatası");

    const coins = await res.json();

    const nameMap = {
      "tether-gold": "Altın (Tether)",
      "pax-gold": "Altın (PAX)"
    };

    coins.forEach((c) => {
      if (nameMap[c.id]) c.displayName = nameMap[c.id];
    });

    resultsEl.innerHTML = buildCardsHTML(coins);
  } catch (err) {
    resultsEl.innerHTML = `<div class="error"><p>Yüklenemedi. ${err.message}</p></div>`;
  }
}

async function searchCoins(query, resultsEl) {
  showLoading(true);

  try {
    const searchRes = await fetch(
      `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`
    );

    if (!searchRes.ok) throw new Error("Arama başarısız");

    const searchData = await searchRes.json();
    const coins = searchData.coins || [];

    if (coins.length === 0) {
      resultsEl.innerHTML = `<div class="empty"><p>"${query}" için sonuç bulunamadı.</p></div>`;
      return;
    }

    const topCoins = coins.slice(0, 20);
    const ids = topCoins.map((c) => c.id).join(",");

    const marketRes = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`
    );

    const marketData = await marketRes.json();

    resultsEl.innerHTML = buildCardsHTML(marketData);
  } catch (err) {
    resultsEl.innerHTML = `<div class="error"><p>Hata: ${err.message}</p></div>`;
  } finally {
    showLoading(false);
  }
}

function buildCardsHTML(coins) {
  let html = '<div class="grid">';

  coins.forEach((coin) => {
    const name = coin.displayName || coin.name;
    const price = coin.current_price;
    const change = coin.price_change_percentage_24h;
    const changeClass = change != null && change >= 0 ? "positive" : "negative";
    const changeSymbol = change != null && change >= 0 ? "▲" : "▼";
    const changeText = change != null ? `${Math.abs(change).toFixed(2)}%` : "—";

    let formattedPrice;
    if (price == null) {
      formattedPrice = "—";
    } else if (price < 0.01) {
      formattedPrice = `$${price.toFixed(6)}`;
    } else if (price < 1) {
      formattedPrice = `$${price.toFixed(4)}`;
    } else {
      formattedPrice = `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    const formattedMarketCap = coin.market_cap
      ? `$${(coin.market_cap / 1e9).toFixed(1)}B`
      : "—";

    html += `
      <div class="card">
        <div style="display:flex;align-items:center;gap:10px">
          <img src="${coin.image || ""}" alt="${name}" style="width:32px;height:32px" onerror="this.style.display='none'">
          <div>
            <p class="card-title">${name}</p>
            <p class="card-subtitle">${(coin.symbol || "—").toUpperCase()}</p>
          </div>
        </div>
        <p class="card-value">${formattedPrice}</p>
        <p class="card-value ${changeClass}" style="font-size:1rem">
          ${change != null ? changeSymbol + " " : ""}${changeText}
        </p>
        <p class="card-subtitle">Market Cap: ${formattedMarketCap}</p>
      </div>
    `;
  });

  html += "</div>";
  return html;
}

function stopCryptoRefresh() {
  if (cryptoInterval) {
    clearInterval(cryptoInterval);
    cryptoInterval = null;
  }
}
