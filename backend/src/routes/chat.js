// backend/src/routes/chat.js
import express from 'express';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();
const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Ping-route
router.get('/chat/ping', (_req, res) => {
  res.json({ ok: true });
});

// Helper om één completion te maken
async function createCompletion(prompt, model, maxTokens) {
  const resp = await openai.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: maxTokens,
  });
  return resp.choices[0].message.content.trim();
}
// 1) Indicator-explanation endpoint
router.post('/chat/explain-indicator', async (req, res) => {
  const { name, params, value, advice, explanation, ibs, model } = req.body;
  const mdl = model || 'gpt-4.1-mini-2025-04-14';
  const prompt = `
Indicator ${name}(${params}):
- Waarde: ${value}
- IBS: ${ibs}%
- Advies: ${advice}
- Uiteenzetting: ${explanation}

Geef in 1–2 zinnen duidelijk waarom dit het juiste advies is.
`;
  try {
    const response = await createCompletion(prompt, mdl, 100);
    const text = response.choices[0].message.content.trim();
    return res.json({ text });
  } catch (err) {
    console.error('🛑 explain-indicator error:', err);
    return res.status(500).json({ error: 'GPT explain failed' });
  }
});

// 2) Trade-advies, in één call: laag, medium, hoog én toelichting
router.post('/chat/trade-advice', async (req, res) => {
  const { symbol, direction, confidence, usedCount, model } = req.body;
  const mdl = model || 'gpt-4.1-mini-2025-04-14';

  // Build prompt
  const prompt = `
Op basis van ${usedCount} indicatoren (IBS>70%) gaven we een ${direction}-advies voor ${symbol} met ${confidence}% vertrouwen.
Noem specifiek welke indicatoren (en hun IBS-waardes) dit advies ondersteunden, en leg uit hoe de scores en weging tot deze conclusie leiden.

Voor elk risiconiveau (Laag, Middel, Hoog) wil ik in één JSON-object:

{
  "<level>": {
    "explanation": "…korte toelichting inclusief inschatting van win/verlies-kans…",
    "sizePct": <percentage van saldo>,
    "leverage": <multiplier>,
    "leverageType": "Isolated" of "Cross",
    "entries": [<entries>],
    "takeProfits": [<tps>],
    "stopLoss": <sl>
  },
  …
}

Waar `<level>` staat voor "low", "medium" en "high".  
Geef **alle drie** in één JSON-structuur terug, zonder extra tekst eromheen.
`;

  try {
    const responseText = await createCompletion(prompt, mdl, 400);
    // parse JSON directly from model output
    const adviceAll = JSON.parse(responseText);
    return res.json(adviceAll);
  } catch (err) {
    console.error('🛑 trade-advice error:', err);
    return res.status(500).json({ error: 'GPT trade advice failed' });
  }
});

export default router;