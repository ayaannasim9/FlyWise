import { Link } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="relative min-h-screen overflow-hidden font-inter text-gray-800">
      <div className="absolute inset-0 bg-gradient-to-br from-[#cfe9ff] via-[#eaf5ff] to-white -z-10"></div>
      <div className="bg-glow"></div>
      <div className="bg-glow-2"></div>

      <header className="flex justify-between items-center px-10 py-6">
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
              <p className="hidden sm:block">Welcome, {user.email}</p>
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

      <section className="text-center mt-20 px-4">
        <h1 className="text-5xl font-extrabold text-blue-900 leading-tight tracking-tight drop-shadow-sm">
          Discover <span className="text-blue-600">Cheap Flights</span> ✈️
        </h1>
        <p className="text-gray-600 mt-3 text-lg">
          Search across hundreds of airlines & travel sites in seconds.
        </p>
        <Link to="/track" className="inline-flex items-center gap-2 mt-6 text-blue-700 font-semibold">
          Prefer to track an existing flight? <span className="underline">Open tracker →</span>
        </Link>
      </section>

      <div className="mt-14 flex justify-center pb-16">
        <SearchBar />
      </div>
    </div>
  );
}
