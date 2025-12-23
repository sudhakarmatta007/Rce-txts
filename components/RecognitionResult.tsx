
import React, { useState } from 'react';

export type LanguageKey = 'original' | 'hindi' | 'telugu';

interface RecognitionResultProps {
  text: string;
  translations: Record<string, string>;
  activeLang: LanguageKey;
  onLanguageChange: (lang: LanguageKey) => void;
  isProcessing: boolean;
  isTranslating: boolean;
  fontSize: number;
  isBold: boolean;
  onFontSizeChange: (newSize: number) => void;
  onToggleBold: () => void;
}

export const RecognitionResult: React.FC<RecognitionResultProps> = ({ 
  text, 
  translations, 
  activeLang,
  onLanguageChange,
  isProcessing,
  isTranslating,
  fontSize,
  isBold,
  onFontSizeChange,
  onToggleBold
}) => {
  const [copied, setCopied] = useState(false);

  const displayText = activeLang === 'original' ? text : translations[activeLang];

  const handleCopy = async () => {
    if (!displayText) return;
    try {
      await navigator.clipboard.writeText(displayText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  if (isProcessing) {
    return (
      <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center p-8 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="relative mb-6">
          <div className="w-16 h-16 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <i className="fas fa-brain text-slate-400 animate-pulse"></i>
          </div>
        </div>
        <h3 className="text-lg font-bold text-slate-800 animate-pulse">Analyzing Handwriting...</h3>
        <p className="text-sm text-slate-500 mt-2 text-center max-w-xs">
          RCE-Txts is identifying characters and structure.
        </p>
      </div>
    );
  }

  if (!text) {
    return (
      <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
        <i className="fas fa-file-invoice text-5xl mb-4 opacity-10"></i>
        <p className="font-medium">No results generated</p>
        <p className="text-xs mt-1">Upload an image and start processing</p>
      </div>
    );
  }

  const tabs: { key: LanguageKey; label: string; icon: string }[] = [
    { key: 'original', label: 'Original', icon: 'fa-font' },
    { key: 'hindi', label: 'Hindi', icon: 'fa-language' },
    { key: 'telugu', label: 'Telugu', icon: 'fa-language' },
  ];

  return (
    <div className="w-full flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm h-full">
      {/* Language Tabs & Controls Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between px-2 pt-2 bg-slate-50 border-b border-slate-200 gap-2">
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onLanguageChange(tab.key)}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                activeLang === tab.key
                  ? 'bg-white text-slate-900 border-x border-t border-slate-200 -mb-px shadow-[0_-2px_4px_rgba(0,0,0,0.02)]'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
            >
              <i className={`fas ${tab.icon} text-[10px]`}></i>
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-1.5 px-2 pb-2 sm:pb-0 sm:mb-2">
            {/* Font Size Controls */}
            <div className="flex items-center bg-slate-200 rounded-lg p-0.5">
                <button 
                    onClick={() => onFontSizeChange(Math.max(10, fontSize - 2))}
                    className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-white hover:shadow-sm rounded-md transition-all text-xs"
                    title="Decrease font size"
                >
                    <i className="fas fa-minus"></i>
                </button>
                <div className="px-2 text-[10px] font-bold text-slate-500 w-8 text-center">{fontSize}</div>
                <button 
                    onClick={() => onFontSizeChange(Math.min(32, fontSize + 2))}
                    className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-white hover:shadow-sm rounded-md transition-all text-xs"
                    title="Increase font size"
                >
                    <i className="fas fa-plus"></i>
                </button>
            </div>

            {/* Bold Toggle */}
            <button 
                onClick={onToggleBold}
                className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${
                    isBold ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
                title="Toggle Bold"
            >
                <i className="fas fa-bold text-xs"></i>
            </button>

            <div className="w-px h-6 bg-slate-300 mx-1"></div>

            <button 
                onClick={handleCopy}
                disabled={!displayText || isTranslating}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    copied ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-slate-900 text-white hover:bg-slate-800'
                } disabled:opacity-30`}
            >
                <i className={copied ? "fas fa-check" : "fas fa-copy"}></i>
                {copied ? 'Copied' : 'Copy'}
            </button>
        </div>
      </div>

      <div className="relative flex-grow min-h-[350px] overflow-hidden bg-white">
        {isTranslating && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center p-6 text-center">
             <div className="w-8 h-8 border-2 border-slate-900/10 border-t-slate-900 rounded-full animate-spin mb-4"></div>
             <p className="text-xs font-bold text-slate-700 uppercase tracking-widest">Translating to {activeLang}...</p>
          </div>
        )}
        
        <div 
            className="p-8 h-full overflow-auto font-mono-custom leading-relaxed whitespace-pre-wrap text-slate-700 selection:bg-indigo-100 selection:text-indigo-900"
            style={{ 
                fontSize: `${fontSize}px`,
                fontWeight: isBold ? 'bold' : 'normal'
            }}
        >
          {displayText || (activeLang !== 'original' && !isTranslating && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60" style={{ fontSize: '14px', fontWeight: 'normal' }}>
                <i className="fas fa-language text-3xl mb-3"></i>
                <p className="text-xs font-medium uppercase tracking-widest">Translation requested</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
         <div className="flex items-center gap-3">
             <div className="flex -space-x-1">
                 <div className="w-5 h-5 rounded-full bg-rose-500 border border-white"></div>
                 <div className="w-5 h-5 rounded-full bg-indigo-500 border border-white"></div>
                 <div className="w-5 h-5 rounded-full bg-slate-900 border border-white"></div>
             </div>
             <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Readability Enhanced</span>
         </div>
         {displayText && (
             <span className="text-[10px] text-slate-400 font-medium">
                 {displayText.split(/\s+/).filter(x => x.length > 0).length} words
             </span>
         )}
      </div>
    </div>
  );
};
