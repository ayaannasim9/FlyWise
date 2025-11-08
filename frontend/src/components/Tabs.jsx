import { useState } from "react";

export default function Tabs() {
  const [active, setActive] = useState("Flights");

  const tabs = ["Flights", "Hotels", "Car Hire", "Explore"];

  return (
    <div className="flex justify-center mt-10">
      <div className="flex space-x-4 bg-[#0B2451]">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={`px-6 py-2 rounded-full font-semibold transition-all
            ${active === tab ? "bg-blue-600 text-white" : "bg-white/10 text-white"}`}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}
