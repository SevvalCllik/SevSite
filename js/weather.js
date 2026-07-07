const PRESET_LOCATIONS = [
  { name: "Çağlayan", lat: 41.073, lon: 28.978 },
  { name: "Sarıyer", lat: 41.167, lon: 29.057 },
  { name: "İTÜ Ayazağa", lat: 41.105, lon: 29.024 }
];

function initWeather(container) {
  const API_KEY = CONFIG.WEATHER_API_KEY;

  const section = document.createElement("div");
  section.innerHTML = `
    <div class="section-header">
      <h2>Hava Durumu</h2>
      <div class="search-box">
        <input type="text" class="search-input" placeholder="Şehir ara... (örn: Ankara)">
        <button class="search-btn">Ara</button>
      </div>
    </div>
    <div class="preset-weather"></div>
    <div class="search-weather"></div>
  `;

  const input = section.querySelector(".search-input");
  const button = section.querySelector(".search-btn");
  const presetContainer = section.querySelector(".preset-weather");
  const searchContainer = section.querySelector(".search-weather");

  button.addEventListener("click", () => {
    const query = input.value.trim();
    if (query) fetchWeather(query, searchContainer);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const query = input.value.trim();
      if (query) fetchWeather(query, searchContainer);
    }
  });

  container.appendChild(section);

  if (API_KEY === "BURAYA_OPENWEATHERMAP_API_KEY_YAZ" || !API_KEY) {
    presetContainer.innerHTML = `<div class="error"><p>API key tanımlanmamış.</p></div>`;
    return;
  }

  loadPresetLocations(presetContainer);
}

async function loadPresetLocations(container) {
  const API_KEY = CONFIG.WEATHER_API_KEY;
  showLoading(true);

  try {
    const promises = PRESET_LOCATIONS.map((loc) =>
      fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${loc.lat}&lon=${loc.lon}&appid=${API_KEY}&units=metric&lang=tr`
      ).then((r) => r.json())
    );

    const results = await Promise.all(promises);
    renderPresetWeather(PRESET_LOCATIONS, results, container);
  } catch (err) {
    container.innerHTML = `<div class="error"><p>Hata: ${err.message}</p></div>`;
  } finally {
    showLoading(false);
  }
}

function getWeatherEmoji(weatherId, iconCode) {
  const isNight = iconCode?.endsWith("n");

  if (weatherId >= 200 && weatherId < 300) return "⛈️";
  if (weatherId >= 300 && weatherId < 400) return "🌦️";
  if (weatherId >= 500 && weatherId < 600) return "🌧️";
  if (weatherId >= 600 && weatherId < 700) return "🌨️";
  if (weatherId >= 700 && weatherId < 800) return "🌫️";
  if (weatherId === 800) return isNight ? "🌙" : "☀️";
  if (weatherId === 801) return isNight ? "🌙" : "🌤️";
  if (weatherId === 802) return "⛅";
  if (weatherId >= 803) return "☁️";
  return "🌡️";
}

function getWeatherBg(weatherId) {
  if (weatherId === 800) return "linear-gradient(135deg, #f59e0b22, #fbbf2422)";
  if (weatherId >= 200 && weatherId < 300) return "linear-gradient(135deg, #6366f122, #818cf822)";
  if (weatherId >= 300 && weatherId < 600) return "linear-gradient(135deg, #3b82f622, #60a5fa22)";
  if (weatherId >= 600 && weatherId < 700) return "linear-gradient(135deg, #e0e7ff22, #c7d2fe22)";
  if (weatherId >= 700 && weatherId < 800) return "linear-gradient(135deg, #94a3b822, #cbd5e122)";
  return "linear-gradient(135deg, #64748b22, #94a3b822)";
}

function renderPresetWeather(locations, data, container) {
  let html = '<div class="weather-preset-grid">';

  locations.forEach((loc, i) => {
    const w = data[i];
    const weatherId = w.weather?.[0]?.id || 800;
    const iconCode = w.weather?.[0]?.icon || "01d";
    const emoji = getWeatherEmoji(weatherId, iconCode);
    const bg = getWeatherBg(weatherId);
    const desc = w.weather?.[0]?.description || "—";

    html += `
      <div class="weather-preset-card" style="background:${bg}">
        <p class="weather-preset-location">${loc.name}</p>
        <div class="weather-preset-visual">${emoji}</div>
        <p class="weather-preset-temp">${Math.round(w.main?.temp || 0)}°C</p>
        <p class="weather-preset-desc">${desc}</p>
        <div class="weather-preset-details">
          <span>🌡️ ${Math.round(w.main?.feels_like || 0)}°</span>
          <span>💧 %${w.main?.humidity || "—"}</span>
          <span>💨 ${w.wind?.speed || "—"} m/s</span>
        </div>
      </div>
    `;
  });

  html += "</div>";
  container.innerHTML = html;
}

async function fetchWeather(city, resultsEl) {
  const API_KEY = CONFIG.WEATHER_API_KEY;
  showLoading(true);

  try {
    const [currentRes, forecastRes] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=tr`),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=tr`)
    ]);

    if (!currentRes.ok) {
      const err = await currentRes.json();
      throw new Error(err.message || "Şehir bulunamadı");
    }

    const current = await currentRes.json();
    const forecast = await forecastRes.json();
    renderCityWeather(current, forecast, resultsEl);
  } catch (err) {
    resultsEl.innerHTML = `<div class="error"><p>Hata: ${err.message}</p></div>`;
  } finally {
    showLoading(false);
  }
}

function renderCityWeather(current, forecast, resultsEl) {
  const icon = current.weather[0].icon;
  const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

  let html = `
    <div class="current-weather">
      <p class="city">${current.name}, ${current.sys.country}</p>
      <img class="weather-icon" src="${iconUrl}" alt="${current.weather[0].description}">
      <p class="temp">${Math.round(current.main.temp)}°C</p>
      <p class="desc">${current.weather[0].description}</p>
      <div class="weather-details">
        <div class="weather-detail-item">
          <div class="value">${Math.round(current.main.feels_like)}°C</div>
          <div class="label">Hissedilen</div>
        </div>
        <div class="weather-detail-item">
          <div class="value">%${current.main.humidity}</div>
          <div class="label">Nem</div>
        </div>
        <div class="weather-detail-item">
          <div class="value">${current.wind.speed} m/s</div>
          <div class="label">Rüzgar</div>
        </div>
        <div class="weather-detail-item">
          <div class="value">${current.main.pressure} hPa</div>
          <div class="label">Basınç</div>
        </div>
      </div>
    </div>
    <h3 style="margin:16px 0 8px">5 Günlük Tahmin</h3>
    <div class="grid">
  `;

  const dailyForecasts = {};
  forecast.list.forEach((item) => {
    const date = item.dt_txt.split(" ")[0];
    if (!dailyForecasts[date]) {
      dailyForecasts[date] = { temps: [], icons: [] };
    }
    dailyForecasts[date].temps.push(item.main.temp);
    dailyForecasts[date].icons.push(item.weather[0].icon);
  });

  const days = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

  Object.entries(dailyForecasts).slice(0, 5).forEach(([date, data]) => {
    const min = Math.round(Math.min(...data.temps));
    const max = Math.round(Math.max(...data.temps));
    const mostCommonIcon = data.icons.sort((a, b) =>
      data.icons.filter((v) => v === a).length - data.icons.filter((v) => v === b).length
    ).pop();
    const d = new Date(date);
    const dayName = days[d.getDay()];

    html += `
      <div class="card" style="text-align:center">
        <p class="card-subtitle">${dayName}</p>
        <p style="font-size:0.8rem;color:var(--text-muted)">${date.split("-").reverse().join("/")}</p>
        <img src="https://openweathermap.org/img/wn/${mostCommonIcon}@2x.png" alt="" style="width:50px;height:50px;margin:0 auto">
        <p class="card-value" style="color:var(--text)">${max}° <span style="color:var(--text-muted);font-size:0.9rem">${min}°</span></p>
      </div>
    `;
  });

  html += "</div>";
  resultsEl.innerHTML = html;
}
