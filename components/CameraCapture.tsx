import React, { useRef, useState, useEffect, useCallback } from 'react';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [errorType, setErrorType] = useState<'permission_denied' | 'no_camera' | 'in_use' | 'unsupported' | 'unknown' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState<boolean>(false);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedPreviewUrl, setCapturedPreviewUrl] = useState<string | null>(null);

  // Stop camera tracks cleanly
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Check available camera devices
  const checkMultipleCameras = useCallback(async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((device) => device.kind === 'videoinput');
        setHasMultipleCameras(videoDevices.length > 1);
      }
    } catch {
      // Ignore enumeration errors
    }
  }, []);

  // Start camera stream with robust fallbacks
  const startCamera = useCallback(async (requestedFacingMode: 'environment' | 'user') => {
    setIsInitializing(true);
    setErrorType(null);
    setErrorMessage(null);
    stopCameraStream();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorType('unsupported');
      setErrorMessage("Camera access is not supported by your browser or requires a secure context (HTTPS or localhost).");
      setIsInitializing(false);
      return;
    }

    let mediaStream: MediaStream | null = null;

    // Attempt 1: Optimal resolution & requested facingMode for document scanning
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: requestedFacingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
    } catch (err1: any) {
      // Attempt 2: Fallback facingMode only
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: requestedFacingMode }
        });
      } catch (err2: any) {
        // Attempt 3: Basic video stream fallback (e.g. desktop webcams)
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true
          });
        } catch (err3: any) {
          console.error("Camera access error:", err3);
          setIsInitializing(false);
          const errorName = err3?.name || err1?.name || '';
          if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
            setErrorType('permission_denied');
            setErrorMessage("Camera access was denied. Please allow camera permission in your browser settings or use Gallery instead.");
          } else if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
            setErrorType('no_camera');
            setErrorMessage("No usable camera device was found on your system.");
          } else if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
            setErrorType('in_use');
            setErrorMessage("Camera is currently in use by another application or unavailable.");
          } else {
            setErrorType('unknown');
            setErrorMessage("Unable to connect to camera. Please check device permissions or use Gallery.");
          }
          return;
        }
      }
    }

    if (mediaStream) {
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});
        };
      }
      setIsInitializing(false);
      checkMultipleCameras();
    }
  }, [stopCameraStream, checkMultipleCameras]);

  useEffect(() => {
    startCamera(facingMode);

    return () => {
      stopCameraStream();
    };
  }, [facingMode]);

  // Clean up object URLs when captured preview changes
  useEffect(() => {
    return () => {
      if (capturedPreviewUrl) {
        URL.revokeObjectURL(capturedPreviewUrl);
      }
    };
  }, [capturedPreviewUrl]);

  const toggleCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              if (capturedPreviewUrl) {
                URL.revokeObjectURL(capturedPreviewUrl);
              }
              const previewUrl = URL.createObjectURL(blob);
              setCapturedBlob(blob);
              setCapturedPreviewUrl(previewUrl);
            }
          },
          'image/jpeg',
          0.92
        );
      }
    }
  };

  const handleRetake = () => {
    if (capturedPreviewUrl) {
      URL.revokeObjectURL(capturedPreviewUrl);
    }
    setCapturedBlob(null);
    setCapturedPreviewUrl(null);
  };

  const handleUsePhoto = () => {
    if (capturedBlob) {
      const file = new File([capturedBlob], `camera_${Date.now()}.jpg`, { type: 'image/jpeg' });
      stopCameraStream();
      if (capturedPreviewUrl) {
        URL.revokeObjectURL(capturedPreviewUrl);
      }
      onCapture(file);
    }
  };

  const handleClose = () => {
    stopCameraStream();
    if (capturedPreviewUrl) {
      URL.revokeObjectURL(capturedPreviewUrl);
    }
    onCancel();
  };

  // Render error card if camera permissions or device fail
  if (errorType || errorMessage) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[360px] bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center shadow-xl text-white">
        <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center mb-4">
          <i className={errorType === 'permission_denied' ? "fas fa-lock text-2xl text-rose-400" : "fas fa-camera-slash text-2xl text-rose-400"}></i>
        </div>
        <h3 className="text-lg font-bold mb-2">
          {errorType === 'permission_denied' ? 'Camera Access Denied' : 'Camera Unavailable'}
        </h3>
        <p className="text-slate-400 text-xs leading-relaxed max-w-sm mb-6">
          {errorMessage}
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          {errorType === 'permission_denied' && (
            <button
              onClick={() => startCamera(facingMode)}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-slate-700"
            >
              <i className="fas fa-rotate-right mr-2"></i>Try Again
            </button>
          )}
          <button
            onClick={handleClose}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30"
          >
            <i className="fas fa-images mr-2"></i>Use Gallery
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-[360px] sm:min-h-[420px] bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col justify-between">
      <canvas ref={canvasRef} className="hidden" />

      {/* Captured Image Preview Mode */}
      {capturedPreviewUrl ? (
        <div className="relative w-full h-full min-h-[360px] sm:min-h-[420px] flex flex-col justify-between bg-black">
          <img
            src={capturedPreviewUrl}
            alt="Captured preview"
            className="absolute inset-0 w-full h-full object-contain bg-slate-950"
          />

          {/* Top Bar Overlay */}
          <div className="relative z-10 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
            <span className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-[10px] text-white font-bold uppercase tracking-widest border border-white/10">
              Photo Preview
            </span>
            <button
              onClick={handleClose}
              className="w-9 h-9 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-md transition-colors flex items-center justify-center border border-white/10"
              title="Close"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          {/* Bottom Action Bar */}
          <div className="relative z-10 p-6 flex items-center justify-center gap-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
            <button
              onClick={handleRetake}
              className="px-6 py-3 bg-slate-900/90 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider backdrop-blur-md transition-all border border-white/10 flex items-center gap-2"
            >
              <i className="fas fa-rotate-left"></i>
              Retake
            </button>
            <button
              onClick={handleUsePhoto}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xl shadow-indigo-600/40 flex items-center gap-2"
            >
              <i className="fas fa-check"></i>
              Use Photo
            </button>
          </div>
        </div>
      ) : (
        /* Live Camera Feed Mode */
        <div className="relative w-full h-full min-h-[360px] sm:min-h-[420px] flex flex-col justify-between">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Initializing Spinner */}
          {isInitializing && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-white">
              <div className="w-10 h-10 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-3"></div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Starting Camera...</p>
            </div>
          )}

          {/* Document Framing Overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8 sm:p-12">
            <div className="w-full h-full border-2 border-white/30 border-dashed rounded-2xl relative">
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-indigo-500 rounded-tl-lg"></div>
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-indigo-500 rounded-tr-lg"></div>
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-indigo-500 rounded-bl-lg"></div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-indigo-500 rounded-br-lg"></div>
            </div>
          </div>

          {/* Top Controls Overlay */}
          <div className="relative z-10 p-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
            <button
              onClick={handleClose}
              className="w-9 h-9 bg-black/40 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition-colors flex items-center justify-center border border-white/10"
              title="Close Camera"
            >
              <i className="fas fa-times"></i>
            </button>

            <div className="flex items-center gap-2">
              {hasMultipleCameras && (
                <button
                  onClick={toggleCamera}
                  className="w-9 h-9 bg-black/40 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition-colors flex items-center justify-center border border-white/10"
                  title="Switch Camera"
                >
                  <i className="fas fa-camera-rotate"></i>
                </button>
              )}

              <div className="bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-md text-[10px] text-white font-bold uppercase tracking-widest flex items-center gap-2 border border-white/10">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                Live View
              </div>
            </div>
          </div>

          {/* Bottom Capture Button */}
          <div className="relative z-10 p-6 flex items-center justify-center bg-gradient-to-t from-black/70 via-black/30 to-transparent">
            <button
              onClick={captureImage}
              disabled={isInitializing}
              className="w-16 h-16 sm:w-18 sm:h-18 bg-white/90 hover:bg-white rounded-full border-4 border-slate-300/50 flex items-center justify-center active:scale-95 transition-all shadow-2xl camera-pulse disabled:opacity-50"
              title="Capture Photo"
            >
              <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center">
                <i className="fas fa-camera text-white text-lg sm:text-xl"></i>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
