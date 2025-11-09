import { Link, useSearchParams } from "react-router-dom";
import FlightTrackerWidget from "../components/FlightTrackerWidget";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export default function FlightTracker() {
  const [searchParams] = useSearchParams();
  const initialName = searchParams.get("name") || "DL";
  const initialNum = searchParams.get("num") || "33";
  const initialDateParam = searchParams.get("date");
  const initialDate =
    initialDateParam && initialDateParam.length === 8
      ? `${initialDateParam.slice(0, 4)}-${initialDateParam.slice(
          4,
          6
        )}-${initialDateParam.slice(6)}`
      : initialDateParam || undefined;

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

        <div className="mt-8">
          <FlightTrackerWidget
            apiBaseUrl={API_BASE_URL}
            initialName={initialName}
            initialNum={initialNum}
            initialDate={initialDate}
          />
        </div>
      </div>
    </div>
  );
}
