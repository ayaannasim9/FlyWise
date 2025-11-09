const decisionStyles = {
  book: {
    badge: "bg-emerald-100 text-emerald-800",
    gradient: "from-emerald-500 to-green-600",
    label: "Book now",
  },
  wait: {
    badge: "bg-amber-100 text-amber-800",
    gradient: "from-amber-500 to-orange-600",
    label: "Wait for a better deal",
  },
};

const formatCurrency = (value, currency) => {
  if ((value ?? null) === null) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${value}`;
  }
};

export default function AIRecommendations({
  data,
  currency = "GBP",
  onBook,
}) {
  if (!data) return null;
  const style = decisionStyles[data.decision] || decisionStyles.book;
  const windows = data.best_windows || [];
  const confidence = Math.round((data.confidence || 0) * 100);
  const stats = data.baseline_features || {};
  const packages = data.packages || [];

  return (
    <div className="bg-slate-900 text-white rounded-3xl shadow-2xl overflow-hidden">
      <div
        className={`p-6 sm:p-8 bg-gradient-to-br ${style.gradient} text-white`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em]">Gemini says</p>
            <h3 className="text-3xl sm:text-4xl font-black mt-2">
              {style.label}
            </h3>
            <p className="text-sm text-white/80 mt-1">
              Confidence {confidence || 0}%
            </p>
          </div>
          {onBook && data.decision === "book" && (
            <button
              type="button"
              onClick={onBook}
              className="px-4 py-2 rounded-full bg-white text-slate-900 text-xs font-semibold uppercase tracking-wide shadow-sm hover:bg-slate-100 transition"
            >
              Book
            </button>
          )}
        </div>
        {data.rationale && (
          <p className="mt-4 text-base text-white/90 leading-relaxed">
            {data.rationale}
          </p>
        )}
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        {windows.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Top travel windows
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {windows.map((window, idx) => (
                <div
                  key={`${window.start}-${idx}`}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4"
                >
                  <p className="text-sm text-slate-300">Option {idx + 1}</p>
                  <p className="text-lg font-semibold">
                    {window.start} → {window.end}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    {window.price
                      ? formatCurrency(window.price, currency)
                      : "Dynamic fare"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {Object.keys(stats).length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Market snapshot
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-4">
              {[
                { label: "Monthly min", value: stats.pmin },
                { label: "25th percentile", value: stats.p25 },
                { label: "Median", value: stats.p50 },
                {
                  label: "Trend (3d)",
                  value:
                    stats.trend3d !== undefined
                      ? `${(stats.trend3d * 100).toFixed(1)}%`
                      : null,
                  raw: true,
                },
              ].map(
                (item) =>
                  item.value !== undefined &&
                  item.value !== null && (
                    <div
                      key={item.label}
                      className="bg-white/5 border border-white/10 rounded-2xl p-4"
                    >
                      <p className="text-xs text-slate-400 uppercase">
                        {item.label}
                      </p>
                      <p className="text-lg font-semibold text-white mt-1">
                        {item.raw
                          ? item.value
                          : formatCurrency(item.value, currency)}
                      </p>
                    </div>
                  )
              )}
            </div>
          </div>
        )}

        {packages.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Curated packages
            </p>
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              {packages.map((pkg) => (
                <div
                  key={pkg.tier}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3"
                >
                  <div>
                    <p className="text-sm text-slate-300 uppercase tracking-wide">
                      {pkg.tier}
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(pkg.total_budget, currency)}
                    </p>
                  </div>
                  <div className="text-xs text-slate-400 space-y-1">
                    <p>
                      Flight ·{" "}
                      <span className="text-white font-semibold">
                        {formatCurrency(pkg.flight_price, currency)}
                      </span>
                    </p>
                    <p>
                      Hotel ·{" "}
                      <span className="text-white font-semibold">
                        {formatCurrency(pkg.hotel_price, currency)}
                      </span>
                    </p>
                  </div>
                  {pkg.activities?.length > 0 && (
                    <div className="text-xs text-slate-400">
                      <p className="font-semibold text-slate-200 mb-1">
                        Suggested activities
                      </p>
                      <ul className="space-y-1">
                        {pkg.activities.map((act, idx) => (
                          <li key={idx}>• {act}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
