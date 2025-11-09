export default function AIPlaceholder({ message = "Waiting for live fares…" }) {
  return (
    <div className="rounded-3xl bg-slate-900 text-white shadow-2xl border border-white/10 overflow-hidden">
      <div className="p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
          <p className="text-xs uppercase tracking-[0.4em] text-emerald-300">
            Gemini warming up
          </p>
        </div>
        <h3 className="text-2xl font-bold">Hang tight…</h3>
        <p className="text-sm text-white/80">{message}</p>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div className="ai-shimmer h-full rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
