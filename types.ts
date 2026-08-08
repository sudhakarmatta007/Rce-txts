export type LanguageKey = 'original' | 'hindi' | 'telugu';

export interface PageItem {
  id: string;
  file: File;
  preview: string;
  status: 'idle' | 'processing' | 'success' | 'error';
  recognizedText: string;
  translations: Record<string, string>;
  activeLang: LanguageKey;
  isTranslating: boolean;
  errorMessage?: string;
  fontSize: number;
  isBold: boolean;
}

export enum AppStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface RecognitionResult {
  text: string;
  error?: string;
  timestamp: number;
}

export interface ImageFile {
  file: File;
  preview: string;
}
