import React, { useState, useEffect, useRef } from 'react';
import { dataStorage } from '../services/dataStorage';
import { gasSyncService } from '../services/gasSyncService';
import { formatRupiah, formatDateIndo } from '../utils/formatters';
import { 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  ShieldCheck, 
  Info, 
  Copy, 
  Check, 
  X, 
  HardDrive, 
  FileSpreadsheet, 
  ArrowUpFromLine, 
  Clock, 
  AlertTriangle,
  FolderArchive,
  Layers,
  Sparkles,
  Zap
} from 'lucide-react';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataRestored?: () => void;
  initialTab?: 'backup' | 'restore' | 'troubleshoot';
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  onDataRestored,
  initialTab = 'backup',
}) => {
  const [activeTab, setActiveTab] = useState<'backup' | 'restore' | 'troubleshoot'>(initialTab);
  const [dbStats, setDbStats] = useState(() => dataStorage.getDatabaseStats());
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [previewSnippet, setPreviewSnippet] = useState('');

  // Restore State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<any | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [autoBackupBeforeRestore, setAutoBackupBeforeRestore] = useState(true);
  const [restoreResult, setRestoreResult] = useState<{
    success: boolean;
    message: string;
    summary?: any;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state
  const gasConfig = dataStorage.getGasConfig();

  // Refresh DB Stats
  const refreshStats = () => {
    setDbStats(dataStorage.getDatabaseStats());
  };

  useEffect(() => {
    if (isOpen) {
      refreshStats();
      setDownloadSuccess(false);
      setRestoreResult(null);
      setSelectedFile(null);
      setFileContent(null);
      setFileError(null);
      setShowJsonPreview(false);
      if (initialTab) setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // Handle Export Download
  const handleDownloadBackup = () => {
    setIsDownloading(true);
    try {
      const fullBackup = dataStorage.exportFullDatabaseJson(true);
      const jsonString = JSON.stringify(fullBackup, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
      const hospitalSlug = (fullBackup.appSettings?.systemShortName || 'SIMBARS').toUpperCase();
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `BACKUP_DATABASE_${hospitalSlug}_${dateStr}_${timeStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsDownloading(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 6000);
    } catch (err: any) {
      setIsDownloading(false);
      alert('Gagal membuat berkas cadangan: ' + (err.message || String(err)));
    }
  };

  // Toggle & Generate JSON Preview
  const handleTogglePreview = () => {
    if (!showJsonPreview) {
      const fullBackup = dataStorage.exportFullDatabaseJson(false);
      setPreviewSnippet(JSON.stringify(fullBackup, null, 2));
      setShowJsonPreview(true);
    } else {
      setShowJsonPreview(false);
    }
  };

  // Copy Preview
  const handleCopyPreview = () => {
    if (!previewSnippet) {
      const fullBackup = dataStorage.exportFullDatabaseJson(false);
      navigator.clipboard.writeText(JSON.stringify(fullBackup, null, 2));
    } else {
      navigator.clipboard.writeText(previewSnippet);
    }
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2500);
  };

  // File Upload Handlers for Restore
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith('.json')) {
      setFileError('Format berkas harus berupa berkas JSON (.json).');
      setSelectedFile(null);
      setFileContent(null);
      return;
    }

    setSelectedFile(file);
    setFileError(null);
    setIsReadingFile(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      setIsReadingFile(false);
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (typeof parsed !== 'object' || parsed === null) {
          throw new Error('Format isi berkas JSON tidak valid.');
        }

        // Basic compatibility verification
        const hasMaster = Boolean(parsed.master || parsed.jenis || parsed.database?.master);
        const hasInventaris = Boolean(parsed.dataInventaris || parsed.inventarisRuangan || parsed.inventaris || parsed.database?.dataInventaris);

        if (!hasMaster && !hasInventaris) {
          setFileError('Berkas JSON tidak memiliki struktur database inventaris SIMBARS yang dikenali.');
          setFileContent(null);
          return;
        }

        setFileContent(parsed);
      } catch (err: any) {
        setFileError('Gagal memproses berkas JSON: ' + (err.message || 'Sintaks tidak valid.'));
        setFileContent(null);
      }
    };
    reader.onerror = () => {
      setIsReadingFile(false);
      setFileError('Gagal membaca berkas dari disk lokal.');
      setFileContent(null);
    };
    reader.readAsText(file);
  };

  // Execute Restore
  const handleExecuteRestore = () => {
    if (!fileContent) return;

    if (!window.confirm('PERINGATAN: Memulihkan database akan menimpa data inventaris saat ini dengan data dari berkas cadangan. Lanjutkan proses pemulihan?')) {
      return;
    }

    setIsRestoring(true);

    // If auto-backup before restore is enabled, create snapshot first
    if (autoBackupBeforeRestore) {
      try {
        const autoBackup = dataStorage.exportFullDatabaseJson(true);
        const autoBlob = new Blob([JSON.stringify(autoBackup, null, 2)], { type: 'application/json' });
        const autoUrl = URL.createObjectURL(autoBlob);
        const autoLink = document.createElement('a');
        autoLink.href = autoUrl;
        autoLink.download = `PRE_RESTORE_SAFETY_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(autoLink);
        autoLink.click();
        document.body.removeChild(autoLink);
        URL.revokeObjectURL(autoUrl);
      } catch (e) {
        console.warn('Could not auto-download safety backup', e);
      }
    }

    setTimeout(() => {
      const res = dataStorage.importFullDatabaseJson(fileContent);
      setIsRestoring(false);
      setRestoreResult(res);

      if (res.success) {
        refreshStats();
        if (onDataRestored) {
          onDataRestored();
        }
      }
    }, 500);
  };

  // Helper info from inspect
  const getFileInspectionInfo = () => {
    if (!fileContent) return null;
    const meta = fileContent._metadata || {};
    const hospital = meta.hospital || fileContent.hospital || fileContent.appSettings?.appName || 'RS Medika Insani';
    const date = meta.exportDate || fileContent.exportedAt || '-';
    const totalAset = meta.stats?.totalInventaris ?? 
      (fileContent.dataInventaris?.ruangan?.length || fileContent.inventarisRuangan?.length || fileContent.inventaris?.length || 0);
    const totalMaster = (fileContent.master?.jenis?.length || 0) + 
      (fileContent.master?.kategori?.length || 0) + 
      (fileContent.master?.ruang?.length || 0);
    const totalUsers = fileContent.users?.length || 0;
    const version = meta.version || '2.x';

    return { hospital, date, totalAset, totalMaster, totalUsers, version };
  };

  const inspectInfo = getFileInspectionInfo();

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-400/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base leading-tight">
                Pusat Cadangan & Pemulihan Database (Backup & Restore)
              </h2>
              <p className="text-[11px] text-slate-400">
                Penyelamatan data lokal offline & sinkronisasi Google Sheets RS
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-2 gap-2 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => { setActiveTab('backup'); setRestoreResult(null); }}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'backup'
                ? 'bg-white text-blue-700 border-blue-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Unduh Cadangan (Backup JSON)</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('restore'); setRestoreResult(null); }}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'restore'
                ? 'bg-white text-blue-700 border-blue-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Pulihkan Data (Restore JSON)</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('troubleshoot'); setRestoreResult(null); }}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'troubleshoot'
                ? 'bg-white text-amber-700 border-amber-500 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Solusi Kendala Google Sheets</span>
          </button>
        </div>

        {/* CONTENT BODY */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          
          {/* TAB 1: BACKUP DATABASE */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              
              {/* Summary Status Card */}
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-blue-700" />
                    <span className="font-bold text-blue-900 text-xs">
                      Status Database Lokal Aktif ({dbStats.hospitalName})
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-mono font-bold">
                    Est. {dbStats.approxStorageSizeKb} KB ({dbStats.totalAllRecords} Catatan)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
                  <div className="bg-white p-2 rounded-lg border border-blue-100 shadow-2xs">
                    <div className="text-[10px] text-slate-500 font-medium">Total Aset (DIR)</div>
                    <div className="font-bold text-slate-800 text-sm">{dbStats.totalInventaris} Unit</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-blue-100 shadow-2xs">
                    <div className="text-[10px] text-slate-500 font-medium">Akumulasi Nilai</div>
                    <div className="font-bold text-emerald-700 text-[11px] truncate">{formatRupiah(dbStats.totalValuation)}</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-blue-100 shadow-2xs">
                    <div className="text-[10px] text-slate-500 font-medium">Master Data</div>
                    <div className="font-bold text-slate-800 text-sm">{dbStats.totalMasterRecords} Item</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-blue-100 shadow-2xs">
                    <div className="text-[10px] text-slate-500 font-medium">Pengguna & Izin</div>
                    <div className="font-bold text-slate-800 text-sm">{dbStats.totalUsers} Akun</div>
                  </div>
                </div>

                <p className="text-[11px] text-blue-800/80 leading-relaxed">
                  Berkas cadangan JSON ini mencakup seluruh tabel master, inventaris ruangan (DIR beserta riwayat foto aset), catatan sirkulasi, log audit trail, kegiatan IPSRS, pengadaan, pemusnahan, dan matriks hak akses.
                </p>
              </div>

              {/* Success Notification Banner */}
              {downloadSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 flex items-center gap-2.5 animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold block">Berkas Cadangan Berhasil Diunduh!</span>
                    <span className="text-[11px]">Simpan berkas JSON ini di komputer atau penyimpanan cloud aman Anda.</span>
                  </div>
                </div>
              )}

              {/* Main Action Buttons */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <FolderArchive className="w-4 h-4 text-blue-600" />
                      <span>Unduh File Snapshot Database Lengkap (.JSON)</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Format standar terstruktur untuk arsip berkala dan pemulihan cepat saat darurat.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isDownloading}
                    onClick={handleDownloadBackup}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    <Download className={`w-4 h-4 ${isDownloading ? 'animate-bounce' : ''}`} />
                    <span>{isDownloading ? 'Menyiapkan...' : 'Download File Backup (.json)'}</span>
                  </button>
                </div>

                {/* Inspect JSON Payload Option */}
                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleTogglePreview}
                    className="text-blue-700 hover:text-blue-900 font-medium text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{showJsonPreview ? 'Tutup Preview Struktur JSON' : 'Lihat / Salin Struktur JSON'}</span>
                  </button>

                  {showJsonPreview && (
                    <button
                      type="button"
                      onClick={handleCopyPreview}
                      className="px-2.5 py-1 rounded bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      {copiedJson ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedJson ? 'Tersalin' : 'Salin Semua JSON'}</span>
                    </button>
                  )}
                </div>

                {showJsonPreview && (
                  <div className="max-h-48 overflow-y-auto p-3 bg-slate-900 text-emerald-400 font-mono text-[10px] rounded-lg border border-slate-800 leading-relaxed select-all">
                    <pre>{previewSnippet.slice(0, 1200)}...</pre>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: RESTORE DATABASE */}
          {activeTab === 'restore' && (
            <div className="space-y-4">
              
              {/* Dropzone Upload */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 rounded-2xl border-2 border-dashed text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2.5 ${
                  selectedFile
                    ? 'bg-emerald-50/50 border-emerald-300 text-emerald-900'
                    : 'bg-slate-50 hover:bg-blue-50/40 border-slate-300 hover:border-blue-400 text-slate-600'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  selectedFile ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  <Upload className="w-6 h-6" />
                </div>

                <div>
                  <div className="font-bold text-xs sm:text-sm text-slate-800">
                    {selectedFile ? selectedFile.name : 'Pilih Berkas JSON atau Tarik ke Sini'}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {selectedFile
                      ? `Ukuran berkas: ${(selectedFile.size / 1024).toFixed(1)} KB`
                      : 'Hanya mendukung berkas backup berformat .json dari SIMBARS RS'}
                  </p>
                </div>

                <button
                  type="button"
                  className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-semibold text-xs shadow-2xs hover:bg-slate-100 cursor-pointer"
                >
                  {selectedFile ? 'Ganti Berkas Lain' : 'Telusuri Berkas Komputer'}
                </button>
              </div>

              {/* Error Warning */}
              {fileError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{fileError}</span>
                </div>
              )}

              {/* Pre-Restore Inspection Card */}
              {inspectInfo && fileContent && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Hasil Pemeriksaan Validitas Berkas Cadangan</span>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                      Format Valid & Kompatibel
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Asal Rumah Sakit:</span>
                      <span className="font-bold text-slate-800">{inspectInfo.hospital}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Waktu Backup:</span>
                      <span className="font-semibold text-slate-800">
                        {inspectInfo.date !== '-' ? formatDateIndo(inspectInfo.date.split('T')[0]) : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Versi Format:</span>
                      <span className="font-mono font-semibold text-slate-800">{inspectInfo.version}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Aset Inventaris (DIR):</span>
                      <span className="font-bold text-blue-700">{inspectInfo.totalAset} Unit</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Master Ruang/Jenis:</span>
                      <span className="font-bold text-slate-800">{inspectInfo.totalMaster} Item</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Pengguna Terdaftar:</span>
                      <span className="font-bold text-slate-800">{inspectInfo.totalUsers} Akun</span>
                    </div>
                  </div>

                  {/* Safety Checkbox */}
                  <label className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50/80 border border-amber-200 text-amber-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoBackupBeforeRestore}
                      onChange={e => setAutoBackupBeforeRestore(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-semibold text-[11px]">
                      Unduh otomatis cadangan pengaman (safety backup) data saat ini sebelum proses pemulihan dieksekusi.
                    </span>
                  </label>

                  {/* Restore Execute Button */}
                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      disabled={isRestoring}
                      onClick={handleExecuteRestore}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${isRestoring ? 'animate-spin' : ''}`} />
                      <span>{isRestoring ? 'Memulihkan Database...' : 'Pulihkan Database Sekarang'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Restore Result Notification */}
              {restoreResult && (
                <div className={`p-4 rounded-xl border space-y-2 animate-in fade-in ${
                  restoreResult.success
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}>
                  <div className="flex items-center gap-2 font-bold text-xs">
                    {restoreResult.success ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    )}
                    <span>{restoreResult.message}</span>
                  </div>

                  {restoreResult.summary && (
                    <div className="p-3 bg-white/90 rounded-lg border border-emerald-200 text-[11px] space-y-1">
                      <div className="font-bold text-slate-800 border-b border-emerald-100 pb-1">
                        Rincian Data yang Berhasil Dimuat:
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-slate-700 pt-1">
                        <div>• Aset Ruangan (DIR): <strong>{restoreResult.summary.inventarisCount}</strong> unit</div>
                        <div>• Master Data: <strong>{restoreResult.summary.masterCount}</strong> item</div>
                        <div>• Sirkulasi / Mutasi: <strong>{restoreResult.summary.sirkulasiCount}</strong></div>
                        <div>• Kegiatan IPSRS: <strong>{restoreResult.summary.kegiatanCount}</strong></div>
                        <div>• Pengadaan PO: <strong>{restoreResult.summary.pengadaanCount}</strong></div>
                        <div>• Pemusnahan Aset: <strong>{restoreResult.summary.pemusnahanCount}</strong></div>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* TAB 3: TROUBLESHOOTING GOOGLE SHEETS */}
          {activeTab === 'troubleshoot' && (
            <div className="space-y-3.5">
              
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Kapan Menggunakan Cadangan JSON Sebagai Solusi Sinkronisasi?</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  Integrasi Google Spreadsheet membutuhkan koneksi internet stabil dan URL Web App Apps Script aktif. Jika terjadi situasi berikut:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-amber-800">
                  <li><strong>Koneksi Internet Terputus / Lambat:</strong> Anda tetap dapat beraktivitas 100% normal secara offline. Data tersimpan aman di peramban (LocalStorage).</li>
                  <li><strong>Gagal Sinkron / Kuota Google Script Habis:</strong> Segera unduh berkas <em>Backup JSON</em> untuk mengamankan perubahan data terkini.</li>
                  <li><strong>Pindah Perangkat / Komputer Baru:</strong> Cukup unduh Backup JSON dari komputer lama dan pulihkan (Restore) di komputer baru dalam 3 detik.</li>
                </ul>
              </div>

              {/* Action Steps Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  <span>Langkah Cepat Penyelamatan Data (3 Tahap Mudah):</span>
                </h4>

                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">Unduh Cadangan JSON Sekarang</span>
                      <p className="text-[11px] text-slate-500">
                        Klik tombol di bawah untuk mengunduh seluruh data inventaris dan master ke komputer Anda.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">Perbaiki atau Buat Spreadsheet Baru</span>
                      <p className="text-[11px] text-slate-500">
                        Buka menu pengaturan Google Apps Script jika perlu memperbarui URL Web App atau memasang template spreadsheet baru.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">Kirim / Push Ulang Data ke Spreadsheet</span>
                      <p className="text-[11px] text-slate-500">
                        Setelah URL terhubung, klik "Kirim / Push ke Sheets" untuk memperbarui seluruh 15 sheet di Google Drive secara otomatis.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleDownloadBackup}
                    className="w-full sm:w-auto px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh Cadangan JSON Darurat</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      window.dispatchEvent(new CustomEvent('simbars:open-settings-tab', { detail: 'database' }));
                    }}
                    className="w-full sm:w-auto px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Buka Pengaturan Spreadsheet</span>
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="hidden sm:inline">Penyimpanan lokal didukung oleh HTML5 Storage terenkripsi peramban RS.</span>
            <span className="sm:hidden">Storage Lokal Terenkripsi.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
