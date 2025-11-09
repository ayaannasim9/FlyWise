const express = require("express");
const router = express.Router();

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID =
  process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";

const phrasebook = {
  en: {
    code: "en",
    language: "English",
    phrases: [
      { text: "Hello", script: "Hello", meaning: "Friendly greeting" },
      { text: "Thank you", script: "Thank you", meaning: "Show appreciation" },
      { text: "Excuse me", script: "Excuse me", meaning: "Politely get attention" },
    ],
  },
  hi: {
    code: "hi",
    language: "Hindi",
    phrases: [
      { text: "Namaste", script: "नमस्ते", meaning: "Hello / Greetings" },
      { text: "Dhanyavaad", script: "धन्यवाद", meaning: "Thank you" },
      { text: "Kripya", script: "कृपया", meaning: "Please" },
    ],
  },
  ja: {
    code: "ja",
    language: "Japanese",
    phrases: [
      { text: "Konnichiwa", script: "こんにちは", meaning: "Good day / Hello" },
      { text: "Arigatou gozaimasu", script: "ありがとうございます", meaning: "Thank you" },
      { text: "Sumimasen", script: "すみません", meaning: "Excuse me / Sorry" },
    ],
  },
  ar: {
    code: "ar",
    language: "Arabic",
    phrases: [
      { text: "Marhaba", script: "مرحبا", meaning: "Hello" },
      { text: "Shukran", script: "شكرا", meaning: "Thank you" },
      { text: "Min fadlak", script: "من فضلك", meaning: "Please" },
    ],
  },
  es: {
    code: "es",
    language: "Spanish",
    phrases: [
      { text: "Hola", script: "Hola", meaning: "Hello" },
      { text: "Gracias", script: "Gracias", meaning: "Thank you" },
      { text: "Por favor", script: "Por favor", meaning: "Please" },
    ],
  },
  fr: {
    code: "fr",
    language: "French",
    phrases: [
      { text: "Bonjour", script: "Bonjour", meaning: "Hello / Good day" },
      { text: "Merci", script: "Merci", meaning: "Thank you" },
      { text: "S'il vous plaît", script: "S'il vous plaît", meaning: "Please" },
    ],
  },
  zh: {
    code: "zh",
    language: "Mandarin",
    phrases: [
      { text: "Nǐ hǎo", script: "你好", meaning: "Hello" },
      { text: "Xièxiè", script: "谢谢", meaning: "Thank you" },
      { text: "Qǐng", script: "请", meaning: "Please" },
    ],
  },
  ko: {
    code: "ko",
    language: "Korean",
    phrases: [
      { text: "Annyeong haseyo", script: "안녕하세요", meaning: "Hello" },
      { text: "Gamsahamnida", script: "감사합니다", meaning: "Thank you" },
      { text: "Jwoesonghamnida", script: "죄송합니다", meaning: "Sorry / Excuse me" },
    ],
  },
  pt: {
    code: "pt",
    language: "Portuguese",
    phrases: [
      { text: "Olá", script: "Olá", meaning: "Hello" },
      { text: "Obrigado", script: "Obrigado/a", meaning: "Thank you" },
      { text: "Por favor", script: "Por favor", meaning: "Please" },
    ],
  },
  de: {
    code: "de",
    language: "German",
    phrases: [
      { text: "Hallo", script: "Hallo", meaning: "Hello" },
      { text: "Danke", script: "Danke", meaning: "Thank you" },
      { text: "Bitte", script: "Bitte", meaning: "Please" },
    ],
  },
  nl: {
    code: "nl",
    language: "Dutch",
    phrases: [
      { text: "Hallo", script: "Hallo", meaning: "Hello" },
      { text: "Dank je", script: "Dank je", meaning: "Thank you" },
      { text: "Alsjeblieft", script: "Alsjeblieft", meaning: "Please" },
    ],
  },
  tr: {
    code: "tr",
    language: "Turkish",
    phrases: [
      { text: "Merhaba", script: "Merhaba", meaning: "Hello" },
      { text: "Teşekkürler", script: "Teşekkürler", meaning: "Thank you" },
      { text: "Lütfen", script: "Lütfen", meaning: "Please" },
    ],
  },
};

router.get("/phrase-guide/:lang", (req, res) => {
  const lang = req.params.lang?.toLowerCase();
  const guide = phrasebook[lang] || phrasebook.en;
  res.json(guide);
});

router.post("/phrase-guide/audio", express.json(), async (req, res) => {
  if (!ELEVENLABS_API_KEY) {
    return res
      .status(400)
      .json({ error: "ElevenLabs is not configured on the server." });
  }

  const { text, lang = "en" } = req.body || {};
  if (!text) {
    return res.status(400).json({ error: "Missing phrase text." });
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
          accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.35,
            similarity_boost: 0.8,
          },
          language: lang,
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText);
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBase64 = Buffer.from(arrayBuffer).toString("base64");
    res.json({ audio: audioBase64 });
  } catch (err) {
    console.error("ElevenLabs error:", err.message);
    res
      .status(500)
      .json({ error: "Unable to generate pronunciation audio right now." });
  }
});

module.exports = router;
