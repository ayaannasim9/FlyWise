import { useState } from "react";

export default function SearchBar() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [month, setMonth] = useState("");
  const [stay, setStay] = useState(15);

  return (
    <div className="flex justify-center mt-12 w-full">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-[80%] max-w-5xl">
        
        <div className="grid grid-cols-5 gap-4 items-center">
          
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 font-semibold">From</label>
            <input
              type="text"
              placeholder="Manchester (MAN)"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="border p-3 rounded-lg focus:outline-blue-500"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-gray-600 font-semibold">To</label>
            <input
              type="text"
              placeholder="Delhi (DEL)"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="border p-3 rounded-lg focus:outline-blue-500"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-gray-600 font-semibold">Month</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="border p-3 rounded-lg focus:outline-blue-500"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-gray-600 font-semibold">Days</label>
            <input
              type="number"
              value={stay}
              onChange={(e) => setStay(e.target.value)}
              className="border p-3 rounded-lg focus:outline-blue-500"
            />
          </div>

          <button className="bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-700 font-semibold h-[55px] mt-6">
            Search
          </button>

        </div>
      </div>
    </div>
  );
}
