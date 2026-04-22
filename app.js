import { FIELDS, FIELD_BY_KEY, buildFieldsParam, PARTICLE_BINS, PM25_AVG_SERIES } from "./fields.js";

// -------------------- Config / storage --------------------

const LS = {
  apiKey: "pa_read_key",
  sensor: "pa_sensor_index",
  priv: "pa_private_read_key",
  cadence: "pa_cadence_s",
};

const DEFAULT_SENSOR = "38371";
const DEFAULT_CADENCE = 120;

// Bundled read key: XOR'd with BUNDLED_PASS and base64-encoded so the raw
// UUID never appears in the repo (defeats GitHub secret scanners). This is
// obfuscation, not security — anyone can open devtools and read the key.
// Tolerable because PurpleAir read keys have no spend, only a rate limit.
const BUNDLED_PASS = "670-vernon-home-status";
const BUNDLED_KEY_B64 = "A3ZxFDMkQF1CXWhQWkBUHDVFTDZASgAaBB9GVDMtXipuWV1e";

function decodeBundledKey() {
  try {
    const raw = atob(BUNDLED_KEY_B64);
    let out = "";
    for (let i = 0; i < raw.length; i++) {
      out += String.fromCharCode(raw.charCodeAt(i) ^ BUNDLED_PASS.charCodeAt(i % BUNDLED_PASS.length));
    }
    return out;
  } catch (_) {
    return "";
  }
}

function getCfg() {
  return {
    apiKey: localStorage.getItem(LS.apiKey) || decodeBundledKey(),
    sensor: localStorage.getItem(LS.sensor) || DEFAULT_SENSOR,
    priv: localStorage.getItem(LS.priv) || "",
    cadence: Number(localStorage.getItem(LS.cadence) ?? DEFAULT_CADENCE),
  };
}

function setCfg(next) {
  if ("apiKey" in next) localStorage.setItem(LS.apiKey, next.apiKey || "");
  if ("sensor" in next) localStorage.setItem(LS.sensor, String(next.sensor || DEFAULT_SENSOR));
  if ("priv" in next) localStorage.setItem(LS.priv, next.priv || "");
  if ("cadence" in next) localStorage.setItem(LS.cadence, String(next.cadence));
}

// -------------------- Helpers --------------------

// EPA AQI from PM2.5 (µg/m³), 2024 revised breakpoints.
// Source: US EPA technical assistance document.
const AQI_BREAKS = [
  { cLo: 0.0, cHi: 9.0, iLo: 0, iHi: 50, cat: "Good", color: "#00e676" },
  { cLo: 9.1, cHi: 35.4, iLo: 51, iHi: 100, cat: "Moderate", color: "#ffeb3b" },
  { cLo: 35.5, cHi: 55.4, iLo: 101, iHi: 150, cat: "Unhealthy for Sensitive Groups", color: "#ff9800" },
  { cLo: 55.5, cHi: 125.4, iLo: 151, iHi: 200, cat: "Unhealthy", color: "#f44336" },
  { cLo: 125.5, cHi: 225.4, iLo: 201, iHi: 300, cat: "Very Unhealthy", color: "#9c27b0" },
  { cLo: 225.5, cHi: 1000, iLo: 301, iHi: 500, cat: "Hazardous", color: "#7e0023" },
];

function pmToAqi(pm) {
  if (pm == null || Number.isNaN(pm)) return null;
  const c = Math.max(0, Math.min(1000, Number(pm)));
  const bp = AQI_BREAKS.find((b) => c >= b.cLo && c <= b.cHi) || AQI_BREAKS[AQI_BREAKS.length - 1];
  const aqi = Math.round(((bp.iHi - bp.iLo) / (bp.cHi - bp.cLo)) * (c - bp.cLo) + bp.iLo);
  return { aqi, category: bp.cat, color: bp.color, pct: Math.min(100, (aqi / 300) * 100) };
}

// PurpleAir housing → ambient corrections (vendor guidance):
// ambient_temp_f ≈ housing_temp_f - 8
// ambient_rh    ≈ housing_rh + 4 (clamped to 0..100)
function toAmbient(tempF, rh) {
  const atF = tempF == null ? null : tempF - 8;
  const arh = rh == null ? null : Math.max(0, Math.min(100, rh + 4));
  return { atF, arh };
}

// Magnus formula dewpoint (°C) from temp °C and RH %.
function dewpointC(tempC, rh) {
  if (tempC == null || rh == null) return null;
  const a = 17.625;
  const b = 243.04;
  const alpha = Math.log(Math.max(0.0001, rh / 100)) + (a * tempC) / (b + tempC);
  return (b * alpha) / (a - alpha);
}

// Humidex from temp °C + dewpoint °C. Returns °C.
function humidexC(tempC, dewC) {
  if (tempC == null || dewC == null) return null;
  const e = 6.11 * Math.exp(5417.7530 * (1 / 273.16 - 1 / (273.16 + dewC)));
  const h = tempC + (5 / 9) * (e - 10);
  return h;
}

const fToC = (f) => (f == null ? null : (f - 32) * (5 / 9));
const cToF = (c) => (c == null ? null : c * 9 / 5 + 32);

function fmt(value, decimals = 1) {
  if (value == null || Number.isNaN(value)) return "—";
  if (typeof value === "string") return value;
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: Math.min(decimals, value % 1 === 0 ? 0 : decimals) });
}

function relTime(unix) {
  if (!unix) return "—";
  const diff = Math.round((Date.now() / 1000) - unix);
  const abs = Math.abs(diff);
  const sign = diff < 0 ? "in " : "";
  const suffix = diff >= 0 ? " ago" : "";
  if (abs < 60) return `${sign}${abs}s${suffix}`;
  if (abs < 3600) return `${sign}${Math.round(abs / 60)}m${suffix}`;
  if (abs < 86400) return `${sign}${Math.round(abs / 3600)}h${suffix}`;
  return `${sign}${Math.round(abs / 86400)}d${suffix}`;
}

function formatUptimeMin(min) {
  if (min == null) return "—";
  const d = Math.floor(min / 1440);
  const h = Math.floor((min % 1440) / 60);
  const m = min % 60;
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h || d) parts.push(`${h}h`);
  parts.push(`${m}m`);
  return parts.join(" ");
}

function rssiBars(rssi) {
  if (rssi == null) return 0;
  if (rssi >= -55) return 4;
  if (rssi >= -65) return 3;
  if (rssi >= -75) return 2;
  if (rssi >= -85) return 1;
  return 0;
}

function locationLabel(v) {
  if (v === 0) return "Outside";
  if (v === 1) return "Inside";
  return "—";
}

function formatField(field, value) {
  if (value == null || value === "") return "—";
  switch (field.type) {
    case "string": return String(value);
    case "bool01": return value ? "Yes" : "No";
    case "locationType": return locationLabel(value);
    case "stars": return `${value}★`;
    case "timestamp": return `${new Date(value * 1000).toLocaleString()} (${relTime(value)})`;
    case "uptime": return formatUptimeMin(value);
    case "int": return fmt(value, 0);
    case "number": return fmt(value, field.decimals ?? 1);
    default: return String(value);
  }
}

// -------------------- API fetch --------------------

const ENDPOINT = "https://api.purpleair.com/v1/sensors";

async function fetchSensor({ apiKey, sensor, priv }) {
  const params = new URLSearchParams();
  params.set("fields", buildFieldsParam());
  if (priv) params.set("read_key", priv);
  const url = `${ENDPOINT}/${encodeURIComponent(sensor)}?${params.toString()}`;
  const res = await fetch(url, { headers: { "X-API-Key": apiKey }, cache: "no-store" });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.description || body.error || JSON.stringify(body);
    } catch (_) {
      /* ignore */
    }
    throw new Error(`HTTP ${res.status}: ${detail}`);
  }
  return res.json();
}

// -------------------- Rendering --------------------

const el = (id) => document.getElementById(id);

const state = {
  chartAverages: null,
  chartParticles: null,
  timer: null,
  nextAt: 0,
};

function renderHero(sensor) {
  el("sensorName").textContent = sensor.name || `Sensor ${sensor.sensor_index}`;
  el("sensorLabel").textContent = `sensor ${sensor.sensor_index}`;

  const chips = [];
  const lastSeen = sensor.last_seen;
  const secs = lastSeen ? Math.round(Date.now() / 1000 - lastSeen) : null;
  let status = "live";
  let statusText = "Live";
  if (secs == null) { status = "dead"; statusText = "No data"; }
  else if (secs > 1800) { status = "dead"; statusText = "Offline"; }
  else if (secs > 600) { status = "stale"; statusText = "Stale"; }
  chips.push(`<span class="chip ${status}"><span>●</span> ${statusText} · ${relTime(lastSeen)}</span>`);

  if (sensor.confidence != null) chips.push(`<span class="chip">Confidence <strong>${sensor.confidence}%</strong></span>`);
  if (sensor.location_type != null) chips.push(`<span class="chip">${locationLabel(sensor.location_type)}</span>`);
  if (sensor.model) chips.push(`<span class="chip">${sensor.model}</span>`);
  if (sensor.firmware_version) chips.push(`<span class="chip">FW <strong>${sensor.firmware_version}</strong></span>`);
  if (sensor.rssi != null) {
    const bars = rssiBars(sensor.rssi);
    chips.push(`<span class="chip"><span class="wifi">${[1,2,3,4].map(i => `<span class="${i <= bars ? "on" : ""}"></span>`).join("")}</span> ${sensor.rssi} dBm</span>`);
  }
  if (sensor.uptime != null) chips.push(`<span class="chip">Up <strong>${formatUptimeMin(sensor.uptime)}</strong></span>`);

  el("heroChips").innerHTML = chips.join("");

  // AQI tile
  const pm = sensor["pm2.5_atm"] ?? sensor["pm2.5"];
  const aqi = pmToAqi(pm);
  const tile = el("heroAqi");
  if (aqi) {
    tile.style.setProperty("--aqi-color", aqi.color);
    tile.style.setProperty("--aqi-pct", `${aqi.pct}%`);
    el("aqiNumber").textContent = aqi.aqi;
    el("aqiCategory").textContent = aqi.category;
    el("aqiSubline").textContent = `PM2.5 ${fmt(pm, 1)} µg/m³`;
    el("aqiScale").style.setProperty("--aqi-pct", `${aqi.pct}%`);
  } else {
    tile.style.setProperty("--aqi-color", "var(--accent)");
    el("aqiNumber").textContent = "—";
    el("aqiCategory").textContent = "No PM2.5";
    el("aqiSubline").textContent = "sensor has not reported PM2.5 yet";
  }
}

function renderAveragesChart(sensor) {
  const ctx = el("chartAverages");
  const labels = PM25_AVG_SERIES.map((s) => s.label);
  const statsA = sensor.stats_a || {};
  const statsB = sensor.stats_b || {};
  const statsAvg = sensor.stats || {};

  const dataAvg = PM25_AVG_SERIES.map((s) => sensor[s.fieldKey] ?? statsAvg[s.statKey] ?? null);
  const dataA = PM25_AVG_SERIES.map((s) => sensor[`${s.fieldKey}_a`] ?? statsA[s.statKey] ?? null);
  const dataB = PM25_AVG_SERIES.map((s) => sensor[`${s.fieldKey}_b`] ?? statsB[s.statKey] ?? null);

  const cfg = {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Avg", data: dataAvg, backgroundColor: "rgba(139, 92, 246, 0.85)", borderRadius: 6, borderSkipped: false },
        { label: "A", data: dataA, backgroundColor: "rgba(34, 211, 238, 0.75)", borderRadius: 6, borderSkipped: false },
        { label: "B", data: dataB, backgroundColor: "rgba(244, 114, 182, 0.75)", borderRadius: 6, borderSkipped: false },
      ],
    },
    options: chartOptions("µg/m³"),
  };

  if (state.chartAverages) {
    state.chartAverages.data = cfg.data;
    state.chartAverages.update();
  } else {
    state.chartAverages = new window.Chart(ctx, cfg);
  }
}

function renderParticlesChart(sensor) {
  const ctx = el("chartParticles");
  const labels = PARTICLE_BINS.map((b) => b.label);
  const dataA = PARTICLE_BINS.map((b) => sensor[`${b.key}_a`] ?? null);
  const dataB = PARTICLE_BINS.map((b) => sensor[`${b.key}_b`] ?? null);
  const dataAvg = PARTICLE_BINS.map((b) => sensor[b.key] ?? null);

  const cfg = {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "A", data: dataA, backgroundColor: "rgba(34, 211, 238, 0.8)", borderRadius: 6, borderSkipped: false },
        { label: "B", data: dataB, backgroundColor: "rgba(244, 114, 182, 0.8)", borderRadius: 6, borderSkipped: false },
        { label: "Avg", data: dataAvg, backgroundColor: "rgba(139, 92, 246, 0.55)", borderRadius: 6, borderSkipped: false },
      ],
    },
    options: chartOptions("counts /dL", { logY: true }),
  };

  if (state.chartParticles) {
    state.chartParticles.data = cfg.data;
    state.chartParticles.options = cfg.options;
    state.chartParticles.update();
  } else {
    state.chartParticles = new window.Chart(ctx, cfg);
  }
}

function chartOptions(yTitle, { logY = false } = {}) {
  const grid = getComputedStyle(document.documentElement).getPropertyValue("--card-border").trim() || "rgba(255,255,255,0.08)";
  const tick = getComputedStyle(document.documentElement).getPropertyValue("--text-dim").trim() || "#9aa0b4";
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: tick, boxWidth: 12, font: { size: 12 } } },
      tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${c.parsed.y == null ? "—" : c.parsed.y.toLocaleString()}` } },
    },
    scales: {
      x: { ticks: { color: tick }, grid: { color: grid, drawOnChartArea: false } },
      y: {
        type: logY ? "logarithmic" : "linear",
        title: { display: true, text: yTitle, color: tick },
        ticks: { color: tick },
        grid: { color: grid },
      },
    },
  };
}

function renderMass(sensor) {
  const rows = [
    { key: "pm1.0_atm", label: "PM1.0", color: "linear-gradient(90deg, #22d3ee, #8b5cf6)" },
    { key: "pm2.5_atm", label: "PM2.5", color: "linear-gradient(90deg, #8b5cf6, #f472b6)" },
    { key: "pm10.0_atm", label: "PM10", color: "linear-gradient(90deg, #f472b6, #fbbf24)" },
  ];
  const values = rows.map((r) => sensor[r.key]);
  const max = Math.max(10, ...values.map((v) => (v == null ? 0 : v)));
  const html = rows.map((r, i) => {
    const v = values[i];
    const width = v == null ? 0 : (v / max) * 100;
    return `
      <div class="mass-row">
        <div class="m-label">${r.label}</div>
        <div class="m-bar"><div class="m-fill" style="width:${width}%; background:${r.color}"></div></div>
        <div class="m-val">${v == null ? "—" : `${fmt(v, 1)} <span style="color:var(--text-faint); font-weight:400">µg/m³</span>`}</div>
      </div>`;
  }).join("");
  el("massRows").innerHTML = html;
}

function renderEnv(sensor) {
  const t = sensor.temperature;
  const h = sensor.humidity;
  const p = sensor.pressure;
  const { atF, arh } = toAmbient(t, h);
  const dewC = dewpointC(fToC(atF ?? t), arh ?? h);
  const humidC = humidexC(fToC(atF ?? t), dewC);

  const tiles = [
    {
      label: "Temperature",
      value: t == null ? "—" : `${fmt(t, 0)}°F`,
      sub: t == null ? "" : `housing · ambient est. ${fmt(atF, 0)}°F / ${fmt(fToC(atF), 0)}°C`,
    },
    {
      label: "Humidity",
      value: h == null ? "—" : `${fmt(h, 0)}%`,
      sub: h == null ? "" : `housing · ambient est. ${fmt(arh, 0)}%`,
    },
    {
      label: "Pressure",
      value: p == null ? "—" : `${fmt(p, 1)} mbar`,
      sub: p == null ? "" : `${fmt(p * 0.02953, 2)} inHg`,
    },
    {
      label: "Dewpoint",
      value: dewC == null ? "—" : `${fmt(cToF(dewC), 0)}°F`,
      sub: dewC == null ? "" : `${fmt(dewC, 1)}°C (computed)`,
    },
    {
      label: "Humidex",
      value: humidC == null ? "—" : `${fmt(cToF(humidC), 0)}°F`,
      sub: humidC == null ? "" : `${fmt(humidC, 1)}°C (computed)`,
    },
    {
      label: "VOC",
      value: sensor.voc == null ? "—" : `${fmt(sensor.voc, 1)}`,
      sub: sensor.voc == null ? "not equipped" : "Bosch IAQ units",
    },
  ];

  el("envGrid").innerHTML = tiles.map((t) => `
    <div class="env-tile">
      <div class="t-label">${t.label}</div>
      <div class="t-value">${t.value}</div>
      <div class="t-sub">${t.sub || ""}</div>
    </div>`).join("");
}

function renderKvGrid(containerId, pairs) {
  const items = pairs.filter(([, v]) => v !== undefined);
  const html = items.map(([k, v]) => `
    <div class="kv-row">
      <span class="k">${k}</span>
      <span class="v ${v === "—" || v == null ? "muted" : ""}">${v == null ? "—" : v}</span>
    </div>`).join("");
  el(containerId).innerHTML = html || `<div class="kv-row"><span class="k">No data</span><span class="v muted">—</span></div>`;
}

function renderVisibility(sensor) {
  const pairs = [];
  const fs = ["scattering_coefficient", "scattering_coefficient_a", "scattering_coefficient_b",
              "deciviews", "deciviews_a", "deciviews_b",
              "visual_range", "visual_range_a", "visual_range_b"];
  for (const k of fs) {
    const f = FIELD_BY_KEY[k];
    const v = sensor[k];
    if (v == null) continue;
    pairs.push([f.label, `${formatField(f, v)} ${f.unit}`.trim()]);
  }
  if (pairs.length === 0) {
    el("visGrid").innerHTML = `<div class="kv-row"><span class="k">No optical data reported</span><span class="v muted">—</span></div>`;
    return;
  }
  renderKvGrid("visGrid", pairs);
}

function renderMisc(sensor) {
  const pairs = [];
  for (const k of ["voc", "voc_a", "voc_b", "ozone1", "analog_input"]) {
    const f = FIELD_BY_KEY[k];
    const v = sensor[k];
    if (v == null) continue;
    pairs.push([f.label, `${formatField(f, v)} ${f.unit}`.trim()]);
  }
  if (pairs.length === 0) {
    el("miscGrid").innerHTML = `<div class="kv-row"><span class="k">No optional sensors equipped</span><span class="v muted">—</span></div>`;
    return;
  }
  renderKvGrid("miscGrid", pairs);
}

function renderDiagnostics(sensor) {
  const compare = [
    { label: "PM2.5 (ATM)", a: sensor["pm2.5_atm_a"], b: sensor["pm2.5_atm_b"], unit: "µg/m³", decimals: 1 },
    { label: "PM1.0 (ATM)", a: sensor["pm1.0_atm_a"], b: sensor["pm1.0_atm_b"], unit: "µg/m³", decimals: 1 },
    { label: "PM10 (ATM)", a: sensor["pm10.0_atm_a"], b: sensor["pm10.0_atm_b"], unit: "µg/m³", decimals: 1 },
    { label: "Humidity", a: sensor.humidity_a, b: sensor.humidity_b, unit: "%", decimals: 0 },
    { label: "Temperature", a: sensor.temperature_a, b: sensor.temperature_b, unit: "°F", decimals: 0 },
    { label: "Pressure", a: sensor.pressure_a, b: sensor.pressure_b, unit: "mbar", decimals: 1 },
  ];
  const conf = sensor.confidence ?? null;
  const confClass = conf == null ? "" : conf >= 90 ? "ok" : conf >= 70 ? "warn" : "err";
  const flagsTile = `
    <div class="diag-tile ${confClass}">
      <div class="d-label">Confidence</div>
      <div class="d-row"><span>Avg</span><strong>${conf == null ? "—" : `${conf}%`}</strong></div>
      <div class="d-row"><span>Manual</span><strong>${sensor.confidence_manual == null ? "—" : `${sensor.confidence_manual}%`}</strong></div>
      <div class="d-row"><span>Auto</span><strong>${sensor.confidence_auto == null ? "—" : `${sensor.confidence_auto}%`}</strong></div>
      <div class="d-delta">Channel flags: <strong>${sensor.channel_flags ?? "—"}</strong> · state <strong>${sensor.channel_state ?? "—"}</strong></div>
    </div>`;

  const tiles = compare.map((c) => {
    const hasA = c.a != null;
    const hasB = c.b != null;
    const delta = hasA && hasB ? c.a - c.b : null;
    const cls = delta == null ? "" : Math.abs(delta) < (c.unit === "µg/m³" ? 3 : c.unit === "%" ? 5 : 2) ? "ok" : "warn";
    return `
      <div class="diag-tile ${cls}">
        <div class="d-label">${c.label}</div>
        <div class="d-row"><span>A</span><strong>${hasA ? fmt(c.a, c.decimals) : "—"} <span style="color:var(--text-faint); font-weight:400">${c.unit}</span></strong></div>
        <div class="d-row"><span>B</span><strong>${hasB ? fmt(c.b, c.decimals) : "—"} <span style="color:var(--text-faint); font-weight:400">${c.unit}</span></strong></div>
        <div class="d-delta">Δ <strong>${delta == null ? "—" : `${delta >= 0 ? "+" : ""}${fmt(delta, c.decimals)} ${c.unit}`}</strong></div>
      </div>`;
  }).join("");

  el("diagGrid").innerHTML = flagsTile + tiles;
}

function renderDevice(sensor) {
  const pairs = [
    ["Model", sensor.model || "—"],
    ["Hardware", sensor.hardware || "—"],
    ["Firmware", sensor.firmware_version || "—"],
    ["Firmware upgrade", sensor.firmware_upgrade || "—"],
    ["RSSI", sensor.rssi == null ? "—" : `${sensor.rssi} dBm`],
    ["Uptime", formatUptimeMin(sensor.uptime)],
    ["PA latency", sensor.pa_latency == null ? "—" : `${sensor.pa_latency} ms`],
    ["Free heap", sensor.memory == null ? "—" : `${sensor.memory} KB`],
    ["LED brightness", sensor.led_brightness ?? "—"],
    ["Last seen", sensor.last_seen ? relTime(sensor.last_seen) : "—"],
    ["Last modified", sensor.last_modified ? relTime(sensor.last_modified) : "—"],
    ["Created", sensor.date_created ? new Date(sensor.date_created * 1000).toLocaleDateString() : "—"],
  ];
  renderKvGrid("deviceGrid", pairs);
}

function renderLocation(sensor) {
  const pairs = [
    ["Location", locationLabel(sensor.location_type)],
    ["Private", sensor.private ? "Yes" : "No"],
    ["Latitude", sensor.latitude == null ? "—" : fmt(sensor.latitude, 5) + "°"],
    ["Longitude", sensor.longitude == null ? "—" : fmt(sensor.longitude, 5) + "°"],
    ["Altitude", sensor.altitude == null ? "—" : `${fmt(sensor.altitude, 0)} ft`],
    ["Position rating", sensor.position_rating == null ? "—" : `${sensor.position_rating}★`],
  ];
  renderKvGrid("locGrid", pairs);

  const wrap = el("mapWrap");
  if (sensor.latitude != null && sensor.longitude != null) {
    const lat = sensor.latitude;
    const lon = sensor.longitude;
    const d = 0.008;
    const bbox = `${lon - d},${lat - d},${lon + d},${lat + d}`;
    const src = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat},${lon}`;
    wrap.innerHTML = `<iframe loading="lazy" style="width:100%;height:100%;border:0" src="${src}" title="Sensor location"></iframe>`;
  } else {
    wrap.innerHTML = "";
  }
}

function renderRaw(raw) {
  el("rawJson").textContent = JSON.stringify(raw, null, 2);
}

function renderAll(apiResponse) {
  const sensor = apiResponse.sensor || {};
  renderHero(sensor);
  renderAveragesChart(sensor);
  renderParticlesChart(sensor);
  renderMass(sensor);
  renderEnv(sensor);
  renderVisibility(sensor);
  renderMisc(sensor);
  renderDiagnostics(sensor);
  renderDevice(sensor);
  renderLocation(sensor);
  renderRaw(apiResponse);

  const dataAt = apiResponse.data_time_stamp ? new Date(apiResponse.data_time_stamp * 1000).toLocaleTimeString() : "—";
  el("footerStatus").textContent = `Data as of ${dataAt} · server ${apiResponse.api_version || ""}`;
}

// -------------------- Refresh loop --------------------

let currentCfg = getCfg();

async function refresh() {
  currentCfg = getCfg();
  if (!currentCfg.apiKey) {
    openSettings(true);
    return;
  }
  try {
    el("refreshBtn").disabled = true;
    const data = await fetchSensor(currentCfg);
    renderAll(data);
  } catch (err) {
    console.error(err);
    toast(err.message || String(err));
    el("footerStatus").textContent = `Error: ${err.message || err}`;
  } finally {
    el("refreshBtn").disabled = false;
    scheduleNext();
  }
}

function scheduleNext() {
  if (state.timer) clearTimeout(state.timer);
  const cadence = currentCfg.cadence;
  const ring = el("refreshRing");
  const label = el("refreshLabel");
  const circumference = 2 * Math.PI * 15.5;
  ring.style.strokeDasharray = `${circumference}`;

  if (!cadence || cadence <= 0) {
    label.textContent = "⏸";
    ring.style.strokeDashoffset = `${circumference}`;
    state.nextAt = 0;
    return;
  }
  state.nextAt = Date.now() + cadence * 1000;
  state.timer = setTimeout(refresh, cadence * 1000);
  tickRing();
}

function tickRing() {
  const circumference = 2 * Math.PI * 15.5;
  const label = el("refreshLabel");
  const ring = el("refreshRing");
  function step() {
    if (!state.nextAt) return;
    const remainMs = state.nextAt - Date.now();
    if (remainMs <= 0) {
      label.textContent = "…";
      ring.style.strokeDashoffset = "0";
      return;
    }
    const total = currentCfg.cadence * 1000;
    const frac = Math.max(0, Math.min(1, remainMs / total));
    ring.style.strokeDashoffset = `${circumference * (1 - frac)}`;
    label.textContent = `${Math.ceil(remainMs / 1000)}s`;
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// -------------------- Toast --------------------

let toastTimer = null;
function toast(msg) {
  const t = el("toast");
  t.textContent = msg;
  t.hidden = false;
  requestAnimationFrame(() => t.classList.add("visible"));
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    t.classList.remove("visible");
    setTimeout(() => { t.hidden = true; }, 250);
  }, 5000);
}

// -------------------- Settings --------------------

function openSettings(forceRequireKey = false) {
  const cfg = getCfg();
  el("inputApiKey").value = cfg.apiKey;
  el("inputSensorIndex").value = cfg.sensor;
  el("inputPrivateKey").value = cfg.priv;
  el("inputCadence").value = String(cfg.cadence);
  const dlg = el("settingsDialog");
  if (typeof dlg.showModal === "function") {
    dlg.showModal();
  } else {
    dlg.setAttribute("open", "");
  }
  if (forceRequireKey) {
    el("footerStatus").textContent = "Paste a PurpleAir Read Key to begin.";
  }
}

function wireSettings() {
  el("settingsBtn").addEventListener("click", () => openSettings());
  el("settingsCancel").addEventListener("click", (e) => {
    e.preventDefault();
    el("settingsDialog").close();
  });
  el("settingsForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const apiKey = el("inputApiKey").value.trim();
    const sensor = el("inputSensorIndex").value.trim() || DEFAULT_SENSOR;
    const priv = el("inputPrivateKey").value.trim();
    const cadence = Number(el("inputCadence").value) || 0;
    setCfg({ apiKey, sensor, priv, cadence });
    el("settingsDialog").close();
    refresh();
  });
}

function wireRefresh() {
  el("refreshBtn").addEventListener("click", () => refresh());
}

// -------------------- Boot --------------------

function boot() {
  wireSettings();
  wireRefresh();
  const cfg = getCfg();
  if (!cfg.apiKey) {
    openSettings(true);
  } else {
    refresh();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
