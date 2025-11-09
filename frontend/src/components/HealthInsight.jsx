const severityColors = {
  1: "bg-emerald-100 text-emerald-800",
  2: "bg-lime-100 text-lime-800",
  3: "bg-amber-100 text-amber-800",
  4: "bg-orange-100 text-orange-800",
  5: "bg-red-100 text-red-800",
};

export default function HealthInsight({ data, status, error }) {
  if (status === "loading") {
    return (
      <div className="bg-white rounded-3xl shadow-xl border border-white/60 p-6">
        <div className="animate-pulse h-24 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-3xl shadow-xl border border-white/60 p-6 text-sm text-red-500">
        {error}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-white/60 p-6 space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-blue-700 font-semibold">
          Health & Air Quality
        </p>
        <h2 className="text-2xl font-bold text-gray-900 mt-1">Is it safe to breathe?</h2>
        <p className="text-sm text-gray-500">{data.summary}</p>
      </div>

      <div className="space-y-2">
        {data.window?.map((day) => (
          <div
            key={day.date}
            className="flex items-center justify-between border border-slate-100 rounded-2xl px-4 py-2"
          >
            <div>
              <p className="text-sm font-semibold text-slate-900">{day.date}</p>
              <p className="text-xs text-slate-500">{day.advice}</p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${severityColors[day.aqi] || "bg-slate-100 text-slate-600"}`}
            >
              {day.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
