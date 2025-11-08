import { useLocation, Link } from "react-router-dom";

export default function Results() {
  const { state } = useLocation();
  const flights = state?.flights || [];

  return (
    <div className="p-10">
      <Link to="/" className="text-blue-600 underline">
        ← Back
      </Link>

      <h2 className="text-3xl font-bold mt-3 mb-5">Best Flight Deals ✈️</h2>

      {flights.length === 0 ? (
        <p>No flights found.</p>
      ) : (
        <div className="grid gap-4">
          {flights.map((f) => (
            <div className="p-4 bg-white shadow rounded-lg" key={f.id}>
              <h3 className="text-xl font-bold">€{f.price}</h3>

              {f.legs.map((leg, i) => (
                <div key={i} className="text-sm mt-2">
                  <p>{leg.from} → {leg.to}</p>
                  <p>Depart: {leg.departure}</p>
                  <p>Arrive: {leg.arrival}</p>
                  <p>Stops: {leg.stops}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
