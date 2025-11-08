import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function SearchBar() {
  const navigate = useNavigate();

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [month, setMonth] = useState("");
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!from || !to || !month) {
      return alert("Please fill all fields");
    }

    setLoading(true);

    try {
      const departDate = `${month}-01`;
      const returnDate = `${month}-${String(1 + Number(days)).padStart(2, "0")}`;

      const res = await axios.get("http://localhost:5000/api/roundtrip", {
        params: {
          departure_airport_code: from,
          arrival_airport_code: to,
          departure_date: departDate,
          arrival_date: returnDate,
          number_of_adults: 1,
          currency: "EUR",
        },
      });

      navigate("/results", { state: { flights: res.data } });
    } catch (err) {
      console.error(err);
      alert("Error fetching flights");
    }

    setLoading(false);
  };

  return (
    <div className="flex gap-3 items-center bg-white shadow-lg p-4 rounded-xl border">
      <input
        type="text"
        placeholder="From (Airport Code)"
        className="border p-2 rounded"
        onChange={(e) => setFrom(e.target.value)}
      />
      <input
        type="text"
        placeholder="To (Airport Code)"
        className="border p-2 rounded"
        onChange={(e) => setTo(e.target.value)}
      />
      <input
        type="month"
        className="border p-2 rounded"
        onChange={(e) => setMonth(e.target.value)}
      />
      <input
        type="number"
        className="border p-2 rounded"
        defaultValue={7}
        onChange={(e) => setDays(e.target.value)}
      />
      <button
        onClick={handleSearch}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
      >
        {loading ? "Searching..." : "Search"}
      </button>
    </div>
  );
}
