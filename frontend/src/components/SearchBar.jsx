import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import airports from "../airportData";

const cabinClasses = ["Economy", "PremiumEconomy", "Business", "First"];
const currencies = ["GBP", "EUR", "USD"];

export default function SearchBar() {
  const navigate = useNavigate();
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const [form, setForm] = useState({
    tripType: "roundtrip",
    departure_airport_code: airports[0]?.code || "",
    arrival_airport_code: airports[1]?.code || "",
    departure_date: "",
    arrival_date: "",
    stay_len: 7,
    number_of_adults: 1,
    number_of_children: 0,
    number_of_infants: 0,
    cabin_class: "Economy",
    currency: "GBP",
  });
  const [error, setError] = useState("");

  const updateField = (field) => (event) => {
    const value =
      event.target.type === "number"
        ? Number(event.target.value)
        : event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const setTripType = (type) => {
    setForm((prev) => ({
      ...prev,
      tripType: type,
      arrival_date: type === "oneway" ? "" : prev.arrival_date,
    }));
  };

  const validate = () => {
    if (!form.departure_airport_code || !form.arrival_airport_code) {
      return "Select both origin and destination airports.";
    }
    if (form.departure_airport_code === form.arrival_airport_code) {
      return "Origin and destination airports must be different.";
    }
    if (!form.departure_date) {
      return "Choose a departure date.";
    }
    if (form.tripType === "roundtrip") {
      if (!form.arrival_date) return "Choose a return date for round trips.";
      if (form.arrival_date < form.departure_date) {
        return "Return date cannot be before departure.";
      }
    }
    if (form.number_of_adults < 1) {
      return "At least one adult traveler is required.";
    }
    if (!form.stay_len || form.stay_len < 1) {
      return "Stay length must be at least 1 day.";
    }
    return "";
  };

  const handleSearch = () => {
    const validationMessage = validate();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setError("");
    const params = new URLSearchParams({
      tripType: form.tripType,
      departure_airport_code: form.departure_airport_code,
      arrival_airport_code: form.arrival_airport_code,
      departure_date: form.departure_date,
      number_of_adults: String(form.number_of_adults),
      number_of_children: String(form.number_of_children),
      number_of_infants: String(form.number_of_infants),
      cabin_class: form.cabin_class,
      currency: form.currency,
      stay_len: String(form.stay_len),
    });

    if (form.tripType === "roundtrip") {
      params.set("arrival_date", form.arrival_date);
    }

    navigate(`/results?${params.toString()}`);
  };

  return (
    <div className="glass-card glow-border p-6 lg:p-8 w-full text-gray-900">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm font-semibold text-blue-900 uppercase tracking-[0.3em]">
            Plan your journey
          </p>
          <div className="flex items-center gap-2 bg-blue-50 rounded-full p-1 text-sm font-semibold">
            {["roundtrip", "oneway"].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setTripType(type)}
                className={`px-4 py-2 rounded-full transition-all ${
                  form.tripType === type
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-blue-600"
                }`}
              >
                {type === "roundtrip" ? "Round Trip" : "One Way"}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              From
            </label>
            <select
              value={form.departure_airport_code}
              onChange={updateField("departure_airport_code")}
              className="mt-2 w-full rounded-2xl border px-4 py-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {airports.map((airport) => (
                <option key={airport.code} value={airport.code}>
                  {airport.name} ({airport.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              To
            </label>
            <select
              value={form.arrival_airport_code}
              onChange={updateField("arrival_airport_code")}
              className="mt-2 w-full rounded-2xl border px-4 py-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {airports.map((airport) => (
                <option key={airport.code} value={airport.code}>
                  {airport.name} ({airport.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Departure
            </label>
            <input
              type="date"
              value={form.departure_date}
              onChange={updateField("departure_date")}
              min={today}
              className="mt-2 w-full rounded-2xl border px-4 py-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Return
            </label>
            <input
              type="date"
              value={form.arrival_date}
              onChange={updateField("arrival_date")}
              min={form.departure_date || today}
              disabled={form.tripType === "oneway"}
              className="mt-2 w-full rounded-2xl border px-4 py-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Adults
            </label>
            <input
              type="number"
              min={1}
              max={8}
              value={form.number_of_adults}
              onChange={updateField("number_of_adults")}
              className="mt-2 w-full rounded-2xl border px-4 py-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Children
            </label>
            <input
              type="number"
              min={0}
              max={8}
              value={form.number_of_children}
              onChange={updateField("number_of_children")}
              className="mt-2 w-full rounded-2xl border px-4 py-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Infants
            </label>
            <input
              type="number"
              min={0}
              max={4}
              value={form.number_of_infants}
              onChange={updateField("number_of_infants")}
              className="mt-2 w-full rounded-2xl border px-4 py-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="lg:col-span-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Cabin Class
            </label>
            <select
              value={form.cabin_class}
              onChange={updateField("cabin_class")}
              className="mt-2 w-full rounded-2xl border px-4 py-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {cabinClasses.map((cabin) => {
                const label =
                  cabin === "PremiumEconomy"
                    ? "Premium Economy"
                    : cabin;
                return (
                  <option key={cabin} value={cabin}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Stay Length (days)
            </label>
            <input
              type="number"
              min={1}
              max={45}
              value={form.stay_len}
              onChange={updateField("stay_len")}
              className="mt-2 w-full rounded-2xl border px-4 py-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="w-full lg:w-48">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Currency
            </label>
            <select
              value={form.currency}
              onChange={updateField("currency")}
              className="mt-2 w-full rounded-2xl border px-4 py-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {currencies.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
                {error}
              </p>
            )}
          </div>

          <button
            onClick={handleSearch}
            className="w-full lg:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-10 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            Search Flights
          </button>
        </div>
      </div>
  );
}
