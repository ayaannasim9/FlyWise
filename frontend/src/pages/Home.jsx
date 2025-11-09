import { Link } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";

const badges = [
  { title: "Live fares", description: "FlightAPI + Gemini driven" },
  { title: "Snowflake insights", description: "Trending route analytics" },
  { title: "Concierge hotels", description: "Booking.com ready links" },
];

const metrics = [
  { label: "AI packages crafted", value: "2.3k+" },
  { label: "Routes tracked", value: "480+" },
  { label: "Avg. savings", value: "18%" },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="relative min-h-screen overflow-hidden font-inter text-gray-800">
      <div className="absolute inset-0 bg-gradient-to-br from-[#d8f3ff] via-[#f7fbff] to-white -z-10"></div>
      <div className="bg-glow"></div>
      <div className="bg-glow-2"></div>

      <header className="flex flex-wrap gap-4 justify-between items-center px-6 md:px-10 py-6">
        <h1 className="text-3xl font-bold text-blue-900 flex items-center gap-2">
          FlyWise ✈️
        </h1>

        <div className="flex items-center gap-4">
          <Link to="/track" className="hidden sm:block">
            <button className="px-5 py-2 rounded-full border border-blue-200 text-blue-700 font-semibold hover:bg-blue-50 transition">
              Track a flight
            </button>
          </Link>

          {user ? (
            <div className="flex gap-3 items-center text-blue-900">
              <p className="hidden sm:block text-sm">Welcome, {user.email}</p>
              <button
                onClick={() => signOut(auth)}
                className="bg-red-500 text-white px-4 py-1.5 rounded-full"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full shadow-md transition">
                Login
              </button>
            </Link>
          )}
        </div>
      </header>

      <section className="px-6 md:px-10 mt-10 grid gap-8 lg:grid-cols-2 items-center">
        <div className="space-y-5">
          <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 text-sm font-semibold text-blue-700 shadow">
            <span className="text-blue-500 text-lg">✦</span> End-to-end travel intelligence
          </p>
          <h1 className="text-4xl md:text-5xl font-black text-blue-950 leading-tight">
            Fly wiser with <span className="text-blue-600">Gemini</span>, Snowflake, and live fares.
          </h1>
          <p className="text-gray-600 text-lg">
            Compare flights, receive AI-curated packages, and unlock data-backed insights before you book.
          </p>
          <div className="flex flex-wrap gap-3">
            {badges.map((badge) => (
              <div
                key={badge.title}
                className="flex-1 min-w-[160px] rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm"
              >
                <p className="text-sm font-semibold text-blue-900">
                  {badge.title}
                </p>
                <p className="text-xs text-gray-500 mt-1">{badge.description}</p>
              </div>
            ))}
          </div>
          <Link
            to="/track"
            className="inline-flex items-center gap-2 text-blue-700 font-semibold hover:gap-3 transition-all"
          >
            Prefer to track an existing flight? <span className="underline">Open tracker →</span>
          </Link>
        </div>

        <div className="space-y-6">
          <SearchBar />
          <div className="grid grid-cols-3 gap-3 mt-6">
            {metrics.map((metric) => (
              <div key={metric.label} className="text-center">
                <p className="text-2xl font-bold text-blue-900">{metric.value}</p>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  {metric.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
