import React, { useState, useEffect, useMemo } from 'react';
import { 
  HashRouter, 
  Routes, 
  Route, 
  useLocation, 
  useNavigate, 
  Navigate 
} from 'react-router-dom';
import { 
  UserAccount, 
  GasSyncConfig, 
  JenisInventaris, 
  KategoriInventaris, 
  MerkInventaris, 
  RuangInventaris, 
  SupplierInventaris,
  InventarisRuangan,
  ActionPermission,
  AppSettings
} from './types/inventory';
import { dataStorage } from './services/dataStorage';
import { gasSyncService } from './services/gasSyncService';
import { formatRupiah, formatAssetQrText } from './utils/formatters';

// Layout & Views
import { LoginPage } from './components/LoginPage';
import { Header } from './components/Header';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { MasterInventarisView } from './components/MasterInventarisView';
import { DataInventarisRuanganView } from './components/DataInventarisRuanganView';
import { DataInventarisAllView } from './components/DataInventarisAllView';
import { SirkulasiView } from './components/SirkulasiView';
import { KegiatanInventarisView, KegiatanSubTab } from './components/KegiatanInventarisView';
import { PengadaanInventarisView, PengadaanSubTab } from './components/PengadaanInventarisView';
import { PemusnahanAsetView, PemusnahanSubTab } from './components/PemusnahanAsetView';
import { SettingsView } from './components/SettingsView';
import { PetunjukPenggunaanView } from './components/PetunjukPenggunaanView';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { AssetDetailModal } from './components/AssetDetailModal';
import { BackupRestoreModal } from './components/BackupRestoreModal';
import { GasUpdateGuideModal } from './components/GasUpdateGuideModal';

// Modals
import { 
  QrCode, 
  X, 
  FileSpreadsheet, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Copy,
  Check,
  Building2,
  DoorOpen,
  Tag,
  ShieldCheck,
  Info,
  Zap,
  Clock,
  ArrowDownToLine,
  ArrowUpFromLine,
  History,
  Eye,
  Database,
  FolderArchive,
  Download
} from 'lucide-react';

export const TAB_PATH_MAP: Record<ActiveTab, string> = {
  dashboard: '/dashboard',
  master_jenis: '/master-jenis',
  master_kategori: '/master-kategori',
  master_merk: '/master-merk',
  master_ruang: '/master-ruang',
  master_supplier: '/master-supplier',
  data_ruangan: '/data-ruangan',
  data_semua_rs: '/data-semua-rs',
  sirkulasi: '/sirkulasi',
  permintaan_perbaikan: '/permintaan-perbaikan',
  perbaikan: '/perbaikan',
  pemeliharaan: '/pemeliharaan',
  laporan_mutu: '/laporan-mutu',
  pengajuan: '/pengajuan',
  pengadaan: '/pengadaan',
  penerimaan: '/penerimaan',
  permintaan_pemusnahan: '/permintaan-pemusnahan',
  pelaksanaan_pemusnahan: '/pelaksanaan-pemusnahan',
  laporan_pemusnahan: '/laporan-pemusnahan',
  setting_user: '/setting-user',
  setting_hak_akses: '/setting-hak-akses',
  setting_aplikasi: '/setting-aplikasi',
  gas_sync: '/gas-sync',
  petunjuk: '/petunjuk',
};

export const PATH_TAB_MAP: Record<string, ActiveTab> = {
  '/': 'dashboard',
  '/dashboard': 'dashboard',
  '/master-jenis': 'master_jenis',
  '/master-kategori': 'master_kategori',
  '/master-merk': 'master_merk',
  '/master-ruang': 'master_ruang',
  '/master-supplier': 'master_supplier',
  '/data-ruangan': 'data_ruangan',
  '/data-semua-rs': 'data_semua_rs',
  '/sirkulasi': 'sirkulasi',
  '/permintaan-perbaikan': 'permintaan_perbaikan',
  '/perbaikan': 'perbaikan',
  '/pemeliharaan': 'pemeliharaan',
  '/laporan-mutu': 'laporan_mutu',
  '/pengajuan': 'pengajuan',
  '/pengadaan': 'pengadaan',
  '/penerimaan': 'penerimaan',
  '/permintaan-pemusnahan': 'permintaan_pemusnahan',
  '/pelaksanaan-pemusnahan': 'pelaksanaan_pemusnahan',
  '/laporan-pemusnahan': 'laporan_pemusnahan',
  '/setting-user': 'setting_user',
  '/setting-hak-akses': 'setting_hak_akses',
  '/setting-aplikasi': 'setting_aplikasi',
  '/gas-sync': 'gas_sync',
  '/petunjuk': 'petunjuk',
};

function SimbarsApp() {
  const location = useLocation();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => dataStorage.getCurrentUser());
  const [appSettings, setAppSettings] = useState<AppSettings>(() => dataStorage.getAppSettings());
  
  // Resolve initial tab from current hash path
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    const currentPath = window.location.hash.replace(/^#/, '') || '/';
    const cleanPath = currentPath.split('?')[0].toLowerCase();
    return PATH_TAB_MAP[cleanPath] || 'dashboard';
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Global Modals
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [isGasModalOpen, setIsGasModalOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [searchNavContext, setSearchNavContext] = useState<{ assetId?: string; roomId?: string; categoryId?: string; search?: string } | null>(null);
  const [scannedAsset, setScannedAsset] = useState<InventarisRuangan | null>(null);
  const [scannedError, setScannedError] = useState<string | null>(null);
  const [manualQrInput, setManualQrInput] = useState('');
  const [copiedQrText, setCopiedQrText] = useState(false);

  // Asset Detail & Audit Trail Modal
  const [detailModalAsset, setDetailModalAsset] = useState<InventarisRuangan | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Backup & Restore Database Modal
  const [isBackupRestoreOpen, setIsBackupRestoreOpen] = useState(false);
  const [backupRestoreTab, setBackupRestoreTab] = useState<'backup' | 'restore' | 'troubleshoot'>('backup');

  // Synchronize location pathname to activeTab
  useEffect(() => {
    const cleanPath = (location.pathname || '/').toLowerCase().replace(/\/+$/, '') || '/';
    const matchedTab = PATH_TAB_MAP[cleanPath];
    if (matchedTab && matchedTab !== activeTab) {
      setActiveTab(matchedTab);
    }
  }, [location.pathname]);

  // Navigate and update activeTab
  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    const targetPath = TAB_PATH_MAP[tab] || '/dashboard';
    if (location.pathname !== targetPath) {
      navigate(targetPath);
    }
  };

  // Global keyboard shortcut: Ctrl+K or Cmd+K to open Global Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // GAS Sync Config state
  const [gasConfig, setGasConfig] = useState<GasSyncConfig>(() => dataStorage.getGasConfig());
  const [gasUrlInput, setGasUrlInput] = useState(gasConfig.webAppUrl);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ status: 'success' | 'error'; message: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isGasGuideModalOpen, setIsGasGuideModalOpen] = useState(false);
  const [gasGuideErrorMessage, setGasGuideErrorMessage] = useState<string | undefined>(undefined);

  // Synchronize gasUrlInput when gasConfig changes
  useEffect(() => {
    setGasUrlInput(gasConfig.webAppUrl);
  }, [gasConfig.webAppUrl]);

  // 1. Listen for background sync status updates and real-time data changes
  useEffect(() => {
    const handleSyncStatus = (e: any) => {
      if (e.detail) {
        setGasConfig(e.detail);
      }
    };

    const handleDataChanged = () => {
      const cfg = dataStorage.getGasConfig();
      if (cfg.webAppUrl && cfg.autoSyncEnabled && cfg.autoSyncOnChange) {
        gasSyncService.triggerAutoPush(cfg, 2500);
      }
    };

    window.addEventListener('simbars:sync-status', handleSyncStatus);
    window.addEventListener('simbars:data-changed', handleDataChanged);

    return () => {
      window.removeEventListener('simbars:sync-status', handleSyncStatus);
      window.removeEventListener('simbars:data-changed', handleDataChanged);
    };
  }, []);

  // 2. Periodic background auto-sync timer
  useEffect(() => {
    if (!gasConfig.webAppUrl || !gasConfig.autoSyncEnabled) return;
    const intervalMinutes = gasConfig.autoSyncIntervalMinutes || 5;
    const intervalMs = Math.max(1, intervalMinutes) * 60 * 1000;

    const timer = setInterval(async () => {
      const currentCfg = dataStorage.getGasConfig();
      if (currentCfg.webAppUrl && currentCfg.autoSyncEnabled) {
        await gasSyncService.pushToGoogleSheets(currentCfg);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [gasConfig.webAppUrl, gasConfig.autoSyncEnabled, gasConfig.autoSyncIntervalMinutes]);

  // Protect admin-only tabs
  useEffect(() => {
    if (!currentUser) return;
    const isUserAdmin = currentUser.role === 'Super Admin' || 
      currentUser.role?.toLowerCase().includes('admin') || 
      currentUser.username?.toLowerCase() === 'admin';
    if (!isUserAdmin && (activeTab === 'petunjuk' || activeTab === 'gas_sync')) {
      handleSelectTab('dashboard');
    }
  }, [currentUser, activeTab]);

  // Sync state handler
  const handleLogin = (user: UserAccount) => {
    setCurrentUser(user);
    dataStorage.saveCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    dataStorage.saveCurrentUser(null);
  };

  const handleSaveGasUrl = async () => {
    const updated: GasSyncConfig = {
      ...gasConfig,
      webAppUrl: gasUrlInput.trim(),
      autoSyncEnabled: true,
      autoSyncOnChange: true,
    };
    setGasConfig(updated);
    dataStorage.saveGasConfig(updated);

    if (gasUrlInput.trim()) {
      setIsSyncing(true);
      const res = await gasSyncService.testConnection(gasUrlInput.trim());
      setIsSyncing(false);
      setSyncFeedback({
        status: res.success ? 'success' : 'error',
        message: res.message,
      });

      // Auto-push initial database upon connecting
      if (res.success) {
        gasSyncService.triggerAutoPush(updated, 1000);
      }
    } else {
      setSyncFeedback({
        status: 'success',
        message: 'URL Google Apps Script dikosongkan.',
      });
    }
  };

  const handleToggleAutoSync = (enabled: boolean) => {
    const updated: GasSyncConfig = {
      ...gasConfig,
      autoSyncEnabled: enabled,
    };
    setGasConfig(updated);
    dataStorage.saveGasConfig(updated);
    if (enabled && updated.webAppUrl) {
      gasSyncService.triggerAutoPush(updated, 500);
    }
  };

  const handleToggleAutoSyncOnChange = (onChange: boolean) => {
    const updated: GasSyncConfig = {
      ...gasConfig,
      autoSyncOnChange: onChange,
    };
    setGasConfig(updated);
    dataStorage.saveGasConfig(updated);
  };

  const handleChangeSyncInterval = (minutes: number) => {
    const updated: GasSyncConfig = {
      ...gasConfig,
      autoSyncIntervalMinutes: minutes,
    };
    setGasConfig(updated);
    dataStorage.saveGasConfig(updated);
  };

  const handleSyncAllToGas = async () => {
    if (!gasConfig.webAppUrl) {
      setSyncFeedback({
        status: 'error',
        message: 'Harap konfigurasi Web App URL Google Apps Script terlebih dahulu.',
      });
      return;
    }

    setIsSyncing(true);
    const res = await gasSyncService.pushToGoogleSheets(gasConfig);
    setIsSyncing(false);

    setSyncFeedback({
      status: res.success ? 'success' : 'error',
      message: res.message,
    });
  };

  const handlePullFromGas = async () => {
    if (!gasConfig.webAppUrl) {
      setSyncFeedback({
        status: 'error',
        message: 'Harap konfigurasi Web App URL Google Apps Script terlebih dahulu.',
      });
      return;
    }

    setIsSyncing(true);
    const res = await gasSyncService.pullFromGoogleSheets(gasConfig);
    setIsSyncing(false);

    setSyncFeedback({
      status: res.success ? 'success' : 'error',
      message: res.message,
    });
  };

  const handleCopyGasCode = () => {
    navigator.clipboard.writeText(gasSyncService.getGasScriptTemplate());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  const handleDownloadCodeGs = () => {
    gasSyncService.downloadCodeGsFile(gasConfig.apiKeySecret);
    setSyncFeedback({
      status: 'success',
      message: 'File Code.gs (v3.2.0) berhasil diunduh ke komputer Anda.',
    });
  };

  const handleAutoMigrateSchema = async () => {
    if (!gasConfig.webAppUrl) {
      setSyncFeedback({
        status: 'error',
        message: 'Harap konfigurasi Web App URL Google Apps Script terlebih dahulu.',
      });
      return;
    }

    setIsSyncing(true);
    setSyncFeedback({
      status: 'success',
      message: 'Sedang memperbarui skema 19 tabel Google Spreadsheet secara otomatis...',
    });

    const res = await gasSyncService.autoMigrateRemoteSchema(gasConfig);
    setIsSyncing(false);

    setSyncFeedback({
      status: res.success ? 'success' : 'error',
      message: res.message,
    });

    if (
      !res.success &&
      (res.needsScriptUpdate ||
        (res.message && (res.message.toLowerCase().includes('invalid action') || res.message.includes('autoUpdateSchema'))))
    ) {
      setGasGuideErrorMessage(res.message);
      setIsGasGuideModalOpen(true);
    }
  };

  const handleQrLookup = (input: string) => {
    if (!input || !input.trim()) return;
    const raw = input.trim();
    const all = dataStorage.getInventarisRuangan();

    // 1. Direct ID match
    let found = all.find(i => (i.idBarang || '').toLowerCase() === raw.toLowerCase());

    // 2. Extracted ID from multi-line text (e.g. "ID: J01-K01-R01-0001")
    if (!found) {
      const matchIdLine = raw.match(/ID:\s*([A-Za-z0-9-]+)/i);
      if (matchIdLine && matchIdLine[1]) {
        found = all.find(i => (i.idBarang || '').toLowerCase() === matchIdLine[1].trim().toLowerCase());
      }
    }

    // 3. Extracted ID from JSON string if any
    if (!found && (raw.startsWith('{') || raw.includes('"id"'))) {
      try {
        const parsed = JSON.parse(raw);
        const parsedId = parsed.id || parsed.idBarang;
        if (parsedId) {
          found = all.find(i => (i.idBarang || '').toLowerCase() === String(parsedId).toLowerCase());
        }
      } catch {}
    }

    if (found) {
      setScannedAsset(found);
      setScannedError(null);
    } else {
      setScannedAsset(null);
      setScannedError(`Aset dengan ID atau kode "${raw}" tidak ditemukan di database.`);
    }
  };

  if (!currentUser) {
    return (
      <LoginPage 
        onLoginSuccess={handleLogin} 
        appSettings={appSettings} 
      />
    );
  }

  const actionAccess: ActionPermission = {
    ...(currentUser.actionAccess || {}),
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canPrint: true,
    canExport: true,
  };

  const isAdmin = currentUser.role === 'Super Admin' || 
    currentUser.role?.toLowerCase().includes('admin') || 
    currentUser.username?.toLowerCase() === 'admin';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-800 selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* Header */}
      <Header
        currentUser={currentUser}
        appSettings={appSettings}
        onLogout={handleLogout}
        onOpenQrScanner={() => {
          setScannedAsset(null);
          setScannedError(null);
          setManualQrInput('');
          setIsQrScannerOpen(true);
        }}
        onOpenGlobalSearch={() => {
          setIsGlobalSearchOpen(true);
        }}
        onOpenGasSync={() => {
          if (isAdmin) setIsGasModalOpen(true);
        }}
        onOpenGuide={() => {
          if (isAdmin) handleSelectTab('petunjuk');
        }}
        gasConfig={gasConfig}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          currentUser={currentUser}
          appSettings={appSettings}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 lg:pl-72 flex flex-col min-w-0 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
            
            {/* 0. DASHBOARD */}
            {activeTab === 'dashboard' && (
              <DashboardView 
                currentUser={currentUser}
                isAdmin={isAdmin}
                onNavigate={(tab) => handleSelectTab(tab as ActiveTab)} 
                onOpenGlobalSearch={() => setIsGlobalSearchOpen(true)}
                onOpenQrScanner={() => {
                  setScannedAsset(null);
                  setScannedError(null);
                  setManualQrInput('');
                  setIsQrScannerOpen(true);
                }}
                onInspectAsset={(asset) => {
                  setManualQrInput(asset.idBarang);
                  handleQrLookup(asset.idBarang);
                  setIsQrScannerOpen(true);
                }}
              />
            )}

            {/* 1. MASTER INVENTARIS */}
            {activeTab === 'master_jenis' && (
              <MasterInventarisView initialSubTab="jenis" actionAccess={actionAccess} />
            )}
            {activeTab === 'master_kategori' && (
              <MasterInventarisView initialSubTab="kategori" actionAccess={actionAccess} />
            )}
            {activeTab === 'master_merk' && (
              <MasterInventarisView initialSubTab="merk" actionAccess={actionAccess} />
            )}
            {activeTab === 'master_ruang' && (
              <MasterInventarisView initialSubTab="ruang" actionAccess={actionAccess} />
            )}
            {activeTab === 'master_supplier' && (
              <MasterInventarisView initialSubTab="supplier" actionAccess={actionAccess} />
            )}

            {/* 2. DATA INVENTARIS */}
            {activeTab === 'data_ruangan' && (
              <DataInventarisRuanganView 
                actionAccess={actionAccess} 
                currentUser={currentUser}
                userRuangId={currentUser?.ruangId}
                appSettings={appSettings}
                initialSearch={searchNavContext?.search || searchNavContext?.assetId || ''}
                initialRuangId={searchNavContext?.roomId || 'ALL'}
                onInspectAsset={(asset) => {
                  setManualQrInput(asset.idBarang);
                  handleQrLookup(asset.idBarang);
                  setIsQrScannerOpen(true);
                }}
              />
            )}
            {activeTab === 'data_semua_rs' && (
              <DataInventarisAllView 
                actionAccess={actionAccess} 
                appSettings={appSettings}
                initialSearch={searchNavContext?.search || searchNavContext?.assetId || ''}
                initialRuangId={searchNavContext?.roomId || 'ALL'}
                initialKategoriId={searchNavContext?.categoryId || 'ALL'}
                onInspectAsset={(asset) => {
                  setManualQrInput(asset.idBarang);
                  handleQrLookup(asset.idBarang);
                  setIsQrScannerOpen(true);
                }}
              />
            )}
            {activeTab === 'sirkulasi' && (
              <SirkulasiView actionAccess={actionAccess} appSettings={appSettings} currentUser={currentUser} />
            )}

            {/* 3. KEGIATAN INVENTARIS */}
            {activeTab === 'permintaan_perbaikan' && (
              <KegiatanInventarisView initialSubTab="permintaan" actionAccess={actionAccess} appSettings={appSettings} currentUser={currentUser} />
            )}
            {activeTab === 'perbaikan' && (
              <KegiatanInventarisView initialSubTab="perbaikan" actionAccess={actionAccess} appSettings={appSettings} currentUser={currentUser} />
            )}
            {activeTab === 'pemeliharaan' && (
              <KegiatanInventarisView initialSubTab="pemeliharaan" actionAccess={actionAccess} appSettings={appSettings} currentUser={currentUser} />
            )}
            {activeTab === 'laporan_mutu' && (
              <KegiatanInventarisView initialSubTab="laporanMutu" actionAccess={actionAccess} appSettings={appSettings} currentUser={currentUser} />
            )}

            {/* 4. PENGADAAN INVENTARIS */}
            {activeTab === 'pengajuan' && (
              <PengadaanInventarisView initialSubTab="pengajuan" actionAccess={actionAccess} currentUser={currentUser} appSettings={appSettings} />
            )}
            {activeTab === 'pengadaan' && (
              <PengadaanInventarisView initialSubTab="pengadaan" actionAccess={actionAccess} currentUser={currentUser} appSettings={appSettings} />
            )}
            {activeTab === 'penerimaan' && (
              <PengadaanInventarisView initialSubTab="penerimaan" actionAccess={actionAccess} currentUser={currentUser} appSettings={appSettings} />
            )}

            {/* 5. PEMUSNAHAN ASET */}
            {activeTab === 'permintaan_pemusnahan' && (
              <PemusnahanAsetView initialSubTab="permintaan" actionAccess={actionAccess} currentUser={currentUser} appSettings={appSettings} />
            )}
            {activeTab === 'pelaksanaan_pemusnahan' && (
              <PemusnahanAsetView initialSubTab="pelaksanaan" actionAccess={actionAccess} currentUser={currentUser} appSettings={appSettings} />
            )}
            {activeTab === 'laporan_pemusnahan' && (
              <PemusnahanAsetView initialSubTab="laporan" actionAccess={actionAccess} currentUser={currentUser} appSettings={appSettings} />
            )}

            {/* 6. SETTING */}
            {(activeTab === 'setting_user' || activeTab === 'setting_hak_akses' || activeTab === 'setting_aplikasi' || activeTab === 'gas_sync') && (
              <SettingsView
                currentUser={currentUser as any}
                actionAccess={actionAccess}
                appSettings={appSettings}
                onAppSettingsChange={(newSettings) => {
                  setAppSettings(newSettings);
                }}
                initialTab={
                  activeTab === 'setting_hak_akses' 
                    ? 'hakAkses' 
                    : activeTab === 'setting_aplikasi' 
                    ? 'aplikasi' 
                    : activeTab === 'gas_sync' 
                    ? 'database' 
                    : 'user'
                }
                onUserRoleChange={(updatedUser) => {
                  setCurrentUser({
                    ...currentUser,
                    namaLengkap: updatedUser.namaLengkap,
                    username: updatedUser.username,
                    role: updatedUser.role,
                  });
                }}
                onPermissionsUpdated={() => {
                  const updatedCurrent = dataStorage.getCurrentUser();
                  if (updatedCurrent) {
                    setCurrentUser(updatedCurrent);
                  }
                }}
              />
            )}

            {/* 7. PETUNJUK PENGGUNAAN (ADMIN ONLY) */}
            {activeTab === 'petunjuk' && isAdmin && (
              <PetunjukPenggunaanView />
            )}

          </div>
        </main>
      </div>

      {/* QR SCANNER POPUP MODAL */}
      {isQrScannerOpen && (() => {
        const allRooms = dataStorage.getRuang();
        const allTypes = dataStorage.getJenis();
        const allCategories = dataStorage.getKategori();
        const allBrands = dataStorage.getMerk();

        const scannedRoom = scannedAsset ? allRooms.find(r => r.id === scannedAsset.idRuang) : null;
        const scannedType = scannedAsset ? allTypes.find(j => j.id === scannedAsset.idJenis) : null;
        const scannedCat = scannedAsset ? allCategories.find(k => k.id === scannedAsset.idKategori) : null;
        const scannedBrand = scannedAsset ? allBrands.find(m => m.id === scannedAsset.idMerk) : null;
        const cleanQrText = scannedAsset 
          ? formatAssetQrText(scannedAsset, scannedRoom?.namaRuang, appSettings?.appName)
          : '';

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-emerald-600" />
                  <span>Pindai & Lookup Identitas Aset</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsQrScannerOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-slate-600">
                  Pindai QR code fisik atau masukkan kode ID Barang / teks QR:
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualQrInput}
                    onChange={e => setManualQrInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleQrLookup(manualQrInput);
                    }}
                    placeholder="Ketik / scan ID Barang (e.g. J01-K01-R01-0001)..."
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleQrLookup(manualQrInput)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer transition-colors shadow-xs"
                  >
                    Cari
                  </button>
                </div>

                {/* Sample Quick Lookup Pills */}
                <div className="pt-1">
                  <span className="text-[11px] text-slate-400 block mb-1">Contoh Cepat:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {dataStorage.getInventarisRuangan().slice(0, 3).map(sample => (
                      <button
                        key={sample.idBarang}
                        type="button"
                        onClick={() => {
                          setManualQrInput(sample.idBarang);
                          handleQrLookup(sample.idBarang);
                        }}
                        className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-[10px] font-mono font-medium text-slate-700 cursor-pointer"
                      >
                        {sample.idBarang} ({sample.namaBarang})
                      </button>
                    ))}
                  </div>
                </div>

                {scannedError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                    <span>{scannedError}</span>
                  </div>
                )}

                {scannedAsset && (
                  <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
                          Hasil Lookup Aset
                        </span>
                        <h4 className="font-extrabold text-slate-800 text-sm mt-1">{scannedAsset.namaBarang}</h4>
                        <span className="font-mono text-xs text-emerald-800 font-bold">{scannedAsset.idBarang}</span>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          scannedAsset.kondisi === 'Baik' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : scannedAsset.kondisi === 'Rusak Ringan' 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {scannedAsset.kondisi}
                        </span>
                        <span className="block text-[10px] text-slate-500 mt-0.5">{scannedAsset.status}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Lokasi Ruangan:</span>
                        <span className="font-semibold text-slate-800">{scannedRoom?.namaRuang || scannedAsset.idRuang}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Kategori / Jenis:</span>
                        <span className="font-semibold text-slate-800">{scannedCat?.namaKategori || '-'} / {scannedType?.namaJenis || '-'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Merk / Tipe:</span>
                        <span className="font-semibold text-slate-800">{scannedBrand?.namaMerk || scannedAsset.idMerk || '-'} / {scannedAsset.spesifikasi || '-'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">No Seri (SN):</span>
                        <span className="font-mono text-slate-800">{scannedAsset.nomorSeri || '-'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Tahun Perolehan:</span>
                        <span className="font-semibold text-slate-800">{scannedAsset.tahunPerolehan || '-'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Nilai / Harga:</span>
                        <span className="font-semibold text-emerald-700">{formatRupiah(scannedAsset.hargaPerolehan)}</span>
                      </div>
                    </div>

                    {/* Quick Action Navigation */}
                    <div className="pt-2 border-t border-emerald-100 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsQrScannerOpen(false);
                          setDetailModalAsset(scannedAsset);
                          setIsDetailModalOpen(true);
                        }}
                        className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Buka Detail & Riwayat</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(cleanQrText);
                          setCopiedQrText(true);
                          setTimeout(() => setCopiedQrText(false), 2000);
                        }}
                        className="py-1.5 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer"
                        title="Salin Data QR Lengkap"
                      >
                        {copiedQrText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedQrText ? 'Tersalin' : 'Salin Data'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsQrScannerOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* GAS SYNC POPUP MODAL */}
      {isGasModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <span>Sinkronisasi Google Apps Script (Google Sheets)</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsGasModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-slate-600">
                Hubungkan SIMBARS ke Google Sheets untuk pencadangan database *cloud* otomatis secara *real-time* atau berkala.
              </p>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Web App URL Google Apps Script:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={gasUrlInput}
                    onChange={e => setGasUrlInput(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSaveGasUrl}
                    disabled={isSyncing}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold cursor-pointer transition-colors shadow-xs"
                  >
                    {isSyncing ? 'Menyimpan...' : 'Simpan & Tes'}
                  </button>
                </div>
              </div>

              {/* Status and feedback alert */}
              {syncFeedback && (
                <div
                  className={`p-3 rounded-xl flex items-start gap-2 ${
                    syncFeedback.status === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {syncFeedback.status === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                  )}
                  <span className="text-xs">{syncFeedback.message}</span>
                </div>
              )}

              {/* Real-time sync & auto interval controls */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-700 block">Auto-Sync Otomatis</span>
                    <span className="text-[11px] text-slate-500">Sinkronisasi otomatis di latar belakang</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={gasConfig.autoSyncEnabled}
                    onChange={e => handleToggleAutoSync(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                  <div>
                    <span className="font-bold text-slate-700 block">Sync Setiap Perubahan Data (Real-time)</span>
                    <span className="text-[11px] text-slate-500">Otomatis push saat ada input/edit data baru</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={gasConfig.autoSyncOnChange ?? true}
                    onChange={e => handleToggleAutoSyncOnChange(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                  <span className="text-slate-600">Interval Sinkronisasi Berkala:</span>
                  <select
                    value={gasConfig.autoSyncIntervalMinutes || 5}
                    onChange={e => handleChangeSyncInterval(Number(e.target.value))}
                    className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-xs font-semibold"
                  >
                    <option value={1}>Setiap 1 Menit</option>
                    <option value={3}>Setiap 3 Menit</option>
                    <option value={5}>Setiap 5 Menit</option>
                    <option value={15}>Setiap 15 Menit</option>
                    <option value={30}>Setiap 30 Menit</option>
                    <option value={60}>Setiap 1 Jam</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleSyncAllToGas}
                  disabled={isSyncing || !gasConfig.webAppUrl}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <ArrowUpFromLine className="w-4 h-4" />
                  <span>{isSyncing ? 'Mengunggah...' : 'Upload Semua ke Sheets'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePullFromGas}
                  disabled={isSyncing || !gasConfig.webAppUrl}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  <span>{isSyncing ? 'Mengunduh...' : 'Tarik Data dari Sheets'}</span>
                </button>
              </div>

              {/* AUTOMATIC SCHEMA UPDATE BANNER */}
              <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                    v3.2
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">Pembaruan Skema Otomatis (19 Tabel)</span>
                    <span className="text-[11px] text-slate-500">Sesuaikan sheet & kolom baru di Spreadsheet tanpa hapus data lama</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={handleAutoMigrateSchema}
                    disabled={isSyncing || !gasConfig.webAppUrl}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-2xs"
                    title="Perbarui skema spreadsheet secara otomatis dari SIMBARS"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Update Skema</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadCodeGs}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center gap-1 cursor-pointer shadow-2xs"
                    title="Unduh file Code.gs versi 3.2.0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh .gs</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGasGuideErrorMessage(undefined);
                      setIsGasGuideModalOpen(true);
                    }}
                    className="px-2 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-xs flex items-center gap-1 cursor-pointer"
                    title="Petunjuk langkah demi langkah update script Code.gs di Google Spreadsheet"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Panduan</span>
                  </button>
                </div>
              </div>

              {/* TROUBLESHOOT / LOCAL BACKUP FALLBACK BANNER */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-700 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">Cadangan Lokal (Offline Backup JSON)</span>
                    <span className="text-[11px] text-slate-500">Amankan data saat Google Sheets offline atau gagal sync</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsGasModalOpen(false);
                    setBackupRestoreTab('troubleshoot');
                    setIsBackupRestoreOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs"
                >
                  <FolderArchive className="w-3.5 h-3.5" />
                  <span>Buka Backup</span>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-slate-500 text-xs">Versi Script: <strong>Code.gs v3.2.0 (Terbaru)</strong></span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadCodeGs}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Unduh Code.gs</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyGasCode}
                    className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Tersalin!' : 'Salin Code.gs'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsGasModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        appSettings={appSettings}
        onInspectAsset={(asset) => {
          setDetailModalAsset(asset);
          setIsDetailModalOpen(true);
        }}
        onNavigateToTab={(tab, context) => {
          setSearchNavContext(context || null);
          handleSelectTab(tab as ActiveTab);
        }}
      />

      {/* ASSET DETAIL & AUDIT TRAIL MODAL (GLOBAL) */}
      <AssetDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setDetailModalAsset(null);
        }}
        asset={detailModalAsset}
        onAssetUpdated={() => {
          if (detailModalAsset) {
            const latest = dataStorage.getAssetById(detailModalAsset.idBarang);
            if (latest) setDetailModalAsset(latest);
          }
          if (scannedAsset) {
            const latestScanned = dataStorage.getAssetById(scannedAsset.idBarang);
            if (latestScanned) setScannedAsset(latestScanned);
          }
        }}
        actionAccess={actionAccess}
      />

      {/* GLOBAL BACKUP & RESTORE MODAL */}
      <BackupRestoreModal
        isOpen={isBackupRestoreOpen}
        onClose={() => setIsBackupRestoreOpen(false)}
        initialTab={backupRestoreTab}
        onDataRestored={() => {
          setGasConfig(dataStorage.getGasConfig());
          setAppSettings(dataStorage.getAppSettings());
        }}
      />

      {/* GAS UPDATE GUIDE MODAL */}
      <GasUpdateGuideModal
        isOpen={isGasGuideModalOpen}
        onClose={() => setIsGasGuideModalOpen(false)}
        apiKeySecret={gasConfig.apiKeySecret}
        errorMessage={gasGuideErrorMessage}
        webAppUrl={gasConfig.webAppUrl}
      />

    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="*" element={<SimbarsApp />} />
      </Routes>
    </HashRouter>
  );
}
