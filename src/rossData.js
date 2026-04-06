import fs from "node:fs/promises";
export { buildDataset, filterEpisodes, parseCsv, toLabel } from "./rossCore.js";

export async function loadCsvFile(path) {
  return fs.readFile(path, "utf8");
}
