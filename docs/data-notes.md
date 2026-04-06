# Data Notes

## Source

The raw episode-level data comes from FiveThirtyEight's Bob Ross dataset:

- Repository: <https://github.com/fivethirtyeight/data/tree/master/bob-ross>
- File used here: `elements-by-episode.csv`

The dataset marks 67 visual elements as binary flags for each episode from `S01E01` through `S31E13`.

## Local Processing

`scripts/build-data.mjs` reads the raw CSV and produces `data/bob-ross.json`.

The generated JSON contains:

- `summary`: project-wide rollups used in the hero and stat cards
- `seasons`: per-season averages and top motifs
- `elementStats`: counts, shares, and per-season peaks for each motif
- `episodes`: normalized episode records used for filtering in the browser

## Verification

The test suite checks:

- CSV parsing of quoted values
- known series-level counts from the source file
- known season episode counts
- combined filtering behavior across season range, search, and motif filters

## Notes On Scope

This project keeps the interface intentionally compact:

- No external charting libraries
- No build step for the front end
- No runtime network dependency beyond loading the bundled local JSON
