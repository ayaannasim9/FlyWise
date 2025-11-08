const formatTime = (iso) => {
  if (!iso) return "--:--";
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDate = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

const formatDuration = (minutes) => {
  if (!minutes) return "—";
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
};

const formatCurrency = (amount, currency = "USD") => {
  if ((amount ?? null) === null || Number.isNaN(amount)) return "See details";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
};

export default function ResultsCard({ flight, isBest = false }) {
  if (!flight) return null;
  const { price, currency, legs = [], total_duration_mins } = flight;
  const headline = legs[0];

  return (
    <div className="bg-white/95 backdrop-blur rounded-3xl shadow-xl border border-white/60 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-gradient-to-r from-blue-600/10 to-indigo-600/10">
        <div>
          <p className="text-sm text-gray-500 uppercase tracking-wide">
            From {headline?.from} to {headline?.to}
          </p>
          <p className="text-2xl font-bold text-slate-900">
            {formatCurrency(price, currency)}
          </p>
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Total duration • {formatDuration(total_duration_mins)}
          </p>
        </div>

        <div className="text-right">
          {isBest && (
            <span className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold uppercase tracking-wide">
              Best value
            </span>
          )}
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {legs.map((leg, index) => (
          <div key={leg.leg_id || index} className="p-6 flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xl font-semibold text-slate-900">
                  {leg.from} → {leg.to}
                </p>
                <p className="text-sm text-gray-500">
                  {formatDate(leg.departure)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                  {leg.airline || "Multiple airlines"}
                </p>
                <p className="text-xs text-gray-400">
                  {leg.stops === 0 ? "Non-stop" : `${leg.stops} stop${
                    leg.stops > 1 ? "s" : ""
                  }`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-xl font-bold text-slate-900">
                  {formatTime(leg.departure)}
                </p>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  {leg.from}
                </p>
              </div>

              <div className="flex-1">
                <div className="flex justify-between text-xs text-gray-400 uppercase tracking-wide">
                  <span>{formatDuration(leg.duration_mins)}</span>
                  <span>{leg.stops === 0 ? "Direct" : "Stopover"}</span>
                </div>
                <div className="h-1 bg-gradient-to-r from-blue-200 to-indigo-300 rounded-full mt-2" />
              </div>

              <div className="text-center">
                <p className="text-xl font-bold text-slate-900">
                  {formatTime(leg.arrival)}
                </p>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  {leg.to}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
