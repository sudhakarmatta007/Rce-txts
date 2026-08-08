import React, { useState, useCallback } from 'react';
import { PageItem, LanguageKey } from './types';
import { recognizeHandwriting, translateText, fileToBase64 } from './services/geminiService';
import { Button } from './components/Button';
import { FileUploader } from './components/FileUploader';
import { RecognitionResult } from './components/RecognitionResult';
import { CameraCapture } from './components/CameraCapture';
import { BrandLogo } from './components/BrandLogo';

const App: React.FC = () => {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [isProcessingBatch, setIsProcessingBatch] = useState<boolean>(false);
  const [currentProcessingIndex, setCurrentProcessingIndex] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Add files to batch (max 10)
  const handleAddFiles = useCallback((files: File[]) => {
    if (files.length === 0) return;
    setErrorMessage(null);

    setPages((prevPages) => {
      const availableSlots = 10 - prevPages.length;
      if (availableSlots <= 0) {
        setErrorMessage("You can upload up to 10 pages at a time.");
        return prevPages;
      }

      const filesToAdd = files.slice(0, availableSlots);
      if (files.length > availableSlots) {
        setErrorMessage("You can upload up to 10 pages at a time.");
      }

      const newItems: PageItem[] = filesToAdd.map((file) => ({
        id: `page_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        file,
        preview: URL.createObjectURL(file),
        status: 'idle',
        recognizedText: '',
        translations: {},
        activeLang: 'original',
        isTranslating: false,
        fontSize: 14,
        isBold: false
      }));

      return [...prevPages, ...newItems];
    });

    setShowCamera(false);
  }, []);

  // Handle camera single capture append
  const handleCameraCapture = useCallback((file: File) => {
    setErrorMessage(null);
    setPages((prevPages) => {
      if (prevPages.length >= 10) {
        setErrorMessage("You can upload up to 10 pages at a time.");
        return prevPages;
      }
      const newItem: PageItem = {
        id: `page_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        file,
        preview: URL.createObjectURL(file),
        status: 'idle',
        recognizedText: '',
        translations: {},
        activeLang: 'original',
        isTranslating: false,
        fontSize: 14,
        isBold: false
      };
      return [...prevPages, newItem];
    });

    setShowCamera(false);
  }, []);

  // Remove single page from batch
  const handleRemovePage = useCallback((id: string) => {
    setPages((prevPages) => {
      const target = prevPages.find((p) => p.id === id);
      if (target?.preview) {
        URL.revokeObjectURL(target.preview);
      }
      return prevPages.filter((p) => p.id !== id);
    });
  }, []);

  // Clear all pages in batch
  const handleClearAll = useCallback(() => {
    setPages((prevPages) => {
      prevPages.forEach((p) => {
        if (p.preview) URL.revokeObjectURL(p.preview);
      });
      return [];
    });
    setErrorMessage(null);
    setShowCamera(false);
  }, []);

  // Max limit callback
  const handleMaxLimitExceeded = useCallback(() => {
    setErrorMessage("You can upload up to 10 pages at a time.");
  }, []);

  // Sequential batch processing of all pages in batch
  const handleProcessBatch = async () => {
    if (pages.length === 0 || isProcessingBatch) return;

    setIsProcessingBatch(true);
    setErrorMessage(null);

    let hasErrors = false;

    for (let i = 0; i < pages.length; i++) {
      const currentPage = pages[i];
      // Skip pages that are already recognized successfully
      if (currentPage.status === 'success') continue;

      setCurrentProcessingIndex(i);

      setPages((prev) =>
        prev.map((p, idx) =>
          idx === i ? { ...p, status: 'processing', errorMessage: undefined } : p
        )
      );

      try {
        const { data, mimeType } = await fileToBase64(currentPage.file);
        const resultText = await recognizeHandwriting(data, mimeType);
        setPages((prev) =>
          prev.map((p, idx) =>
            idx === i
              ? { ...p, status: 'success', recognizedText: resultText, errorMessage: undefined }
              : p
          )
        );
      } catch (err: any) {
        console.error(`Error recognizing page ${i + 1}:`, err);
        hasErrors = true;
        setPages((prev) =>
          prev.map((p, idx) =>
            idx === i
              ? {
                  ...p,
                  status: 'error',
                  errorMessage: err?.message || 'Recognition failed for this page.'
                }
              : p
          )
        );
      }
    }

    if (hasErrors) {
      setErrorMessage("One or more pages failed recognition. You can retry individual failed pages.");
    }

    setIsProcessingBatch(false);
  };

  // Retry a single page
  const handleRetrySinglePage = async (pageId: string) => {
    const targetIndex = pages.findIndex((p) => p.id === pageId);
    if (targetIndex === -1 || isProcessingBatch) return;

    setIsProcessingBatch(true);
    setCurrentProcessingIndex(targetIndex);

    setPages((prev) =>
      prev.map((p) => (p.id === pageId ? { ...p, status: 'processing', errorMessage: undefined } : p))
    );

    const targetPage = pages[targetIndex];

    try {
      const { data, mimeType } = await fileToBase64(targetPage.file);
      const resultText = await recognizeHandwriting(data, mimeType);
      setPages((prev) =>
        prev.map((p) =>
          p.id === pageId
            ? { ...p, status: 'success', recognizedText: resultText, errorMessage: undefined }
            : p
        )
      );
    } catch (err: any) {
      console.error(`Error retrying page ${targetIndex + 1}:`, err);
      setPages((prev) =>
        prev.map((p) =>
          p.id === pageId
            ? { ...p, status: 'error', errorMessage: err?.message || 'Recognition failed.' }
            : p
        )
      );
    }

    setIsProcessingBatch(false);
  };

  // Per-page translation handler
  const handlePageLanguageChange = async (pageId: string, lang: LanguageKey) => {
    const targetPage = pages.find((p) => p.id === pageId);
    if (!targetPage || targetPage.activeLang === lang) return;

    const prevLang = targetPage.activeLang;
    setPages((prev) =>
      prev.map((p) => (p.id === pageId ? { ...p, activeLang: lang } : p))
    );

    if (lang !== 'original' && !targetPage.translations[lang] && targetPage.recognizedText) {
      setPages((prev) =>
        prev.map((p) => (p.id === pageId ? { ...p, isTranslating: true } : p))
      );

      try {
        const targetLangName = lang === 'hindi' ? 'Hindi' : 'Telugu';
        const translated = await translateText(targetPage.recognizedText, targetLangName);
        setPages((prev) =>
          prev.map((p) =>
            p.id === pageId
              ? {
                  ...p,
                  translations: { ...p.translations, [lang]: translated },
                  isTranslating: false
                }
              : p
          )
        );
      } catch (err: any) {
        console.error("Translation error:", err);
        setPages((prev) =>
          prev.map((p) =>
            p.id === pageId
              ? { ...p, activeLang: prevLang, isTranslating: false }
              : p
          )
        );
      }
    }
  };

  // Per-page font size
  const handlePageFontSize = (pageId: string, newSize: number) => {
    setPages((prev) =>
      prev.map((p) => (p.id === pageId ? { ...p, fontSize: newSize } : p))
    );
  };

  // Per-page bold toggle
  const handlePageToggleBold = (pageId: string) => {
    setPages((prev) =>
      prev.map((p) => (p.id === pageId ? { ...p, isBold: !p.isBold } : p))
    );
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-indigo-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo size={40} />
            <div>
              <h1 className="font-bold text-slate-900 text-lg leading-tight tracking-tight">UNDERSTAND AI</h1>
              <p className="text-[9px] text-indigo-600 font-extrabold uppercase tracking-[0.2em]">See it. Understand it. Text it.</p>
            </div>
          </div>

          <button
            onClick={() => window.location.reload()}
            title="Refresh page"
            aria-label="Refresh page"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
          >
            <i className="fas fa-rotate-right text-sm"></i>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-6xl mx-auto w-full px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 h-full">
          
          {/* Left Column: Input Selection & Page Batch */}
          <section className="flex flex-col gap-6">
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Handwritten Analysis</h2>
              <p className="text-slate-500 text-sm font-medium">See it. Understand it. Text it.</p>
            </div>

            {/* Gallery vs Camera Input Tabs */}
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200">
              <button 
                onClick={() => setShowCamera(false)}
                className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${!showCamera ? 'bg-white shadow-sm text-slate-900 border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <i className="fas fa-images mr-2"></i>Gallery
              </button>
              <button 
                onClick={() => {
                  if (pages.length >= 10) {
                    setErrorMessage("You can upload up to 10 pages at a time.");
                    return;
                  }
                  setShowCamera(true);
                }}
                className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${showCamera ? 'bg-white shadow-sm text-slate-900 border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <i className="fas fa-camera mr-2"></i>Camera
              </button>
            </div>

            {/* Input Component */}
            <div className="flex-grow">
              {showCamera ? (
                <CameraCapture 
                  onCapture={handleCameraCapture} 
                  onCancel={() => setShowCamera(false)} 
                />
              ) : (
                <FileUploader 
                  pages={pages}
                  onAddFiles={handleAddFiles}
                  onRemovePage={handleRemovePage}
                  onClearAll={handleClearAll}
                  isProcessing={isProcessingBatch}
                  onMaxLimitExceeded={handleMaxLimitExceeded}
                />
              )}
            </div>

            {/* Notice / Error Banner */}
            {errorMessage && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start justify-between gap-3 text-rose-700 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-start gap-3">
                  <i className="fas fa-circle-exclamation mt-1 text-rose-500"></i>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-tight">Notice</p>
                    <p className="text-xs leading-relaxed opacity-90">{errorMessage}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {pages.some((p) => p.status === 'error' || p.status === 'idle') && pages.length > 0 && (
                    <button 
                      onClick={handleProcessBatch}
                      disabled={isProcessingBatch}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
                    >
                      <i className="fas fa-rotate-right text-[10px]"></i>
                      Try Again
                    </button>
                  )}
                  <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-rose-600 p-1">
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              </div>
            )}

            {/* Primary Action Controls */}
            <div className="flex gap-4">
                <Button 
                    className="flex-grow h-14 text-lg font-bold shadow-xl shadow-slate-100 rounded-2xl" 
                    onClick={handleProcessBatch} 
                    disabled={pages.length === 0 || isProcessingBatch}
                    isLoading={isProcessingBatch}
                    icon="fas fa-wand-magic-sparkles"
                >
                    {isProcessingBatch 
                      ? `Analyzing Page ${currentProcessingIndex + 1} of ${pages.length}...`
                      : pages.length > 1
                      ? `Recognize All ${pages.length} Pages`
                      : 'Recognize Text'
                    }
                </Button>
                {pages.length > 0 && (
                    <Button 
                        variant="secondary" 
                        className="w-14 h-14 p-0 rounded-2xl"
                        onClick={handleClearAll}
                        disabled={isProcessingBatch}
                        title="Clear all pages"
                    >
                        <i className="fas fa-trash-can"></i>
                    </Button>
                )}
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 bg-white flex flex-col gap-2">
                    <i className="fas fa-shield-halved text-slate-400 text-lg"></i>
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Stable Logic</h5>
                    <p className="text-xs text-slate-600 font-medium">Fails gracefully to maintain application uptime.</p>
                </div>
                <div className="p-4 rounded-2xl border border-slate-200 bg-white flex flex-col gap-2">
                    <i className="fas fa-code text-slate-400 text-lg"></i>
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Predictable</h5>
                    <p className="text-xs text-slate-600 font-medium">No hidden metadata or malformed AI outputs.</p>
                </div>
            </div>
          </section>

          {/* Right Column: Vertically Stacked Digital Results */}
          <section className="flex flex-col gap-6 lg:mt-0">
             <div className="flex-grow">
                <RecognitionResult 
                  pages={pages}
                  onLanguageChange={handlePageLanguageChange}
                  onFontSizeChange={handlePageFontSize}
                  onToggleBold={handlePageToggleBold}
                  onRetryPage={handleRetrySinglePage}
                  isProcessingBatch={isProcessingBatch}
                  currentProcessingIndex={currentProcessingIndex}
                />
             </div>
          </section>

        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="py-6 border-t border-slate-200 mt-8 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 text-center space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">&copy; 2026 UNDERSTAND AI</p>
          <p className="text-[11px] font-medium text-slate-400">Built by Sudhakar Matta</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
