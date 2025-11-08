import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { airports } from "../data/airportData";
import { FaPlaneDeparture, FaCalendarAlt, FaSearch } from "react-icons/fa";

export default function SearchBar() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [month, setMonth] = useState("");
  const [days, setDays] = useState(7);

  const navigate = useNavigate();

  const searchFlights = () => {
    navigate(`/results?from=${from}&to=${to}&month=${month}&days=${days}`);
  };

  const filteredFrom = airports.filter((a) =>
    a.city.toLowerCase().includes(from.toLowerCase()) ||
    a.code.toLowerCase().includes(from.toLowerCase())
  );

  const filteredTo = airports.filter((a) =>
    a.city.toLowerCase().includes(to.toLowerCase()) ||
    a.code.toLowerCase().includes(to.toLowerCase())
  );

  return (
    <div className="bg-white/70 backdrop-blur-xl p-6 rounded-2xl shadow-xl w-full max-w-6xl mx-auto mt-10">
      <div className="grid lg:grid-cols-5 md:grid-cols-2 grid-cols-1 gap-6">

        {/* FROM */}
        <div className="relative">
          <label className="font-semibold text-gray-700">From</label>
          <div className="flex items-center gap-2 bg-white shadow-md rounded-xl px-3 py-3">
            <FaPlaneDeparture className="text-blue-600" />
            <input
              className="outline-none w-full"
              placeholder="Type city or airport..."
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>

          {from && (
            <div className="absolute bg-white shadow-xl rounded-xl w-full max-h-56 overflow-auto z-10 mt-1">
              {filteredFrom.map((a, i) => (
                <div
                  key={i}
                  className="p-3 hover:bg-blue-50 cursor-pointer flex justify-between"
                  onClick={() => setFrom(`${a.city} (${a.code})`)}
                >
                  <span>{a.flag} {a.city}</span>
                  <span className="font-bold">{a.code}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* TO */}
        <div className="relative">
          <label className="font-semibold text-gray-700">To</label>
          <div className="flex items-center gap-2 bg-white shadow-md rounded-xl px-3 py-3">
            <FaPlaneDeparture className="text-blue-600 rotate-180" />
            <input
              className="outline-none w-full"
              placeholder="Type city or airport..."
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>

          {to && (
            <div className="absolute bg-white shadow-xl rounded-xl w-full max-h-56 overflow-auto z-10 mt-1">
              {filteredTo.map((a, i) => (
                <div
                  key={i}
                  className="p-3 hover:bg-blue-50 cursor-pointer flex justify-between"
                  onClick={() => setTo(`${a.city} (${a.code})`)}
                >
                  <span>{a.flag} {a.city}</span>
                  <span className="font-bold">{a.code}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MONTH */}
        <div>
          <label className="font-semibold text-gray-700">Month</label>
          <div className="flex items-center gap-2 bg-white shadow-md rounded-xl px-3 py-3">
            <FaCalendarAlt className="text-blue-600" />
            <input
              type="month"
              className="outline-none w-full"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </div>
        </div>

        {/* DAYS */}
        <div>
          <label className="font-semibold text-gray-700">Days</label>
          <input
            type="number"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="bg-white shadow-md rounded-xl px-4 py-3 w-full outline-none"
          />
        </div>

        {/* ✅ SEARCH BUTTON FIXED */}
        <div className="flex items-end">
          <button
            onClick={searchFlights}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg flex gap-2 justify-center items-center hover:scale-105 active:scale-95 transition-all"
          >
            <FaSearch />
            Search
          </button>
        </div>

      </div>
    </div>
  );
}
