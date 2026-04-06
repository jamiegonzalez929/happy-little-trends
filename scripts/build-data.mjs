import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildDataset, loadCsvFile } from "../src/rossData.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const inputPath = path.join(rootDir, "data/raw/elements-by-episode.csv");
const outputPath = path.join(rootDir, "data/bob-ross.json");

const csvText = await loadCsvFile(inputPath);
const dataset = buildDataset(csvText);

await fs.writeFile(outputPath, `${JSON.stringify(dataset, null, 2)}\n`);
console.log(`Wrote ${outputPath}`);
