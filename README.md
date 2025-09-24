# CC_FrontProj-2 — Crypto Dashboard (React + Vite)

This repository contains a React frontend built with Vite that displays cryptocurrency market data and per-coin details.

## Highlights

- Top markets table (cached to `public/coins.json`)
- Per-coin cached detail + 30-day market chart files in `public/coins/{id}.json`
- Theme tokens (light/dark) via CSS variables in `src/styles/global.css`
- Chart.js charts (price, market cap, volume) with per-chart range controls
- Watchlist persisted to `localStorage` and a dedicated Watchlist page

## Layout (important files)

- `src/` — React source
	- `pages/Dashboard.jsx` — markets table and watchlist toggle
	- `pages/CoinDetails.jsx` — per-coin page and charts (reads `public/coins/{id}.json` first)
	- `pages/Watchlist.jsx` — shows coins saved to `localStorage` watchlist
	- `styles/global.css` — theme tokens and button styles
- `public/coins.json` — cached top markets (created by the script)
- `public/coins/{id}.json` — cached per-coin details and 30d chart data
- `tools/fetch_coins.js` — script to generate the cached JSON files

## Caching coins (update script)

To avoid hitting CoinGecko on every page load, we cache the top markets and per-coin data into the `public/` folder. The repository includes a helper script that writes these files:

```powershell
node tools/fetch_coins.js
```

Notes about the script

- The script writes `public/coins.json` and `public/coins/{id}.json` for each fetched coin.
- It creates `public/` and `public/coins/` relative to the repository.

## Using the script in GitHub Actions

Example workflow (saves the cached JSON back to the repo):

```yaml
name: Update cached coins
on:
	workflow_dispatch:
	schedule:
		- cron: '0 2 * * *'

jobs:
	fetch:
		runs-on: ubuntu-latest
		steps:
			- uses: actions/checkout@v4
			- name: Setup Node
				uses: actions/setup-node@v4
				with:
					node-version: 18
			- name: Install deps
				run: npm ci
			- name: Run fetch_coins
				env:
					COIN_FETCH_DELAY_MS: 1500
				run: node tools/fetch_coins.js
			- name: List cached files (debug)
				run: ls -la public/coins | head -n 20
			- name: Commit & push (optional)
				run: |
					git config user.name "github-actions[bot]"
					git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
					git add public/coins public/coins.json
					git commit -m "chore: update cached coins" || echo "no changes"
					git push
```


