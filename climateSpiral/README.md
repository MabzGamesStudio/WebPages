# Climate Spiral

A single-page app that turns 70+ years of monthly temperature data for any
city into a rotating 3D spiral, inspired by [NASA SVS's climate spiral
visualization](https://svs.gsfc.nasa.gov/5190/). One loop of the spiral =
one year; the angle around the loop is the month; the radius bulges outward
in warm months/years and pinches inward in cool ones; height rises with
time, so the whole record reads as a climbing, warming coil.

Built with **React + TypeScript + SCSS**, 3D rendering via **three.js /
react-three-fiber**, and a fully key-less public data source
(**Open-Meteo**).

## Features

- **City search** — type any place name; results come from Open-Meteo's
  free geocoding API (no key required).
- **Historical data, no API key** — daily mean temperature since 1950 comes
  from Open-Meteo's ERA5 reanalysis archive, aggregated client-side into
  monthly anomalies relative to each calendar month's long-run average.
- **Animated playback** — the spiral draws itself month by month.
- **Play / pause** and **scrub** — drag the timeline to jump to any month.
- **Speed control** — 0.5x to 8x playback speed.
- **Free 3D rotation** — drag to orbit, scroll/pinch to zoom (OrbitControls).
- **Camera presets** — snap to a top-down view (matches the classic flat
  spiral look) or a side view (reveals the rising helix/coil shape), or
  return to the free-orbit default.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL. To produce a production build:

```bash
npm run build
npm run preview
```

## How the data becomes a shape

See `src/utils/climateMath.ts` (daily → monthly aggregation + anomaly) and
`src/utils/spiralGeometry.ts` (monthly points → 3D helix coordinates):

- `angle = (month - 1) / 12 * 2π` — one full revolution per year.
- `radius = baseRadius + anomaly * scale` — warmer-than-baseline months
  push the point outward, cooler months pull it inward.
- `height = yearsElapsed * yearHeight` — the vertical axis is simply time,
  so the coil climbs as the dataset advances.
- Color is a diverging blue → red scale driven by the anomaly value.

## Project structure

```
src/
  api/openMeteo.ts          Fetch wrappers for geocoding + archive endpoints
  hooks/useGeocoding.ts     Debounced city search
  hooks/useClimateData.ts   Fetch + aggregate a city's climate history
  hooks/usePlayback.ts      Play/pause/speed/scrub timeline engine
  utils/climateMath.ts      Daily -> monthly aggregation + anomaly calc
  utils/spiralGeometry.ts   Monthly points -> 3D helix coordinates + color
  components/
    CitySearch/             Search input + results dropdown
    SpiralScene/             react-three-fiber canvas, spiral line, camera rig
    Controls/                Bottom transport dock (play/scrub/speed/view)
    Hud/                     Floating telemetry readout (date/temp/anomaly)
```

## Data source

[Open-Meteo](https://open-meteo.com) — free for non-commercial use, no API
key required:
- Geocoding: `https://geocoding-api.open-meteo.com/v1/search`
- Historical archive (ERA5 reanalysis): `https://archive-api.open-meteo.com/v1/archive`

If a location has very sparse or no historical records, the app will
surface an error message rather than showing an empty spiral.
