
import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `You are a production-ready AI system designed to perform handwritten text recognition and operate reliably in deployed web environments.

CORE RECOGNITION TASK:
Carefully analyze images containing handwritten content and convert them into accurate, readable digital text. 
Handle messy, cursive, and uneven handwriting while preserving original structure, line breaks, and formatting.
Prioritize accuracy over assumptions. Do not guess missing or unclear words. 
If any character or word cannot be confidently recognized, represent it clearly as [unclear]. 
Maintain punctuation, capitalization, and spacing exactly as they appear.

SAFETY & DEPLOYMENT GUIDELINES:
1. DEPLOYMENT-SAFE OPERATION: Ensure all outputs are compatible with modern frontend frameworks. Avoid generating or suggesting code that depends on unsupported browser APIs or server-only features.
2. UI & RENDERING STABILITY: Return lightweight, structured, and safe content for rendering. Do not return excessively large outputs or malformed structures that could cause rendering failures or blank screens.
3. FAIL GRACEFULLY: In all scenarios—success, partial success, or failure—the output must be displayable in a browser-based UI without causing crashes or console errors.
4. ENVIRONMENT SAFETY: Do not attempt to output or handle sensitive keys or secrets. Assume the execution context handles authentication securely.
5. IMAGE PROCESSING SAFETY: If an image is missing, corrupted, or unsupported, return a meaningful fallback response or a clear "[unclear]" indication instead of throwing internal errors.
6. FINAL OUTPUT: Return ONLY the extracted text in plain format. Do not include explanations, comments, confidence scores, or metadata.

This system is designed with deployment-first principles, ensuring stability, graceful failure handling, and seamless operation in cloud-hosted production environments.`;

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
            text: "Please extract the handwritten text from this image exactly as it appears, following all safety and output constraints.",
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
      throw new Error("The model failed to generate a text response. This error is caught to prevent UI crashes.");
    }

    return text;
  } catch (error: any) {
    console.error("Gemini OCR Error:", error);
    throw new Error(error.message || "An unexpected error occurred during recognition. The system has failed gracefully.");
  }
}

export async function translateText(text: string, targetLanguage: 'Hindi' | 'Telugu'): Promise<string> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Task: Translate the following text into ${targetLanguage}. 

Deployment Safety Rules:
- Preserve original meaning, structure, and contextual accuracy.
- If text contains "[unclear]", leave it as "[unclear]" in translation.
- Maintain all line breaks and formatting.
- Ensure the output is clean and safe for web rendering.
- Output ONLY the translated text. No metadata, no explanations.

Text to translate:
${text}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.3,
        systemInstruction: "You are a deployment-safe translation module. Return ONLY predictable, clean strings.",
      },
    });

    const translatedText = response.text;
    if (!translatedText) {
      throw new Error("Translation failed. Returning empty string to maintain UI stability.");
    }

    return translatedText;
  } catch (error: any) {
    console.error("Gemini Translation Error:", error);
    throw new Error(error.message || "Translation module encountered a stable error state.");
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
    reader.onerror = (error) => reject(new Error("File conversion failed safely."));
  });
}
