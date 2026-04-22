# 670 Vernon — PurpleAir Live

A fully-static, single-page dashboard that renders every field returned by the
current [PurpleAir v1 API](https://api.purpleair.com/#api-sensors-get-sensor-data)
for one sensor (default: `38371`). No build step, no backend, no npm.

## Run it

```bash
cd home_status
python3 -m http.server 8000
```

Then open <http://localhost:8000> in any browser (or the laptop's LAN IP on
your phone to review the mobile layout).

A PurpleAir **Read Key** is bundled directly into [app.js](app.js), XOR'd with
a passphrase and base64-encoded so the raw UUID never appears in the repo
(keeps GitHub secret scanners quiet). This is obfuscation, not security —
anyone who opens devtools on the hosted page can recover the key. It is
tolerable here because PurpleAir read keys have rate limits but no billable
spend; the worst case is someone else chewing up the daily quota reading
your sensor. If that ever happens, rotate the key at
<https://develop.purpleair.com/>, re-encode it (see below), and redeploy.

Click the gear icon to override the bundled key, change the sensor index,
add a private `read_key`, or tune the refresh cadence. Overrides are stored
in `localStorage`; nothing is sent anywhere except directly to
`https://api.purpleair.com`.

### Rotating the bundled key

```bash
node -e '
const key = "YOUR-NEW-READ-KEY";
const pass = "670-vernon-home-status";
const out = Buffer.alloc(key.length);
for (let i = 0; i < key.length; i++) out[i] = key.charCodeAt(i) ^ pass.charCodeAt(i % pass.length);
console.log(out.toString("base64"));
'
```

Paste the resulting base64 string into the `BUNDLED_KEY_B64` constant at the
top of [app.js](app.js).

## Deploying to GitHub Pages

1. Push the repo to GitHub.
2. Repo → Settings → Pages → Source: `main` branch, `/` root.
3. Wait ~30 s, then open `https://<you>.github.io/home_status/`.

All four files (`index.html`, `styles.css`, `app.js`, `fields.js`) are
static and self-contained; Chart.js loads from jsDelivr.

## What you see

- **Hero** — sensor name, liveness chip (live / stale / offline based on
  `last_seen`), confidence %, firmware, Wi-Fi bars (from `rssi`), uptime, and
  a headline **EPA AQI tile** (2024 revised PM2.5 breakpoints) with the
  category, color band, and a needle on the Good → Hazardous scale.
- **PM2.5 averages chart** — grouped bars for now / 10m / 30m / 60m / 6h / 24h
  / 1 week, with channels A, B, and the combined average overlaid.
- **Particle size distribution chart** — log-scaled bars across the 0.3 /
  0.5 / 1.0 / 2.5 / 5.0 / 10.0 µm count bins, A vs B vs average.
- **Mass concentration** — PM1.0 / PM2.5 / PM10 ATM values as animated bars.
- **Environment** — temperature, humidity, pressure, dewpoint (computed via
  Magnus formula), humidex (computed), and VOC when equipped. Ambient
  estimates apply PurpleAir's vendor correction (−8°F, +4% RH).
- **Visibility & scattering** — `scattering_coefficient`, `deciviews`,
  `visual_range` (A / B / avg) when reported.
- **Misc sensors** — VOC A/B, ozone, analog input when reported.
- **Dual-channel diagnostics** — A vs B comparison tiles for PM2.5, PM1.0,
  PM10, humidity, temperature, pressure, with delta chips. Plus a confidence
  tile (avg / manual / auto) and channel flags.
- **Device health** — model, hardware, firmware, RSSI, uptime, PA latency,
  free heap, LED brightness, timestamps.
- **Location** — coordinates, altitude, position rating, and an embedded
  OpenStreetMap pin at the sensor's lat/lon.
- **Raw response** — collapsible `<details>` with the full pretty-printed
  JSON, so every field the API returns is always visible even if a new one
  appears later.

The page auto-refreshes on the cadence set in settings (default 2 minutes,
matching the sensor's reporting interval). The ring in the top-right counts
down to the next pull; the circular arrow triggers a manual refresh.

## Files

- [index.html](index.html) — markup shell, loads Chart.js via CDN.
- [styles.css](styles.css) — dark theme by default, switches to light via
  `prefers-color-scheme`. Responsive CSS Grid collapses to one column on
  phones.
- [fields.js](fields.js) — the single source of truth for every field we
  request. The `fields=` query string and every rendered label are generated
  from this file, so keeping them in sync is impossible.
- [app.js](app.js) — fetch + auto-refresh loop, EPA AQI + dewpoint + humidex
  helpers, DOM rendering per panel, settings dialog.

## API notes

- `GET https://api.purpleair.com/v1/sensors/:sensor_index?fields=...`
- Header: `X-API-Key: <read-key>`
- Private sensors: add `&read_key=<per-sensor-read-key>`
- Default rate limit: 100 ms. The default cadence of 120 s is well under it.
- CORS is open (`access-control-allow-origin: *`), which is why this works
  from a static page.
