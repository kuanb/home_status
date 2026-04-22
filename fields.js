// Source of truth for every field we request from
// GET https://api.purpleair.com/v1/sensors/:sensor_index
// Groups drive both the `fields=` query string and the UI rendering.
//
// Obsolete ThingSpeak fields are intentionally excluded per the PurpleAir docs.

export const GROUPS = {
  station: "Station & status",
  env: "Environment",
  misc: "Miscellaneous",
  pm1: "PM1.0",
  pm25: "PM2.5",
  pm25avg: "PM2.5 averages",
  pm10: "PM10.0",
  counts: "Particle counts",
  visibility: "Visibility",
};

const CH = { avg: "avg", a: "A", b: "B" };

export const FIELDS = [
  // Station info and status
  { key: "name", group: "station", label: "Name", unit: "", type: "string" },
  { key: "icon", group: "station", label: "Icon", unit: "", type: "int" },
  { key: "model", group: "station", label: "Model", unit: "", type: "string" },
  { key: "hardware", group: "station", label: "Hardware", unit: "", type: "string" },
  { key: "location_type", group: "station", label: "Location", unit: "", type: "locationType" },
  { key: "private", group: "station", label: "Private", unit: "", type: "bool01" },
  { key: "latitude", group: "station", label: "Latitude", unit: "°", type: "number", decimals: 4 },
  { key: "longitude", group: "station", label: "Longitude", unit: "°", type: "number", decimals: 4 },
  { key: "altitude", group: "station", label: "Altitude", unit: "ft", type: "number", decimals: 0 },
  { key: "position_rating", group: "station", label: "Position rating", unit: "★", type: "stars" },
  { key: "led_brightness", group: "station", label: "LED brightness", unit: "", type: "int" },
  { key: "firmware_version", group: "station", label: "Firmware", unit: "", type: "string" },
  { key: "firmware_upgrade", group: "station", label: "Firmware upgrade", unit: "", type: "string" },
  { key: "rssi", group: "station", label: "Wi-Fi RSSI", unit: "dBm", type: "int" },
  { key: "uptime", group: "station", label: "Uptime", unit: "min", type: "uptime" },
  { key: "pa_latency", group: "station", label: "PA latency", unit: "ms", type: "int" },
  { key: "memory", group: "station", label: "Free heap", unit: "KB", type: "int" },
  { key: "last_seen", group: "station", label: "Last seen", unit: "", type: "timestamp" },
  { key: "last_modified", group: "station", label: "Last modified", unit: "", type: "timestamp" },
  { key: "date_created", group: "station", label: "Created", unit: "", type: "timestamp" },
  { key: "channel_state", group: "station", label: "Channel state", unit: "", type: "int" },
  { key: "channel_flags", group: "station", label: "Channel flags", unit: "", type: "int" },
  { key: "channel_flags_manual", group: "station", label: "Channel flags (manual)", unit: "", type: "int" },
  { key: "channel_flags_auto", group: "station", label: "Channel flags (auto)", unit: "", type: "int" },
  { key: "confidence", group: "station", label: "Confidence", unit: "%", type: "int" },
  { key: "confidence_manual", group: "station", label: "Confidence (manual)", unit: "%", type: "int" },
  { key: "confidence_auto", group: "station", label: "Confidence (auto)", unit: "%", type: "int" },

  // Environment
  { key: "humidity", group: "env", label: "Humidity", unit: "%", type: "number", decimals: 0, channel: CH.avg },
  { key: "humidity_a", group: "env", label: "Humidity A", unit: "%", type: "number", decimals: 0, channel: CH.a },
  { key: "humidity_b", group: "env", label: "Humidity B", unit: "%", type: "number", decimals: 0, channel: CH.b },
  { key: "temperature", group: "env", label: "Temperature", unit: "°F", type: "number", decimals: 0, channel: CH.avg },
  { key: "temperature_a", group: "env", label: "Temperature A", unit: "°F", type: "number", decimals: 0, channel: CH.a },
  { key: "temperature_b", group: "env", label: "Temperature B", unit: "°F", type: "number", decimals: 0, channel: CH.b },
  { key: "pressure", group: "env", label: "Pressure", unit: "mbar", type: "number", decimals: 1, channel: CH.avg },
  { key: "pressure_a", group: "env", label: "Pressure A", unit: "mbar", type: "number", decimals: 1, channel: CH.a },
  { key: "pressure_b", group: "env", label: "Pressure B", unit: "mbar", type: "number", decimals: 1, channel: CH.b },

  // Misc
  { key: "voc", group: "misc", label: "VOC", unit: "IAQ", type: "number", decimals: 1, channel: CH.avg },
  { key: "voc_a", group: "misc", label: "VOC A", unit: "IAQ", type: "number", decimals: 1, channel: CH.a },
  { key: "voc_b", group: "misc", label: "VOC B", unit: "IAQ", type: "number", decimals: 1, channel: CH.b },
  { key: "ozone1", group: "misc", label: "Ozone", unit: "ppb", type: "number", decimals: 1 },
  { key: "analog_input", group: "misc", label: "Analog input", unit: "V", type: "number", decimals: 2 },

  // Visibility / scattering
  { key: "scattering_coefficient", group: "visibility", label: "Scattering coefficient", unit: "Mm⁻¹", type: "number", decimals: 2, channel: CH.avg },
  { key: "scattering_coefficient_a", group: "visibility", label: "Scattering A", unit: "Mm⁻¹", type: "number", decimals: 2, channel: CH.a },
  { key: "scattering_coefficient_b", group: "visibility", label: "Scattering B", unit: "Mm⁻¹", type: "number", decimals: 2, channel: CH.b },
  { key: "deciviews", group: "visibility", label: "Deciviews", unit: "dv", type: "number", decimals: 2, channel: CH.avg },
  { key: "deciviews_a", group: "visibility", label: "Deciviews A", unit: "dv", type: "number", decimals: 2, channel: CH.a },
  { key: "deciviews_b", group: "visibility", label: "Deciviews B", unit: "dv", type: "number", decimals: 2, channel: CH.b },
  { key: "visual_range", group: "visibility", label: "Visual range", unit: "mi", type: "number", decimals: 1, channel: CH.avg },
  { key: "visual_range_a", group: "visibility", label: "Visual range A", unit: "mi", type: "number", decimals: 1, channel: CH.a },
  { key: "visual_range_b", group: "visibility", label: "Visual range B", unit: "mi", type: "number", decimals: 1, channel: CH.b },

  // PM1.0
  { key: "pm1.0", group: "pm1", label: "PM1.0", unit: "µg/m³", type: "number", decimals: 1, channel: CH.avg },
  { key: "pm1.0_a", group: "pm1", label: "PM1.0 A", unit: "µg/m³", type: "number", decimals: 1, channel: CH.a },
  { key: "pm1.0_b", group: "pm1", label: "PM1.0 B", unit: "µg/m³", type: "number", decimals: 1, channel: CH.b },
  { key: "pm1.0_atm", group: "pm1", label: "PM1.0 ATM", unit: "µg/m³", type: "number", decimals: 1, channel: CH.avg },
  { key: "pm1.0_atm_a", group: "pm1", label: "PM1.0 ATM A", unit: "µg/m³", type: "number", decimals: 1, channel: CH.a },
  { key: "pm1.0_atm_b", group: "pm1", label: "PM1.0 ATM B", unit: "µg/m³", type: "number", decimals: 1, channel: CH.b },
  { key: "pm1.0_cf_1", group: "pm1", label: "PM1.0 CF=1", unit: "µg/m³", type: "number", decimals: 1, channel: CH.avg },
  { key: "pm1.0_cf_1_a", group: "pm1", label: "PM1.0 CF=1 A", unit: "µg/m³", type: "number", decimals: 1, channel: CH.a },
  { key: "pm1.0_cf_1_b", group: "pm1", label: "PM1.0 CF=1 B", unit: "µg/m³", type: "number", decimals: 1, channel: CH.b },

  // PM2.5 current
  { key: "pm2.5_alt", group: "pm25", label: "PM2.5 ALT", unit: "µg/m³", type: "number", decimals: 1, channel: CH.avg },
  { key: "pm2.5_alt_a", group: "pm25", label: "PM2.5 ALT A", unit: "µg/m³", type: "number", decimals: 1, channel: CH.a },
  { key: "pm2.5_alt_b", group: "pm25", label: "PM2.5 ALT B", unit: "µg/m³", type: "number", decimals: 1, channel: CH.b },
  { key: "pm2.5", group: "pm25", label: "PM2.5", unit: "µg/m³", type: "number", decimals: 1, channel: CH.avg },
  { key: "pm2.5_a", group: "pm25", label: "PM2.5 A", unit: "µg/m³", type: "number", decimals: 1, channel: CH.a },
  { key: "pm2.5_b", group: "pm25", label: "PM2.5 B", unit: "µg/m³", type: "number", decimals: 1, channel: CH.b },
  { key: "pm2.5_atm", group: "pm25", label: "PM2.5 ATM", unit: "µg/m³", type: "number", decimals: 1, channel: CH.avg },
  { key: "pm2.5_atm_a", group: "pm25", label: "PM2.5 ATM A", unit: "µg/m³", type: "number", decimals: 1, channel: CH.a },
  { key: "pm2.5_atm_b", group: "pm25", label: "PM2.5 ATM B", unit: "µg/m³", type: "number", decimals: 1, channel: CH.b },
  { key: "pm2.5_cf_1", group: "pm25", label: "PM2.5 CF=1", unit: "µg/m³", type: "number", decimals: 1, channel: CH.avg },
  { key: "pm2.5_cf_1_a", group: "pm25", label: "PM2.5 CF=1 A", unit: "µg/m³", type: "number", decimals: 1, channel: CH.a },
  { key: "pm2.5_cf_1_b", group: "pm25", label: "PM2.5 CF=1 B", unit: "µg/m³", type: "number", decimals: 1, channel: CH.b },

  // PM2.5 running averages
  { key: "pm2.5_10minute", group: "pm25avg", label: "PM2.5 10 min", unit: "µg/m³", type: "number", decimals: 1, channel: CH.avg },
  { key: "pm2.5_10minute_a", group: "pm25avg", label: "PM2.5 10 min A", unit: "µg/m³", type: "number", decimals: 1, channel: CH.a },
  { key: "pm2.5_10minute_b", group: "pm25avg", label: "PM2.5 10 min B", unit: "µg/m³", type: "number", decimals: 1, channel: CH.b },
  { key: "pm2.5_30minute", group: "pm25avg", label: "PM2.5 30 min", unit: "µg/m³", type: "number", decimals: 1, channel: CH.avg },
  { key: "pm2.5_30minute_a", group: "pm25avg", label: "PM2.5 30 min A", unit: "µg/m³", type: "number", decimals: 1, channel: CH.a },
  { key: "pm2.5_30minute_b", group: "pm25avg", label: "PM2.5 30 min B", unit: "µg/m³", type: "number", decimals: 1, channel: CH.b },
  { key: "pm2.5_60minute", group: "pm25avg", label: "PM2.5 60 min", unit: "µg/m³", type: "number", decimals: 1, channel: CH.avg },
  { key: "pm2.5_60minute_a", group: "pm25avg", label: "PM2.5 60 min A", unit: "µg/m³", type: "number", decimals: 1, channel: CH.a },
  { key: "pm2.5_60minute_b", group: "pm25avg", label: "PM2.5 60 min B", unit: "µg/m³", type: "number", decimals: 1, channel: CH.b },
  { key: "pm2.5_6hour", group: "pm25avg", label: "PM2.5 6 hour", unit: "µg/m³", type: "number", decimals: 1, channel: CH.avg },
  { key: "pm2.5_6hour_a", group: "pm25avg", label: "PM2.5 6 hour A", unit: "µg/m³", type: "number", decimals: 1, channel: CH.a },
  { key: "pm2.5_6hour_b", group: "pm25avg", label: "PM2.5 6 hour B", unit: "µg/m³", type: "number", decimals: 1, channel: CH.b },
  { key: "pm2.5_24hour", group: "pm25avg", label: "PM2.5 24 hour", unit: "µg/m³", type: "number", decimals: 1, channel: CH.avg },
  { key: "pm2.5_24hour_a", group: "pm25avg", label: "PM2.5 24 hour A", unit: "µg/m³", type: "number", decimals: 1, channel: CH.a },
  { key: "pm2.5_24hour_b", group: "pm25avg", label: "PM2.5 24 hour B", unit: "µg/m³", type: "number", decimals: 1, channel: CH.b },
  { key: "pm2.5_1week", group: "pm25avg", label: "PM2.5 1 week", unit: "µg/m³", type: "number", decimals: 1, channel: CH.avg },
  { key: "pm2.5_1week_a", group: "pm25avg", label: "PM2.5 1 week A", unit: "µg/m³", type: "number", decimals: 1, channel: CH.a },
  { key: "pm2.5_1week_b", group: "pm25avg", label: "PM2.5 1 week B", unit: "µg/m³", type: "number", decimals: 1, channel: CH.b },

  // PM10.0
  { key: "pm10.0", group: "pm10", label: "PM10", unit: "µg/m³", type: "number", decimals: 1, channel: CH.avg },
  { key: "pm10.0_a", group: "pm10", label: "PM10 A", unit: "µg/m³", type: "number", decimals: 1, channel: CH.a },
  { key: "pm10.0_b", group: "pm10", label: "PM10 B", unit: "µg/m³", type: "number", decimals: 1, channel: CH.b },
  { key: "pm10.0_atm", group: "pm10", label: "PM10 ATM", unit: "µg/m³", type: "number", decimals: 1, channel: CH.avg },
  { key: "pm10.0_atm_a", group: "pm10", label: "PM10 ATM A", unit: "µg/m³", type: "number", decimals: 1, channel: CH.a },
  { key: "pm10.0_atm_b", group: "pm10", label: "PM10 ATM B", unit: "µg/m³", type: "number", decimals: 1, channel: CH.b },
  { key: "pm10.0_cf_1", group: "pm10", label: "PM10 CF=1", unit: "µg/m³", type: "number", decimals: 1, channel: CH.avg },
  { key: "pm10.0_cf_1_a", group: "pm10", label: "PM10 CF=1 A", unit: "µg/m³", type: "number", decimals: 1, channel: CH.a },
  { key: "pm10.0_cf_1_b", group: "pm10", label: "PM10 CF=1 B", unit: "µg/m³", type: "number", decimals: 1, channel: CH.b },

  // Particle counts
  { key: "0.3_um_count", group: "counts", label: "0.3 µm count", unit: "/dL", type: "number", decimals: 0, channel: CH.avg },
  { key: "0.3_um_count_a", group: "counts", label: "0.3 µm A", unit: "/dL", type: "number", decimals: 0, channel: CH.a },
  { key: "0.3_um_count_b", group: "counts", label: "0.3 µm B", unit: "/dL", type: "number", decimals: 0, channel: CH.b },
  { key: "0.5_um_count", group: "counts", label: "0.5 µm count", unit: "/dL", type: "number", decimals: 0, channel: CH.avg },
  { key: "0.5_um_count_a", group: "counts", label: "0.5 µm A", unit: "/dL", type: "number", decimals: 0, channel: CH.a },
  { key: "0.5_um_count_b", group: "counts", label: "0.5 µm B", unit: "/dL", type: "number", decimals: 0, channel: CH.b },
  { key: "1.0_um_count", group: "counts", label: "1.0 µm count", unit: "/dL", type: "number", decimals: 0, channel: CH.avg },
  { key: "1.0_um_count_a", group: "counts", label: "1.0 µm A", unit: "/dL", type: "number", decimals: 0, channel: CH.a },
  { key: "1.0_um_count_b", group: "counts", label: "1.0 µm B", unit: "/dL", type: "number", decimals: 0, channel: CH.b },
  { key: "2.5_um_count", group: "counts", label: "2.5 µm count", unit: "/dL", type: "number", decimals: 0, channel: CH.avg },
  { key: "2.5_um_count_a", group: "counts", label: "2.5 µm A", unit: "/dL", type: "number", decimals: 0, channel: CH.a },
  { key: "2.5_um_count_b", group: "counts", label: "2.5 µm B", unit: "/dL", type: "number", decimals: 0, channel: CH.b },
  { key: "5.0_um_count", group: "counts", label: "5.0 µm count", unit: "/dL", type: "number", decimals: 0, channel: CH.avg },
  { key: "5.0_um_count_a", group: "counts", label: "5.0 µm A", unit: "/dL", type: "number", decimals: 0, channel: CH.a },
  { key: "5.0_um_count_b", group: "counts", label: "5.0 µm B", unit: "/dL", type: "number", decimals: 0, channel: CH.b },
  { key: "10.0_um_count", group: "counts", label: "10.0 µm count", unit: "/dL", type: "number", decimals: 0, channel: CH.avg },
  { key: "10.0_um_count_a", group: "counts", label: "10.0 µm A", unit: "/dL", type: "number", decimals: 0, channel: CH.a },
  { key: "10.0_um_count_b", group: "counts", label: "10.0 µm B", unit: "/dL", type: "number", decimals: 0, channel: CH.b },
];

export const FIELD_BY_KEY = Object.fromEntries(FIELDS.map((f) => [f.key, f]));

// Join all field keys into the comma-separated `fields=` query param.
export function buildFieldsParam() {
  return FIELDS.map((f) => f.key).join(",");
}

// Particle size bins used by the distribution chart.
export const PARTICLE_BINS = [
  { key: "0.3_um_count", label: "0.3 µm" },
  { key: "0.5_um_count", label: "0.5 µm" },
  { key: "1.0_um_count", label: "1.0 µm" },
  { key: "2.5_um_count", label: "2.5 µm" },
  { key: "5.0_um_count", label: "5.0 µm" },
  { key: "10.0_um_count", label: "10.0 µm" },
];

// PM2.5 average series used by the averages chart.
// `stats` keys come from the top-level `stats` object in the response.
export const PM25_AVG_SERIES = [
  { label: "now", statKey: "pm2.5", fieldKey: "pm2.5" },
  { label: "10m", statKey: "pm2.5_10minute", fieldKey: "pm2.5_10minute" },
  { label: "30m", statKey: "pm2.5_30minute", fieldKey: "pm2.5_30minute" },
  { label: "60m", statKey: "pm2.5_60minute", fieldKey: "pm2.5_60minute" },
  { label: "6h", statKey: "pm2.5_6hour", fieldKey: "pm2.5_6hour" },
  { label: "24h", statKey: "pm2.5_24hour", fieldKey: "pm2.5_24hour" },
  { label: "1w", statKey: "pm2.5_1week", fieldKey: "pm2.5_1week" },
];
