import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildDataset, filterEpisodes, parseCsv } from "../src/rossData.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturePath = path.join(__dirname, "..", "data/raw/elements-by-episode.csv");

test("parseCsv handles quoted values", () => {
  const rows = parseCsv('A,B,C\n1,"hello, world","""quoted"""');
  assert.deepEqual(rows, [
    ["A", "B", "C"],
    ["1", "hello, world", '"quoted"']
  ]);
});

test("buildDataset computes known summary values", async () => {
  const csv = await fs.readFile(fixturePath, "utf8");
  const dataset = buildDataset(csv);

  assert.equal(dataset.summary.totalEpisodes, 403);
  assert.equal(dataset.summary.totalSeasons, 31);
  assert.equal(dataset.summary.trackedElements, 67);
  assert.equal(dataset.summary.mostCommonElement.label, "Tree");
  assert.equal(dataset.summary.mostCommonElement.count, 361);
  assert.equal(dataset.summary.richestSeason.season, 10);
});

test("season summaries preserve episode counts", async () => {
  const csv = await fs.readFile(fixturePath, "utf8");
  const dataset = buildDataset(csv);
  const firstSeason = dataset.seasons.find((season) => season.season === 1);
  const lastSeason = dataset.seasons.find((season) => season.season === 31);

  assert.equal(firstSeason.episodeCount, 13);
  assert.equal(lastSeason.episodeCount, 13);
  assert.equal(firstSeason.topElements[0].label, "Tree");
});

test("filterEpisodes applies season, query, and element filters together", async () => {
  const csv = await fs.readFile(fixturePath, "utf8");
  const dataset = buildDataset(csv);
  const filtered = filterEpisodes(dataset.episodes, {
    seasonStart: 1,
    seasonEnd: 1,
    query: "winter",
    elements: ["SNOW"]
  });

  assert.deepEqual(filtered.map((episode) => episode.id), ["S01E06"]);
});
