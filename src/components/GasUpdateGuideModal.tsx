import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  FileCode2,
  Sparkles,
  ArrowRight,
  Play,
  RefreshCw,
  Zap,
  Globe
} from 'lucide-react';
import { gasSyncService } from '../services/gasSyncService';

interface GasUpdateGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKeySecret?: string;
  errorMessage?: string;
  webAppUrl?: string;
}

export const GasUpdateGuideModal: React.FC<GasUpdateGuideModalProps> = ({
  isOpen,
  onClose,
  apiKeySecret,
  errorMessage,
  webAppUrl,
}) => {
  const [copied, setCopied] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const cleanUrl = (webAppUrl || '').trim().replace(/\/dev(\?.*)?$/, '/exec$1');
  const directExecutionUrl = cleanUrl
    ? `${cleanUrl}${cleanUrl.includes('?') ? '&' : '?'}action=setupDatabase&apiKey=${encodeURIComponent(apiKeySecret || '')}`
    : '';

  const handleCopy = async () => {
    const ok = await gasSyncService.copyCodeGsToClipboard(apiKeySecret);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3500);
    }
  };

  const handleDownload = () => {
    gasSyncService.downloadCodeGsFile(apiKeySecret);
  };

  const handleTestConnection = async () => {
    if (!cleanUrl) return;
    setIsTesting(true);
    setTestResult(null);

    const res = await gasSyncService.testConnection(cleanUrl);
    setIsTesting(false);
    setTestResult(res);
  };

  return (
    <div
      id="gas-update-guide-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="gas-update-guide-modal-container"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                Pembaruan Script Code.gs (v{gasSyncService.VERSION})
              </h3>
              <p className="text-xs text-amber-100 font-medium">
                Dilengkapi Mesin Batch-Update Cepat & Skema 19 Tabel Lengkap
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 text-white/90 hover:text-white transition-colors cursor-pointer"
            title="Tutup dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-700 text-xs leading-relaxed">
          {/* Why this happened box */}
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-900 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Penyebab Muncul Pesan Gagal:</span>
            </div>
            <p className="text-[11px] text-amber-800">
              {errorMessage || 'Script di Google Apps Script belum diperbarui atau belum dideploy sebagai "Versi Baru".'}
            </p>
            <p className="text-[11px] text-amber-900 font-medium">
              Google Apps Script tidak memperbarui kode secara otomatis dari luar. Pilih salah satu cara tercepat di bawah ini:
            </p>
          </div>

          {/* METHOD 1: CARA TERCEPAT - RUN LANGSUNG (10 DETIK) */}
          <div className="p-4 rounded-xl border-2 border-emerald-300 bg-emerald-50/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                  ★
                </span>
                <span className="font-bold text-emerald-950 text-sm">
                  Cara Tercepat: Jalankan Fungsi Langsung di Apps Script (10 Detik)
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900">
                Paling Mudah & Pasti Berhasil
              </span>
            </div>

            <p className="text-[11px] text-slate-700">
              Anda <strong>tidak perlu bingung mencari menu deploy</strong>! Setelah kode ditempel di Apps Script:
            </p>

            <div className="bg-white rounded-lg p-3 border border-emerald-200 space-y-1.5">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                <span>Di Apps Script, salin & simpan (<kbd className="px-1 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-[10px]">Ctrl+S</kbd>) kode <strong>Code.gs v3.2.0</strong> terbaru.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                <span>Pada toolbar atas Apps Script, klik menu pilihan fungsi dan pilih: <strong className="text-emerald-800 font-mono bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">setupDatabase</strong> (atau <strong className="text-emerald-800 font-mono bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">autoMigrateDatabase</strong>).</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                <span className="flex items-center gap-1.5 flex-wrap">
                  Klik tombol <strong className="text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-300 inline-flex items-center gap-1"><Play className="w-3 h-3 text-emerald-600 fill-emerald-600" /> Jalankan (Run)</strong>.
                  <span className="text-emerald-700 font-medium">Buka spreadsheet Anda, seluruh 19 tabel seketika terbentuk lengkap dengan warna header!</span>
                </span>
              </div>
            </div>
          </div>

          {/* METHOD 2: 4 QUICK STEPS UNTUK DEPLOY VERSI BARU */}
          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
              <span>Langkah Standar: Deploy "Versi Baru" (Agar Sinkron Otomatis SIMBARS Aktif):</span>
            </h4>

            <div className="space-y-2.5">
              {/* Step 1 */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div className="flex-1">
                  <span className="font-bold text-slate-800 block text-xs">Salin Kode Code.gs v3.2.0</span>
                  <p className="text-[11px] text-slate-600 mt-0.5 mb-2">
                    Gunakan tombol di bawah ini untuk menyalin seluruh script backend terbaru ke clipboard:
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Script Code.gs v3.2.0'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      <span>Unduh File .gs</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <span className="font-bold text-slate-800 block text-xs">Buka Apps Script di Spreadsheet</span>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Buka tab Google Spreadsheet Anda, klik menu <strong>Ekstensi (Extensions)</strong> &gt; <strong>Apps Script</strong>.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <span className="font-bold text-slate-800 block text-xs">Ganti Kode & Simpan</span>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Hapus kode lama (<kbd className="px-1.5 py-0.5 bg-slate-200 rounded font-mono text-[10px]">Ctrl+A</kbd> lalu <kbd className="px-1.5 py-0.5 bg-slate-200 rounded font-mono text-[10px]">Del</kbd>), tempel kode baru (<kbd className="px-1.5 py-0.5 bg-slate-200 rounded font-mono text-[10px]">Ctrl+V</kbd>), lalu simpan (<kbd className="px-1.5 py-0.5 bg-slate-200 rounded font-mono text-[10px]">Ctrl+S</kbd>).
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/60 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  4
                </div>
                <div>
                  <span className="font-bold text-blue-900 block text-xs">Deploy Sebagai "Versi Baru" (Paling Krusial)</span>
                  <p className="text-[11px] text-slate-700 mt-0.5">
                    Di pojok kanan atas Apps Script:
                  </p>
                  <ol className="list-decimal list-inside text-[11px] text-slate-700 space-y-1 mt-1 font-medium">
                    <li>Klik <strong>Deploy (Terapkan)</strong> &gt; pilih <strong>Kelola penerapan (Manage deployments)</strong>.</li>
                    <li>Klik ikon <strong>Pensil (Edit)</strong> pada deployment Web App aktif.</li>
                    <li>Di dropdown <strong>Versi (Version)</strong>, WAJIB pilih <strong>Versi baru (New version)</strong>.</li>
                    <li>Pastikan <em>Siapa yang memiliki akses</em> adalah <strong>Siapa saja (Anyone)</strong>.</li>
                    <li>Klik <strong>Terapkan (Deploy)</strong>.</li>
                  </ol>
                </div>
              </div>

              {/* Step 5: Optional index.html Portal */}
              <div className="p-3 rounded-xl border border-teal-200 bg-teal-50/60 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  5
                </div>
                <div>
                  <span className="font-bold text-teal-900 block text-xs">Pasang Portal Web (index.html) - Fitur Terbaru</span>
                  <p className="text-[11px] text-slate-700 mt-0.5">
                    Di Apps Script Editor, klik ikon <strong>+ (Tambah file)</strong> &gt; pilih <strong>HTML</strong> &gt; ketik <code className="font-mono bg-teal-100 px-1 py-0.5 rounded text-teal-900">index</code>. Salin dan tempel kode <code className="font-mono text-teal-900">index.html</code> SIMBARS. Saat URL Web App dibuka di browser, sistem otomatis menampilkan portal dasbor interaktif, pemantauan 19 sheet, dan live pencarian aset!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Direct Browser Link Option */}
          {directExecutionUrl && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-slate-800 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-600" />
                  <span>Pilihan Tambahan: Eksekusi Skema di Tab Baru</span>
                </span>
                <a
                  href={directExecutionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Buka URL Eksekusi Skema</span>
                </a>
              </div>
              <p className="text-[10px] text-slate-500">
                Membuka tautan ini akan langsung memerintahkan Google Apps Script menjalankan migrasi 19 tabel menggunakan kredensial Google Anda di peramban.
              </p>
            </div>
          )}

          {/* Test Connection Box */}
          {cleanUrl && (
            <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-emerald-950 block">Uji Ulang Status Script di Spreadsheet</span>
                  <p className="text-[10px] text-emerald-800">
                    Setelah Anda menyimpan atau menjalankan fungsi di Apps Script, periksa statusnya di sini:
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isTesting}
                  onClick={handleTestConnection}
                  className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Memeriksa...' : 'Uji Status Script'}</span>
                </button>
              </div>

              {testResult && (
                <div className={`p-2 rounded-lg text-xs font-medium ${testResult.success ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-rose-100 text-rose-900 border border-rose-300'}`}>
                  {testResult.message}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Tersalin!' : 'Salin Script Code.gs'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors"
          >
            Tutup & Kembali ke SIMBARS
          </button>
        </div>
      </div>
    </div>
  );
};

