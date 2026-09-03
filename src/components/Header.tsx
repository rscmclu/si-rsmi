import React from 'react';
import { UserAccount, GasSyncConfig, AppSettings } from '../types/inventory';
import { AppLogo } from './AppLogo';
import { 
  QrCode, 
  RefreshCw, 
  CloudCheck, 
  FileSpreadsheet, 
  HelpCircle, 
  LogOut, 
  User as UserIcon, 
  Menu, 
  Bell, 
  Search,
  Sparkles
} from 'lucide-react';

interface HeaderProps {
  currentUser: UserAccount;
  appSettings?: AppSettings;
  onLogout: () => void;
  onOpenQrScanner: () => void;
  onOpenGlobalSearch: () => void;
  onOpenGasSync: () => void;
  onOpenGuide: () => void;
  gasConfig: GasSyncConfig;
  onToggleSidebar: () => void;
  unreadNotificationsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  appSettings,
  onLogout,
  onOpenQrScanner,
  onOpenGlobalSearch,
  onOpenGasSync,
  onOpenGuide,
  gasConfig,
  onToggleSidebar,
  unreadNotificationsCount = 2,
}) => {
  const isAdmin = currentUser?.role === 'Super Admin' || 
    currentUser?.role?.toLowerCase().includes('admin') || 
    currentUser?.username?.toLowerCase() === 'admin';
  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-4 shadow-xs">
      {/* Left side: Hamburger & Title */}
      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer"
          title="Toggle Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2.5 sm:space-x-3">
          <AppLogo settings={appSettings} size="md" />
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-bold text-slate-900 tracking-tight text-sm sm:text-base">
                {appSettings?.appName || 'RS Medika Insani'}
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                {appSettings?.systemShortName || 'SIMBARS'} {appSettings?.appVersion || 'v2.5'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden xl:block">
              {appSettings?.appSubtitle || 'Sistem Informasi Manajemen Inventaris & Aset Rumah Sakit'}
            </p>
          </div>
        </div>
      </div>

      {/* Center: Global Search Bar Trigger (Desktop / Tablet) */}
      <div className="flex-1 max-w-md mx-2 hidden md:block">
        <button
          type="button"
          onClick={onOpenGlobalSearch}
          className="w-full flex items-center justify-between px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200/90 rounded-xl text-slate-500 hover:text-slate-800 text-xs transition-all cursor-pointer shadow-2xs group text-left"
          title="Cari Aset Global (Ctrl+K)"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" />
            <span className="truncate">Cari aset (Nama, ID, Kategori, Ruang)...</span>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <kbd className="font-mono text-[10px] font-semibold bg-white border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded shadow-2xs">
              Ctrl+K
            </kbd>
          </div>
        </button>
      </div>

      {/* Right side: Actions & User Info */}
      <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
        {/* Mobile Search Button */}
        <button
          type="button"
          onClick={onOpenGlobalSearch}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 md:hidden cursor-pointer"
          title="Pencarian Global Aset"
        >
          <Search className="w-5 h-5 text-blue-600" />
        </button>

        {/* Quick QR Scanner Button */}
        <button
          type="button"
          onClick={onOpenQrScanner}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-xs font-medium transition-all cursor-pointer shadow-xs"
          title="Pindai QR Code Barang"
        >
          <QrCode className="w-4 h-4 text-blue-600" />
          <span className="hidden lg:inline">Scan QR Aset</span>
        </button>

        {/* Google Sheets Sync Indicator & Button */}
        {isAdmin && (
          <button
            type="button"
            onClick={onOpenGasSync}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-all cursor-pointer shadow-xs ${
              gasConfig.webAppUrl
                ? gasConfig.autoSyncEnabled
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100/80'
                  : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100/80'
                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/70'
            }`}
            title={
              gasConfig.webAppUrl
                ? gasConfig.autoSyncEnabled
                  ? `Auto-Sync Aktif (Tiap ${gasConfig.autoSyncIntervalMinutes || 5} mnt & saat ada perubahan)`
                  : 'Spreadsheet Terhubung (Manual Sync)'
                : 'Setup Spreadsheet Google Apps Script'
            }
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden lg:inline">
              {gasConfig.webAppUrl
                ? gasConfig.autoSyncEnabled
                  ? 'Auto-Sync Aktif'
                  : 'Spreadsheet Terhubung'
                : 'Setup Spreadsheet'}
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                gasConfig.webAppUrl
                  ? gasConfig.autoSyncEnabled
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-blue-500'
                  : 'bg-amber-500'
              }`}
            ></span>
          </button>
        )}

        {/* Help Guide Button (Admin Only) */}
        {isAdmin && (
          <button
            type="button"
            onClick={onOpenGuide}
            className="p-2 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Petunjuk Penggunaan & Kode Apps Script"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        )}

        {/* Vertical Divider */}
        <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block"></div>

        {/* Current User Card */}
        <div className="flex items-center space-x-2.5 pl-1">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            {currentUser.namaLengkap ? currentUser.namaLengkap.charAt(0) : 'U'}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-slate-800 truncate max-w-[130px]">
              {currentUser.namaLengkap}
            </div>
            <div className="text-[10px] font-medium text-slate-500 capitalize truncate max-w-[130px]">
              {currentUser.role}
            </div>
          </div>

          {/* Logout Button */}
          <button
            type="button"
            onClick={onLogout}
            className="p-2 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1 cursor-pointer"
            title="Keluar / Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
