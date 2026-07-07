let currentTab = "weather";

function showLoading(show) {
  document.getElementById("loading").classList.toggle("hidden", !show);
}

function getContent() {
  return document.getElementById("content");
}

function createSection(title, searchPlaceholder, searchCallback) {
  const section = document.createElement("div");

  section.innerHTML = `
    <div class="section-header">
      <h2>${title}</h2>
      <div class="search-box">
        <input type="text" class="search-input" placeholder="${searchPlaceholder}">
        <button class="search-btn">Ara</button>
      </div>
    </div>
    <div class="results-container"></div>
  `;

  const input = section.querySelector(".search-input");
  const button = section.querySelector(".search-btn");
  const results = section.querySelector(".results-container");

  button.addEventListener("click", () => {
    const query = input.value.trim();
    if (query) searchCallback(query, results);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const query = input.value.trim();
      if (query) searchCallback(query, results);
    }
  });

  return { section, input, results };
}

function initTabs() {
  const tabs = document.querySelectorAll(".tab");
  const sectionMap = {};

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      currentTab = tab.dataset.tab;
      loadTab(currentTab);
    });
  });
}

function loadTab(tabId) {
  const content = getContent();
  content.innerHTML = "";

  switch (tabId) {
    case "weather":
      initWeather(content);
      break;
    case "crypto":
      initCrypto(content);
      break;
    case "movies":
      initMovies(content);
      break;
    case "tv":
      initTV(content);
      break;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  loadTab("weather");
});
