# Letterboxd Scraper

Scrapes every review from a Letterboxd profile and exports the results to CSV and JSON. Built with Playwright and Node.js.

## What it collects

| Field | Description |
|---|---|
| `filmTitle` | Title of the reviewed film |
| `yearReleased` | Release year of the film |
| `rating` | Star rating given by the reviewer |
| `reviewDate` | Date the review was posted (ISO format) |
| `fullReview` | Full text of the review |

## Setup

```bash
npm install
npx playwright install chromium
```

## Usage

```bash
node scraper.js <username>
```

Replace `<username>` with the Letterboxd username you want to scrape. For example:

```bash
node scraper.js orangepickleguy
```

Two output files are created in the project root:

```
reviews-by-<username>-<timestamp>.csv
reviews-by-<username>-<timestamp>.json
```

## How it works

On startup, the scraper opens a persistent headless Chromium session using Puppeteer's Stealth Plugin to avoid bot detection. It navigates to the user's reviews page, reads the total number of pages from the pagination, then scrapes all pages concurrently — each on its own browser tab. Within each page, it expands any truncated reviews before extracting the data.