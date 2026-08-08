import React, { useState } from 'react';
import { PageItem, LanguageKey } from '../types';

interface RecognitionResultProps {
  pages: PageItem[];
  onLanguageChange: (pageId: string, lang: LanguageKey) => void;
  onFontSizeChange: (pageId: string, newSize: number) => void;
  onToggleBold: (pageId: string) => void;
  onRetryPage: (pageId: string) => void;
  isProcessingBatch: boolean;
  currentProcessingIndex: number;
}

export const RecognitionResult: React.FC<RecognitionResultProps> = ({
  pages,
  onLanguageChange,
  onFontSizeChange,
  onToggleBold,
  onRetryPage,
  isProcessingBatch,
  currentProcessingIndex
}) => {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedPageId, setCopiedPageId] = useState<string | null>(null);

  const handleCopyPage = async (page: PageItem) => {
    const text = page.activeLang === 'original' ? page.recognizedText : page.translations[page.activeLang] || page.recognizedText;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPageId(page.id);
      setTimeout(() => setCopiedPageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy page text:', err);
    }
  };

  const handleCopyAll = async () => {
    const validPages = pages.filter(
      (p) => p.status === 'success' && (p.recognizedText || p.translations[p.activeLang])
    );

    if (validPages.length === 0) return;

    const combined = validPages
      .map((p, idx) => {
        const text = p.activeLang === 'original' ? p.recognizedText : p.translations[p.activeLang] || p.recognizedText;
        return `--- PAGE ${idx + 1} ---\n\n${text}`;
      })
      .join('\n\n\n');

    try {
      await navigator.clipboard.writeText(combined);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (err) {
      console.error('Failed to copy all text:', err);
    }
  };

  // If no pages are in batch
  if (pages.length === 0) {
    return (
      <div className="w-full h-full min-h-[360px] md:min-h-[420px] flex flex-col items-center justify-center p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
        <i className="fas fa-file-invoice text-5xl mb-4 opacity-10"></i>
        <p className="font-bold text-slate-600 text-sm">No results generated</p>
        <p className="text-xs text-slate-400 mt-1">Upload or capture pages and click Recognize All Pages</p>
      </div>
    );
  }

  const hasSuccessfulResults = pages.some(
    (p) => p.status === 'success' && (p.recognizedText || p.translations[p.activeLang])
  );

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Header bar with Copy All */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Digital Results</h3>
          <span className="px-2.5 py-0.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-full">
            {pages.filter((p) => p.status === 'success').length} / {pages.length} Pages
          </span>
        </div>

        {hasSuccessfulResults && (
          <button
            onClick={handleCopyAll}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
              copiedAll
                ? 'bg-emerald-500 text-white shadow-emerald-200'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
            title="Copy all recognized pages to clipboard"
          >
            <i className={copiedAll ? 'fas fa-check text-xs' : 'fas fa-copy text-xs'}></i>
            <span>{copiedAll ? 'Copied All' : 'Copy All'}</span>
          </button>
        )}
      </div>

      {/* Stacked Page Result Cards */}
      <div className="flex flex-col gap-6">
        {pages.map((page, index) => {
          const displayText =
            page.activeLang === 'original'
              ? page.recognizedText
              : page.translations[page.activeLang] || page.recognizedText;

          return (
            <div
              key={page.id}
              className="w-full flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all"
            >
              {/* Page Card Header & Controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200 gap-3">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <span className="px-2.5 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg">
                    Page {index + 1}
                  </span>

                  <div className="flex items-center gap-2">
                    <label
                      htmlFor={`lang-select-${page.id}`}
                      className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider"
                    >
                      Languages
                    </label>
                    <div className="relative">
                      <select
                        id={`lang-select-${page.id}`}
                        value={page.activeLang}
                        onChange={(e) => onLanguageChange(page.id, e.target.value as LanguageKey)}
                        disabled={page.status !== 'success' || page.isTranslating}
                        className="appearance-none bg-white border border-slate-300 hover:border-slate-400 text-slate-800 text-xs font-bold py-1.5 pl-2.5 pr-7 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer disabled:opacity-50 transition-all"
                      >
                        <option value="original">Original</option>
                        <option value="hindi">Hindi</option>
                        <option value="telugu">Telugu</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                        <i className="fas fa-chevron-down text-[9px]"></i>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Text Controls & Per-Page Copy */}
                <div className="flex items-center justify-end gap-1.5 w-full sm:w-auto">
                  {/* Font Size Controls */}
                  <div className="flex items-center bg-slate-200/70 rounded-xl p-0.5">
                    <button
                      onClick={() => onFontSizeChange(page.id, Math.max(10, page.fontSize - 2))}
                      disabled={page.status !== 'success'}
                      className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-white hover:shadow-sm rounded-lg transition-all text-xs disabled:opacity-30"
                      title="Decrease font size"
                    >
                      <i className="fas fa-minus text-[10px]"></i>
                    </button>
                    <div className="px-1 text-[10px] font-bold text-slate-600 w-6 text-center">
                      {page.fontSize}
                    </div>
                    <button
                      onClick={() => onFontSizeChange(page.id, Math.min(32, page.fontSize + 2))}
                      disabled={page.status !== 'success'}
                      className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-white hover:shadow-sm rounded-lg transition-all text-xs disabled:opacity-30"
                      title="Increase font size"
                    >
                      <i className="fas fa-plus text-[10px]"></i>
                    </button>
                  </div>

                  {/* Bold Toggle */}
                  <button
                    onClick={() => onToggleBold(page.id)}
                    disabled={page.status !== 'success'}
                    className={`w-8 h-8 flex items-center justify-center rounded-xl border transition-all disabled:opacity-30 ${
                      page.isBold
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                    title="Toggle Bold"
                  >
                    <i className="fas fa-bold text-xs"></i>
                  </button>

                  <div className="w-px h-5 bg-slate-300 mx-1"></div>

                  {/* Per-Page Copy Button */}
                  <button
                    onClick={() => handleCopyPage(page)}
                    disabled={page.status !== 'success' || !displayText || page.isTranslating}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      copiedPageId === page.id
                        ? 'bg-emerald-500 text-white shadow-emerald-200'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    } disabled:opacity-30`}
                    title={`Copy Page ${index + 1} text`}
                  >
                    <i className={copiedPageId === page.id ? 'fas fa-check text-xs' : 'fas fa-copy text-xs'}></i>
                    <span>{copiedPageId === page.id ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Result Content Box */}
              <div className="relative min-h-[200px] overflow-hidden bg-white flex flex-col justify-between">
                {/* Translating Spinner Overlay */}
                {page.isTranslating && (
                  <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-7 h-7 border-2 border-slate-900/10 border-t-slate-900 rounded-full animate-spin mb-2"></div>
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Translating Page {index + 1} to {page.activeLang}...
                    </p>
                  </div>
                )}

                {/* Processing State */}
                {page.status === 'processing' && (
                  <div className="w-full h-full min-h-[220px] flex flex-col items-center justify-center p-8 text-center bg-slate-50">
                    <div className="relative mb-4">
                      <div className="w-12 h-12 border-3 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 animate-pulse">
                      Analyzing Page {index + 1}...
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      UNDERSTAND AI is identifying characters and layout.
                    </p>
                  </div>
                )}

                {/* Error State */}
                {page.status === 'error' && (
                  <div className="w-full h-full min-h-[220px] flex flex-col items-center justify-center p-6 text-center bg-rose-50/50">
                    <i className="fas fa-circle-exclamation text-2xl text-rose-500 mb-2"></i>
                    <h4 className="text-sm font-bold text-rose-800">
                      Page {index + 1} Recognition Failed
                    </h4>
                    <p className="text-xs text-rose-600/90 mt-1 max-w-sm">
                      {page.errorMessage || 'Unable to recognize handwriting on this page.'}
                    </p>
                    <button
                      onClick={() => onRetryPage(page.id)}
                      disabled={isProcessingBatch}
                      className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <i className="fas fa-rotate-right text-[10px]"></i>
                      <span>Retry Page {index + 1}</span>
                    </button>
                  </div>
                )}

                {/* Idle / Unprocessed State */}
                {page.status === 'idle' && (
                  <div className="w-full h-full min-h-[200px] flex flex-col items-center justify-center p-6 text-center bg-slate-50/50 text-slate-400">
                    <i className="fas fa-hourglass-start text-3xl mb-2 opacity-20"></i>
                    <p className="text-xs font-medium uppercase tracking-wider">
                      Ready for recognition
                    </p>
                  </div>
                )}

                {/* Success / Recognized Text Area */}
                {page.status === 'success' && (
                  <div
                    className="p-6 font-mono-custom leading-relaxed whitespace-pre-wrap text-slate-800 selection:bg-indigo-100 selection:text-indigo-900"
                    style={{
                      fontSize: `${page.fontSize}px`,
                      fontWeight: page.isBold ? 'bold' : 'normal'
                    }}
                  >
                    {displayText || 'No text detected on this page.'}
                  </div>
                )}

                {/* Page Footer Info */}
                {page.status === 'success' && (
                  <div className="px-6 py-2.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                      Page {index + 1} Verified
                    </span>
                    {displayText && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        {displayText.split(/\s+/).filter((x) => x.length > 0).length} words
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
