import { Link } from "react-router-dom";

export default function Results() {
  const fakeData = [
    { date: "2025-12-10 → 2025-12-25", price: "£420", airline: "Emirates" },
    { date: "2025-12-12 → 2025-12-27", price: "£398", airline: "Qatar Airways" },
    { date: "2025-12-15 → 2025-12-30", price: "£450", airline: "Etihad" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <Link to="/" className="text-blue-600 underline text-lg">← Back</Link>

      <h1 className="text-4xl font-bold mt-4">Best Deals Found ✅</h1>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fakeData.map((item, index) => (
          <div key={index} className="bg-white shadow-xl p-6 rounded-2xl">
            <p className="text-xl font-semibold">{item.date}</p>
            <p className="text-gray-600">Airline: {item.airline}</p>
            <p className="text-2xl font-bold text-green-600 mt-2">{item.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
