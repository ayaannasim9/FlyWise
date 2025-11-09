import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ResultsCard from "../components/ResultsCard";
import AIRecommendations from "../components/AIRecommendations";
import HotelFinder from "../components/HotelFinder";
import FlightTrackerWidget from "../components/FlightTrackerWidget";
import AIPlaceholder from "../components/AIPlaceholder";
import LanguageBuddy from "../components/LanguageBuddy";
import HealthInsight from "../components/HealthInsight";
import airports from "../airportData";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const AI_BASE_URL =
  import.meta.env.VITE_AI_API_BASE_URL || "http://localhost:7860";

const airportByCode = Object.fromEntries(
  airports.map((airport) => [airport.code, airport])
);

export default function Results() {
  const [searchParams] = useSearchParams();
  const paramsString = searchParams.toString();
  const tripType = searchParams.get("tripType") || "roundtrip";
  const hasQuery =
    searchParams.has("departure_airport_code") &&
    searchParams.has("arrival_airport_code") &&
    searchParams.has("departure_date");

  const [status, setStatus] = useState(hasQuery ? "loading" : "idle");
  const [flights, setFlights] = useState([]);
  const [error, setError] = useState("");
  const [aiStatus, setAiStatus] = useState("idle");
  const [aiData, setAiData] = useState(null);
  const [aiError, setAiError] = useState("");
  const [routeInsights, setRouteInsights] = useState([]);
  const [routeInsightsEnabled, setRouteInsightsEnabled] = useState(false);
  const [healthStatus, setHealthStatus] = useState("idle");
  const [healthData, setHealthData] = useState(null);
  const [healthError, setHealthError] = useState("");

  const tripSummary = useMemo(() => {
      const travelerCount =
        Number(searchParams.get("number_of_adults") || 0) +
        Number(searchParams.get("number_of_children") || 0) +
        Number(searchParams.get("number_of_infants") || 0);

    const depart = searchParams.get("departure_date");
    const returnDate = searchParams.get("arrival_date");

    let stayLen = Number(searchParams.get("stay_len"));
    stayLen = Number.isFinite(stayLen) && stayLen > 0 ? stayLen : undefined;

    if (!stayLen && depart && returnDate) {
      const start = new Date(depart);
      const end = new Date(returnDate);
      const diff =
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      if (!Number.isNaN(diff) && diff > 0) {
        stayLen = Math.round(diff);
      }
    }

    const month = depart?.slice(0, 7) || null;
    const toCode = searchParams.get("arrival_airport_code");
    const toAirport = airportByCode[toCode] || {};

    return {
      from: searchParams.get("departure_airport_code"),
      to: toCode,
      toName: toAirport.name || toCode,
      toCity: toAirport.city || toAirport.name || toCode,
      language: toAirport.language || "en",
      lat: toAirport.lat,
      lon: toAirport.lon,
      depart,
      returnDate,
      cabin: searchParams.get("cabin_class") || "Economy",
      travelers: Math.max(travelerCount, 1),
      currency: searchParams.get("currency") || "EUR",
      stayLen: stayLen || 7,
      month,
    };
  }, [searchParams]);

  const hasAiInputs =
    Boolean(tripSummary.from && tripSummary.to && tripSummary.month && tripSummary.stayLen) &&
    hasQuery;

  const aiItineraries = useMemo(
    () =>
      flights.slice(0, 5).map((flight) => ({
        price: flight.price,
        currency: flight.currency,
        legs: (flight.legs || []).map((leg) => ({
          departure: leg.departure,
          arrival: leg.arrival,
          from: leg.from,
          to: leg.to,
        })),
      })),
    [flights]
  );

  const aiPlaceholderMessage = useMemo(() => {
    if (aiError?.includes("No mock data")) {
      return "Waiting for fresh fare data from the airlines. Try another date or refresh once we have quotes.";
    }
    if (aiError) {
      return "Gemini couldn't reach our travel insights right now. Give it another try in a moment.";
    }
    return "Crunching routes, fares, and hotel intel for your trip.";
  }, [aiError]);

  const bookingFlightUrl = useMemo(() => {
    if (!tripSummary.from || !tripSummary.to || !tripSummary.depart) return "";
    const bestWindow = aiData?.best_windows?.[0];
    const outbound = bestWindow?.start || tripSummary.depart;
    const inbound =
      tripType === "oneway"
        ? undefined
        : bestWindow?.end || tripSummary.returnDate || tripSummary.depart;
    const params = new URLSearchParams({
      origin_iata: tripSummary.from,
      destination_iata: tripSummary.to,
      tripType: tripType === "oneway" ? "oneway" : "roundtrip",
      depart: outbound,
      adults: String(tripSummary.travelers),
    });
    if (inbound) params.set("return", inbound);
    return `https://www.booking.com/flights/search/${tripSummary.from}.${tripSummary.to}.roundtrip-1/en-gb?${params.toString()}`;
  }, [
    tripSummary.from,
    tripSummary.to,
    tripSummary.depart,
    tripSummary.returnDate,
    tripSummary.travelers,
    tripType,
    aiData,
  ]);

  useEffect(() => {
    if (!hasQuery) return;

    const controller = new AbortController();
    const fetchFlights = async () => {
      setStatus("loading");
      setError("");
      try {
        const endpoint = tripType === "oneway" ? "oneway" : "roundtrip";
        const outgoingParams = new URLSearchParams(paramsString);
        outgoingParams.delete("tripType");

        const response = await fetch(
          `${API_BASE_URL}/${endpoint}?${outgoingParams.toString()}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          const message = await response.text();
          throw new Error(
            message || "Unable to fetch flights. Please try again."
          );
        }

        const data = await response.json();
        setFlights(Array.isArray(data) ? data : []);
        setStatus("success");
      } catch (err) {
        if (err.name === "AbortError") return;
        setError(err.message || "Something went wrong fetching flights.");
        setStatus("error");
      }
    };

    fetchFlights();
    return () => controller.abort();
  }, [paramsString, tripType, hasQuery]);

  useEffect(() => {
    if (!hasAiInputs) {
      setAiStatus("idle");
      setAiData(null);
      return;
    }

    const controller = new AbortController();
    const fetchRecommendation = async () => {
      setAiStatus("loading");
      setAiError("");
      try {
        const response = await fetch(`${AI_BASE_URL}/recommend`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            origin: tripSummary.from,
            destination: tripSummary.to,
            month: tripSummary.month,
            stay_len: tripSummary.stayLen,
            itineraries: aiItineraries,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const message = await response.text();
          throw new Error(
            message || "Unable to fetch AI recommendation. Please try again."
          );
        }

        const data = await response.json();
        setAiData(data);
        setAiStatus("success");
      } catch (err) {
        if (err.name === "AbortError") return;
        setAiError(
          err.message || "Something went wrong fetching AI insights."
        );
        setAiStatus("error");
      }
    };

    fetchRecommendation();
    return () => controller.abort();
  }, [
    hasAiInputs,
    tripSummary.from,
    tripSummary.to,
    tripSummary.month,
    tripSummary.stayLen,
    aiItineraries,
  ]);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/analytics/routes`);
        if (!res.ok) throw new Error("Failed to load analytics");
        const data = await res.json();
        setRouteInsightsEnabled(Boolean(data.enabled));
        setRouteInsights(data.routes || []);
      } catch {
        setRouteInsightsEnabled(false);
        setRouteInsights([]);
      }
    };
    fetchInsights();
  }, []);

  useEffect(() => {
    if (!tripSummary.lat || !tripSummary.lon || !tripSummary.depart) return;
    const endDate = tripSummary.returnDate || tripSummary.depart;
    setHealthStatus("loading");
    setHealthError("");
    fetch(
      `${API_BASE_URL}/health/aqi?lat=${tripSummary.lat}&lon=${tripSummary.lon}&start=${tripSummary.depart}&end=${endDate}`
    )
      .then(async (res) => {
        if (!res.ok) throw new Error("Unable to fetch air quality.");
        return res.json();
      })
      .then((data) => {
        setHealthData(data);
        setHealthStatus("success");
      })
      .catch((err) => {
        setHealthError(err.message);
        setHealthStatus("error");
      });
  }, [tripSummary.lat, tripSummary.lon, tripSummary.depart, tripSummary.returnDate]);

  const formatDate = (value) => {
    if (!value) return "";
    return new Date(value).toLocaleDateString(undefined, {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleBookNow = () => {
    if (bookingFlightUrl) {
      window.open(bookingFlightUrl, "_blank", "noreferrer");
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-white pb-16">
      <div className="max-w-6xl mx-auto px-4 pt-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-blue-700 hover:text-blue-900 font-semibold"
        >
          ← Modify search
        </Link>

        <div className="mt-6 bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl p-6 border border-white/50">
          <div className="flex flex-wrap items-center gap-3 text-gray-600 text-sm">
            <span className="text-xl font-semibold text-gray-900">
              {tripSummary.from} → {tripSummary.to}
            </span>
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold uppercase tracking-wide">
              {tripType === "oneway" ? "One Way" : "Round Trip"}
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold uppercase tracking-wide">
              {tripSummary.cabin}
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold uppercase tracking-wide">
              {tripSummary.travelers || 1} Traveler
              {tripSummary.travelers > 1 ? "s" : ""}
            </span>
            {tripSummary.stayLen && (
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold uppercase tracking-wide">
                {tripSummary.stayLen} day stay
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <div>
              Departing
              <p className="text-gray-900 font-semibold">
                {formatDate(tripSummary.depart)}
              </p>
            </div>
            {tripType !== "oneway" && (
              <div>
                Returning
                <p className="text-gray-900 font-semibold">
                  {formatDate(tripSummary.returnDate)}
                </p>
              </div>
            )}
            <div>
              Currency
              <p className="text-gray-900 font-semibold">{tripSummary.currency}</p>
            </div>
            {tripSummary.month && (
              <div>
                Travel month
                <p className="text-gray-900 font-semibold">
                  {tripSummary.month}
                </p>
              </div>
            )}
          </div>
        </div>

        {!hasQuery && (
          <div className="mt-10 bg-white rounded-2xl shadow-lg p-8 text-center">
            <p className="text-lg font-semibold text-gray-800">
              Start by searching for flights.
            </p>
            <p className="text-gray-500 mt-2">
              Head back to the homepage to enter your travel details.
            </p>
          </div>
        )}

        {hasQuery && (
          <div className="mt-10 grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7 space-y-6">
              {status === "loading" && (
                <div className="grid gap-6">
                  {[...Array(3)].map((_, index) => (
                    <div
                      key={index}
                      className="animate-pulse bg-white rounded-2xl h-40 shadow-lg"
                    />
                  ))}
                </div>
              )}

              {status === "error" && (
                <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl p-6">
                  {error}
                </div>
              )}

              {status === "success" && flights.length === 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                  <p className="text-lg font-semibold text-gray-800">
                    No flights were returned for this search.
                  </p>
                  <p className="text-gray-500 mt-2">
                    Try adjusting your dates, airports or cabin class.
                  </p>
                </div>
              )}

              {status === "success" && flights.length > 0 && (
                <div className="space-y-5">
                  {flights.map((flight, index) => (
                    <ResultsCard
                      key={flight.id || index}
                      flight={flight}
                      isBest={index === 0}
                      currencyOverride={tripSummary.currency}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-5 space-y-6">
              {hasAiInputs && (
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-blue-700 font-semibold">
                        Smart package insight
                      </p>
                      <h2 className="text-2xl font-bold text-gray-900 mt-1">
                        Gemini-powered recommendation
                      </h2>
                    </div>
                  </div>

                  <div>
                    {aiStatus === "loading" && (
                      <div className="animate-pulse bg-slate-900/80 text-white rounded-3xl shadow-2xl h-60" />
                    )}
                    {(aiStatus === "error" || (aiStatus === "success" && !aiData)) && (
                      <AIPlaceholder message={aiPlaceholderMessage} />
                    )}
                    {aiStatus === "success" && aiData && (
                      <AIRecommendations
                        data={aiData}
                        currency={tripSummary.currency}
                        onBook={bookingFlightUrl ? handleBookNow : undefined}
                      />
                    )}
                  </div>
                </section>
              )}

              <HotelFinder
            destinationCode={tripSummary.to}
            destinationName={tripSummary.toName}
            destinationCity={tripSummary.toCity}
            arrivalDate={tripSummary.depart}
            departureDate={tripSummary.returnDate || tripSummary.depart}
            travelers={tripSummary.travelers}
            currency={tripSummary.currency}
            apiBaseUrl={AI_BASE_URL}
              />

              <section className="space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-blue-700 font-semibold">
                    Live flight tracking
                  </p>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Follow a flight in real time
                  </h2>
                  <p className="text-sm text-gray-500">
                    Enter the airline code and flight number to pull the latest gate
                    info from our tracker.
                  </p>
                </div>
                <FlightTrackerWidget apiBaseUrl={API_BASE_URL} layout="compact" />
              </section>

              <LanguageBuddy
                apiBaseUrl={API_BASE_URL}
                languageCode={tripSummary.language || "en"}
                destination={tripSummary.toCity || tripSummary.toName}
              />

              <HealthInsight
                data={healthData}
                status={healthStatus}
                error={healthError}
              />

              {routeInsightsEnabled && routeInsights.length > 0 && (
                <section className="bg-white rounded-3xl shadow-xl border border-white/60 p-6">
                  <p className="text-xs uppercase tracking-[0.3em] text-blue-700 font-semibold">
                    Snowflake insights
                  </p>
                  <h2 className="text-2xl font-bold text-gray-900 mt-1">
                    Most searched routes
                  </h2>
                  <div className="space-y-3 mt-4">
                    {routeInsights.map((item) => (
                      <div
                        key={`${item.route}-${item.tripType}`}
                        className="rounded-2xl border border-slate-100 p-4 bg-slate-50/60"
                      >
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          {item.tripType === "oneway" ? "One-way" : "Round-trip"}
                        </p>
                        <p className="text-xl font-semibold text-slate-900">
                          {item.route}
                        </p>
                        <p className="text-sm text-slate-500 mt-2">
                          {item.searches} recent searches
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
