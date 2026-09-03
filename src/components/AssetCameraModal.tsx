import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  RotateCcw,
  FlipHorizontal,
  Check,
  X,
  Upload,
  Image as ImageIcon,
  AlertCircle,
  Sparkles,
  Layers,
  FileCheck,
  Maximize2
} from 'lucide-react';
import { KondisiBarang } from '../types/inventory';

interface AssetCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string, meta?: { caption?: string; tipeFoto?: string; kondisi?: KondisiBarang | string }) => void;
  assetId?: string;
  assetName?: string;
  currentKondisi?: KondisiBarang | string;
  title?: string;
  defaultTipeFoto?: string;
}

export const AssetCameraModal: React.FC<AssetCameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  assetId,
  assetName,
  currentKondisi = 'Baik',
  title = 'Ambil Foto Aset via Kamera',
  defaultTipeFoto = 'Kondisi Fisik'
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isShutterFlashing, setIsShutterFlashing] = useState(false);
  const [includeWatermark, setIncludeWatermark] = useState(true);
  const [caption, setCaption] = useState('');
  const [tipeFoto, setTipeFoto] = useState(defaultTipeFoto);
  const [kondisiFoto, setKondisiFoto] = useState<string>(currentKondisi);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop current video stream
  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Start video stream with chosen facing mode
  const startCamera = useCallback(async () => {
    setCameraError(null);
    stopStream();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Perangkat atau browser ini tidak mendukung akses kamera langsung (WebRTC getUserMedia).');
      }

      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(e => console.error('Video play error:', e));
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      let errMsg = 'Gagal mengakses kamera perangkat.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errMsg = 'Izin akses kamera ditolak oleh browser. Harap izinkan akses kamera pada pengaturan browser Anda.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errMsg = 'Tidak ada perangkat kamera yang terdeteksi di perangkat Anda.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errMsg = 'Kamera sedang digunakan oleh aplikasi lain atau mengalami kendala sistem.';
      } else if (err.message) {
        errMsg = err.message;
      }
      setCameraError(errMsg);
    }
  }, [facingMode, stopStream]);

  // Handle open/close and stream cleanup
  useEffect(() => {
    if (isOpen) {
      setCapturedImage(null);
      setCaption('');
      setTipeFoto(defaultTipeFoto);
      setKondisiFoto(currentKondisi);
      if (activeTab === 'camera') {
        startCamera();
      }
    } else {
      stopStream();
    }

    return () => {
      stopStream();
    };
  }, [isOpen, activeTab, facingMode]);

  // Toggle Camera Facing Mode (Front / Rear)
  const handleToggleCamera = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Process & compress canvas image
  const processImageToDataUrl = (canvas: HTMLCanvasElement): string => {
    const maxDim = 1024;
    let width = canvas.width;
    let height = canvas.height;

    if (width > maxDim || height > maxDim) {
      if (width > height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }

    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = width;
    outputCanvas.height = height;
    const ctx = outputCanvas.getContext('2d');
    if (!ctx) return canvas.toDataURL('image/jpeg', 0.82);

    ctx.drawImage(canvas, 0, 0, width, height);

    // Add optional hospital timestamp watermark
    if (includeWatermark) {
      const barHeight = Math.max(30, Math.round(height * 0.07));
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)'; // slate-900 with alpha
      ctx.fillRect(0, height - barHeight, width, barHeight);

      ctx.fillStyle = '#ffffff';
      const fontSize = Math.max(11, Math.round(barHeight * 0.42));
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textBaseline = 'middle';

      const now = new Date();
      const dateStr = now.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      const timeStr = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const labelLeft = `RS MEDIKA INSANI ${assetId ? `• ${assetId}` : ''}`;
      const labelRight = `${dateStr} ${timeStr} • [${kondisiFoto}]`;

      ctx.fillText(labelLeft, 12, height - barHeight / 2);
      ctx.textAlign = 'right';
      ctx.fillText(labelRight, width - 12, height - barHeight / 2);
    }

    return outputCanvas.toDataURL('image/jpeg', 0.82);
  };

  // Take Snapshot from Video Stream
  const handleTakeSnapshot = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    // Trigger flash animation
    setIsShutterFlashing(true);
    setTimeout(() => setIsShutterFlashing(false), 200);

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const processedDataUrl = processImageToDataUrl(canvas);
    setCapturedImage(processedDataUrl);
    stopStream();
  };

  // Handle File Upload Fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar yang valid (.jpg, .jpeg, .png, .webp)');
      return;
    }

    const reader = new FileReader();
    reader.onload = event => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const processed = processImageToDataUrl(canvas);
          setCapturedImage(processed);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedImage(null);
    if (activeTab === 'camera') {
      startCamera();
    }
  };

  // Confirm and Save
  const handleConfirmUsePhoto = () => {
    if (!capturedImage) return;

    onCapture(capturedImage, {
      caption: caption.trim() || undefined,
      tipeFoto: tipeFoto || 'Kondisi Fisik',
      kondisi: kondisiFoto || currentKondisi,
    });
    stopStream();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-white/10 text-emerald-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight text-white flex items-center gap-2">
                <span>{title}</span>
                {assetId && (
                  <span className="px-1.5 py-0.5 rounded bg-blue-500/30 text-blue-200 font-mono text-[10px] font-normal border border-blue-400/20">
                    {assetId}
                  </span>
                )}
              </h3>
              {assetName && (
                <p className="text-[11px] text-slate-300 truncate max-w-xs sm:max-w-sm">
                  {assetName}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopStream();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector: Kamera vs Upload File */}
        {!capturedImage && (
          <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setActiveTab('camera');
                setCameraError(null);
                startCamera();
              }}
              className={`px-3 py-2 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'camera'
                  ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Kamera Perangkat (Langsung)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('upload');
                stopStream();
              }}
              className={`px-3 py-2 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'upload'
                  ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Unggah dari Galeri / File</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 space-y-3 overflow-y-auto">
          
          {/* STATE 1: PREVIEW CAPTURED PHOTO */}
          {capturedImage ? (
            <div className="space-y-3 animate-in fade-in">
              <div className="relative bg-slate-950 rounded-xl overflow-hidden aspect-4/3 flex items-center justify-center border border-slate-800 shadow-inner group">
                <img
                  src={capturedImage}
                  alt="Hasil Foto Aset"
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-2.5 left-2.5 px-2.5 py-1 bg-emerald-900/80 text-emerald-200 text-[10px] font-bold rounded-full backdrop-blur-xs flex items-center gap-1 border border-emerald-500/30">
                  <Check className="w-3 h-3 text-emerald-400" />
                  Foto Siap Digunakan
                </div>
              </div>

              {/* Meta Input: Keterangan & Kategori Foto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Jenis Dokumentasi Foto:
                  </label>
                  <select
                    value={tipeFoto}
                    onChange={e => setTipeFoto(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="Kondisi Fisik">📸 Foto Kondisi Fisik Keseluruhan</option>
                    <option value="Registrasi Awal">🏷️ Foto Registrasi Aset Baru</option>
                    <option value="Kerusakan">⚠️ Bukti Kerusakan / Cacat Fisik</option>
                    <option value="Perbaikan">🔧 Bukti Tindakan Perbaikan</option>
                    <option value="Uji Fungsi">⚡ Hasil Uji Fungsi / Kalibrasi</option>
                    <option value="Stiker/SN">🔢 Foto Nomor Seri (SN) / Plat Merk</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Kondisi Aset Saat Foto Diambil:
                  </label>
                  <select
                    value={kondisiFoto}
                    onChange={e => setKondisiFoto(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="Baik">Baik (Siap Pakai)</option>
                    <option value="Rusak Ringan">Rusak Ringan</option>
                    <option value="Rusak Berat">Rusak Berat (Afkir)</option>
                    <option value="Dalam Perbaikan">Dalam Perbaikan</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Catatan / Keterangan Tambahan (Opsional):
                  </label>
                  <input
                    type="text"
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                    placeholder="Contoh: Tampak depan panel kontrol, tidak ada lecet fisik..."
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          ) : activeTab === 'camera' ? (
            /* STATE 2: LIVE CAMERA STREAM */
            <div className="space-y-3">
              <div className="relative bg-slate-950 rounded-xl overflow-hidden aspect-4/3 flex items-center justify-center border border-slate-800 shadow-inner">
                
                {/* Flash effect */}
                {isShutterFlashing && (
                  <div className="absolute inset-0 bg-white z-20 animate-out fade-out duration-200" />
                )}

                {cameraError ? (
                  <div className="p-6 text-center text-slate-300 space-y-3 max-w-sm">
                    <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div className="text-xs text-rose-300 font-semibold">{cameraError}</div>
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={startCamera}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Coba Akses Lagi</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('upload')}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer"
                      >
                        Gunakan Unggah File
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />

                    {/* Viewfinder Target Framing Guidelines */}
                    <div className="absolute inset-4 pointer-events-none border border-white/20 rounded-lg flex flex-col justify-between p-2">
                      <div className="flex justify-between">
                        <div className="w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                        <div className="w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                      </div>
                      <div className="flex justify-between">
                        <div className="w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                        <div className="w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
                      </div>
                    </div>

                    {/* Floating Controls on Camera Overlay */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
                      <button
                        type="button"
                        onClick={handleToggleCamera}
                        className="p-2 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white backdrop-blur-xs border border-white/10 transition-colors cursor-pointer"
                        title="Balik Kamera (Depan / Belakang)"
                      >
                        <FlipHorizontal className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Watermark badge on viewfinder */}
                    {includeWatermark && (
                      <div className="absolute bottom-2 left-2 right-2 px-2.5 py-1 bg-slate-950/70 text-white rounded-md text-[10px] font-mono flex items-center justify-between backdrop-blur-xs border border-white/10 pointer-events-none">
                        <span>RS MEDIKA INSANI {assetId ? `• ${assetId}` : ''}</span>
                        <span className="text-emerald-400 font-bold">● LIVE</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Camera Shutter and Settings */}
              <div className="flex items-center justify-between px-1">
                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeWatermark}
                    onChange={e => setIncludeWatermark(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Sematkan Watermark Tanggal & ID RS</span>
                </label>

                {!cameraError && (
                  <button
                    type="button"
                    onClick={handleTakeSnapshot}
                    className="px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer transition-all transform active:scale-95"
                  >
                    <div className="w-3.5 h-3.5 rounded-full bg-white animate-pulse" />
                    <span>Ambil Foto (Jepret)</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* STATE 3: UPLOAD FILE DRAG & DROP */
            <div className="space-y-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/40 rounded-xl p-8 text-center cursor-pointer transition-colors space-y-3"
              >
                <div className="w-12 h-12 mx-auto rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-xs text-slate-800">
                    Klik untuk pilih berkas foto aset atau seret foto ke sini
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Mendukung format JPG, PNG, WEBP dari kamera smartphone atau penyimpanan lokal.
                  </div>
                </div>
                <button
                  type="button"
                  className="px-4 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs hover:bg-slate-100"
                >
                  Pilih Berkas Gambar
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              <div className="flex items-center justify-between px-1 text-xs text-slate-500">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeWatermark}
                    onChange={e => setIncludeWatermark(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Sematkan Watermark RS pada foto yang diunggah</span>
                </label>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => {
              stopStream();
              onClose();
            }}
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            Batal
          </button>

          {capturedImage ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRetake}
                className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Ambil Ulang</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmUsePhoto}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Gunakan & Simpan Foto</span>
              </button>
            </div>
          ) : activeTab === 'camera' && !cameraError ? (
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Arahkan kamera ke aset RS dan tekan tombol Jepret</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Pilih Berkas Foto
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
