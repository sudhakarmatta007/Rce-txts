
import React, { useCallback } from 'react';
import { ImageFile } from '../types';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  selectedImage: ImageFile | null;
  onClear: () => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect, selectedImage, onClear }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  if (selectedImage) {
    return (
      <div className="relative group w-full aspect-video md:aspect-auto md:h-96 rounded-2xl overflow-hidden bg-slate-200 border-2 border-slate-200 shadow-inner">
        <img 
          src={selectedImage.preview} 
          alt="Upload preview" 
          className="w-full h-full object-contain"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-4">
          <button 
            onClick={onClear}
            className="bg-white/90 hover:bg-white text-rose-600 p-3 rounded-full shadow-lg transition-transform hover:scale-110"
            title="Remove Image"
          >
            <i className="fas fa-trash-alt text-xl"></i>
          </button>
        </div>
        <div className="absolute bottom-4 left-4 right-4 text-center">
            <span className="bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                {selectedImage.file.name} ({(selectedImage.file.size / 1024).toFixed(1)} KB)
            </span>
        </div>
      </div>
    );
  }

  return (
    <label 
      className="flex flex-col items-center justify-center w-full h-64 md:h-96 border-2 border-dashed border-slate-300 rounded-2xl bg-white hover:bg-slate-50 transition-colors cursor-pointer group"
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="flex flex-col items-center justify-center pt-5 pb-6">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
          <i className="fas fa-cloud-upload-alt text-2xl"></i>
        </div>
        <p className="mb-2 text-sm text-slate-700">
          <span className="font-semibold">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-slate-500 uppercase tracking-wider">PNG, JPG or WEBP</p>
      </div>
      <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
    </label>
  );
};
