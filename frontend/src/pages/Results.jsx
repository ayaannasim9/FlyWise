import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export default function Results() {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const from = params.get("from");
  const to = params.get("to");
  const depart = params.get("depart");
  const days = parseInt(params.get("days"), 10) || 7;

  // Convert departure + days → return date
  const returnDate = new Date(depart);
  returnDate.setDate(returnDate.getDate() + days);
  const arrival_date = returnDate.toISOString().slice(0, 10);

  useEffect(() => {
    async function fetchFlights() {
      try {
        const res = await fetch(
          `http://localhost:3000/roundtrip?departure_airport_code=${from}&arrival_airport_code=${to}&departure_date=${depart}&arrival_date=${arrival_date}`
        );

        const data = await res.json();
        setFlights(data);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }

    fetchFlights();
  }, [from, to, depart, arrival_date]);

  if (loading) return <h2>Loading flights...</h2>;

  return (
    <div style={{ padding: "40px" }}>
      <h1>Best Deals ✈️</h1>
      {flights.length === 0 ? (
        <p>No flights found.</p>
      ) : (
        flights.map((f, i) => (
          <div
            key={i}
            style={{
              border: "1px solid #ddd",
              padding: "16px",
              margin: "10px 0",
              borderRadius: "10px",
            }}
          >
            <h3>Price: ${f.price}</h3>
            {f.legs.map((leg, j) => (
              <p key={j}>
                {leg.from} → {leg.to}
                <br />
                Depart: {leg.departure} | Arrive: {leg.arrival}
                <br />
                Stops: {leg.stops}, Duration: {leg.duration_mins} mins
              </p>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
