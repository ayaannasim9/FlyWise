export default function ResultsCard({ results }) {
  if (!results) return null;

  return (
    <div className="bg-white shadow-xl w-full max-w-2xl p-6 rounded-2xl mt-6">
      <h2 className="text-xl font-bold text-green-600">Best Suggested Dates</h2>

      {results.windows?.map((win, index) => (
        <div key={index} className="border-b py-2">
          <p>📅 {win.outbound} → {win.return}</p>
          <p>💷 £{win.avg_price}</p>
        </div>
      ))}

      <p className="mt-4 font-medium">
        Recommendation: {results.recommendation?.action}
      </p>
      <p className="text-gray-600">{results.explanation}</p>
    </div>
  );
}
