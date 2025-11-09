import { useEffect, useState } from "react";

const celebrityVoices = [
  { id: "default", label: "Calm Guide" },
  { id: "donald", label: "Donald-esque", voiceId: import.meta.env.VITE_ELEVENLABS_TRUMP_VOICE },
  { id: "modi", label: "Modi Vibe", voiceId: import.meta.env.VITE_ELEVENLABS_MODI_VOICE },
  { id: "elon", label: "Elon Hype", voiceId: import.meta.env.VITE_ELEVENLABS_ELON_VOICE },
];

export default function LanguageBuddy({
  apiBaseUrl,
  languageCode = "en",
  destination,
}) {
  const [guide, setGuide] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState("");
  const [voice, setVoice] = useState("default");

  useEffect(() => {
    if (!languageCode) return;
    setStatus("loading");
    setError("");
    fetch(`${apiBaseUrl}/phrase-guide/${languageCode}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Unable to load phrase guide.");
        }
        return res.json();
      })
      .then((data) => {
        setGuide(data);
        setStatus("success");
      })
      .catch((err) => {
        setError(err.message || "Failed to load phrases.");
        setStatus("error");
      });
  }, [apiBaseUrl, languageCode]);

  const handlePlay = async (text) => {
    if (!text) return;
    setPlaying(text);
    setError("");
    try {
      const selectedVoice = celebrityVoices.find((v) => v.id === voice);
      const res = await fetch(`${apiBaseUrl}/phrase-guide/audio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lang: languageCode,
          text,
          voiceId:
            selectedVoice?.voiceId ||
            (selectedVoice?.id === "default" ? undefined : null),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.audio) {
        throw new Error(data.error || "Unable to play audio.");
      }
      const audio = new Audio(`data:audio/mpeg;base64,${data.audio}`);
      audio.play();
    } catch (err) {
      setError(err.message || "Unable to play phrase.");
    } finally {
      setPlaying("");
    }
  };

  if (status === "loading") {
    return (
      <div className="bg-white rounded-3xl shadow-xl border border-white/60 p-6">
        <div className="animate-pulse h-24 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="bg-white rounded-3xl shadow-xl border border-white/60 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-blue-700 font-semibold">
          Local phrases
        </p>
        <p className="text-sm text-red-500 mt-2">{error}</p>
      </div>
    );
  }

  if (!guide) return null;

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-white/60 p-6 space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-blue-700 font-semibold">
          Local phrases
        </p>
        <h2 className="text-2xl font-bold text-gray-900 mt-1">
          Speak {guide.language}
        </h2>
        <p className="text-sm text-gray-500">
          Essentials for {destination || "your trip"} – tap play to hear
          pronunciation.
        </p>
        <div className="mt-3">
          <label className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
            Celebrity mode
          </label>
          <select
            value={voice}
            onChange={(e) => setVoice(e.target.value)}
            className="mt-1 w-full rounded-2xl border px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            {celebrityVoices.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {guide.phrases?.map((phrase) => (
          <div
            key={phrase.text}
            className="flex items-center gap-3 border border-slate-100 rounded-2xl p-3"
          >
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">
                {phrase.text}
              </p>
              {phrase.script && (
                <p className="text-xs text-slate-500">{phrase.script}</p>
              )}
              <p className="text-xs text-slate-400 mt-1">
                {phrase.meaning || "Common expression"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handlePlay(phrase.text)}
              disabled={playing === phrase.text}
              className="px-3 py-2 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 disabled:opacity-50"
            >
              {playing === phrase.text ? "..." : "Play"}
            </button>
          </div>
        ))}
      </div>

      {error && (
        <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-2xl px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}
