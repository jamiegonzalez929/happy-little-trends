export function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        value += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(value);
      value = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }
      row.push(value);
      if (row.some((cell) => cell.length > 0)) {
        rows.push(row);
      }
      row = [];
      value = "";
      continue;
    }

    value += char;
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value);
    rows.push(row);
  }

  return rows;
}

export function normalizeTitle(rawTitle) {
  return rawTitle.replace(/^"+|"+$/g, "").trim();
}

export function toSlug(label) {
  return label.toLowerCase().replace(/_/g, "-");
}

export function toLabel(key) {
  return key
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function buildDataset(csvText) {
  const [header, ...rows] = parseCsv(csvText);
  const elementKeys = header.slice(2);

  const episodes = rows.map((row) => {
    const [episodeCode, rawTitle, ...flags] = row;
    const season = Number.parseInt(episodeCode.slice(1, 3), 10);
    const episodeNumber = Number.parseInt(episodeCode.slice(4), 10);
    const elements = elementKeys.filter((_, index) => flags[index] === "1");

    return {
      id: episodeCode,
      season,
      episodeNumber,
      title: normalizeTitle(rawTitle),
      elements,
      elementCount: elements.length
    };
  });

  const seasonMap = new Map();
  const elementMap = new Map(
    elementKeys.map((key) => [
      key,
      {
        key,
        label: toLabel(key),
        slug: toSlug(key),
        count: 0,
        seasonCounts: {},
        firstSeason: Number.POSITIVE_INFINITY,
        lastSeason: 0
      }
    ])
  );

  for (const episode of episodes) {
    if (!seasonMap.has(episode.season)) {
      seasonMap.set(episode.season, {
        season: episode.season,
        episodeCount: 0,
        totalElements: 0,
        elementCounts: {}
      });
    }

    const seasonSummary = seasonMap.get(episode.season);
    seasonSummary.episodeCount += 1;
    seasonSummary.totalElements += episode.elementCount;

    for (const element of episode.elements) {
      const elementSummary = elementMap.get(element);
      elementSummary.count += 1;
      elementSummary.seasonCounts[episode.season] =
        (elementSummary.seasonCounts[episode.season] ?? 0) + 1;
      elementSummary.firstSeason = Math.min(elementSummary.firstSeason, episode.season);
      elementSummary.lastSeason = Math.max(elementSummary.lastSeason, episode.season);
      seasonSummary.elementCounts[element] = (seasonSummary.elementCounts[element] ?? 0) + 1;
    }
  }

  const seasons = [...seasonMap.values()]
    .sort((left, right) => left.season - right.season)
    .map((season) => ({
      season: season.season,
      episodeCount: season.episodeCount,
      averageElements: Number((season.totalElements / season.episodeCount).toFixed(2)),
      topElements: Object.entries(season.elementCounts)
        .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
        .slice(0, 5)
        .map(([key, count]) => ({
          key,
          label: toLabel(key),
          count
        }))
    }));

  const elementStats = [...elementMap.values()]
    .map((element) => {
      const peakEntry = Object.entries(element.seasonCounts).sort(
        (left, right) => right[1] - left[1] || Number(left[0]) - Number(right[0])
      )[0];

      return {
        ...element,
        share: Number((element.count / episodes.length).toFixed(4)),
        firstSeason: Number.isFinite(element.firstSeason) ? element.firstSeason : null,
        peakSeason: peakEntry ? Number(peakEntry[0]) : null,
        peakCount: peakEntry ? peakEntry[1] : 0
      };
    })
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));

  const totalElements = episodes.reduce((sum, episode) => sum + episode.elementCount, 0);
  const averageElementsPerEpisode = Number((totalElements / episodes.length).toFixed(2));
  const mostCommonElement = elementStats[0];
  const richestSeason = [...seasons].sort(
    (left, right) => right.averageElements - left.averageElements || left.season - right.season
  )[0];

  return {
    source: {
      name: "FiveThirtyEight Bob Ross dataset",
      url: "https://github.com/fivethirtyeight/data/tree/master/bob-ross"
    },
    summary: {
      totalEpisodes: episodes.length,
      totalSeasons: seasons.length,
      trackedElements: elementKeys.length,
      averageElementsPerEpisode,
      mostCommonElement: {
        key: mostCommonElement.key,
        label: mostCommonElement.label,
        count: mostCommonElement.count,
        share: mostCommonElement.share
      },
      richestSeason: {
        season: richestSeason.season,
        averageElements: richestSeason.averageElements
      }
    },
    seasons,
    elementStats,
    episodes
  };
}

export function filterEpisodes(episodes, filters) {
  const seasonStart = filters.seasonStart ?? 1;
  const seasonEnd = filters.seasonEnd ?? 31;
  const query = (filters.query ?? "").trim().toLowerCase();
  const requiredElements = filters.elements ?? [];

  return episodes.filter((episode) => {
    if (episode.season < seasonStart || episode.season > seasonEnd) {
      return false;
    }

    if (query.length > 0) {
      const haystack = `${episode.id} ${episode.title}`.toLowerCase();
      if (!haystack.includes(query)) {
        return false;
      }
    }

    return requiredElements.every((element) => episode.elements.includes(element));
  });
}
