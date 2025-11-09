import { useMemo, useState } from "react";

const propertyTypes = ["Hotel", "Apartment", "Villa", "Resort", "Boutique"];
const vibes = ["Modern", "Heritage", "Luxury", "Budget-Friendly", "Wellness"];
const amenitySuggestions = [
  "Pool",
  "Breakfast included",
  "Airport shuttle",
  "Family rooms",
  "Spa",
  "Executive lounge",
];

const formatCurrency = (value, currency) => {
  if ((value ?? null) === null) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(value);
  } catch {
    return `${currency} ${value}`;
  }
};

export default function HotelFinder({
  destinationCode,
  destinationName,
  arrivalDate,
  departureDate,
  travelers = 1,
  currency = "EUR",
  apiBaseUrl,
}) {
  const [propertyType, setPropertyType] = useState("Hotel");
  const [vibe, setVibe] = useState("Modern");
  const [amenities, setAmenities] = useState(["Pool", "Breakfast included"]);
  const [budget, setBudget] = useState("");
  const [results, setResults] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const destinationLabel = destinationName || destinationCode;
  const amenityText = useMemo(() => amenities.join(", "), [amenities]);

  const toggleAmenity = (item) => {
    setAmenities((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!destinationLabel || !arrivalDate || !departureDate) {
      setError("Complete your flight search first to pick dates and destination.");
      return;
    }

    setError("");
    setStatus("loading");
    setResults(null);

    const params = new URLSearchParams({
      destination: destinationLabel,
      arrival_date: arrivalDate,
      departure_date: departureDate,
      travelers: String(travelers),
      purpose: vibe.toLowerCase(),
      property_type: propertyType,
      vibe,
      must_have: amenityText || "clean, comfortable",
    });
    if (budget) params.set("budget_per_night", budget);

    try {
      const response = await fetch(`${apiBaseUrl}/hotels?${params.toString()}`);
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Unable to fetch hotel ideas.");
      }
      const data = await response.json();
      setResults(data);
      setStatus("success");
    } catch (err) {
      setError(err.message || "Something went wrong fetching hotel ideas.");
      setStatus("error");
    }
  };

  return (
    <div className="mt-12 bg-white rounded-3xl shadow-xl border border-white/60 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-blue-700 font-semibold">
            Booking.com concierge
          </p>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">
            Find the perfect stay in {destinationLabel}
          </h2>
          <p className="text-sm text-slate-500">
            {arrivalDate} → {departureDate} · {travelers} traveler
            {travelers > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="px-6 py-6 grid gap-6 lg:grid-cols-2"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Property type
            </label>
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="mt-2 w-full rounded-2xl border px-4 py-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {propertyTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Budget per night ({currency})
            </label>
            <input
              type="number"
              min={50}
              placeholder="e.g. 180"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="mt-2 w-full rounded-2xl border px-4 py-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Wanted vibe
            </label>
            <select
              value={vibe}
              onChange={(e) => setVibe(e.target.value)}
              className="mt-2 w-full rounded-2xl border px-4 py-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {vibes.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Must-have amenities
            </label>
            <div className="flex flex-wrap gap-2 mt-2">
              {amenitySuggestions.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => toggleAmenity(item)}
                  className={`px-4 py-2 rounded-full border text-sm font-semibold transition ${
                    amenities.includes(item)
                      ? "bg-blue-600 text-white border-blue-600"
                      : "border-gray-300 text-gray-600"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="lg:col-span-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
            {error}
          </div>
        )}

        <div className="lg:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={status === "loading"}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl disabled:opacity-60"
          >
            {status === "loading" ? "Fetching stays..." : "Show Booking.com stays"}
          </button>
        </div>
      </form>

      {status === "loading" && (
        <div className="px-6 pb-6 grid gap-4 lg:grid-cols-2">
          {[...Array(2)].map((_, index) => (
            <div
              key={index}
              className="h-40 bg-slate-100 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      )}

      {status === "success" && results?.hotels?.length > 0 && (
        <div className="px-6 pb-6 grid gap-6 lg:grid-cols-2">
          {results.hotels.map((hotel) => (
            <article
              key={hotel.name}
              className="border border-slate-100 rounded-2xl p-5 flex flex-col gap-3 bg-slate-50/60"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">
                    {hotel.name}
                  </h3>
                  <p className="text-sm text-slate-500">{hotel.area}</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold uppercase tracking-wide">
                  {hotel.suitability || "Great match"}
                </span>
              </div>

              <p className="text-lg font-bold text-slate-900">
                {formatCurrency(hotel.approx_price_per_night, currency)}{" "}
                <span className="text-sm font-normal text-slate-500">
                  / night
                </span>
              </p>

              <div className="text-sm text-slate-600 space-y-1">
                {hotel.pros?.length > 0 && (
                  <p>
                    <span className="font-semibold text-emerald-700">Pros:</span>{" "}
                    {hotel.pros.join(", ")}
                  </p>
                )}
                {hotel.cons?.length > 0 && (
                  <p>
                    <span className="font-semibold text-amber-600">Cons:</span>{" "}
                    {hotel.cons.join(", ")}
                  </p>
                )}
              </div>

              <a
                href={hotel.booking_link}
                target="_blank"
                rel="noreferrer"
                className="mt-auto inline-flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-2.5 rounded-2xl hover:bg-blue-700 transition"
              >
                View on Booking.com →
              </a>
            </article>
          ))}
        </div>
      )}

      {status === "success" && (!results?.hotels || results.hotels.length === 0) && (
        <div className="px-6 pb-6 text-center text-sm text-slate-500">
          No hotel suggestions were generated. Try adjusting your filters.
        </div>
      )}
    </div>
  );
}
