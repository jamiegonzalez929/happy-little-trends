import { filterEpisodes, toLabel } from "./rossCore.js";

const app = document.querySelector("#app");

const state = {
  data: null,
  filters: {
    seasonStart: 1,
    seasonEnd: 31,
    query: "",
    elements: []
  },
  compare: {
    left: "TREE",
    right: "MOUNTAIN"
  }
};

bootstrap().catch((error) => {
  console.error(error);
  app.innerHTML = `
    <section class="panel">
      <h1>Happy Little Trends</h1>
      <p>Failed to load the bundled dataset.</p>
      <pre>${error.message}</pre>
    </section>
  `;
});

async function bootstrap() {
  const response = await fetch("./data/bob-ross.json");
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} while loading data/bob-ross.json`);
  }

  state.data = await response.json();
  state.filters.seasonEnd = state.data.summary.totalSeasons;
  render();
}

function render() {
  const { data, filters, compare } = state;
  const filteredEpisodes = filterEpisodes(data.episodes, filters);
  const filteredSummary = summarizeFilteredEpisodes(filteredEpisodes);
  const availableElements = data.elementStats.slice(0, 14);
  const seasonRange = Array.from(
    { length: data.summary.totalSeasons },
    (_, index) => index + 1
  );

  app.innerHTML = `
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">Bob Ross Data Viz</p>
        <h1>Happy Little Trends</h1>
        <p class="lede">
          A compact explorer for all 403 <em>Joy of Painting</em> episodes, built from FiveThirtyEight’s
          element-by-episode dataset.
        </p>
      </div>
      <div class="hero-metrics">
        ${renderMetric("Episodes", data.summary.totalEpisodes)}
        ${renderMetric("Tracked elements", data.summary.trackedElements)}
        ${renderMetric("Most common motif", `${data.summary.mostCommonElement.label} (${percent(data.summary.mostCommonElement.share)})`)}
      </div>
    </section>

    <section class="panel filters-panel">
      <div>
        <p class="section-kicker">Filter episodes</p>
        <h2>Trim the series down to the patterns you care about</h2>
      </div>
      <div class="filters-grid">
        <label>
          <span>Season start</span>
          <select data-action="season-start">
            ${seasonRange
              .map(
                (season) =>
                  `<option value="${season}" ${season === filters.seasonStart ? "selected" : ""}>Season ${season}</option>`
              )
              .join("")}
          </select>
        </label>
        <label>
          <span>Season end</span>
          <select data-action="season-end">
            ${seasonRange
              .map(
                (season) =>
                  `<option value="${season}" ${season === filters.seasonEnd ? "selected" : ""}>Season ${season}</option>`
              )
              .join("")}
          </select>
        </label>
        <label class="search-field">
          <span>Search title or code</span>
          <input data-action="query" type="search" value="${escapeHtml(filters.query)}" placeholder="winter, lake, S12E03">
        </label>
      </div>
      <div class="chip-group">
        ${availableElements
          .map(
            (element) => `
              <label class="chip ${filters.elements.includes(element.key) ? "chip-active" : ""}">
                <input
                  type="checkbox"
                  data-action="toggle-element"
                  value="${element.key}"
                  ${filters.elements.includes(element.key) ? "checked" : ""}
                >
                <span>${element.label}</span>
              </label>
            `
          )
          .join("")}
      </div>
      <div class="filter-summary">
        <strong>${filteredEpisodes.length}</strong> episodes match.
        Average elements per match: <strong>${filteredSummary.averageElements}</strong>.
      </div>
    </section>

    <section class="stats-grid">
      <article class="panel stat-card">
        <p class="section-kicker">Snapshot</p>
        <h2>Filtered view</h2>
        <div class="stat-lines">
          <p><strong>${filteredEpisodes.length}</strong> matching episodes</p>
          <p><strong>${filteredSummary.averageElements}</strong> average elements</p>
          <p><strong>${filteredSummary.topElement.label}</strong> is the dominant motif</p>
        </div>
      </article>
      <article class="panel stat-card">
        <p class="section-kicker">Series peak</p>
        <h2>Most intricate season</h2>
        <div class="stat-lines">
          <p>Season <strong>${data.summary.richestSeason.season}</strong></p>
          <p><strong>${data.summary.richestSeason.averageElements}</strong> average elements per episode</p>
          <p>Compared with a series-wide average of <strong>${data.summary.averageElementsPerEpisode}</strong></p>
        </div>
      </article>
      <article class="panel stat-card">
        <p class="section-kicker">Source</p>
        <h2>Dataset provenance</h2>
        <div class="stat-lines">
          <p>Binary tags for <strong>67</strong> visual elements</p>
          <p>Originally assembled for FiveThirtyEight’s Bob Ross analysis</p>
          <p><a href="${data.source.url}">Open source dataset</a></p>
        </div>
      </article>
    </section>

    <section class="panel">
      <div class="section-heading">
        <div>
          <p class="section-kicker">Season profile</p>
          <h2>How dense the paintings were over time</h2>
        </div>
      </div>
      ${renderSeasonBars(filteredEpisodes, data.summary.totalSeasons)}
    </section>

    <section class="panel">
      <div class="section-heading">
        <div>
          <p class="section-kicker">Element heatmap</p>
          <h2>Where common motifs cluster across the series</h2>
        </div>
      </div>
      ${renderHeatmap(data, filteredEpisodes)}
    </section>

    <section class="panel compare-panel">
      <div class="section-heading">
        <div>
          <p class="section-kicker">Element comparison</p>
          <h2>Check how two motifs travel together</h2>
        </div>
        <div class="compare-controls">
          <label>
            <span>Left</span>
            <select data-action="compare-left">
              ${data.elementStats
                .slice(0, 20)
                .map(
                  (element) =>
                    `<option value="${element.key}" ${element.key === compare.left ? "selected" : ""}>${element.label}</option>`
                )
                .join("")}
            </select>
          </label>
          <label>
            <span>Right</span>
            <select data-action="compare-right">
              ${data.elementStats
                .slice(0, 20)
                .map(
                  (element) =>
                    `<option value="${element.key}" ${element.key === compare.right ? "selected" : ""}>${element.label}</option>`
                )
                .join("")}
            </select>
          </label>
        </div>
      </div>
      ${renderComparison(filteredEpisodes, compare.left, compare.right)}
    </section>

    <section class="panel">
      <div class="section-heading">
        <div>
          <p class="section-kicker">Episode index</p>
          <h2>Matching episodes</h2>
        </div>
      </div>
      ${renderEpisodeTable(filteredEpisodes)}
    </section>
  `;

  bindEvents();
}

function bindEvents() {
  app.querySelectorAll("[data-action]").forEach((element) => {
    element.addEventListener("change", handleAction);
    if (element.matches('input[type="search"]')) {
      element.addEventListener("input", handleAction);
    }
  });
}

function handleAction(event) {
  const action = event.currentTarget.dataset.action;

  if (action === "season-start") {
    state.filters.seasonStart = Number(event.currentTarget.value);
    if (state.filters.seasonStart > state.filters.seasonEnd) {
      state.filters.seasonEnd = state.filters.seasonStart;
    }
  }

  if (action === "season-end") {
    state.filters.seasonEnd = Number(event.currentTarget.value);
    if (state.filters.seasonEnd < state.filters.seasonStart) {
      state.filters.seasonStart = state.filters.seasonEnd;
    }
  }

  if (action === "query") {
    state.filters.query = event.currentTarget.value;
  }

  if (action === "toggle-element") {
    const { value, checked } = event.currentTarget;
    const nextElements = new Set(state.filters.elements);
    if (checked) {
      nextElements.add(value);
    } else {
      nextElements.delete(value);
    }
    state.filters.elements = [...nextElements];
  }

  if (action === "compare-left") {
    state.compare.left = event.currentTarget.value;
  }

  if (action === "compare-right") {
    state.compare.right = event.currentTarget.value;
  }

  render();
}

function summarizeFilteredEpisodes(episodes) {
  if (episodes.length === 0) {
    return {
      averageElements: "0.00",
      topElement: { label: "No matches" }
    };
  }

  const counts = new Map();
  let totalElements = 0;

  for (const episode of episodes) {
    totalElements += episode.elementCount;
    for (const element of episode.elements) {
      counts.set(element, (counts.get(element) ?? 0) + 1);
    }
  }

  const [topKey] =
    [...counts.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))[0] ?? [];

  return {
    averageElements: (totalElements / episodes.length).toFixed(2),
    topElement: { label: topKey ? toLabel(topKey) : "No motifs" }
  };
}

function renderMetric(label, value) {
  return `
    <div class="metric">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `;
}

function renderSeasonBars(episodes, totalSeasons) {
  const seasonSummaries = Array.from({ length: totalSeasons }, (_, index) => ({
    season: index + 1,
    episodeCount: 0,
    averageElements: 0
  }));

  for (const episode of episodes) {
    const season = seasonSummaries[episode.season - 1];
    season.episodeCount += 1;
    season.averageElements += episode.elementCount;
  }

  for (const season of seasonSummaries) {
    if (season.episodeCount > 0) {
      season.averageElements = Number((season.averageElements / season.episodeCount).toFixed(2));
    }
  }

  const maxAverage = Math.max(...seasonSummaries.map((season) => season.averageElements), 1);

  return `
    <div class="season-bars">
      ${seasonSummaries
        .map((season) => {
          const height = `${(season.averageElements / maxAverage) * 100}%`;
          return `
            <div class="season-bar-card">
              <div class="season-bar-track">
                <div class="season-bar" style="height:${height}"></div>
              </div>
              <div class="season-bar-meta">
                <strong>S${String(season.season).padStart(2, "0")}</strong>
                <span>${season.averageElements.toFixed(2)}</span>
              </div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderHeatmap(data, episodes) {
  const topElements = data.elementStats.slice(0, 8);
  const seasonCounts = new Map();

  for (const episode of episodes) {
    if (!seasonCounts.has(episode.season)) {
      seasonCounts.set(episode.season, new Map());
    }
    for (const element of episode.elements) {
      seasonCounts.get(episode.season).set(
        element,
        (seasonCounts.get(episode.season).get(element) ?? 0) + 1
      );
    }
  }

  const cells = topElements.flatMap((element) =>
    data.seasons.map((season) => {
      const value = seasonCounts.get(season.season)?.get(element.key) ?? 0;
      return value;
    })
  );
  const maxValue = Math.max(...cells, 1);

  return `
    <div class="heatmap-wrap">
      <div class="heatmap-grid" style="grid-template-columns: 160px repeat(${data.seasons.length}, minmax(20px, 1fr));">
        <div class="heatmap-header heatmap-corner">Element</div>
        ${data.seasons.map((season) => `<div class="heatmap-header">S${season.season}</div>`).join("")}
        ${topElements
          .map(
            (element) => `
              <div class="heatmap-label">${element.label}</div>
              ${data.seasons
                .map((season) => {
                  const value = seasonCounts.get(season.season)?.get(element.key) ?? 0;
                  const alpha = value === 0 ? 0.08 : 0.18 + value / maxValue / 1.35;
                  return `<div class="heatmap-cell" title="${element.label} in season ${season.season}: ${value}" style="background: rgba(210, 110, 55, ${alpha.toFixed(3)})">${value || ""}</div>`;
                })
                .join("")}
            `
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderComparison(episodes, leftKey, rightKey) {
  const leftOnly = [];
  const rightOnly = [];
  const overlap = [];

  for (const episode of episodes) {
    const hasLeft = episode.elements.includes(leftKey);
    const hasRight = episode.elements.includes(rightKey);

    if (hasLeft && hasRight) {
      overlap.push(episode);
    } else if (hasLeft) {
      leftOnly.push(episode);
    } else if (hasRight) {
      rightOnly.push(episode);
    }
  }

  return `
    <div class="compare-stats">
      <div class="compare-card">
        <span>${toLabel(leftKey)} only</span>
        <strong>${leftOnly.length}</strong>
      </div>
      <div class="compare-card compare-card-strong">
        <span>Overlap</span>
        <strong>${overlap.length}</strong>
      </div>
      <div class="compare-card">
        <span>${toLabel(rightKey)} only</span>
        <strong>${rightOnly.length}</strong>
      </div>
    </div>
    <div class="compare-notes">
      <p><strong>Best overlap examples:</strong> ${listEpisodes(overlap.slice(0, 4))}</p>
      <p><strong>Left edge:</strong> ${listEpisodes(leftOnly.slice(0, 3))}</p>
      <p><strong>Right edge:</strong> ${listEpisodes(rightOnly.slice(0, 3))}</p>
    </div>
  `;
}

function listEpisodes(episodes) {
  if (episodes.length === 0) {
    return "none in the current filter";
  }

  return episodes.map((episode) => `${episode.id} ${episode.title}`).join(", ");
}

function renderEpisodeTable(episodes) {
  if (episodes.length === 0) {
    return '<p class="empty-state">No episodes match the current filters.</p>';
  }

  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Episode</th>
            <th>Title</th>
            <th>Elements</th>
            <th>Motifs</th>
          </tr>
        </thead>
        <tbody>
          ${episodes
            .slice(0, 60)
            .map(
              (episode) => `
                <tr>
                  <td>${episode.id}</td>
                  <td>${episode.title}</td>
                  <td>${episode.elementCount}</td>
                  <td>${episode.elements.slice(0, 6).map(toLabel).join(", ")}${episode.elements.length > 6 ? "…" : ""}</td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
      <p class="table-caption">Showing the first ${Math.min(episodes.length, 60)} matching episodes.</p>
    </div>
  `;
}

function percent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
