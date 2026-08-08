import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    return res.status(400).json({ 
      error: 'Gemini API key is missing. Please set GEMINI_API_KEY in Vercel environment variables.' 
    });
  }

  const modelName = process.env.GEMINI_MODEL || 'gemini-flash-latest';

  try {
    const { text, targetLanguage } = req.body || {};
    if (!text) {
      return res.status(400).json({ error: 'Missing text parameter.' });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Task: Translate the following text into ${targetLanguage || 'Hindi'}. 

Production Rules:
- Preserve original meaning, formatting, and line breaks.
- Keep "[unclear]" markers as they are.
- Output ONLY the translated text.

Text:
${text}`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        temperature: 0.2,
        systemInstruction: "You are a translation module. Return ONLY clean, translated text.",
      },
    });

    const translatedText = response.text || text;
    return res.status(200).json({ translatedText: translatedText.trim() });
  } catch (error: any) {
    console.error("Server Translate Error:", error?.message || error);
    return res.status(200).json({ translatedText: req.body?.text || '' });
  }
}
