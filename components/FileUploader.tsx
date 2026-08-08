import React, { useCallback } from 'react';
import { PageItem } from '../types';

interface FileUploaderProps {
  pages: PageItem[];
  onAddFiles: (files: File[]) => void;
  onRemovePage: (id: string) => void;
  onClearAll: () => void;
  isProcessing: boolean;
  onMaxLimitExceeded: () => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  pages,
  onAddFiles,
  onRemovePage,
  onClearAll,
  isProcessing,
  onMaxLimitExceeded
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileList = Array.from(e.target.files);
      if (pages.length + fileList.length > 10) {
        onMaxLimitExceeded();
      }
      onAddFiles(fileList.slice(0, 10 - pages.length));
    }
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const fileList = Array.from(e.dataTransfer.files).filter((f: File) => f.type.startsWith('image/'));
        if (pages.length + fileList.length > 10) {
          onMaxLimitExceeded();
        }
        onAddFiles(fileList.slice(0, 10 - pages.length));
      }
    },
    [pages.length, onAddFiles, onMaxLimitExceeded]
  );

  // If pages are selected, show page collection grid
  if (pages.length > 0) {
    return (
      <div className="w-full flex flex-col gap-4">
        {/* Header bar */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700">
              Page Batch ({pages.length}/10)
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              (10 Max)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {pages.length < 10 && (
              <label className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm">
                <i className="fas fa-plus text-[10px]"></i>
                <span>Add Pages</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isProcessing}
                />
              </label>
            )}
            <button
              onClick={onClearAll}
              disabled={isProcessing}
              className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-30"
              title="Clear all pages"
            >
              <i className="fas fa-trash-can text-sm"></i>
            </button>
          </div>
        </div>

        {/* Thumbnail Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto p-1">
          {pages.map((page, index) => (
            <div
              key={page.id}
              className="relative group rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm aspect-[3/4] flex flex-col justify-between"
            >
              <img
                src={page.preview}
                alt={`Page ${index + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Page Number Badge */}
              <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-slate-900/85 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest rounded-md shadow-sm">
                Page {index + 1}
              </div>

              {/* Status Indicator Pill */}
              {page.status === 'processing' && (
                <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center text-white">
                  <div className="w-6 h-6 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-1"></div>
                  <span className="text-[9px] font-bold uppercase tracking-wider">Analyzing...</span>
                </div>
              )}

              {page.status === 'error' && (
                <div className="absolute top-2 right-2 z-10 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px]" title="Recognition failed">
                  <i className="fas fa-exclamation"></i>
                </div>
              )}

              {page.status === 'success' && (
                <div className="absolute top-2 right-2 z-10 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px]" title="Recognized">
                  <i className="fas fa-check"></i>
                </div>
              )}

              {/* Delete Hover Overlay */}
              {!isProcessing && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center z-20">
                  <button
                    onClick={() => onRemovePage(page.id)}
                    className="w-9 h-9 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110"
                    title={`Remove Page ${index + 1}`}
                  >
                    <i className="fas fa-trash-alt text-xs"></i>
                  </button>
                </div>
              )}

              {/* File Info Bar */}
              <div className="absolute bottom-0 inset-x-0 bg-slate-950/75 backdrop-blur-sm text-white px-2 py-1 text-[9px] truncate font-medium">
                {page.file.name}
              </div>
            </div>
          ))}

          {/* Add Page Card if under 10 */}
          {pages.length < 10 && !isProcessing && (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer aspect-[3/4] text-slate-400 hover:text-slate-600">
              <i className="fas fa-plus text-xl mb-1"></i>
              <span className="text-[10px] font-bold uppercase tracking-wider">Add Page</span>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          )}
        </div>
      </div>
    );
  }

  // Dropzone mode when zero pages are selected
  return (
    <label
      className="flex flex-col items-center justify-center w-full min-h-[360px] md:min-h-[420px] border-2 border-dashed border-slate-300 rounded-2xl bg-white hover:bg-slate-50 transition-colors cursor-pointer group p-6 text-center"
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
          <i className="fas fa-cloud-upload-alt text-2xl"></i>
        </div>
        <p className="mb-1 text-sm font-bold text-slate-800">
          Click to upload pages or drag and drop
        </p>
        <p className="text-xs text-slate-500 font-medium mb-3">
          Select up to <span className="font-bold text-slate-700">10 pages</span> at once
        </p>
        <div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] text-slate-500 font-bold uppercase tracking-wider border border-slate-200">
          PNG, JPG, WEBP (Max 10 per batch)
        </div>
      </div>
      <input
        type="file"
        multiple
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
    </label>
  );
};
