import React from 'react';
import { X, Download, Calendar, Tag, User, Maximize2 } from 'lucide-react';
import { formatDateIndo } from '../utils/formatters';

interface PhotoLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  caption?: string;
  tipeFoto?: string;
  kondisi?: string;
  timestamp?: string;
  petugas?: string;
  assetId?: string;
  assetName?: string;
}

export const PhotoLightboxModal: React.FC<PhotoLightboxModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  caption,
  tipeFoto,
  kondisi,
  timestamp,
  petugas,
  assetId,
  assetName
}) => {
  if (!isOpen || !imageUrl) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `Foto_${assetId || 'Aset'}_${new Date().toISOString().split('T')[0]}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Top bar */}
        <div className="px-5 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-2">
            <div className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-xs font-bold border border-blue-400/30">
              {assetId || 'FOTO DOKUMENTASI ASET'}
            </div>
            {assetName && (
              <span className="text-xs text-slate-300 truncate max-w-xs font-medium">
                {assetName}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Unduh Berkas Foto"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Unduh</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 hover:text-rose-300 text-slate-300 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Image Stage */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950/50">
          <img
            src={imageUrl}
            alt={caption || assetName || 'Foto Aset'}
            className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg shadow-lg border border-slate-800"
          />
        </div>

        {/* Bottom meta info */}
        <div className="px-5 py-3 bg-slate-950/90 border-t border-slate-800 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="space-y-1">
            {caption ? (
              <div className="text-white font-medium text-xs">{caption}</div>
            ) : (
              <div className="text-slate-400 italic text-[11px]">Tidak ada catatan keterangan foto.</div>
            )}
            <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
              {tipeFoto && (
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {tipeFoto}
                </span>
              )}
              {kondisi && (
                <span className={`px-2 py-0.5 rounded border font-semibold ${
                  kondisi === 'Baik'
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                    : kondisi === 'Rusak Ringan'
                    ? 'bg-amber-950/60 text-amber-300 border-amber-800'
                    : 'bg-rose-950/60 text-rose-300 border-rose-800'
                }`}>
                  Kondisi: {kondisi}
                </span>
              )}
              {timestamp && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  {formatDateIndo(timestamp)}
                </span>
              )}
              {petugas && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-500" />
                  {petugas}
                </span>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
