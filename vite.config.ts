import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { GoogleGenAI } from '@google/genai';

function apiDevPlugin(): Plugin {
  return {
    name: 'api-dev-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) {
          return next();
        }

        const env = loadEnv(server.config.mode, server.config.root, '');
        const apiKey = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || env.API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;
        const modelName = env.GEMINI_MODEL || process.env.GEMINI_MODEL || 'gemini-flash-latest';

        let bodyStr = '';
        req.on('data', (chunk) => {
          bodyStr += chunk;
        });

        req.on('end', async () => {
          try {
            const body = bodyStr ? JSON.parse(bodyStr) : {};

            if (req.url === '/api/recognize') {
              if (!apiKey) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ 
                  error: 'Gemini API key is missing. Please set GEMINI_API_KEY in Vercel environment variables.' 
                }));
              }

              const { base64Image, mimeType } = body;
              const ai = new GoogleGenAI({ apiKey });

              const response = await ai.models.generateContent({
                model: modelName,
                contents: {
                  parts: [
                    { inlineData: { mimeType, data: base64Image } },
                    { text: "Extract all handwritten text from this image accurately. Return ONLY the transcribed text with no explanations." }
                  ]
                },
                config: {
                  systemInstruction: `You are an accurate OCR engine for handwritten document digitization. Return ONLY clean transcribed text.`,
                  temperature: 0.1
                }
              });

              const text = response.text || '';
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ text: (text || 'The system could not detect any readable text in the image.').trim() }));
            }

            if (req.url === '/api/translate') {
              if (!apiKey) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ translatedText: body.text || '' }));
              }

              const { text, targetLanguage } = body;
              const ai = new GoogleGenAI({ apiKey });

              const response = await ai.models.generateContent({
                model: modelName,
                contents: `Task: Translate the following text into ${targetLanguage || 'Hindi'}.\n\nText:\n${text}`,
                config: {
                  temperature: 0.2,
                  systemInstruction: "You are a translation module. Return ONLY clean, translated text."
                }
              });

              const translatedText = response.text || text;
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ translatedText: translatedText.trim() }));
            }

            next();
          } catch (err: any) {
            console.error("Local Dev API Error:", err?.message || err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'Recognition service is temporarily unavailable. Please try again.' }));
          }
        });
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), apiDevPlugin()],
  server: {
    port: 3000
  }
});