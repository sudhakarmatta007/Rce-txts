
export interface RecognitionResult {
  text: string;
  error?: string;
  timestamp: number;
}

export enum AppStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface ImageFile {
  file: File;
  preview: string;
}
