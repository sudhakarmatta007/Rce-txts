export async function recognizeHandwriting(base64Image: string, mimeType: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout limit

  try {
    const response = await fetch('/api/recognize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ base64Image, mimeType }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Recognition failed on server.");
    }

    return data.text || "The system could not detect any readable text in the image.";
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error("Gemini OCR Error:", error);
    if (error.name === 'AbortError') {
      throw new Error("Recognition is taking too long. Please check your internet connection or click Try Again.");
    }
    throw new Error(error.message || "Network error. Please try again.");
  }
}

export async function translateText(text: string, targetLanguage: 'Hindi' | 'Telugu'): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, targetLanguage }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const data = await response.json();
    return data.translatedText || text;
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error("Gemini Translation Error:", error);
    return text;
  }
}

export async function fileToBase64(file: File): Promise<{ data: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    // Compress and scale large images (> 200 KB) for high-speed transfer while preserving text legibility
    if (file.type.startsWith('image/') && file.size > 200 * 1024) {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const maxDim = 1600;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                return readRawFile(file).then(resolve).catch(reject);
              }
              const reader = new FileReader();
              reader.readAsDataURL(blob);
              reader.onload = () => {
                const resStr = reader.result as string;
                resolve({ data: resStr.split(',')[1], mimeType: 'image/jpeg' });
              };
              reader.onerror = () => reject(new Error("Image optimization failed."));
            },
            'image/jpeg',
            0.88
          );
          return;
        }
        readRawFile(file).then(resolve).catch(reject);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        readRawFile(file).then(resolve).catch(reject);
      };
      img.src = url;
      return;
    }

    readRawFile(file).then(resolve).catch(reject);
  });
}

function readRawFile(file: File): Promise<{ data: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      resolve({ data: base64Data, mimeType: file.type || 'image/jpeg' });
    };
    reader.onerror = () => reject(new Error("File conversion failed safely."));
  });
}
