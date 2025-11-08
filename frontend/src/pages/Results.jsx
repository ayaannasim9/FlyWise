import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ResultsCard from "../components/ResultsCard";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

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

  const summary = useMemo(() => {
    const travelerCount =
      Number(searchParams.get("number_of_adults") || 0) +
      Number(searchParams.get("number_of_children") || 0) +
      Number(searchParams.get("number_of_infants") || 0);

    return {
      from: searchParams.get("departure_airport_code"),
      to: searchParams.get("arrival_airport_code"),
      depart: searchParams.get("departure_date"),
      returnDate: searchParams.get("arrival_date"),
      cabin: searchParams.get("cabin_class") || "Economy",
      travelers: Math.max(travelerCount, 1),
      currency: searchParams.get("currency") || "EUR",
    };
  }, [searchParams]);

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

  const formatDate = (value) => {
    if (!value) return "";
    return new Date(value).toLocaleDateString(undefined, {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
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
              {summary.from} → {summary.to}
            </span>
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold uppercase tracking-wide">
              {tripType === "oneway" ? "One Way" : "Round Trip"}
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold uppercase tracking-wide">
              {summary.cabin}
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold uppercase tracking-wide">
              {summary.travelers || 1} Traveler
              {summary.travelers > 1 ? "s" : ""}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <div>
              Departing
              <p className="text-gray-900 font-semibold">
                {formatDate(summary.depart)}
              </p>
            </div>
            {tripType !== "oneway" && (
              <div>
                Returning
                <p className="text-gray-900 font-semibold">
                  {formatDate(summary.returnDate)}
                </p>
              </div>
            )}
            <div>
              Currency
              <p className="text-gray-900 font-semibold">{summary.currency}</p>
            </div>
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
          <div className="mt-10 space-y-6">
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
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
