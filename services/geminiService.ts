
import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `You are a production-ready AI component integrated into a web application deployed on a cloud platform. Your responses must always be stable, predictable, and safe for frontend rendering. 

CORE TASK:
Carefully analyze images containing handwritten content and convert them into accurate, readable digital text. Handle messy, cursive, and uneven handwriting while preserving the original structure, line breaks, and formatting.

RULES & CONSTRAINTS:
1. NEVER return executable code, malformed structures, unsupported formats, or excessively large outputs that could cause rendering failures or blank screens.
2. ALWAYS respond with valid, clean, plain text content that can be safely displayed in a browser-based user interface.
3. PRIORITIZE accuracy over assumptions. Do not guess missing or unclear words. If a word cannot be confidently recognized, represent it clearly as [unclear].
4. IF AN IMAGE is missing, invalid, or cannot be processed, return a short, user-friendly fallback message like "Error: Handwritten content could not be identified in the provided image."
5. MAINTAIN punctuation, capitalization, and spacing exactly as they appear in the handwritten input.
6. OUTPUT ONLY the extracted text. Do not include explanations, metadata, or confidence scores.
7. FAIL GRACEFULLY: In all situations—success, partial success, or failure—you must always return a render-safe text response.

This system is designed with deployment-first principles, ensuring stability and a seamless user experience.`;

export async function recognizeHandwriting(base64Image: string, mimeType: string): Promise<string> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return "Service temporarily unavailable: Configuration missing.";
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
            text: "Extract handwritten text from this image. Follow production-ready safety rules.",
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
      return "The system could not detect any readable text in the image.";
    }

    return text;
  } catch (error: any) {
    console.error("Gemini OCR Error:", error);
    // Returning a safe string instead of throwing to prevent component crashes
    return `Note: Recognition encountered an issue. (${error.message || "Unknown error"})`;
  }
}

export async function translateText(text: string, targetLanguage: 'Hindi' | 'Telugu'): Promise<string> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return text; // Return original if service config is missing
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Task: Translate the following text into ${targetLanguage}. 

Production Rules:
- Preserve original meaning and formatting.
- Keep "[unclear]" markers as they are.
- Output ONLY the translated text.
- Ensure the result is safe for web rendering.

Text:
${text}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.3,
        systemInstruction: "You are a deployment-safe translation module. Return ONLY predictable, clean strings. If translation fails, return the input text.",
      },
    });

    return response.text || text;
  } catch (error: any) {
    console.error("Gemini Translation Error:", error);
    return text; // Fallback to original text on failure
  }
}

export async function fileToBase64(file: File): Promise<{ data: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1];
        resolve({ data: base64Data, mimeType: file.type });
      };
      reader.onerror = () => reject(new Error("File conversion failed safely."));
    } catch (e) {
      reject(new Error("File processing interrupted."));
    }
  });
}
