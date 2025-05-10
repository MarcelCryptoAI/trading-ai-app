import express from 'express';
import OpenAI from 'openai';
const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 1a) Explain a single indicator
router.post('/chat/explain-indicator', async (req, res) => {
  const { name, params, value, advice, explanation, ibs } = req.body;
  try {
    const prompt = `
We hebben net de indicator ${name}(${params}) berekend:
- Waarde: ${value}
- IBS: ${ibs}%
- Advies: ${advice}
- Korte toelichting: ${explanation}

Schrijf in 1–2 zinnen helder waarom dit advies is.
`;
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 100,
    });
    res.json({ text: completion.choices[0].message.content.trim() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'GPT explain failed' });
  }
});

// 1b) Trade advice overlay
router.post('/chat/trade-advice', async (req, res) => {
  const { symbol, direction, confidence, riskLevel } = req.body;
  try {
    const prompt = `
We willen een ${direction}-trade openen in ${symbol} op basis van AI-advies met confidence ${confidence}%. 
Het risiconiveau is “${riskLevel}” (Laag / Middel / Hoog). 
Geef me: 
1) Percentage van het saldo  
2) Leverage multiplier en type (“Isolated” of “Cross”)  
3) Entry price of entry prices  
4) Take profit niveaus (1–3)  
5) Stop loss niveau  
Antwoord in JSON met velden: sizePct, leverage, leverageType, entries[], takeProfits[], stopLoss.
`;
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
    });
    // We expect the assistant to reply with pure JSON
    const json = JSON.parse(completion.choices[0].message.content);
    res.json(json);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'GPT trade advice failed' });
  }
});

export default router;
