
import React, { useRef, useState, useEffect } from 'react';
import { Button } from './Button';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setStream(mediaStream);
      } catch (err) {
        console.error("Camera access error:", err);
        setError("Unable to access camera. Please check permissions.");
      }
    }
    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
            onCapture(file);
          }
        }, 'image/jpeg', 0.95);
      }
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-64 md:h-96 bg-rose-50 border-2 border-rose-200 rounded-2xl p-6 text-center">
        <i className="fas fa-camera-slash text-4xl text-rose-400 mb-4"></i>
        <p className="text-rose-700 font-medium">{error}</p>
        <Button variant="secondary" className="mt-4" onClick={onCancel}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-64 md:h-96 bg-black rounded-2xl overflow-hidden shadow-2xl">
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        className="w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Overlay controls */}
      <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
        <div className="flex justify-between items-start pointer-events-auto">
          <button 
            onClick={onCancel}
            className="bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-md transition-colors"
          >
            <i className="fas fa-times px-1"></i>
          </button>
          <div className="bg-black/40 px-3 py-1 rounded-full backdrop-blur-md text-[10px] text-white font-bold uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
            Live View
          </div>
        </div>

        <div className="flex justify-center items-end pb-4 pointer-events-auto">
          <button 
            onClick={captureImage}
            className="w-16 h-16 bg-white rounded-full border-4 border-slate-300 flex items-center justify-center active:scale-90 transition-transform shadow-xl camera-pulse"
          >
            <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center">
              <i className="fas fa-camera text-white text-xl"></i>
            </div>
          </button>
        </div>
      </div>
      
      {/* Target framing */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-12">
        <div className="w-full h-full border-2 border-white/30 border-dashed rounded-lg"></div>
      </div>
    </div>
  );
};
