
import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `You are an advanced AI system designed to perform handwritten text recognition. 
Your task is to carefully analyze images containing handwritten content and convert them into accurate, readable digital text. 
The system must handle messy, cursive, and uneven handwriting while preserving the original structure, line breaks, and formatting of the text.

While extracting the text, prioritize accuracy over assumptions. Do not guess missing or unclear words. 
If any character or word cannot be confidently recognized, represent it clearly as [unclear]. 
Maintain punctuation, capitalization, and spacing exactly as they appear in the handwritten input.

The output should contain ONLY the extracted text in plain format. 
Do not include explanations, comments, confidence scores, or any additional information. 
Ensure the final text is clean, readable, and faithful to the original handwritten document.

The system should automatically identify the language used in the handwritten content. 
If the text is written in English, output it in English. If another language is detected, preserve the original language without translation.`;

export async function recognizeHandwriting(base64Image: string, mimeType: string): Promise<string> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment.");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image,
            },
          },
          {
            text: "Please extract the handwritten text from this image exactly as it appears.",
          },
        ],
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.1,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("The model failed to generate a text response.");
    }

    return text;
  } catch (error: any) {
    console.error("Gemini OCR Error:", error);
    throw new Error(error.message || "An unexpected error occurred during recognition.");
  }
}

export async function translateText(text: string, targetLanguage: 'Hindi' | 'Telugu'): Promise<string> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Translate the following text into ${targetLanguage}. 
Preserve the original meaning, sentence structure, and contextual accuracy. 
If the text contains the marker "[unclear]", leave it as "[unclear]" in the translation.
Maintain the line breaks and formatting exactly as provided.
Output ONLY the translated text without any explanations or notes.

Text to translate:
${text}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.3,
      },
    });

    const translatedText = response.text;
    if (!translatedText) {
      throw new Error("The model failed to generate a translation.");
    }

    return translatedText;
  } catch (error: any) {
    console.error("Gemini Translation Error:", error);
    throw new Error(error.message || "An unexpected error occurred during translation.");
  }
}

export async function fileToBase64(file: File): Promise<{ data: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      resolve({ data: base64Data, mimeType: file.type });
    };
    reader.onerror = (error) => reject(error);
  });
}
