import React, { useState, useEffect } from 'react';
import { 
  GitHubSyncConfig, 
  GitHubSyncLog, 
  UserAccount 
} from '../types/inventory';
import { dataStorage } from '../services/dataStorage';
import { githubSyncService } from '../services/githubSyncService';
import { 
  X, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  ExternalLink, 
  Copy, 
  Key, 
  FolderGit2, 
  Zap, 
  Clock, 
  ArrowUpFromLine, 
  ArrowDownToLine, 
  ShieldCheck, 
  History, 
  HelpCircle, 
  GitBranch, 
  GitCommit, 
  Eye, 
  EyeOff, 
  Save, 
  Download,
  Terminal,
  FileCode,
  Sliders,
  CheckCheck
} from 'lucide-react';

interface GitHubSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  onSyncSuccess?: () => void;
}

export const GitHubSyncModal: React.FC<GitHubSyncModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSyncSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'config' | 'automation' | 'history' | 'guide'>('config');
  const [config, setConfig] = useState<GitHubSyncConfig>(() => dataStorage.getGitHubConfig());

  // Form states
  const [owner, setOwner] = useState(config.owner || 'rscmclu');
  const [repo, setRepo] = useState(config.repo || 'si-rsmi');
  const [branch, setBranch] = useState(config.branch || 'main');
  const [filePath, setFilePath] = useState(config.filePath || 'data/simbars-database.json');
  const [token, setToken] = useState(config.personalAccessToken || '');
  const [showToken, setShowToken] = useState(false);

  // Automation toggles
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(config.autoSyncEnabled ?? true);
  const [autoSyncOnChange, setAutoSyncOnChange] = useState(config.autoSyncOnChange ?? true);
  const [intervalMinutes, setIntervalMinutes] = useState(config.autoSyncIntervalMinutes || 5);
  const [autoPullOnStartup, setAutoPullOnStartup] = useState(config.autoPullOnStartup ?? false);

  // Actions & Feedback
  const [isTesting, setIsTesting] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [feedback, setFeedback] = useState<{ status: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  // Sync state listener
  useEffect(() => {
    const handleStatus = (e: any) => {
      if (e.detail) {
        setConfig(e.detail);
      }
    };
    window.addEventListener('simbars:github-sync-status', handleStatus);
    return () => window.removeEventListener('simbars:github-sync-status', handleStatus);
  }, []);

  // Synchronize internal inputs if config changes
  useEffect(() => {
    if (isOpen) {
      const current = dataStorage.getGitHubConfig();
      setConfig(current);
      setOwner(current.owner || 'rscmclu');
      setRepo(current.repo || 'si-rsmi');
      setBranch(current.branch || 'main');
      setFilePath(current.filePath || 'data/simbars-database.json');
      setToken(current.personalAccessToken || '');
      setAutoSyncEnabled(current.autoSyncEnabled ?? true);
      setAutoSyncOnChange(current.autoSyncOnChange ?? true);
      setIntervalMinutes(current.autoSyncIntervalMinutes || 5);
      setAutoPullOnStartup(current.autoPullOnStartup ?? false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveConfig = (showToast = true) => {
    const updated: GitHubSyncConfig = {
      ...config,
      owner: owner.trim(),
      repo: repo.trim(),
      branch: branch.trim() || 'main',
      filePath: filePath.trim() || 'data/simbars-database.json',
      personalAccessToken: token.trim(),
      autoSyncEnabled,
      autoSyncOnChange,
      autoSyncIntervalMinutes: Number(intervalMinutes),
      autoPullOnStartup,
    };
    setConfig(updated);
    dataStorage.saveGitHubConfig(updated);
    if (showToast) {
      setFeedback({
        status: 'success',
        message: 'Konfigurasi GitHub Auto-Sync berhasil disimpan!',
      });
      setTimeout(() => setFeedback(null), 4000);
    }
    return updated;
  };

  const handleTestConnection = async () => {
    const currentCfg = handleSaveConfig(false);
    setIsTesting(true);
    setFeedback({ status: 'info', message: 'Sedang menguji koneksi ke GitHub API...' });

    const res = await githubSyncService.testConnection(currentCfg);
    setIsTesting(false);
    setFeedback({
      status: res.success ? 'success' : 'error',
      message: res.message,
    });
  };

  const handlePushNow = async () => {
    const currentCfg = handleSaveConfig(false);
    if (!currentCfg.personalAccessToken) {
      setFeedback({
        status: 'error',
        message: 'Personal Access Token wajib diisi sebelum melakukan sinkronisasi.',
      });
      return;
    }

    setIsPushing(true);
    setFeedback({ status: 'info', message: 'Sedang mengekspor & mengirim database ke GitHub...' });

    const res = await githubSyncService.pushToGitHub(currentCfg, {
      isAutoSync: false,
      customMessage: `[Manual Sync] Update SIMBARS Database oleh ${currentUser.namaLengkap}`,
    });

    setIsPushing(false);
    setFeedback({
      status: res.success ? 'success' : 'error',
      message: res.message,
    });

    if (res.success && onSyncSuccess) {
      onSyncSuccess();
    }
  };

  const handlePullNow = async () => {
    const currentCfg = handleSaveConfig(false);
    if (!currentCfg.personalAccessToken) {
      setFeedback({
        status: 'error',
        message: 'Personal Access Token wajib diisi untuk mengambil data dari GitHub.',
      });
      return;
    }

    const confirmPull = window.confirm(
      'PERINGATAN: Menarik data dari GitHub akan memperbarui database lokal dengan versi yang ada di repositori GitHub Anda. Lanjutkan?'
    );
    if (!confirmPull) return;

    setIsPulling(true);
    setFeedback({ status: 'info', message: 'Sedang mengunduh dan memulihkan data dari GitHub...' });

    const res = await githubSyncService.pullFromGitHub(currentCfg);
    setIsPulling(false);
    setFeedback({
      status: res.success ? 'success' : 'error',
      message: res.message,
    });

    if (res.success && onSyncSuccess) {
      onSyncSuccess();
    }
  };

  const handleDownloadBackupLocal = () => {
    const snapshot = dataStorage.exportFullDatabaseJson(true);
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_simbars_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isConfigured = Boolean(config.owner && config.repo && config.personalAccessToken);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* MODAL HEADER */}
        <div className="px-5 sm:px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white shadow-xs">
              <FolderGit2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg tracking-tight text-white flex items-center gap-2">
                  <span>Auto-Sync Otomatis ke GitHub</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    Real-time
                  </span>
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                Sinkronisasi database SIMBARS otomatis setiap ada perubahan data ke repositori GitHub
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Status Pill in Header */}
            <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
              isConfigured
                ? config.autoSyncEnabled
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                isConfigured
                  ? config.autoSyncEnabled
                    ? 'bg-emerald-400 animate-pulse'
                    : 'bg-blue-400'
                  : 'bg-amber-400'
              }`} />
              <span>
                {isConfigured
                  ? config.autoSyncEnabled
                    ? 'Auto-Sync Aktif'
                    : 'Terhubung (Manual)'
                  : 'Belum Dikonfigurasi'}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* FEEDBACK BANNER */}
        {feedback && (
          <div
            className={`px-5 py-2.5 flex items-center justify-between text-xs font-medium border-b shrink-0 transition-all ${
              feedback.status === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : feedback.status === 'error'
                ? 'bg-rose-50 text-rose-900 border-rose-200'
                : 'bg-blue-50 text-blue-900 border-blue-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.status === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : feedback.status === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              ) : (
                <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-slate-400 hover:text-slate-600 ml-2 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* TABS NAVIGATION */}
        <div className="px-5 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center gap-1 sm:gap-2 overflow-x-auto shrink-0 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'config'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            <span>1. Repositori & Token</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('automation')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'automation'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>2. Real-time & Otomatisasi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>3. Riwayat Commit ({config.syncLogs?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'guide'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
            <span>Panduan Token GitHub</span>
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* TAB 1: REPOSITORI & TOKEN */}
          {activeTab === 'config' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Info Callout */}
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Keamanan & Penyimpanan Repositori GitHub:</p>
                  <p className="text-slate-600 leading-relaxed">
                    Setiap perubahan data inventaris ruangan, sirkulasi, permintaan perbaikan, pengadaan, dan audit log akan otomatis dikirim (commit) ke file JSON di repositori GitHub Anda. Token disimpan aman di peramban dan hanya digunakan untuk memanggil REST API GitHub resmi.
                  </p>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Owner */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Owner / Username GitHub <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={owner}
                    onChange={e => setOwner(e.target.value)}
                    placeholder="Contoh: rscmclu"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Username akun GitHub Anda atau nama organisasi.
                  </span>
                </div>

                {/* Repo */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Repositori <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={repo}
                    onChange={e => setRepo(e.target.value)}
                    placeholder="Contoh: si-rsmi"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Nama repositori tempat menyimpan database SIMBARS.
                  </span>
                </div>

                {/* Branch */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <GitBranch className="w-3.5 h-3.5 text-slate-500" />
                    <span>Target Branch</span>
                  </label>
                  <input
                    type="text"
                    value={branch}
                    onChange={e => setBranch(e.target.value)}
                    placeholder="main atau master"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Default branch: <code className="bg-slate-100 px-1 py-0.2 rounded font-mono">main</code>.
                  </span>
                </div>

                {/* File Path */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-slate-500" />
                    <span>Lokasi Berkas di Repositori (Path)</span>
                  </label>
                  <input
                    type="text"
                    value={filePath}
                    onChange={e => setFilePath(e.target.value)}
                    placeholder="data/simbars-database.json"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Format file JSON otomatis dibuat di folder ini.
                  </span>
                </div>
              </div>

              {/* Personal Access Token */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-600" />
                    <span>GitHub Personal Access Token (PAT)</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveTab('guide')}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer underline flex items-center gap-1"
                  >
                    <HelpCircle className="w-3 h-3" />
                    <span>Cara dapatkan token?</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={token}
                    onChange={e => setToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx atau github_pat_xxxxxxxxxxxxxxxxxxxx"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono pr-20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(prev => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    title={showToken ? 'Sembunyikan Token' : 'Lihat Token'}
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Dibutuhkan token dengan izin <strong>repo</strong> (Classic) atau <strong>Repository contents: Read and write</strong> (Fine-grained).
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
                <button
                  type="button"
                  disabled={isTesting}
                  onClick={handleTestConnection}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-blue-600' : ''}`} />
                  <span>{isTesting ? 'Menguji Koneksi...' : 'Uji Koneksi GitHub'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveConfig(true)}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Pengaturan</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: REAL-TIME & OTOMATISASI */}
          {activeTab === 'automation' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Master Toggle Card */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 via-indigo-50/50 to-emerald-50/60 border border-blue-200/90 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                    <h4 className="font-bold text-slate-900 text-sm">Master Switch Auto-Sync GitHub</h4>
                  </div>
                  <p className="text-xs text-slate-600">
                    Aktifkan untuk mengizinkan sistem menyinkronkan data secara otomatis ke GitHub
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSyncEnabled}
                    onChange={e => {
                      setAutoSyncEnabled(e.target.checked);
                      const updated = { ...config, autoSyncEnabled: e.target.checked };
                      setConfig(updated);
                      dataStorage.saveGitHubConfig(updated);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Automation Feature Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                {/* 1. Real-time On Change */}
                <div className={`p-4 rounded-xl border transition-all ${
                  autoSyncOnChange && autoSyncEnabled
                    ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs'
                    : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                        <Zap className="w-4 h-4 text-emerald-600" />
                        <span>⚡ Real-time Sync Tiap Perubahan</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Kirim update ke GitHub seketika saat menambah, mengedit aset, sirkulasi, atau status perbaikan (dengan proteksi buffer 3 detik).
                      </p>
                    </div>

                    <input
                      type="checkbox"
                      checked={autoSyncOnChange}
                      disabled={!autoSyncEnabled}
                      onChange={e => {
                        setAutoSyncOnChange(e.target.checked);
                        const updated = { ...config, autoSyncOnChange: e.target.checked };
                        setConfig(updated);
                        dataStorage.saveGitHubConfig(updated);
                      }}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer mt-0.5"
                    />
                  </div>
                </div>

                {/* 2. Periodic Timer */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span>⏱️ Interval Timer Rutin</span>
                    </div>

                    <select
                      value={intervalMinutes}
                      disabled={!autoSyncEnabled}
                      onChange={e => {
                        setIntervalMinutes(Number(e.target.value));
                        const updated = { ...config, autoSyncIntervalMinutes: Number(e.target.value) };
                        setConfig(updated);
                        dataStorage.saveGitHubConfig(updated);
                      }}
                      className="bg-slate-50 border border-slate-300 text-slate-800 font-bold rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value={1}>Setiap 1 Menit</option>
                      <option value={3}>Setiap 3 Menit</option>
                      <option value={5}>Setiap 5 Menit</option>
                      <option value={15}>Setiap 15 Menit</option>
                      <option value={30}>Setiap 30 Menit</option>
                      <option value={60}>Setiap 1 Jam</option>
                    </select>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Menyinkronkan cadangan secara periodik di latar belakang saat aplikasi dibuka.
                  </p>
                </div>
              </div>

              {/* Status Box */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-xs text-slate-500 font-medium">Status Terakhir:</span>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        config.lastSyncStatus === 'success'
                          ? 'bg-emerald-500'
                          : config.lastSyncStatus === 'error'
                          ? 'bg-rose-500'
                          : config.lastSyncStatus === 'syncing'
                          ? 'bg-blue-500 animate-ping'
                          : 'bg-slate-400'
                      }`} />
                      <span className="font-bold text-xs text-slate-800">
                        {config.lastSyncMessage || 'Belum ada aktivitas sinkronisasi.'}
                      </span>
                    </div>
                    {config.lastSyncTime && (
                      <span className="text-[11px] text-slate-500 block">
                        Waktu: {new Date(config.lastSyncTime).toLocaleString('id-ID')}
                      </span>
                    )}
                  </div>

                  {config.lastCommitUrl && (
                    <a
                      href={config.lastCommitUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 underline self-start sm:self-auto"
                    >
                      <span>Lihat Commit di GitHub ({config.lastCommitSha})</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                {/* Quick Action Buttons */}
                <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={isPushing || !isConfigured}
                    onClick={handlePushNow}
                    className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors disabled:opacity-50"
                  >
                    <ArrowUpFromLine className={`w-3.5 h-3.5 ${isPushing ? 'animate-spin' : ''}`} />
                    <span>{isPushing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang (Push ke GitHub)'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isPulling || !isConfigured}
                    onClick={handlePullNow}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors disabled:opacity-50"
                  >
                    <ArrowDownToLine className={`w-3.5 h-3.5 ${isPulling ? 'animate-spin' : ''}`} />
                    <span>{isPulling ? 'Mengunduh...' : 'Tarik Data dari GitHub (Pull)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadBackupLocal}
                    className="px-3.5 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 cursor-pointer ml-auto"
                    title="Simpan file JSON ke komputer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Download JSON Lokal</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: RIWAYAT COMMIT */}
          {activeTab === 'history' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-slate-600" />
                    <span>Riwayat Sinkronisasi & Commit GitHub</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Catatan audit setiap aktivitas push dan pull data ke repositori
                  </p>
                </div>

                {config.syncLogs && config.syncLogs.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Bersihkan riwayat log sinkronisasi?')) {
                        const updated = { ...config, syncLogs: [] };
                        setConfig(updated);
                        dataStorage.saveGitHubConfig(updated);
                      }
                    }}
                    className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold cursor-pointer underline"
                  >
                    Bersihkan Riwayat
                  </button>
                )}
              </div>

              {(!config.syncLogs || config.syncLogs.length === 0) ? (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <GitCommit className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="font-bold text-xs text-slate-700">Belum Ada Riwayat Commit</p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    Setelah Anda menyimpan konfigurasi token dan menekan "Sinkronkan Sekarang" atau mengedit data, riwayat commit otomatis muncul di sini.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {config.syncLogs.map((log: GitHubSyncLog) => (
                    <div
                      key={log.id}
                      className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                        log.status === 'success'
                          ? 'bg-white border-slate-200'
                          : 'bg-rose-50/60 border-rose-200'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          log.status === 'success'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}>
                          {log.status === 'success' ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <AlertCircle className="w-4 h-4" />
                          )}
                        </div>

                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">{log.message}</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase bg-slate-100 text-slate-600">
                              {log.type === 'auto' ? '⚡ Real-time' : log.type === 'pull' ? '📥 Pull' : '🚀 Push'}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500 flex items-center gap-2">
                            <span>{new Date(log.timestamp).toLocaleString('id-ID')}</span>
                            {log.itemsCount !== undefined && (
                              <>
                                <span>•</span>
                                <span>{log.itemsCount} Aset</span>
                              </>
                            )}
                            {log.commitSha && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-blue-600 font-semibold">
                                  #{log.commitSha}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {log.commitUrl && (
                        <a
                          href={log.commitUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:text-blue-800 p-1 shrink-0"
                          title="Buka Commit di GitHub"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PANDUAN CARA MEMBUAT TOKEN GITHUB */}
          {activeTab === 'guide' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-amber-400" />
                  <h4 className="font-bold text-sm text-white">
                    Panduan Membuat GitHub Personal Access Token (Hanya 1 Menit)
                  </h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Personal Access Token (PAT) berfungsi sebagai kunci otentikasi agar aplikasi SIMBARS dapat membuat commit dan menyimpan berkas data ke repositori Anda secara aman.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                
                {/* Step 1 */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-slate-800">Buka Menu Developer Settings di GitHub</p>
                    <p className="text-slate-600">
                      Klik foto profil Anda di kanan atas GitHub &gt; pilih <strong>Settings</strong> &gt; scroll ke menu paling bawah sebelah kiri &gt; klik <strong>Developer settings</strong>.
                    </p>
                    <a
                      href="https://github.com/settings/tokens"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800 underline mt-1"
                    >
                      <span>Langsung Buka Halaman Token GitHub</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-slate-800">Pilih "Tokens (classic)" &gt; Generate new token</p>
                    <p className="text-slate-600">
                      Klik dropdown <strong>Personal access tokens</strong> &gt; pilih <strong>Tokens (classic)</strong> &gt; klik tombol <strong>Generate new token (classic)</strong>.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    3
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-slate-800">Isi Nama Token & Centang Izin (Scope) "repo"</p>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-600 mt-1">
                      <li><strong>Note:</strong> Beri nama, misalnya <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-blue-700">SIMBARS-Auto-Sync</code></li>
                      <li><strong>Expiration:</strong> Pilih <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">No expiration</code> atau 90 days</li>
                      <li><strong>Select scopes:</strong> Beri centang pada kotak <strong className="text-slate-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">repo</strong> (Full control of private repositories)</li>
                    </ul>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    4
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-slate-800">Klik Generate Token & Salin Kode</p>
                    <p className="text-slate-600">
                      Scroll ke bawah lalu klik <strong>Generate token</strong>. Salin kode token yang diawali <code className="font-mono bg-slate-100 px-1 py-0.5 rounded font-bold text-emerald-700">ghp_...</code> lalu tempelkan ke kolom Token di tab <strong>1. Repositori & Token</strong>.
                    </p>
                  </div>
                </div>

              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveTab('config')}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer shadow-xs"
                >
                  Kembali ke Konfigurasi
                </button>
              </div>

            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Target File: </span>
            <code className="font-mono text-slate-800 font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200">
              {owner}/{repo}:{branch}/{filePath}
            </code>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs cursor-pointer transition-colors"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={() => handleSaveConfig(true)}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan & Aktifkan</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
