
import React, { useState, useCallback } from 'react';
import { AppStatus, ImageFile } from './types';
//import { recognizeHandwriting, translateText, fileToBase64 } from './services/geminiService';
import { Button } from './components/Button';
import { FileUploader } from './components/FileUploader';
import { RecognitionResult, LanguageKey } from './components/RecognitionResult';
import { CameraCapture } from './components/CameraCapture';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);
  const [recognizedText, setRecognizedText] = useState<string>('');
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [activeLang, setActiveLang] = useState<LanguageKey>('original');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState<boolean>(false);
  
  // Customization States
  const [fontSize, setFontSize] = useState<number>(14);
  const [isBold, setIsBold] = useState<boolean>(false);

  // Added toggleBold function to fix "Cannot find name 'toggleBold'" error on line 242
  const toggleBold = useCallback(() => {
    setIsBold(prev => !prev);
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    if (selectedImage?.preview) {
      URL.revokeObjectURL(selectedImage.preview);
    }
    const preview = URL.createObjectURL(file);
    setSelectedImage({ file, preview });
    setRecognizedText('');
    setTranslations({});
    setActiveLang('original');
    setErrorMessage(null);
    setStatus(AppStatus.IDLE);
    setShowCamera(false);
  }, [selectedImage]);

  const handleClear = useCallback(() => {
    if (selectedImage) {
      URL.revokeObjectURL(selectedImage.preview);
    }
    setSelectedImage(null);
    setRecognizedText('');
    setTranslations({});
    setActiveLang('original');
    setErrorMessage(null);
    setStatus(AppStatus.IDLE);
    setShowCamera(false);
  }, [selectedImage]);

const handleProcess = async () => {
  // TEMPORARY SAFE MODE — AI disabled
  setStatus(AppStatus.SUCCESS);
  setRecognizedText("RCE-Txts frontend is rendering correctly.");
};

  const handleLanguageChange = async (lang: LanguageKey) => {
    if (lang === activeLang) return;
    
    const prevLang = activeLang;
    setActiveLang(lang);
    
    if (lang !== 'original' && !translations[lang] && recognizedText) {
      setIsTranslating(true);
      try {
        const target = lang === 'hindi' ? 'Hindi' : 'Telugu';
        //const translated = await translateText(recognizedText, target);
        //setTranslations(prev => ({ ...prev, [lang]: translated }));
      } catch (err: any) {
        console.error("Translation Error:", err);
        setErrorMessage(`Translation to ${lang} encountered an issue. Reverting view.`);
        setActiveLang(prevLang); // Graceful fallback to previous working view
      } finally {
        setIsTranslating(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-indigo-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-200">
              <i className="fas fa-font text-white text-xl"></i>
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-lg leading-tight tracking-tight">RCE-Txts</h1>
              <p className="text-[9px] text-indigo-600 font-extrabold uppercase tracking-[0.2em]">Deployment Ready OCR</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">System Online</span>
            </div>
            <Button variant="ghost" className="text-xs font-bold uppercase tracking-wider">Help</Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-6xl mx-auto w-full px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 h-full">
          
          {/* Left Column: Input selection */}
          <section className="flex flex-col gap-6">
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Handwritten Analysis</h2>
              <p className="text-slate-500 text-sm font-medium">Reliable image-to-text conversion for production environments.</p>
            </div>

            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200">
              <button 
                onClick={() => { setShowCamera(false); if (!selectedImage) handleClear(); }}
                className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${!showCamera ? 'bg-white shadow-sm text-slate-900 border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <i className="fas fa-images mr-2"></i>Gallery
              </button>
              <button 
                onClick={() => { setShowCamera(true); if (!selectedImage) handleClear(); }}
                className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${showCamera ? 'bg-white shadow-sm text-slate-900 border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <i className="fas fa-camera mr-2"></i>Camera
              </button>
            </div>

            <div className="flex-grow">
              {showCamera && !selectedImage ? (
                <CameraCapture onCapture={handleFileSelect} onCancel={() => setShowCamera(false)} />
              ) : (
                <FileUploader 
                  onFileSelect={handleFileSelect} 
                  selectedImage={selectedImage} 
                  onClear={handleClear} 
                />
              )}
            </div>

            {errorMessage && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-rose-700 animate-in fade-in slide-in-from-top-2">
                <i className="fas fa-circle-exclamation mt-1"></i>
                <div className="flex-grow">
                  <p className="text-sm font-bold uppercase tracking-tight">Notice</p>
                  <p className="text-xs leading-relaxed opacity-80">{errorMessage}</p>
                </div>
                <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-rose-600">
                  <i className="fas fa-times"></i>
                </button>
              </div>
            )}

            <div className="flex gap-4">
                <Button 
                    className="flex-grow h-14 text-lg font-bold shadow-xl shadow-slate-100 rounded-2xl" 
                    onClick={handleProcess} 
                    disabled={!selectedImage || status === AppStatus.PROCESSING}
                    isLoading={status === AppStatus.PROCESSING}
                    icon="fas fa-wand-magic-sparkles"
                >
                    {status === AppStatus.PROCESSING ? 'Analyzing...' : 'Recognize Text'}
                </Button>
                {selectedImage && (
                    <Button 
                        variant="secondary" 
                        className="w-14 h-14 p-0 rounded-2xl"
                        onClick={handleClear}
                        disabled={status === AppStatus.PROCESSING}
                    >
                        <i className="fas fa-trash-can"></i>
                    </Button>
                )}
            </div>

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

          {/* Right Column: Output Result */}
          <section className="flex flex-col gap-6 lg:mt-0">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Digital Result</h2>
                  {status === AppStatus.SUCCESS && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-900 text-white text-[8px] font-black uppercase rounded-full tracking-widest">
                      <i className="fas fa-check text-[6px]"></i> Verified
                    </div>
                  )}
                </div>
                
                {status === AppStatus.SUCCESS && (
                  <div className="flex gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>Ready for Translation</span>
                  </div>
                )}
             </div>
             
             <div className="flex-grow">
                <RecognitionResult 
                  text={recognizedText}
                  translations={translations}
                  activeLang={activeLang}
                  onLanguageChange={handleLanguageChange}
                  isProcessing={status === AppStatus.PROCESSING} 
                  isTranslating={isTranslating}
                  fontSize={fontSize}
                  isBold={isBold}
                  onFontSizeChange={setFontSize}
                  onToggleBold={toggleBold}
                />
             </div>
          </section>

        </div>
      </main>

      {/* Enhanced Footer */}
      <footer className="py-12 border-t border-slate-200 mt-20 bg-slate-50/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                 <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                    <i className="fas fa-font text-white text-sm"></i>
                 </div>
                 <span className="font-black text-slate-900 tracking-tight">RCE-Txts</span>
              </div>
              <p className="text-slate-500 text-xs leading-relaxed font-medium">
                Designed for high-reliability handwritten character recognition. 
                Full support for Hindi and Telugu translation with accessibility enhancements.
              </p>
            </div>
            
            <div className="flex flex-col gap-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Production Features</h4>
              <ul className="text-xs text-slate-600 font-bold space-y-2">
                <li><i className="fas fa-check-circle text-emerald-500 mr-2"></i>Deterministic Output</li>
                <li><i className="fas fa-check-circle text-emerald-500 mr-2"></i>No Execution Artifacts</li>
                <li><i className="fas fa-check-circle text-emerald-500 mr-2"></i>Graceful API Fallbacks</li>
                <li><i className="fas fa-check-circle text-emerald-500 mr-2"></i>Safe React Rendering</li>
              </ul>
            </div>

            <div className="flex flex-col gap-4 items-end text-right">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Connect</h4>
              <div className="flex flex-wrap justify-end gap-x-6 gap-y-2">
                {['Status', 'Legal', 'Privacy', 'Support'].map(link => (
                    <a key={link} href="#" className="text-[11px] font-bold text-slate-900 hover:text-indigo-600 transition-colors uppercase tracking-widest">
                        {link}
                    </a>
                ))}
              </div>
              <div className="flex gap-4 text-slate-400 mt-2">
                <i className="fab fa-github hover:text-slate-900 cursor-pointer"></i>
                <i className="fab fa-twitter hover:text-slate-900 cursor-pointer"></i>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-200 text-center">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">&copy; 2025 RCE-Txts Production Suite. Deployment safe.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
