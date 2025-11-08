import { Link } from "react-router-dom";
import SearchBar from "../components/SearchBar";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden font-inter text-gray-800">

      {/* ✅ Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#cfe9ff] via-[#eaf5ff] to-white -z-10"></div>

      {/* ✅ Soft Cloud Glows */}
      <div className="bg-glow"></div>
      <div className="bg-glow-2"></div>

      {/* ✅ NAVBAR */}
      <header className="flex justify-between items-center px-10 py-6">
        <h1 className="text-3xl font-bold text-blue-900 flex items-center gap-2">
          FlyWise ✈️
        </h1>

        <Link to="/login">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full shadow-md transition">
            Login
          </button>
        </Link>
      </header>

      {/* ✅ HERO SECTION */}
      <section className="text-center mt-20">
        <h1 className="text-5xl font-extrabold text-blue-900 leading-tight tracking-tight drop-shadow-sm">
          Discover <span className="text-blue-600">Cheap Flights</span> ✈️
        </h1>
        <p className="text-gray-600 mt-3 text-lg">
          Search across hundreds of airlines & travel sites in seconds.
        </p>
      </section>

      {/* ✅ SEARCH BAR */}
      <div className="mt-14 flex justify-center">
        <SearchBar />
      </div>

    </div>
  );
}
