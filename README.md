# Happy Little Trends

Happy Little Trends is a zero-dependency static data visualization for exploring how Bob Ross painting motifs changed across all 31 seasons of *The Joy of Painting*. It turns FiveThirtyEight's Bob Ross dataset into an interactive browser view with season filters, motif comparisons, a season-density chart, a small heatmap, and an episode index.

## Why This Exists

The original FiveThirtyEight analysis is still a good reference, but it is article-shaped. This project repackages the same episode-level data into a lightweight explorer that makes it easier to answer small questions locally, such as:

- Which seasons packed the most visual elements into each painting?
- How often do motifs like trees and mountains appear together?
- Which episodes match a narrower mood, like winter scenes or cabins plus lakes?

## Features

- Interactive season-range filtering
- Episode search by title or episode code
- Motif chips for narrowing to common elements
- Season-by-season average element chart
- Heatmap for the most common motifs across all seasons
- Pairwise motif comparison with overlap counts and example episodes
- Bundled processed dataset for offline/local use
- Automated tests for CSV parsing, dataset building, and filtering behavior

## Tech Stack

- HTML
- CSS
- Vanilla JavaScript modules
- Node.js built-in test runner
- Python's built-in `http.server` for local serving

## Setup

No third-party services or API keys are required.

1. Confirm `node` and `python3` are available.
2. From the repo root, regenerate the bundled data if needed:

```bash
npm run build:data
```

## How To Run

Serve the repository root as static files:

```bash
python3 -m http.server 8000
```

Then open `http://127.0.0.1:8000`.

## How To Test

```bash
npm test
```

## Example Usage

1. Set the season range to `10` through `18` to focus on the middle of the series.
2. Search for `winter` to isolate colder titles.
3. Turn on the `Cabin` and `Lake` motif chips to narrow to paintings with both elements.
4. Compare `Tree` versus `Mountain` in the comparison panel to see their overlap within the current slice.

## Project Structure

- `index.html`: static entrypoint
- `src/app.js`: browser UI and interactions
- `src/rossCore.js`: shared parsing, transformation, and filtering logic
- `scripts/build-data.mjs`: regenerates `data/bob-ross.json`
- `data/raw/elements-by-episode.csv`: original downloaded source file
- `data/bob-ross.json`: processed dataset used by the app
- `test/rossData.test.js`: automated tests
- `docs/`: extra notes, data provenance, and source reference

## Limitations

- The visualization uses FiveThirtyEight's binary tags, so it does not reflect how prominent an element is within a painting, only whether it appears.
- The UI intentionally focuses on a small set of the most common motifs to stay readable on one page.
- The comparison panel is pairwise only; it does not attempt broader clustering or network analysis.

## Next Ideas

- Add downloadable filtered CSV or JSON exports
- Add a timeline view for first and last appearance of each motif
- Add small multiples for motif combinations such as cabin-plus-lake or winter-plus-mountain

## Data Source

The project bundles `elements-by-episode.csv` from FiveThirtyEight's Bob Ross dataset:

- Source article: <https://fivethirtyeight.com/features/a-statistical-analysis-of-the-work-of-bob-ross/>
- Source repo: <https://github.com/fivethirtyeight/data/tree/master/bob-ross>
