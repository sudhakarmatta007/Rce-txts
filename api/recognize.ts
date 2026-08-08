import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

const SYSTEM_INSTRUCTION = `You are an accurate OCR engine for handwritten document digitization.
Your task is to transcribe handwritten text into clean digital text.
Rules:
1. Return ONLY the extracted text. Do not add explanations, intros, or summaries.
2. Maintain punctuation, capitalization, line breaks, and paragraph layout.
3. Use context to infer unclear words. If a word cannot be read, mark it as [unclear].`;

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
    const { base64Image, mimeType } = req.body || {};
    if (!base64Image || !mimeType) {
      return res.status(400).json({ error: 'Missing image data or mimeType parameter.' });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image,
            },
          },
          {
            text: "Extract all handwritten text from this image accurately. Return ONLY the transcribed text with no explanations.",
          },
        ],
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.1,
      },
    });

    const text = response.text || '';

    if (!text) {
      return res.status(200).json({ text: 'The system could not detect any readable text in the image.' });
    }

    return res.status(200).json({ text: text.trim() });
  } catch (error: any) {
    console.error("Server Recognize Error:", error?.message || error);
    return res.status(500).json({ 
      error: 'Recognition service is temporarily unavailable. Please try again.' 
    });
  }
}
