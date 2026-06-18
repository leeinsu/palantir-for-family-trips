# Family Trip Command Center

> A Palantir-ish dashboard for a very non-Palantir problem: getting a few families to Pine Mountain Lake and Yosemite without losing the plot.

Instead of a normal trip planner, this repo treats a long weekend like an operation: convoy routes, arrival windows, mission launches, meal logistics, family checklists, and a giant map that makes everything feel more serious than it needs to be.

![Family Trip Command Center dashboard overview](docs/dashboard-overview.png)

## What It Does

- Tracks multiple families arriving from different cities.
- Simulates driving routes, convoy departures, and day-by-day timeline playback.
- Organizes the trip into itinerary, stay, meals, activities, expenses, and family views.
- Presents the whole thing as a dark, command-center-style dashboard because that is more fun than a spreadsheet.

## Screens

### Mission launch overlay

![Mission launch overlay](docs/mission-launch.png)

### Activity planning surface

![Activity planning screen](docs/activity-board.png)

### Meal logistics surface

![Meal planning screen](docs/meals-planner.png)

## Why This Exists

Because “three families are trying to get to the same cabin” is already a systems problem.

The repo is intentionally overbuilt for a small real-life use case. That is the point. It is a fun UI experiment, a trip-planning toy, and a mildly absurd attempt to make a family weekend feel like a live operations room.

## Stack

- React 19
- Vite
- OpenStreetMap-compatible Open Map surface
- Lucide icons
- Framer Motion

## Running It Locally

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://127.0.0.1:5173` or whatever Vite prints.

## Environment

Open Map configuration is optional. Defaults use an OpenStreetMap-compatible tile URL and local API proxy paths:

```bash
VITE_MAP_PROVIDER=openstreetmap
VITE_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
VITE_GEOCODING_API_BASE=/api/maps/geocode
VITE_ROUTING_API_BASE=/api/maps/routes
```

Server-side MariaDB values belong in `.env.local`, not browser-exposed `VITE_*` variables.

## Data / Privacy

The trip data in this repo is intentionally sanitized for public sharing.

- Family names are demo names.
- The basecamp address is generalized.
- Access instructions, Wi-Fi, host details, and other private trip notes are removed.

If you publish this with external map/search/route providers, review each provider's usage policy and rate limits.

## Repo Notes

- State is stored locally in the browser.
- The project is optimized for desktop and large-screen dashboard vibes.
- The UI intentionally leans dense, dramatic, and slightly over-the-top.

## If You Want To Hack On It

Good places to start:

- `src/App.jsx` for the main shell, timeline, and overlays
- `src/CommandMap.jsx` for route rendering, playback, and map behavior
- `src/tripModel.js` for the seeded trip document and helper logic

## Status

Built for fun. Surprisingly usable. Not pretending to be enterprise software.
