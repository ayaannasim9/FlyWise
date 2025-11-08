import { useState } from "react";
import axios from "axios";

export default function SearchBox({ onSearch }) {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [month, setMonth] = useState("");
  const [stay, setStay] = useState(15);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!origin || !destination || !month) {
      alert("Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("http://localhost:8000/search", {
        origin,
        destination,
        month,
        stay_length: stay,
      });
      onSearch(response.data);
    } catch (error) {
      alert("Backend not responding yet.");
    }
    setLoading(false);
  };

  return (
    <div className="bg-white shadow-xl w-full max-w-2xl p-6 rounded-2xl">
      <h2 className="text-2xl font-bold mb-6 text-blue-600">Find Cheapest Dates</h2>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <input
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          placeholder="From (e.g. MAN)"
          className="border p-3 rounded-lg w-full"
        />
        <input
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="To (e.g. DEL)"
          className="border p-3 rounded-lg w-full"
        />
        <input
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          placeholder="Month (YYYY-MM)"
          className="border p-3 rounded-lg w-full"
        />
        <input
          type="number"
          value={stay}
          onChange={(e) => setStay(e.target.value)}
          placeholder="Stay Length (days)"
          className="border p-3 rounded-lg w-full"
        />
      </div>

      <button
        onClick={handleSearch}
        className="w-full bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition"
      >
        {loading ? "Searching..." : "Search Best Dates"}
      </button>
    </div>
  );
}
