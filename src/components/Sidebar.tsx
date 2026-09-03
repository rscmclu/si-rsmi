import React from 'react';
import { UserAccount, AppSettings } from '../types/inventory';
import { AppLogo } from './AppLogo';
import {
  LayoutDashboard,
  Boxes,
  Tag,
  Bookmark,
  Building,
  Truck,
  FolderKanban,
  DoorOpen,
  Building2,
  ArrowLeftRight,
  Activity,
  AlertTriangle,
  Wrench,
  CalendarCheck,
  ShoppingBag,
  FilePlus,
  ShoppingCart,
  PackageCheck,
  Trash2,
  FileX,
  Flame,
  FileSpreadsheet,
  Settings,
  Users,
  ShieldCheck,
  Code,
  BookOpen,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  // Master
  | 'master_jenis'
  | 'master_kategori'
  | 'master_merk'
  | 'master_ruang'
  | 'master_supplier'
  // Data Inventaris
  | 'data_ruangan'
  | 'data_semua_rs'
  | 'sirkulasi'
  // Kegiatan
  | 'permintaan_perbaikan'
  | 'perbaikan'
  | 'pemeliharaan'
  | 'laporan_mutu'
  // Pengadaan
  | 'pengajuan'
  | 'pengadaan'
  | 'penerimaan'
  // Pemusnahan
  | 'permintaan_pemusnahan'
  | 'pelaksanaan_pemusnahan'
  | 'laporan_pemusnahan'
  // Setting
  | 'setting_user'
  | 'setting_hak_akses'
  | 'setting_aplikasi'
  // GAS & Guide
  | 'gas_sync'
  | 'petunjuk';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  currentUser: UserAccount;
  appSettings?: AppSettings;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  currentUser,
  appSettings,
  isOpen,
  onClose,
}) => {
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({
    master: true,
    data: true,
    kegiatan: true,
    pengadaan: true,
    pemusnahan: true,
    setting: true,
  });

  const toggleGroup = (key: string) => {
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleItemClick = (tab: ActiveTab) => {
    onSelectTab(tab);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const canAccess = (key: keyof typeof currentUser.menuAccess) => {
    return currentUser.menuAccess[key] !== false;
  };

  const isAdmin = currentUser.role === 'Super Admin' || 
    currentUser.role?.toLowerCase().includes('admin') || 
    currentUser.username?.toLowerCase() === 'admin';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <AppLogo settings={appSettings} size="md" />
            <div className="min-w-0 flex-1">
              <span className="font-bold text-white tracking-tight text-sm block truncate">
                {appSettings?.appName || 'MEDIKA INSANI'}
              </span>
              <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase truncate">
                {appSettings?.systemShortName ? `${appSettings.systemShortName} Aset` : 'Inventory & Asset System'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-3 text-xs font-medium custom-scrollbar">
          
          {/* Dashboard */}
          {canAccess('dashboard') && (
            <div>
              <button
                type="button"
                onClick={() => handleItemClick('dashboard')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/30'
                    : 'hover:bg-slate-800 hover:text-white text-slate-300'
                }`}
              >
                <LayoutDashboard className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-white' : 'text-blue-400'}`} />
                <span>Dashboard Inventaris</span>
              </button>
            </div>
          )}

          {/* 1. MASTER INVENTARIS */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => toggleGroup('master')}
              className="w-full flex items-center justify-between px-2 pt-2 pb-1 text-[10px] font-semibold text-slate-500 hover:text-slate-300 uppercase tracking-widest cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Boxes className="w-3.5 h-3.5 text-slate-400" />
                1. Master Inventaris
              </span>
              {openGroups.master ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
            </button>

            {openGroups.master && (
              <div className="pl-1.5 space-y-0.5 border-l border-slate-800 ml-2">
                {canAccess('masterJenis') && (
                  <button
                    type="button"
                    onClick={() => handleItemClick('master_jenis')}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer text-xs ${
                      activeTab === 'master_jenis'
                        ? 'bg-slate-800 text-blue-400 font-medium'
                        : 'hover:bg-slate-800/70 hover:text-slate-200 text-slate-400'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'master_jenis' ? 'bg-blue-400' : 'bg-slate-600'}`}></div>
                    <span>a. Jenis Inventaris</span>
                  </button>
                )}

                {canAccess('masterKategori') && (
                  <button
                    type="button"
                    onClick={() => handleItemClick('master_kategori')}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer text-xs ${
                      activeTab === 'master_kategori'
                        ? 'bg-slate-800 text-blue-400 font-medium'
                        : 'hover:bg-slate-800/70 hover:text-slate-200 text-slate-400'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'master_kategori' ? 'bg-blue-400' : 'bg-slate-600'}`}></div>
                    <span>b. Kategori Inventaris</span>
                  </button>
                )}

                {canAccess('masterMerk') && (
                  <button
                    type="button"
                    onClick={() => handleItemClick('master_merk')}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer text-xs ${
                      activeTab === 'master_merk'
                        ? 'bg-slate-800 text-blue-400 font-medium'
                        : 'hover:bg-slate-800/70 hover:text-slate-200 text-slate-400'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'master_merk' ? 'bg-blue-400' : 'bg-slate-600'}`}></div>
                    <span>c. Merk Inventaris</span>
                  </button>
                )}

                {canAccess('masterRuang') && (
                  <button
                    type="button"
                    onClick={() => handleItemClick('master_ruang')}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer text-xs ${
                      activeTab === 'master_ruang'
                        ? 'bg-slate-800 text-blue-400 font-medium'
                        : 'hover:bg-slate-800/70 hover:text-slate-200 text-slate-400'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'master_ruang' ? 'bg-blue-400' : 'bg-slate-600'}`}></div>
                    <span>d. Ruang Inventaris</span>
                  </button>
                )}

                {canAccess('masterSupplier') && (
                  <button
                    type="button"
                    onClick={() => handleItemClick('master_supplier')}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer text-xs ${
                      activeTab === 'master_supplier'
                        ? 'bg-slate-800 text-blue-400 font-medium'
                        : 'hover:bg-slate-800/70 hover:text-slate-200 text-slate-400'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'master_supplier' ? 'bg-blue-400' : 'bg-slate-600'}`}></div>
                    <span>e. Supplier Inventaris</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 2. DATA INVENTARIS */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => toggleGroup('data')}
              className="w-full flex items-center justify-between px-2 pt-2 pb-1 text-[10px] font-semibold text-slate-500 hover:text-slate-300 uppercase tracking-widest cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <FolderKanban className="w-3.5 h-3.5 text-slate-400" />
                2. Data Inventaris
              </span>
              {openGroups.data ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
            </button>

            {openGroups.data && (
              <div className="pl-1.5 space-y-0.5 border-l border-slate-800 ml-2">
                {canAccess('dataRuangan') && (
                  <button
                    type="button"
                    onClick={() => handleItemClick('data_ruangan')}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer text-xs ${
                      activeTab === 'data_ruangan'
                        ? 'bg-slate-800 text-blue-400 font-medium'
                        : 'hover:bg-slate-800/70 hover:text-slate-200 text-slate-400'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'data_ruangan' ? 'bg-blue-400' : 'bg-slate-600'}`}></div>
                    <span>a. Inventaris Ruangan (QR)</span>
                  </button>
                )}

                {canAccess('dataSemuaRS') && (
                  <button
                    type="button"
                    onClick={() => handleItemClick('data_semua_rs')}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer text-xs ${
                      activeTab === 'data_semua_rs'
                        ? 'bg-slate-800 text-blue-400 font-medium'
                        : 'hover:bg-slate-800/70 hover:text-slate-200 text-slate-400'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'data_semua_rs' ? 'bg-blue-400' : 'bg-slate-600'}`}></div>
                    <span>b. Rekap Inventaris Seluruh RS</span>
                  </button>
                )}

                {canAccess('sirkulasi') && (
                  <button
                    type="button"
                    onClick={() => handleItemClick('sirkulasi')}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer text-xs ${
                      activeTab === 'sirkulasi'
                        ? 'bg-slate-800 text-blue-400 font-medium'
                        : 'hover:bg-slate-800/70 hover:text-slate-200 text-slate-400'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'sirkulasi' ? 'bg-blue-400' : 'bg-slate-600'}`}></div>
                    <span>c. Sirkulasi / Mutasi Barang</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 3. KEGIATAN INVENTARIS */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => toggleGroup('kegiatan')}
              className="w-full flex items-center justify-between px-2 pt-2 pb-1 text-[10px] font-semibold text-slate-500 hover:text-slate-300 uppercase tracking-widest cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-slate-400" />
                3. Kegiatan Inventaris
              </span>
              {openGroups.kegiatan ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
            </button>

            {openGroups.kegiatan && (
              <div className="pl-1.5 space-y-0.5 border-l border-slate-800 ml-2">
                {canAccess('permintaanPerbaikan') && (
                  <button
                    type="button"
                    onClick={() => handleItemClick('permintaan_perbaikan')}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer text-xs ${
                      activeTab === 'permintaan_perbaikan'
                        ? 'bg-slate-800 text-blue-400 font-medium'
                        : 'hover:bg-slate-800/70 hover:text-slate-200 text-slate-400'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'permintaan_perbaikan' ? 'bg-blue-400' : 'bg-slate-600'}`}></div>
                    <span>a. Permintaan Perbaikan</span>
                  </button>
                )}

                {canAccess('perbaikan') && (
                  <button
                    type="button"
                    onClick={() => handleItemClick('perbaikan')}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer text-xs ${
                      activeTab === 'perbaikan'
                        ? 'bg-slate-800 text-blue-400 font-medium'
                        : 'hover:bg-slate-800/70 hover:text-slate-200 text-slate-400'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'perbaikan' ? 'bg-blue-400' : 'bg-slate-600'}`}></div>
                    <span>b. Tindakan Perbaikan Barang</span>
                  </button>
                )}

                {canAccess('pemeliharaan') && (
                  <button
                    type="button"
                    onClick={() => handleItemClick('pemeliharaan')}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer text-xs ${
                      activeTab === 'pemeliharaan'
                        ? 'bg-slate-800 text-blue-400 font-medium'
                        : 'hover:bg-slate-800/70 hover:text-slate-200 text-slate-400'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'pemeliharaan' ? 'bg-blue-400' : 'bg-slate-600'}`}></div>
                    <span>c. Jadwal & Pemeliharaan</span>
                  </button>
                )}

                {canAccess('laporanMutu') && (
                  <button
                    type="button"
                    onClick={() => handleItemClick('laporan_mutu')}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer text-xs ${
                      activeTab === 'laporan_mutu'
                        ? 'bg-slate-800 text-blue-400 font-medium'
                        : 'hover:bg-slate-800/70 hover:text-slate-200 text-slate-400'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'laporan_mutu' ? 'bg-blue-400' : 'bg-slate-600'}`}></div>
                    <span>d. Laporan Mutu IPSRS</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 4. PENGADAAN INVENTARIS */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => toggleGroup('pengadaan')}
              className="w-full flex items-center justify-between px-2 pt-2 pb-1 text-[10px] font-semibold text-slate-500 hover:text-slate-300 uppercase tracking-widest cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                4. Pengadaan Inventaris
              </span>
              {openGroups.pengadaan ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
            </button>

            {openGroups.pengadaan && (
              <div className="pl-1.5 space-y-0.5 border-l border-slate-800 ml-2">
                {canAccess('pengajuan') && (
                  <button
                    type="button"
                    onClick={() => handleItemClick('pengajuan')}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer text-xs ${
                      activeTab === 'pengajuan'
                        ? 'bg-slate-800 text-blue-400 font-medium'
                        : 'hover:bg-slate-800/70 hover:text-slate-200 text-slate-400'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'pengajuan' ? 'bg-blue-400' : 'bg-slate-600'}`}></div>
                    <span>a. Pengajuan Barang RS</span>
                  </button>
                )}

                {canAccess('pengadaan') && (
                  <button
                    type="button"
                    onClick={() => handleItemClick('pengadaan')}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer text-xs ${
                      activeTab === 'pengadaan'
                        ? 'bg-slate-800 text-blue-400 font-medium'
                        : 'hover:bg-slate-800/70 hover:text-slate-200 text-slate-400'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'pengadaan' ? 'bg-blue-400' : 'bg-slate-600'}`}></div>
                    <span>b. Pengadaan Barang (PO)</span>
                  </button>
                )}

                {canAccess('penerimaan') && (
                  <button
                    type="button"
                    onClick={() => handleItemClick('penerimaan')}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer text-xs ${
                      activeTab === 'penerimaan'
                        ? 'bg-slate-800 text-blue-400 font-medium'
                        : 'hover:bg-slate-800/70 hover:text-slate-200 text-slate-400'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'penerimaan' ? 'bg-blue-400' : 'bg-slate-600'}`}></div>
                    <span>c. Penerimaan Barang (BAST)</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 5. PEMUSNAHAN */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => toggleGroup('pemusnahan')}
              className="w-full flex items-center justify-between px-2 pt-2 pb-1 text-[10px] font-semibold text-slate-500 hover:text-slate-300 uppercase tracking-widest cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                5. Pemusnahan Aset
              </span>
              {openGroups.pemusnahan ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
            </button>

            {openGroups.pemusnahan && (
              <div className="pl-1.5 space-y-0.5 border-l border-slate-800 ml-2">
                {canAccess('permintaanPemusnahan') && (
                  <button
                    type="button"
                    onClick={() => handleItemClick('permintaan_pemusnahan')}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer text-xs ${
                      activeTab === 'permintaan_pemusnahan'
                        ? 'bg-slate-800 text-blue-400 font-medium'
                        : 'hover:bg-slate-800/70 hover:text-slate-200 text-slate-400'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'permintaan_pemusnahan' ? 'bg-blue-400' : 'bg-slate-600'}`}></div>
                    <span>a. Usulan Pemusnahan</span>
                  </button>
                )}

                {canAccess('pelaksanaanPemusnahan') && (
                  <button
                    type="button"
                    onClick={() => handleItemClick('pelaksanaan_pemusnahan')}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer text-xs ${
                      activeTab === 'pelaksanaan_pemusnahan'
                        ? 'bg-slate-800 text-blue-400 font-medium'
                        : 'hover:bg-slate-800/70 hover:text-slate-200 text-slate-400'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'pelaksanaan_pemusnahan' ? 'bg-blue-400' : 'bg-slate-600'}`}></div>
                    <span>b. Pelaksanaan & Metode</span>
                  </button>
                )}

                {canAccess('laporanPemusnahan') && (
                  <button
                    type="button"
                    onClick={() => handleItemClick('laporan_pemusnahan')}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer text-xs ${
                      activeTab === 'laporan_pemusnahan'
                        ? 'bg-slate-800 text-blue-400 font-medium'
                        : 'hover:bg-slate-800/70 hover:text-slate-200 text-slate-400'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'laporan_pemusnahan' ? 'bg-blue-400' : 'bg-slate-600'}`}></div>
                    <span>c. Berita Acara (BAP)</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 6. SETTING */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => toggleGroup('setting')}
              className="w-full flex items-center justify-between px-2 pt-2 pb-1 text-[10px] font-semibold text-slate-500 hover:text-slate-300 uppercase tracking-widest cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                6. Setting & Akses
              </span>
              {openGroups.setting ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
            </button>

            {openGroups.setting && (
              <div className="pl-1.5 space-y-0.5 border-l border-slate-800 ml-2">
                {canAccess('settingUser') && (
                  <button
                    type="button"
                    onClick={() => handleItemClick('setting_user')}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer text-xs ${
                      activeTab === 'setting_user'
                        ? 'bg-slate-800 text-blue-400 font-medium'
                        : 'hover:bg-slate-800/70 hover:text-slate-200 text-slate-400'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'setting_user' ? 'bg-blue-400' : 'bg-slate-600'}`}></div>
                    <span>a. Setting User & Password</span>
                  </button>
                )}

                {canAccess('settingHakAkses') && (
                  <button
                    type="button"
                    onClick={() => handleItemClick('setting_hak_akses')}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer text-xs ${
                      activeTab === 'setting_hak_akses'
                        ? 'bg-slate-800 text-blue-400 font-medium'
                        : 'hover:bg-slate-800/70 hover:text-slate-200 text-slate-400'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'setting_hak_akses' ? 'bg-blue-400' : 'bg-slate-600'}`}></div>
                    <span>b. Custom Menu Hak Akses</span>
                  </button>
                )}

                {canAccess('settingAplikasi') && (
                  <button
                    type="button"
                    onClick={() => handleItemClick('setting_aplikasi')}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer text-xs ${
                      activeTab === 'setting_aplikasi'
                        ? 'bg-slate-800 text-blue-400 font-medium'
                        : 'hover:bg-slate-800/70 hover:text-slate-200 text-slate-400'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'setting_aplikasi' ? 'bg-blue-400' : 'bg-slate-600'}`}></div>
                    <span>c. Setting Aplikasi</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* SPREADSHEET & PETUNJUK (ADMIN ONLY) */}
          {isAdmin && (
            <div className="pt-2 border-t border-slate-800 space-y-1">
              <button
                type="button"
                onClick={() => handleItemClick('gas_sync')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer text-xs ${
                  activeTab === 'gas_sync'
                    ? 'bg-blue-600 text-white font-medium'
                    : 'hover:bg-slate-800 text-blue-400 font-medium'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>Konektor Apps Script (Code.gs)</span>
              </button>

              <button
                type="button"
                onClick={() => handleItemClick('petunjuk')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer text-xs ${
                  activeTab === 'petunjuk'
                    ? 'bg-slate-800 text-blue-400 font-medium'
                    : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                <span>Petunjuk Penggunaan</span>
              </button>
            </div>
          )}

        </nav>

        {/* Sidebar User Profile Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-900 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-7 h-7 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
              {currentUser.namaLengkap ? currentUser.namaLengkap.charAt(0) : 'U'}
            </div>
            <div className="truncate">
              <div className="font-medium text-slate-200 truncate">{currentUser.namaLengkap}</div>
              <div className="text-[10px] text-slate-500 capitalize">{currentUser.role}</div>
            </div>
          </div>
          <span className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800/60 text-[9px] font-semibold uppercase tracking-wider shrink-0">
            Online
          </span>
        </div>
      </aside>
    </>
  );
};
