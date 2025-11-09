const fetch = global.fetch || require("node-fetch");

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

const AQI_SCALE = {
  1: { label: "Good", color: "#16a34a", advice: "Air quality is excellent. Enjoy outdoor plans freely." },
  2: { label: "Fair", color: "#84cc16", advice: "Air quality is acceptable. Sensitive groups can remain cautious." },
  3: { label: "Moderate", color: "#facc15", advice: "Consider shorter outdoor exposure, especially if you have respiratory sensitivities." },
  4: { label: "Poor", color: "#f97316", advice: "Limit prolonged outdoor exertion and keep medication handy." },
  5: { label: "Very Poor", color: "#dc2626", advice: "Stay indoors when possible and use filtration masks outside." },
};

const toUnix = (date) => Math.floor(new Date(date).getTime() / 1000);

async function fetchAqiForecast({ lat, lon }) {
  if (!OPENWEATHER_API_KEY) {
    throw new Error("OPENWEATHER_API_KEY is not configured.");
  }
  const url = `https://api.openweathermap.org/data/2.5/air_pollution/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`;
  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Unable to fetch AQI forecast.");
  }
  return response.json();
}

function bucketByDay(list, start, end) {
  const startTs = toUnix(start);
  const endTs = toUnix(end);
  const byDate = {};

  list.forEach((entry) => {
    if (entry.dt < startTs || entry.dt > endTs) return;
    const date = new Date(entry.dt * 1000).toISOString().slice(0, 10);
    const existing = byDate[date];
    if (!existing || entry.main.aqi > existing.main.aqi) {
      byDate[date] = entry;
    }
  });

  return Object.keys(byDate)
    .sort()
    .map((date) => {
      const { main, components } = byDate[date];
      const meta = AQI_SCALE[main.aqi] || AQI_SCALE[3];
      return {
        date,
        aqi: main.aqi,
        label: meta.label,
        advice: meta.advice,
        color: meta.color,
        components,
      };
    });
}

async function getHealthInsight({ lat, lon, startDate, endDate }) {
  const raw = await fetchAqiForecast({ lat, lon });
  const windowed = bucketByDay(raw.list || [], startDate, endDate);
  const worst = windowed.reduce(
    (acc, day) => (day.aqi > acc.aqi ? day : acc),
    windowed[0] || { aqi: 0, advice: "No data" }
  );

  return {
    window: windowed,
    summary: worst
      ? `Highest AQI reaches ${worst.label.toLowerCase()} around ${worst.date}. ${worst.advice}`
      : "No air quality data for this itinerary.",
  };
}

module.exports = {
  getHealthInsight,
};
