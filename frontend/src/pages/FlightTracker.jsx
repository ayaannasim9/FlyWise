import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const formatDateTime = (value) => {
  if (!value) return "--";
  const date = new Date(value);
  const datePart = date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const timePart = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${datePart} • ${timePart}`;
};

const Field = ({ label, children }) => (
  <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600 uppercase tracking-wide">
    {label}
    {children}
  </label>
);

export default function FlightTracker() {
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [form, setForm] = useState({
    name: "DL",
    num: "33",
    date: today,
  });

  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [segments, setSegments] = useState([]);

  const update = (field) => (event) => {
    setForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const validate = () => {
    if (!form.name || form.name.length < 2) {
      return "Airline code should be at least 2 characters.";
    }
    if (!form.num) {
      return "Enter the flight number.";
    }
    if (!form.date) {
      return "Pick the departure date.";
    }
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }

    setError("");
    setStatus("loading");
    setSegments([]);

    try {
      const params = new URLSearchParams({
        name: form.name.trim().toUpperCase(),
        num: form.num.trim(),
        date: form.date.replace(/-/g, ""),
      });

      const response = await fetch(
        `${API_BASE_URL}/trackFlight?${params.toString()}`
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Unable to retrieve flight status.");
      }

      const data = await response.json();
      setSegments(Array.isArray(data) ? data : []);
      setStatus("success");
    } catch (err) {
      setError(
        err.message ||
          "Something went wrong connecting to the tracker service."
      );
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-blue-700 hover:text-blue-900 font-semibold"
            >
              ← Back to search
            </Link>
            <h1 className="mt-3 text-4xl font-black text-slate-900 tracking-tight">
              Real-time flight tracker
            </h1>
            <p className="text-slate-500 mt-2">
              Enter the airline code, flight number, and departure date exactly
              as on your ticket.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 bg-white/90 backdrop-blur rounded-3xl shadow-xl border border-white/60 p-6 lg:p-8 space-y-6"
        >
          <div className="grid gap-6 lg:grid-cols-3">
            <Field label="Airline code (ex. DL, BA, QR)">
              <input
                type="text"
                value={form.name}
                onChange={update("name")}
                className="rounded-2xl border px-4 py-3 bg-slate-50 uppercase tracking-[0.3em] text-center text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={4}
              />
            </Field>

            <Field label="Flight number">
              <input
                type="text"
                value={form.num}
                onChange={update("num")}
                className="rounded-2xl border px-4 py-3 bg-slate-50 text-center text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Field>

            <Field label="Departure date (YYYY-MM-DD)">
              <input
                type="date"
                value={form.date}
                onChange={update("date")}
                className="rounded-2xl border px-4 py-3 bg-slate-50 text-center text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Field>
          </div>

          {error && (
            <div className="rounded-2xl bg-red-50 border border-red-100 text-red-700 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition"
            disabled={status === "loading"}
          >
            {status === "loading" ? "Looking up flight..." : "Track flight"}
          </button>
        </form>

        {status === "loading" && (
          <div className="mt-10 space-y-4">
            {[...Array(2)].map((_, index) => (
              <div
                key={index}
                className="animate-pulse h-32 bg-white rounded-2xl shadow"
              />
            ))}
          </div>
        )}

        {status === "success" && segments.length === 0 && (
          <div className="mt-10 bg-white rounded-3xl shadow-xl p-8 text-center">
            <p className="text-lg font-semibold text-slate-800">
              No live data for that flight.
            </p>
            <p className="text-slate-500 mt-2">
              Double-check the flight number, airline code, and date.
            </p>
          </div>
        )}

        {segments.length > 0 && (
          <div className="mt-10 space-y-6">
            {segments.map((segment, index) => (
              <div
                key={`${segment.flightNumber || index}-${index}`}
                className="bg-white rounded-3xl shadow-xl border border-white/60 overflow-hidden"
              >
                <div className="px-6 py-4 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 flex flex-wrap items-center gap-3">
                  <p className="text-2xl font-bold text-slate-900">
                    {segment.airline} {segment.flightNumber}
                  </p>
                  {segment.status && (
                    <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold uppercase tracking-wide">
                      {segment.status}
                    </span>
                  )}
                </div>
                <div className="grid gap-6 p-6 lg:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Departure
                    </p>
                    <p className="text-xl font-bold text-slate-900">
                      {segment?.departure?.airport || "—"}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      {segment?.departure?.code || "--"}
                    </p>
                    <p className="text-sm text-slate-500 mt-2">
                      {formatDateTime(segment?.departure?.time)}
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      Terminal {segment?.departure?.terminal || "—"} • Gate{" "}
                      {segment?.departure?.gate || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Arrival
                    </p>
                    <p className="text-xl font-bold text-slate-900">
                      {segment?.arrival?.airport || "—"}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      {segment?.arrival?.code || "--"}
                    </p>
                    <p className="text-sm text-slate-500 mt-2">
                      {formatDateTime(segment?.arrival?.time)}
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      Terminal {segment?.arrival?.terminal || "—"} • Gate{" "}
                      {segment?.arrival?.gate || "—"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
