import React, { useState, useEffect, useMemo } from 'react';
import { 
  UserAccount, 
  RoleType, 
  ActionPermission, 
  MenuAccessPermission, 
  RolePermissionsMatrix,
  AppSettings
} from '../types/inventory';
import { dataStorage } from '../services/dataStorage';
import { gasSyncService } from '../services/gasSyncService';
import { SettingAplikasiSection } from './SettingAplikasiSection';
import { BackupRestoreModal } from './BackupRestoreModal';
import { GasUpdateGuideModal } from './GasUpdateGuideModal';
import { 
  Settings, 
  Users, 
  ShieldCheck, 
  Database, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Download, 
  Upload, 
  Check, 
  X,
  Link, 
  Code2,
  Search,
  CheckCheck,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  SlidersHorizontal,
  FileSpreadsheet,
  Info,
  Building2,
  Palette,
  Zap,
  Clock,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  FolderArchive,
  FileCode,
  Globe,
  ExternalLink,
  FolderGit2
} from 'lucide-react';
import { GitHubSyncModal } from './GitHubSyncModal';
import { githubSyncService } from '../services/githubSyncService';

interface SettingsViewProps {
  currentUser: UserAccount;
  actionAccess: ActionPermission;
  initialTab?: 'user' | 'hakAkses' | 'aplikasi' | 'database';
  appSettings?: AppSettings;
  onAppSettingsChange?: (newSettings: AppSettings) => void;
  onUserRoleChange?: (newUser: UserAccount) => void;
  onPermissionsUpdated?: () => void;
}

interface MenuItemDef {
  key: keyof MenuAccessPermission;
  name: string;
  code: string;
  group: string;
  desc: string;
}

interface ActionItemDef {
  key: keyof ActionPermission;
  name: string;
  code: string;
  group: string;
  desc: string;
}

const MENU_ITEMS: MenuItemDef[] = [
  { key: 'dashboard', name: 'Dashboard Inventaris RS', code: 'DASH-01', group: '0. Dashboard', desc: 'Ringkasan eksekutif, statistik aset, chart kondisi, dan lookup cepat' },
  { key: 'masterJenis', name: 'a. Master Jenis Inventaris', code: 'MST-J', group: '1. Master Inventaris', desc: 'Kelola data jenis barang medis & non-medis (J01, J02, dll)' },
  { key: 'masterKategori', name: 'b. Master Kategori Inventaris', code: 'MST-K', group: '1. Master Inventaris', desc: 'Kelola kategori barang medis habis pakai, aset tetap, dll (K01, K02)' },
  { key: 'masterMerk', name: 'c. Master Merk Inventaris', code: 'MST-M', group: '1. Master Inventaris', desc: 'Daftar merk/brand pabrikan alat dan perlengkapan RS' },
  { key: 'masterRuang', name: 'd. Master Ruang Inventaris', code: 'MST-R', group: '1. Master Inventaris', desc: 'Daftar gedung, lantai, dan ruangan penempatan inventaris (R01, R02)' },
  { key: 'masterSupplier', name: 'e. Master Supplier Inventaris', code: 'MST-S', group: '1. Master Inventaris', desc: 'Daftar vendor, distributor, dan rekanan pengadaan barang' },
  { key: 'dataRuangan', name: 'a. Data Inventaris Ruangan (DIR)', code: 'DIR-01', group: '2. Data Inventaris', desc: 'Daftar inventaris per ruangan, mutasi, cetak KIRC, & QR Code' },
  { key: 'dataSemuaRS', name: 'b. Semua Inventaris RS (Agregat)', code: 'DIR-ALL', group: '2. Data Inventaris', desc: 'Daftar agregat seluruh aset Rumah Sakit Medika Insani' },
  { key: 'sirkulasi', name: 'c. Sirkulasi / Mutasi Aset', code: 'MUT-01', group: '2. Data Inventaris', desc: 'Pencatatan pemindahan, peminjaman, & pengembalian inventaris' },
  { key: 'permintaanPerbaikan', name: 'a. Permintaan Perbaikan Ruangan', code: 'IPSRS-REQ', group: '3. Kegiatan Inventaris', desc: 'Form keluhan & permintaan perbaikan alat dari ruangan/unit' },
  { key: 'perbaikan', name: 'b. Pemeliharaan & Perbaikan (IPSRS)', code: 'IPSRS-ACT', group: '3. Kegiatan Inventaris', desc: 'Tindak lanjut teknisi, log pengerjaan perbaikan, & suku cadang' },
  { key: 'pemeliharaan', name: 'c. Jadwal Pemeliharaan Berkala (PM)', code: 'IPSRS-PM', group: '3. Kegiatan Inventaris', desc: 'Preventive maintenance rutin, kalibrasi, & checklist alat' },
  { key: 'laporanMutu', name: 'd. Laporan Mutu IPSRS', code: 'IPSRS-MUTU', group: '3. Kegiatan Inventaris', desc: 'Indikator mutu pelayanan IPSRS, respon time, kepatuhan PM, & kelaikan alat medis' },
  { key: 'pengajuan', name: 'a. Pengajuan Pengadaan Barang', code: 'PO-REQ', group: '4. Pengadaan Inventaris', desc: 'Pengajuan usulan pembelian inventaris baru oleh ruangan/unit' },
  { key: 'pengadaan', name: 'b. Penerbitan PO Pengadaan Barang', code: 'PO-ORD', group: '4. Pengadaan Inventaris', desc: 'Purchase Order (PO), penetapan supplier, & anggaran pengadaan' },
  { key: 'penerimaan', name: 'c. Berita Acara Penerimaan (BAST)', code: 'PO-BAST', group: '4. Pengadaan Inventaris', desc: 'Penerimaan fisik barang, uji fungsi, verifikasi BAST, & registrasi' },
  { key: 'permintaanPemusnahan', name: 'a. Usulan Pemusnahan Aset Rusak', code: 'AFK-REQ', group: '5. Pemusnahan Aset', desc: 'Pengajuan afkir aset tidak layak pakai / kadaluarsa teknis' },
  { key: 'pelaksanaanPemusnahan', name: 'b. Eksekusi & Berita Acara Pemusnahan', code: 'AFK-ACT', group: '5. Pemusnahan Aset', desc: 'Pemusnahan fisik aset dengan saksi, metode, & dokumentasi BAP' },
  { key: 'laporanPemusnahan', name: 'c. Laporan Penghapusan Buku Aset', code: 'AFK-REP', group: '5. Pemusnahan Aset', desc: 'Rekapitulasi nilai aset terhapus untuk neraca keuangan RS' },
  { key: 'settingUser', name: 'a. Manajemen Pengguna (Users)', code: 'SET-USR', group: '6. Pengaturan Sistem', desc: 'Kelola akun staf, reset password, dan penetapan role pengguna' },
  { key: 'settingHakAkses', name: 'b. Matriks Hak Akses (RBAC)', code: 'SET-RBAC', group: '6. Pengaturan Sistem', desc: 'Konfigurasi granular izin menu dan operasi per kolom role' },
  { key: 'settingAplikasi', name: 'c. Setting Aplikasi & Branding', code: 'SET-APP', group: '6. Pengaturan Sistem', desc: 'Edit nama aplikasi, nama perusahaan/RS, kontak, dan logo aplikasi' },
  { key: 'gasSync', name: 'd. Cloud Sync & Google Sheets', code: 'SET-GAS', group: '6. Pengaturan Sistem', desc: 'Sinkronisasi cloud spreadsheet, backup data JSON, & restore database' },
  { key: 'petunjuk', name: '7. Petunjuk Penggunaan & SOP', code: 'DOC-SOP', group: '7. Bantuan', desc: 'Panduan operasional dan SOP inventaris RS Medika Insani' },
];

const ACTION_ITEMS: ActionItemDef[] = [
  { key: 'canCreate', name: 'Tambah / Input Data Baru (Create)', code: 'ACT-CREATE', group: 'Hak Aksi & Operasi', desc: 'Izin membuka formulir entri dan menambahkan data baru ke database' },
  { key: 'canEdit', name: 'Edit / Update Data Inventaris (Update)', code: 'ACT-UPDATE', group: 'Hak Aksi & Operasi', desc: 'Izin mengubah spesifikasi, status, ruangan, dan riwayat aset' },
  { key: 'canDelete', name: 'Hapus Data (Delete / Hapus Permanen)', code: 'ACT-DELETE', group: 'Hak Aksi & Operasi', desc: 'Izin menghapus data dari sistem (dilindungi konfirmasi)' },
  { key: 'canPrint', name: 'Cetak Dokumen & Cetak Label QR (Print)', code: 'ACT-PRINT', group: 'Hak Aksi & Operasi', desc: 'Izin mencetak label QR, lembar KIRC, formulir BAST, dan laporan fisik' },
  { key: 'canExport', name: 'Export Data Spreadsheet (CSV / JSON)', code: 'ACT-EXPORT', group: 'Hak Aksi & Operasi', desc: 'Izin mengunduh data tabel ke format CSV, Excel, atau JSON snapshot' },
];

const RSMI_ROLES: RoleType[] = [
  'Super Admin',
  'Kepala Instalasi Sarpras / IPSRS',
  'Petugas Ruangan / Perawat',
  'Teknisi Elektromedik / Umum',
  'Tim Pengadaan Logistik',
  'Komite Pemusnahan Aset',
];

const THREE_TIER_ROLES = [
  'Admin (Superuser)',
  'Inputer (Operator)',
  'Viewer (Pimpinan/Auditor)',
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  actionAccess,
  initialTab = 'user',
  appSettings,
  onAppSettingsChange,
  onUserRoleChange,
  onPermissionsUpdated,
}) => {
  const isAdmin = currentUser.role === 'Super Admin' || 
    currentUser.role?.toLowerCase().includes('admin') || 
    currentUser.username?.toLowerCase() === 'admin';

  const [activeTab, setActiveTab] = useState<'user' | 'hakAkses' | 'aplikasi' | 'database'>(() => {
    if (initialTab === 'database' && !isAdmin) return 'user';
    return initialTab;
  });

  useEffect(() => {
    if (initialTab) {
      if (initialTab === 'database' && !isAdmin) {
        setActiveTab('user');
      } else {
        setActiveTab(initialTab);
      }
    }
  }, [initialTab, isAdmin]);

  const [isBackupRestoreModalOpen, setIsBackupRestoreModalOpen] = useState(false);
  const [backupRestoreTab, setBackupRestoreTab] = useState<'backup' | 'restore' | 'troubleshoot'>('backup');

  useEffect(() => {
    const handleOpenSettingsTab = (e: any) => {
      if (e.detail && ['user', 'hakAkses', 'aplikasi', 'database'].includes(e.detail)) {
        setActiveTab(e.detail);
      }
    };
    window.addEventListener('simbars:open-settings-tab', handleOpenSettingsTab);
    return () => window.removeEventListener('simbars:open-settings-tab', handleOpenSettingsTab);
  }, []);

  const [users, setUsers] = useState<UserAccount[]>(() => dataStorage.getUsers());
  const [gasConfig, setGasConfig] = useState(() => dataStorage.getGasConfig());
  const [gasUrl, setGasUrl] = useState(() => dataStorage.getGasUrl());
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [isTestingGas, setIsTestingGas] = useState(false);
  const [isSyncingGas, setIsSyncingGas] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{
    currentBatch: number;
    totalBatches: number;
    percentage: number;
    message: string;
    currentTables?: string[];
  } | null>(null);
  const [isUpdateGuideModalOpen, setIsUpdateGuideModalOpen] = useState(false);
  const [guideErrorMessage, setGuideErrorMessage] = useState<string | undefined>(undefined);
  const [gasFileTab, setGasFileTab] = useState<'codegs' | 'indexhtml'>('codegs');
  const [gasIndexHtmlContent, setGasIndexHtmlContent] = useState<string>('');

  useEffect(() => {
    gasSyncService.fetchGasIndexHtml().then(content => setGasIndexHtmlContent(content));
  }, []);

  useEffect(() => {
    const handleSyncStatus = (e: any) => {
      if (e.detail) {
        setGasConfig(e.detail);
        setGasUrl(e.detail.webAppUrl || '');
      }
    };
    window.addEventListener('simbars:sync-status', handleSyncStatus);
    return () => window.removeEventListener('simbars:sync-status', handleSyncStatus);
  }, []);

  // GitHub Sync State & Listener
  const [githubConfig, setGitHubConfig] = useState(() => dataStorage.getGitHubConfig());
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [isManualPushingGh, setIsManualPushingGh] = useState(false);
  const [isManualPullingGh, setIsManualPullingGh] = useState(false);
  const [ghFeedbackMsg, setGhFeedbackMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleGhStatus = (e: any) => {
      if (e.detail) {
        setGitHubConfig(e.detail);
      }
    };
    window.addEventListener('simbars:github-sync-status', handleGhStatus);
    return () => window.removeEventListener('simbars:github-sync-status', handleGhStatus);
  }, []);

  // Matriks Hak Akses State
  const [roleMatrix, setRoleMatrix] = useState<RolePermissionsMatrix>(() => dataStorage.getRolePermissionsMatrix());
  const [matrixRoleView, setMatrixRoleView] = useState<'rsmi' | '3tier'>('rsmi');
  const [matrixSearch, setMatrixSearch] = useState('');
  const [matrixGroupFilter, setMatrixGroupFilter] = useState('ALL');
  const [hasUnsavedMatrix, setHasUnsavedMatrix] = useState(false);
  const [matrixSaveSuccessMsg, setMatrixSaveSuccessMsg] = useState<string | null>(null);

  // User modal states
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [formUsername, setFormUsername] = useState('');
  const [formNama, setFormNama] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formNip, setFormNip] = useState('');
  const [formRole, setFormRole] = useState<RoleType>('Petugas Ruangan / Perawat');
  const [formUnitKerja, setFormUnitKerja] = useState('');
  const [formKontak, setFormKontak] = useState('');
  const [formPassword, setFormPassword] = useState('');

  const currentRoleColumns = matrixRoleView === 'rsmi' ? RSMI_ROLES : THREE_TIER_ROLES;

  // Count active permissions per role column
  const getRolePermissionStats = (role: string) => {
    const config = roleMatrix[role];
    if (!config) return { menuCount: 0, totalMenu: MENU_ITEMS.length, actionCount: 0, totalAction: ACTION_ITEMS.length, percentage: 0 };
    
    let menuCount = 0;
    MENU_ITEMS.forEach(m => {
      if (config.menuAccess && config.menuAccess[m.key] === true) menuCount++;
    });

    let actionCount = 0;
    ACTION_ITEMS.forEach(a => {
      if (config.actionAccess && config.actionAccess[a.key] === true) actionCount++;
    });

    const total = MENU_ITEMS.length + ACTION_ITEMS.length;
    const active = menuCount + actionCount;
    const percentage = Math.round((active / total) * 100);

    return { menuCount, totalMenu: MENU_ITEMS.length, actionCount, totalAction: ACTION_ITEMS.length, percentage };
  };

  // --- MATRIKS COLUMN EDITING HANDLERS ---
  
  // Toggle individual Menu Permission
  const handleToggleMenuPermission = (role: string, menuKey: keyof MenuAccessPermission) => {
    setRoleMatrix(prev => {
      const currentConfig = prev[role] || {
        menuAccess: {} as MenuAccessPermission,
        actionAccess: { canCreate: true, canEdit: true, canDelete: false, canPrint: true, canExport: true }
      };
      const currentVal = currentConfig.menuAccess ? currentConfig.menuAccess[menuKey] : false;
      const updated = {
        ...prev,
        [role]: {
          ...currentConfig,
          menuAccess: {
            ...currentConfig.menuAccess,
            [menuKey]: !currentVal,
          }
        }
      };
      return updated;
    });
    setHasUnsavedMatrix(true);
    setMatrixSaveSuccessMsg(null);
  };

  // Toggle individual Action Permission
  const handleToggleActionPermission = (role: string, actionKey: keyof ActionPermission) => {
    setRoleMatrix(prev => {
      const currentConfig = prev[role] || {
        menuAccess: {} as MenuAccessPermission,
        actionAccess: { canCreate: true, canEdit: true, canDelete: false, canPrint: true, canExport: true }
      };
      const currentVal = currentConfig.actionAccess ? currentConfig.actionAccess[actionKey] : false;
      const updated = {
        ...prev,
        [role]: {
          ...currentConfig,
          actionAccess: {
            ...currentConfig.actionAccess,
            [actionKey]: !currentVal,
          }
        }
      };
      return updated;
    });
    setHasUnsavedMatrix(true);
    setMatrixSaveSuccessMsg(null);
  };

  // Column Bulk Action: Check All for a Role Column
  const handleCheckAllColumn = (role: string) => {
    setRoleMatrix(prev => {
      const allMenuTrue: Record<string, boolean> = {};
      MENU_ITEMS.forEach(m => { allMenuTrue[m.key] = true; });

      const allActionTrue: Record<string, boolean> = {};
      ACTION_ITEMS.forEach(a => { allActionTrue[a.key] = true; });

      return {
        ...prev,
        [role]: {
          menuAccess: allMenuTrue as unknown as MenuAccessPermission,
          actionAccess: allActionTrue as unknown as ActionPermission,
        }
      };
    });
    setHasUnsavedMatrix(true);
    setMatrixSaveSuccessMsg(null);
  };

  // Column Bulk Action: Uncheck All for a Role Column
  const handleUncheckAllColumn = (role: string) => {
    setRoleMatrix(prev => {
      const allMenuFalse: Record<string, boolean> = {};
      MENU_ITEMS.forEach(m => { allMenuFalse[m.key] = false; });

      const allActionFalse: Record<string, boolean> = {};
      ACTION_ITEMS.forEach(a => { allActionFalse[a.key] = false; });

      return {
        ...prev,
        [role]: {
          menuAccess: allMenuFalse as unknown as MenuAccessPermission,
          actionAccess: allActionFalse as unknown as ActionPermission,
        }
      };
    });
    setHasUnsavedMatrix(true);
    setMatrixSaveSuccessMsg(null);
  };

  // Column Bulk Action: Invert for a Role Column
  const handleInvertColumn = (role: string) => {
    setRoleMatrix(prev => {
      const currentConfig = prev[role] || {
        menuAccess: {} as MenuAccessPermission,
        actionAccess: {} as ActionPermission,
      };

      const invertedMenu: Record<string, boolean> = {};
      MENU_ITEMS.forEach(m => {
        invertedMenu[m.key] = !currentConfig.menuAccess?.[m.key];
      });

      const invertedAction: Record<string, boolean> = {};
      ACTION_ITEMS.forEach(a => {
        invertedAction[a.key] = !currentConfig.actionAccess?.[a.key];
      });

      return {
        ...prev,
        [role]: {
          menuAccess: invertedMenu as unknown as MenuAccessPermission,
          actionAccess: invertedAction as unknown as ActionPermission,
        }
      };
    });
    setHasUnsavedMatrix(true);
    setMatrixSaveSuccessMsg(null);
  };

  // Row Bulk Action: Set All Roles for a Menu Item
  const handleSetRowMenuAllRoles = (menuKey: keyof MenuAccessPermission, val: boolean) => {
    setRoleMatrix(prev => {
      const updated = { ...prev };
      currentRoleColumns.forEach(role => {
        const config = updated[role] || {
          menuAccess: {} as MenuAccessPermission,
          actionAccess: {} as ActionPermission
        };
        updated[role] = {
          ...config,
          menuAccess: {
            ...config.menuAccess,
            [menuKey]: val,
          }
        };
      });
      return updated;
    });
    setHasUnsavedMatrix(true);
    setMatrixSaveSuccessMsg(null);
  };

  // Row Bulk Action: Set All Roles for an Action Item
  const handleSetRowActionAllRoles = (actionKey: keyof ActionPermission, val: boolean) => {
    setRoleMatrix(prev => {
      const updated = { ...prev };
      currentRoleColumns.forEach(role => {
        const config = updated[role] || {
          menuAccess: {} as MenuAccessPermission,
          actionAccess: {} as ActionPermission
        };
        updated[role] = {
          ...config,
          actionAccess: {
            ...config.actionAccess,
            [actionKey]: val,
          }
        };
      });
      return updated;
    });
    setHasUnsavedMatrix(true);
    setMatrixSaveSuccessMsg(null);
  };

  // Save Role Matrix to Storage
  const handleSaveMatrix = () => {
    dataStorage.saveRolePermissionsMatrix(roleMatrix);
    setUsers(dataStorage.getUsers());
    setHasUnsavedMatrix(false);
    setMatrixSaveSuccessMsg('Konfigurasi Matriks Hak Akses berhasil disimpan! Perubahan izin diterapkan seketika ke seluruh pengguna.');
    
    if (onPermissionsUpdated) {
      onPermissionsUpdated();
    }
    setTimeout(() => setMatrixSaveSuccessMsg(null), 5000);
  };

  // Reset Role Matrix to RSMI Defaults
  const handleResetMatrix = () => {
    if (window.confirm('Apakah Anda yakin ingin mengembalikan seluruh Matriks Hak Akses ke standar default RS Medika Insani?')) {
      dataStorage.resetRolePermissionsMatrix();
      const def = dataStorage.getRolePermissionsMatrix();
      setRoleMatrix(def);
      setUsers(dataStorage.getUsers());
      setHasUnsavedMatrix(false);
      setMatrixSaveSuccessMsg('Matriks Hak Akses telah direset ke konfigurasi standar RS Medika Insani.');
      if (onPermissionsUpdated) {
        onPermissionsUpdated();
      }
      setTimeout(() => setMatrixSaveSuccessMsg(null), 4000);
    }
  };

  // Export Matrix JSON
  const handleExportMatrixJson = () => {
    const dataStr = JSON.stringify(roleMatrix, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Matriks_Hak_Akses_RSMI_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import Matrix JSON
  const handleImportMatrixJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (typeof parsed === 'object' && parsed !== null) {
          setRoleMatrix(parsed);
          dataStorage.saveRolePermissionsMatrix(parsed);
          setUsers(dataStorage.getUsers());
          setHasUnsavedMatrix(false);
          setMatrixSaveSuccessMsg('File konfigurasi Matriks Hak Akses berhasil diimpor & disimpan!');
          if (onPermissionsUpdated) {
            onPermissionsUpdated();
          }
        } else {
          alert('Format berkas Matriks JSON tidak valid.');
        }
      } catch (err) {
        alert('Gagal membaca berkas JSON.');
      }
    };
    reader.readAsText(file);
  };

  // --- USER MANAGEMENT HANDLERS ---
  const openAddUser = () => {
    setEditingUser(null);
    setFormUsername('');
    setFormNama('');
    setFormEmail('');
    setFormNip('');
    setFormRole('Petugas Ruangan / Perawat');
    setFormUnitKerja('Instalasi Rawat Inap / IGD');
    setFormKontak('081234567890');
    setFormPassword('123456');
    setIsUserModalOpen(true);
  };

  const openEditUser = (user: UserAccount) => {
    setEditingUser(user);
    setFormUsername(user.username);
    setFormNama(user.namaLengkap);
    setFormEmail(user.unitKerja.includes('@') ? user.unitKerja : `${user.username}@rsmedikainsani.co.id`);
    setFormNip(user.nip || '');
    setFormRole(user.role);
    setFormUnitKerja(user.unitKerja || '');
    setFormKontak(user.kontak || '');
    setFormPassword(user.password || '');
    setIsUserModalOpen(true);
  };

  const handleDeleteUser = (id: string) => {
    if (users.length <= 1) {
      alert('Tidak dapat menghapus pengguna terakhir dalam sistem!');
      return;
    }
    if (window.confirm('Yakin ingin menghapus akun pengguna ini?')) {
      const updated = users.filter(u => u.id !== id);
      setUsers(updated);
      dataStorage.saveUsers(updated);
    }
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    const roleConfig = roleMatrix[formRole] || {
      menuAccess: {} as MenuAccessPermission,
      actionAccess: { canCreate: true, canEdit: true, canDelete: formRole === 'Super Admin', canPrint: true, canExport: true }
    };

    if (editingUser) {
      const updated = users.map(u => {
        if (u.id === editingUser.id) {
          const updatedObj: UserAccount = {
            ...u,
            username: formUsername.trim().toLowerCase(),
            namaLengkap: formNama.trim(),
            nip: formNip.trim(),
            role: formRole,
            unitKerja: formUnitKerja.trim(),
            kontak: formKontak.trim(),
            password: formPassword || u.password,
            menuAccess: { ...roleConfig.menuAccess },
            actionAccess: { ...roleConfig.actionAccess },
          };
          if (u.id === currentUser.id && onUserRoleChange) {
            onUserRoleChange(updatedObj);
          }
          return updatedObj;
        }
        return u;
      });
      setUsers(updated);
      dataStorage.saveUsers(updated);
    } else {
      const newUser: UserAccount = {
        id: `USR-${(users.length + 1).toString().padStart(3, '0')}`,
        username: formUsername.trim().toLowerCase(),
        namaLengkap: formNama.trim(),
        nip: formNip.trim(),
        role: formRole,
        unitKerja: formUnitKerja.trim(),
        kontak: formKontak.trim(),
        password: formPassword || '123456',
        isActive: true,
        menuAccess: { ...roleConfig.menuAccess },
        actionAccess: { ...roleConfig.actionAccess },
        lastLogin: '-',
        avatarColor: formRole === 'Super Admin' ? 'bg-blue-600' : 'bg-emerald-600',
      };
      const updated = [...users, newUser];
      setUsers(updated);
      dataStorage.saveUsers(updated);
    }
    setIsUserModalOpen(false);
  };

  // --- GAS HANDLERS ---
  const handleSaveGasUrl = () => {
    const updated = {
      ...gasConfig,
      webAppUrl: gasUrl.trim(),
      autoSyncEnabled: true,
      autoSyncOnChange: true,
    };
    setGasConfig(updated);
    dataStorage.saveGasConfig(updated);
    setSyncStatusMsg('URL Google Apps Script & Pengaturan Auto-Sync berhasil disimpan!');
    setTimeout(() => setSyncStatusMsg(null), 3500);

    if (gasUrl.trim()) {
      gasSyncService.triggerAutoPush(updated, 1000);
    }
  };

  const handleToggleAutoSync = (enabled: boolean) => {
    const updated = { ...gasConfig, autoSyncEnabled: enabled };
    setGasConfig(updated);
    dataStorage.saveGasConfig(updated);
    if (enabled && updated.webAppUrl) {
      gasSyncService.triggerAutoPush(updated, 500);
    }
  };

  const handleToggleAutoSyncOnChange = (onChange: boolean) => {
    const updated = { ...gasConfig, autoSyncOnChange: onChange };
    setGasConfig(updated);
    dataStorage.saveGasConfig(updated);
  };

  const handleChangeSyncInterval = (minutes: number) => {
    const updated = { ...gasConfig, autoSyncIntervalMinutes: minutes };
    setGasConfig(updated);
    dataStorage.saveGasConfig(updated);
  };

  const handlePushAllToGas = async () => {
    if (!gasUrl) {
      setSyncStatusMsg('Harap masukkan URL Web App Google Apps Script terlebih dahulu.');
      return;
    }
    setIsSyncingGas(true);
    setSyncStatusMsg('Memulai Batch-Update ke Google Spreadsheet (19 Tabel)...');
    setBatchProgress(null);
    const res = await gasSyncService.pushToGoogleSheets(
      {
        ...gasConfig,
        webAppUrl: gasUrl.trim(),
      },
      {
        chunkSize: 5,
        onProgress: (p) => {
          setBatchProgress({
            currentBatch: p.currentBatch,
            totalBatches: p.totalBatches,
            percentage: p.percentage,
            message: p.message,
            currentTables: p.currentTables,
          });
          setSyncStatusMsg(p.message);
        },
      }
    );
    setIsSyncingGas(false);
    setBatchProgress(null);
    if (res.success) {
      setSyncStatusMsg(`✅ ${res.message}`);
    } else {
      setSyncStatusMsg(`❌ Gagal: ${res.message}`);
    }
  };

  const handlePullAllFromGas = async () => {
    if (!gasUrl) {
      setSyncStatusMsg('Harap masukkan URL Web App Google Apps Script terlebih dahulu.');
      return;
    }
    setIsSyncingGas(true);
    setSyncStatusMsg('Sedang mengambil data terbaru dari Google Spreadsheet...');
    const res = await gasSyncService.pullFromGoogleSheets({
      ...gasConfig,
      webAppUrl: gasUrl.trim(),
    });
    setIsSyncingGas(false);
    if (res.success) {
      setSyncStatusMsg(`✅ ${res.message}`);
    } else {
      setSyncStatusMsg(`❌ Gagal: ${res.message}`);
    }
  };

  const handleTestGasConnection = async () => {
    if (!gasUrl) {
      setSyncStatusMsg('Harap masukkan URL Web App Google Apps Script terlebih dahulu.');
      return;
    }
    setIsTestingGas(true);
    setSyncStatusMsg('Sedang menguji koneksi ke Google Apps Script...');
    const res = await gasSyncService.testConnection(gasUrl);
    setIsTestingGas(false);
    if (res.success) {
      setSyncStatusMsg(`✅ ${res.message}`);
    } else {
      setSyncStatusMsg(`❌ Gagal: ${res.message}`);
    }
  };

  const handleAutoMigrateSchema = async () => {
    if (!gasUrl) {
      setSyncStatusMsg('Harap masukkan URL Web App Google Apps Script terlebih dahulu.');
      return;
    }
    setIsSyncingGas(true);
    setSyncStatusMsg('Sedang memperbarui & memigrasikan skema 19 tabel ke Google Spreadsheet secara otomatis...');
    const res = await gasSyncService.autoMigrateRemoteSchema({
      ...gasConfig,
      webAppUrl: gasUrl.trim(),
    });
    setIsSyncingGas(false);
    if (res.success) {
      setSyncStatusMsg(`✅ ${res.message}`);
    } else {
      setSyncStatusMsg(`❌ Gagal: ${res.message}`);
      if (
        res.needsScriptUpdate ||
        (res.message && (res.message.toLowerCase().includes('invalid action') || res.message.includes('autoUpdateSchema')))
      ) {
        setGuideErrorMessage(res.message);
        setIsUpdateGuideModalOpen(true);
      }
    }
  };

  const handleDownloadCodeGs = () => {
    gasSyncService.downloadCodeGsFile(gasConfig.apiKeySecret);
    setSyncStatusMsg(`File Code.gs (v${gasSyncService.VERSION}) berhasil diunduh ke komputer Anda!`);
    setTimeout(() => setSyncStatusMsg(null), 3500);
  };

  const handleCopyCodeGs = async () => {
    const success = await gasSyncService.copyCodeGsToClipboard(gasConfig.apiKeySecret);
    if (success) {
      setSyncStatusMsg(`Script Code.gs (v${gasSyncService.VERSION}) berhasil disalin ke clipboard!`);
      setTimeout(() => setSyncStatusMsg(null), 3500);
    }
  };

  const handleDownloadGasIndexHtml = () => {
    gasSyncService.downloadGasIndexHtmlFile();
    setSyncStatusMsg('File index.html (Portal Google Apps Script) berhasil diunduh ke komputer Anda!');
    setTimeout(() => setSyncStatusMsg(null), 3500);
  };

  const handleCopyGasIndexHtml = async () => {
    const success = await gasSyncService.copyGasIndexHtmlToClipboard();
    if (success) {
      setSyncStatusMsg('Kode index.html (Portal Google Apps Script) berhasil disalin ke clipboard!');
      setTimeout(() => setSyncStatusMsg(null), 3500);
    }
  };

  const handleBackupJson = () => {
    try {
      const fullBackup = dataStorage.exportFullDatabaseJson(true);
      const blobSyst = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blobSyst);
      const link = document.createElement('a');
      link.href = url;
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
      link.download = `BACKUP_DATABASE_SIMBARS_${dateStr}_${timeStr}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Gagal mengekspor data cadangan: ' + (err.message || String(err)));
    }
  };

  const handleRestoreJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      alert('Format berkas harus berupa .json');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const result = dataStorage.importFullDatabaseJson(parsed);
        if (result.success) {
          alert(`✅ ${result.message}\n\nHalaman akan dimuat ulang untuk menyinkronkan seluruh tampilan.`);
          window.location.reload();
        } else {
          alert(`❌ Gagal memulihkan database: ${result.message}`);
        }
      } catch (err: any) {
        alert('Gagal membaca berkas backup JSON: ' + (err.message || 'Sintaks tidak valid.'));
      }
    };
    reader.readAsText(file);
  };

  const handleResetDefault = () => {
    if (window.confirm('PERINGATAN: Semua data yang telah Anda ubah akan digantikan dengan data contoh awal RS Medika Insani. Lanjutkan?')) {
      dataStorage.resetToDefault();
      alert('Database telah direset ke data default! Halaman akan dimuat ulang.');
      window.location.reload();
    }
  };

  // Filtered menu items for matrix table
  const filteredMenuItems = useMemo(() => {
    const q = (matrixSearch || '').trim().toLowerCase();
    return MENU_ITEMS.filter(m => {
      const matchSearch = q === '' || m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q);
      const matchGroup = matrixGroupFilter === 'ALL' || m.group.includes(matrixGroupFilter);
      return matchSearch && matchGroup;
    });
  }, [matrixSearch, matrixGroupFilter]);

  // Filtered action items for matrix table
  const filteredActionItems = useMemo(() => {
    const q = (matrixSearch || '').trim().toLowerCase();
    if (matrixGroupFilter !== 'ALL' && matrixGroupFilter !== 'AKSI') return [];
    return ACTION_ITEMS.filter(a => {
      return q === '' || a.name.toLowerCase().includes(q) || a.code.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q);
    });
  }, [matrixSearch, matrixGroupFilter]);

  const getTabInfo = () => {
    switch (activeTab) {
      case 'user':
        return {
          title: 'Manajemen Pengguna & Password',
          subtitle: 'Kelola akun staf, reset password, kontak, dan penetapan role pengguna RS Medika Insani.',
          icon: <Users className="w-5 h-5 text-blue-600" />
        };
      case 'hakAkses':
        return {
          title: 'Matriks Hak Akses (Editable Per Kolom)',
          subtitle: 'Konfigurasi granular izin menu dan hak operasi (Create, Edit, Delete, Print, Export) per kolom role jabatan (RBAC).',
          icon: <ShieldCheck className="w-5 h-5 text-blue-600" />
        };
      case 'aplikasi':
        return {
          title: 'Setting Aplikasi & Logo',
          subtitle: 'Pengaturan identitas aplikasi, nama instansi / rumah sakit, informasi kontak, dan logo aplikasi.',
          icon: <Building2 className="w-5 h-5 text-blue-600" />
        };
      case 'database':
        return {
          title: 'Konektor Apps Script & Database Sync',
          subtitle: 'Sinkronisasi database Google Sheets via Web App Google Apps Script, backup data JSON, dan restore.',
          icon: <Database className="w-5 h-5 text-blue-600" />
        };
    }
  };

  const currentInfo = getTabInfo();

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              {currentInfo.icon}
              <span>{currentInfo.title}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentInfo.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Role Anda: {currentUser.role}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 1. MANAJEMEN USER */}
      {activeTab === 'user' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-900 text-xs flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Daftar Akun Pengguna Terdaftar RS Medika Insani</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Setiap akun pengguna secara otomatis mewarisi hak akses dari Matriks Hak Akses sesuai role jabatan.
              </p>
            </div>

            {actionAccess.canCreate && (
              <button
                type="button"
                onClick={openAddUser}
                className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-xs cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Pengguna Baru</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Nama Pengguna & NIP</th>
                  <th className="py-2.5 px-3">Username & Kontak</th>
                  <th className="py-2.5 px-3">Unit Kerja / Ruangan</th>
                  <th className="py-2.5 px-3">Role Hak Akses</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {users.map(u => {
                  const isCurrent = u.id === currentUser.id;
                  return (
                    <tr key={u.id} className={`hover:bg-slate-50/70 transition-colors ${isCurrent ? 'bg-blue-50/30' : ''}`}>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-2xs ${
                            u.role === 'Super Admin' ? 'bg-blue-600' :
                            u.role === 'Kepala Instalasi Sarpras / IPSRS' ? 'bg-teal-600' :
                            u.role === 'Teknisi Elektromedik / Umum' ? 'bg-amber-600' :
                            u.role === 'Tim Pengadaan Logistik' ? 'bg-indigo-600' :
                            u.role === 'Komite Pemusnahan Aset' ? 'bg-rose-600' :
                            'bg-emerald-600'
                          }`}>
                            {u.namaLengkap ? u.namaLengkap.slice(0, 2).toUpperCase() : 'US'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <span>{u.namaLengkap}</span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 text-[10px] font-semibold">
                                  Akun Anda
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">NIP: {u.nip || '-'} | ID: {u.id}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="font-mono font-semibold text-slate-800">@{u.username}</div>
                        <div className="text-[11px] text-slate-500">{u.kontak || '-'}</div>
                      </td>

                      <td className="py-2.5 px-3 text-slate-700 font-medium">
                        {u.unitKerja || 'Staf RSMI'}
                      </td>

                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide ${
                          u.role === 'Super Admin'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : u.role === 'Kepala Instalasi Sarpras / IPSRS'
                            ? 'bg-teal-50 text-teal-700 border border-teal-200'
                            : u.role === 'Teknisi Elektromedik / Umum'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : u.role === 'Tim Pengadaan Logistik'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : u.role === 'Komite Pemusnahan Aset'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {u.role}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditUser(u)}
                            className="p-1.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 cursor-pointer shadow-2xs"
                            title="Edit User"
                          >
                            <Edit className="w-3.5 h-3.5 text-blue-600" />
                          </button>
                          {!isCurrent && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u.id)}
                              className="p-1.5 rounded-md bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 cursor-pointer shadow-2xs"
                              title="Hapus User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. MATRIKS HAK AKSES EDITABLE PER KOLOM */}
      {activeTab === 'hakAkses' && (
        <div className="space-y-4">
          
          {/* Action & Control Bar */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Matriks Konfigurasi Hak Akses Menu & Aksi (RBAC)</span>
                  {hasUnsavedMatrix && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold text-[10px] animate-pulse">
                      Ada Perubahan Belum Disimpan
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Klik langsung pada kotak izin untuk mengubah hak akses per menu dan kolom role. Gunakan tombol cepat di header kolom untuk centang/hapus massal.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveMatrix}
                  className={`px-3.5 py-1.5 rounded-md text-white font-medium text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all ${
                    hasUnsavedMatrix 
                      ? 'bg-emerald-600 hover:bg-emerald-500 ring-2 ring-emerald-400 ring-offset-1 font-semibold' 
                      : 'bg-blue-600 hover:bg-blue-500'
                  }`}
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan Matriks</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetMatrix}
                  className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Kembalikan ke konfigurasi default RSMI"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Reset Default</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportMatrixJson}
                  className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Unduh konfigurasi matriks dalam format JSON"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Ekspor JSON</span>
                </button>

                <label className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs">
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>Impor JSON</span>
                  <input type="file" accept=".json" onChange={handleImportMatrixJson} className="hidden" />
                </label>
              </div>
            </div>

            {/* Notification Banner */}
            {matrixSaveSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-900 font-medium animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{matrixSaveSuccessMsg}</span>
              </div>
            )}

            {/* Filter and Search Bar */}
            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative min-w-[220px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={matrixSearch}
                    onChange={e => setMatrixSearch(e.target.value)}
                    placeholder="Cari menu / aksi..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-md border border-slate-200 bg-slate-50/50 text-xs focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  />
                  {matrixSearch && (
                    <button
                      type="button"
                      onClick={() => setMatrixSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Group Filter */}
                <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
                  {[
                    { id: 'ALL', label: 'Semua Modul' },
                    { id: '1. Master', label: 'Master Data' },
                    { id: '2. Data', label: 'DIR & Mutasi' },
                    { id: '3. Kegiatan', label: 'IPSRS' },
                    { id: '4. Pengadaan', label: 'Pengadaan' },
                    { id: '5. Pemusnahan', label: 'Pemusnahan' },
                    { id: '6. Pengaturan', label: 'Pengaturan' },
                    { id: 'AKSI', label: 'Hak Operasi' },
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setMatrixGroupFilter(f.id)}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                        matrixGroupFilter === f.id
                          ? 'bg-slate-900 text-white font-medium shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Role Perspective Switcher */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
                <span className="text-[11px] font-medium text-slate-500 px-1.5">Tampilan:</span>
                <button
                  type="button"
                  onClick={() => setMatrixRoleView('rsmi')}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer ${
                    matrixRoleView === 'rsmi'
                      ? 'bg-white text-blue-700 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  6 Role Jabatan RSMI
                </button>
                <button
                  type="button"
                  onClick={() => setMatrixRoleView('3tier')}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer ${
                    matrixRoleView === '3tier'
                      ? 'bg-white text-blue-700 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  3 Tingkat Standar
                </button>
              </div>
            </div>
          </div>

          {/* MATRIKS TABLE */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                
                {/* Column Headers with Edit Controls per Column */}
                <thead>
                  <tr className="bg-slate-900 text-white border-b border-slate-800">
                    <th className="py-3 px-4 min-w-[280px] sticky left-0 z-20 bg-slate-900 shadow-sm">
                      <div className="font-bold text-xs uppercase tracking-wider text-slate-200">
                        Menu & Operasi Aplikasi
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                        Total {filteredMenuItems.length + filteredActionItems.length} modul/tindakan terdaftar
                      </div>
                    </th>

                    {currentRoleColumns.map((role) => {
                      const stats = getRolePermissionStats(role);
                      return (
                        <th 
                          key={role} 
                          className="py-3 px-3 min-w-[170px] text-center border-l border-slate-800 bg-slate-900/95"
                        >
                          <div className="space-y-2">
                            {/* Role Badge Title */}
                            <div>
                              <div className="font-bold text-xs text-white leading-tight">
                                {role}
                              </div>
                              <div className="text-[10px] text-blue-300 font-mono mt-0.5 font-medium">
                                Akses: {stats.menuCount + stats.actionCount} / {stats.totalMenu + stats.totalAction} ({stats.percentage}%)
                              </div>
                            </div>

                            {/* Column Action Toolbar */}
                            <div className="flex items-center justify-center gap-1 pt-1 border-t border-slate-800/80">
                              <button
                                type="button"
                                onClick={() => handleCheckAllColumn(role)}
                                className="px-1.5 py-0.5 rounded bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-600/40 text-[10px] font-medium cursor-pointer transition-all flex items-center gap-1"
                                title={`Beri semua izin untuk kolom ${role}`}
                              >
                                <Check className="w-2.5 h-2.5" />
                                <span>Semua</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleUncheckAllColumn(role)}
                                className="px-1.5 py-0.5 rounded bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-600/40 text-[10px] font-medium cursor-pointer transition-all flex items-center gap-1"
                                title={`Hapus semua izin untuk kolom ${role}`}
                              >
                                <X className="w-2.5 h-2.5" />
                                <span>Hapus</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleInvertColumn(role)}
                                className="px-1.5 py-0.5 rounded bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600 text-[10px] font-medium cursor-pointer transition-all"
                                title={`Balikkan status pilihan untuk kolom ${role}`}
                              >
                                Invert
                              </button>
                            </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-slate-700">
                  
                  {/* --- SECTION 1: AKSES MENU UTAMA APLIKASI --- */}
                  {filteredMenuItems.length > 0 && (
                    <tr className="bg-blue-50/70 border-y border-blue-100">
                      <td colSpan={currentRoleColumns.length + 1} className="py-2 px-4 font-bold text-xs text-blue-900 flex items-center gap-2 sticky left-0">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-blue-700" />
                        <span>A. HAK AKSES NAVIGASI & MENU APLIKASI ({filteredMenuItems.length} Menu)</span>
                      </td>
                    </tr>
                  )}

                  {filteredMenuItems.map((item) => {
                    return (
                      <tr key={item.key} className="hover:bg-slate-50/80 transition-colors group">
                        
                        {/* Menu Item Description & Row Bulk Actions */}
                        <td className="py-2.5 px-4 sticky left-0 z-10 bg-white group-hover:bg-slate-50/90 shadow-2xs">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                                <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1 py-0.2 rounded">
                                  {item.code}
                                </span>
                                <span>{item.name}</span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                                {item.desc}
                              </div>
                            </div>

                            {/* Row Quick Action */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleSetRowMenuAllRoles(item.key, true)}
                                className="px-1 py-0.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[9px] font-semibold border border-emerald-200 cursor-pointer"
                                title="Beri akses menu ini ke semua role"
                              >
                                +Semua
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetRowMenuAllRoles(item.key, false)}
                                className="px-1 py-0.5 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 text-[9px] font-semibold border border-rose-200 cursor-pointer"
                                title="Kunci menu ini untuk semua role"
                              >
                                -Semua
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Role Columns Checkboxes */}
                        {currentRoleColumns.map((role) => {
                          const config = roleMatrix[role];
                          const isAllowed = config?.menuAccess ? config.menuAccess[item.key] === true : false;
                          const isSuperAdminCol = role === 'Super Admin';

                          return (
                            <td 
                              key={`${role}-${item.key}`} 
                              className="py-2 px-3 text-center border-l border-slate-100"
                            >
                              <button
                                type="button"
                                onClick={() => handleToggleMenuPermission(role, item.key)}
                                className={`w-full py-1.5 px-2 rounded-md font-medium text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                                  isAllowed
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 shadow-2xs'
                                    : 'bg-slate-50 text-slate-400 border-slate-200/80 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                                }`}
                                title={`Klik untuk ${isAllowed ? 'menonaktifkan' : 'mengaktifkan'} akses ${item.name} untuk role ${role}`}
                              >
                                {isAllowed ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                                    <span className="font-semibold text-[11px]">Diizinkan</span>
                                  </>
                                ) : (
                                  <>
                                    <X className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="text-[11px]">Dibatasi</span>
                                  </>
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}

                  {/* --- SECTION 2: HAK AKSI & OPERASI SISTEM --- */}
                  {filteredActionItems.length > 0 && (
                    <tr className="bg-amber-50/70 border-y border-amber-100">
                      <td colSpan={currentRoleColumns.length + 1} className="py-2 px-4 font-bold text-xs text-amber-900 flex items-center gap-2 sticky left-0">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                        <span>B. HAK AKSI & OPERASI DATA ({filteredActionItems.length} Izin Operasi)</span>
                      </td>
                    </tr>
                  )}

                  {filteredActionItems.map((act) => {
                    return (
                      <tr key={act.key} className="hover:bg-slate-50/80 transition-colors group">
                        
                        {/* Action Description */}
                        <td className="py-2.5 px-4 sticky left-0 z-10 bg-white group-hover:bg-slate-50/90 shadow-2xs">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                                <span className="font-mono text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1 py-0.2 rounded font-bold">
                                  {act.code}
                                </span>
                                <span>{act.name}</span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                                {act.desc}
                              </div>
                            </div>

                            {/* Row Quick Action */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleSetRowActionAllRoles(act.key, true)}
                                className="px-1 py-0.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[9px] font-semibold border border-emerald-200 cursor-pointer"
                                title="Beri izin aksi ini ke semua role"
                              >
                                +Semua
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetRowActionAllRoles(act.key, false)}
                                className="px-1 py-0.5 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 text-[9px] font-semibold border border-rose-200 cursor-pointer"
                                title="Cabut izin aksi ini untuk semua role"
                              >
                                -Semua
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Role Columns Checkboxes */}
                        {currentRoleColumns.map((role) => {
                          const config = roleMatrix[role];
                          const isAllowed = config?.actionAccess ? config.actionAccess[act.key] === true : false;

                          return (
                            <td 
                              key={`${role}-${act.key}`} 
                              className="py-2 px-3 text-center border-l border-slate-100"
                            >
                              <button
                                type="button"
                                onClick={() => handleToggleActionPermission(role, act.key)}
                                className={`w-full py-1.5 px-2 rounded-md font-medium text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                                  isAllowed
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 shadow-2xs'
                                    : 'bg-slate-50 text-slate-400 border-slate-200/80 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                                }`}
                                title={`Klik untuk ${isAllowed ? 'mencabut' : 'memberikan'} izin ${act.name} untuk role ${role}`}
                              >
                                {isAllowed ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                                    <span className="font-semibold text-[11px]">Diizinkan</span>
                                  </>
                                ) : (
                                  <>
                                    <X className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="text-[11px]">Dibatasi</span>
                                  </>
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}

                  {filteredMenuItems.length === 0 && filteredActionItems.length === 0 && (
                    <tr>
                      <td colSpan={currentRoleColumns.length + 1} className="py-8 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Search className="w-6 h-6 text-slate-400" />
                          <p className="text-xs">Tidak ada menu atau aksi yang cocok dengan kata kunci & filter pencarian Anda.</p>
                          <button
                            type="button"
                            onClick={() => { setMatrixSearch(''); setMatrixGroupFilter('ALL'); }}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium cursor-pointer"
                          >
                            Reset Filter Pencarian
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}

                </tbody>
              </table>
            </div>

            {/* Bottom Footer Information */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Info className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Pengaturan hak akses disimpan secara persistent di peramban dan langsung tersinkronisasi ke seluruh akun aktif.
                </span>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={handleSaveMatrix}
                  className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Matriks</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* 3. DATABASE & GOOGLE APPS SCRIPT CLOUD SYNC */}
      {activeTab === 'database' && isAdmin && (
        <div className="space-y-6">
          
          {/* GITHUB AUTO-SYNC & REAL-TIME SYNC CARD */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-slate-900 text-white shadow-xs">
                  <FolderGit2 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">
                      Auto-Sync Database ke GitHub (Real-time)
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold border border-blue-200">
                      Real-time Event
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Sinkronisasi otomatis setiap ada perubahan data SIMBARS langsung dicommit ke repository GitHub sebagai file database JSON.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
                  githubConfig.personalAccessToken && githubConfig.owner && githubConfig.repo
                    ? githubConfig.autoSyncEnabled
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-blue-50 text-blue-800 border-blue-200'
                    : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    githubConfig.personalAccessToken && githubConfig.owner && githubConfig.repo
                      ? githubConfig.autoSyncEnabled
                        ? 'bg-emerald-500 animate-pulse'
                        : 'bg-blue-500'
                      : 'bg-amber-500'
                  }`}></span>
                  <span>
                    {githubConfig.personalAccessToken && githubConfig.owner && githubConfig.repo
                      ? githubConfig.autoSyncEnabled
                        ? 'Auto-Sync Aktif'
                        : 'Manual Sync'
                      : 'Belum Dikonfigurasi'}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsGitHubModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs cursor-pointer shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <FolderGit2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Konfigurasi & Log GitHub</span>
                </button>
              </div>
            </div>

            {/* Quick Status / Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 text-[11px] block font-medium">Target Repository:</span>
                <div className="font-mono font-bold text-slate-800 truncate mt-0.5">
                  {githubConfig.owner && githubConfig.repo ? `${githubConfig.owner}/${githubConfig.repo}` : 'Belum diatur'}
                </div>
                <span className="text-[10px] text-slate-400">Branch: {githubConfig.branch || 'main'}</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 text-[11px] block font-medium">File Database:</span>
                <div className="font-mono font-bold text-slate-800 truncate mt-0.5">
                  {githubConfig.filePath || 'data/simbars-database.json'}
                </div>
                <span className="text-[10px] text-slate-400">
                  Auto-Sync Perubahan: {githubConfig.autoSyncOnChange ? 'Aktif (Real-time)' : 'Non-aktif'}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 text-[11px] block font-medium">Sinkronisasi Terakhir:</span>
                <div className="font-bold text-slate-800 truncate mt-0.5">
                  {githubConfig.lastSyncTime ? new Date(githubConfig.lastSyncTime).toLocaleTimeString('id-ID') : 'Belum pernah'}
                </div>
                <span className="text-[10px] text-slate-400 truncate block">
                  Status: {githubConfig.lastSyncMessage || 'Siap digunakan'}
                </span>
              </div>
            </div>

            {/* Quick action buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!githubConfig.personalAccessToken || isManualPushingGh}
                  onClick={async () => {
                    setIsManualPushingGh(true);
                    setGhFeedbackMsg('Sedang mempush data ke GitHub...');
                    const res = await githubSyncService.pushToGitHub(githubConfig);
                    setIsManualPushingGh(false);
                    setGhFeedbackMsg(res.success ? `✅ Berhasil: ${res.message}` : `❌ Gagal: ${res.message}`);
                    setTimeout(() => setGhFeedbackMsg(null), 4000);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs cursor-pointer shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <ArrowUpFromLine className={`w-3.5 h-3.5 ${isManualPushingGh ? 'animate-bounce' : ''}`} />
                  <span>{isManualPushingGh ? 'Mempush...' : 'Push ke GitHub Sekarang'}</span>
                </button>

                <button
                  type="button"
                  disabled={!githubConfig.personalAccessToken || isManualPullingGh}
                  onClick={async () => {
                    if (!confirm('Tarik data dari GitHub? Data lokal akan diperbarui dengan data dari GitHub.')) return;
                    setIsManualPullingGh(true);
                    setGhFeedbackMsg('Sedang menarik data dari GitHub...');
                    const res = await githubSyncService.pullFromGitHub(githubConfig);
                    setIsManualPullingGh(false);
                    setGhFeedbackMsg(res.success ? `✅ Berhasil: ${res.message}` : `❌ Gagal: ${res.message}`);
                    setTimeout(() => setGhFeedbackMsg(null), 4000);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs cursor-pointer shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <ArrowDownToLine className={`w-3.5 h-3.5 ${isManualPullingGh ? 'animate-bounce' : ''}`} />
                  <span>{isManualPullingGh ? 'Menarik...' : 'Pull dari GitHub'}</span>
                </button>
              </div>

              {ghFeedbackMsg && (
                <div className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-800 border border-slate-200">
                  {ghFeedbackMsg}
                </div>
              )}
            </div>
          </div>

          {/* GAS SYNC URL & AUTO-SYNC BOX */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 text-xs flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Integrasi & Otomatisasi Google Spreadsheet (Apps Script)</span>
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  gasUrl
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {gasUrl ? '● Terhubung' : '○ Belum Dikonfigurasi'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Sinkronkan seluruh database inventaris secara otomatis dan berkala langsung ke spreadsheet Google Drive Rumah Sakit.
              </p>
            </div>

            <div className="space-y-2.5">
              <label className="block font-medium text-slate-700 text-xs">Web App URL Google Apps Script:</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={gasUrl}
                  onChange={e => setGasUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                  className="flex-1 px-3 py-1.5 rounded-md border border-slate-200 font-mono text-xs focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleSaveGasUrl}
                  className="px-3.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs cursor-pointer shadow-xs whitespace-nowrap"
                >
                  Simpan & Terapkan
                </button>
                <button
                  type="button"
                  disabled={isTestingGas}
                  onClick={handleTestGasConnection}
                  className="px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs cursor-pointer shadow-xs flex items-center justify-center gap-1.5 whitespace-nowrap disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingGas ? 'animate-spin' : ''}`} />
                  <span>{isTestingGas ? 'Menguji...' : 'Tes Koneksi'}</span>
                </button>
              </div>

              {syncStatusMsg && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 font-medium">
                  {syncStatusMsg}
                </div>
              )}
            </div>

            {/* AUTO-SYNC ENGINE CONTROLS */}
            <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-700" />
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">Sinkronisasi Otomatis (Auto-Sync)</span>
                    <span className="text-[11px] text-slate-500">Kirim perubahan data inventaris ke spreadsheet di latar belakang</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gasConfig.autoSyncEnabled ?? true}
                    onChange={e => handleToggleAutoSync(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-emerald-200/60">
                {/* Instant sync on change */}
                <label className="flex items-center gap-2 p-2 rounded-lg bg-white/80 border border-emerald-200 text-[11px] cursor-pointer hover:bg-white transition-colors">
                  <input
                    type="checkbox"
                    checked={gasConfig.autoSyncOnChange ?? true}
                    onChange={e => handleToggleAutoSyncOnChange(e.target.checked)}
                    disabled={!gasConfig.autoSyncEnabled}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-slate-700">⚡ Sinkron Instan Tiap Tambah/Edit Data</span>
                </label>

                {/* Interval selector */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-white/80 border border-emerald-200 text-[11px]">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Interval Timer:</span>
                  </div>
                  <select
                    value={gasConfig.autoSyncIntervalMinutes ?? 5}
                    onChange={e => handleChangeSyncInterval(Number(e.target.value))}
                    disabled={!gasConfig.autoSyncEnabled}
                    className="bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold rounded px-2 py-0.5 text-xs focus:ring-1 focus:ring-emerald-500"
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

              {/* Status and Action Buttons */}
              <div className="pt-2 border-t border-emerald-200/60 space-y-2">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-600">
                    <span className="font-medium">Status Sinkronisasi Terakhir: </span>
                    <span className="font-bold text-slate-800">
                      {gasConfig.lastSyncTime
                        ? new Date(gasConfig.lastSyncTime).toLocaleString('id-ID')
                        : 'Belum pernah sinkron'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      disabled={isSyncingGas}
                      onClick={handlePushAllToGas}
                      className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 transition-colors"
                      title="Kirim data dengan metode Batch-Update berkecepatan tinggi"
                    >
                      <ArrowUpFromLine className={`w-3.5 h-3.5 ${isSyncingGas ? 'animate-spin' : ''}`} />
                      <span>{isSyncingGas ? 'Mengirim Batch...' : 'Kirim / Push (Batch)'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isSyncingGas}
                      onClick={handlePullAllFromGas}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 transition-colors"
                    >
                      <ArrowDownToLine className={`w-3.5 h-3.5 ${isSyncingGas ? 'animate-spin' : ''}`} />
                      <span>{isSyncingGas ? 'Mengambil...' : 'Tarik / Pull dari Sheets'}</span>
                    </button>
                  </div>
                </div>

                {/* Real-time Batch Progress Bar */}
                {batchProgress && (
                  <div className="p-3 bg-white/90 border border-emerald-300 rounded-xl space-y-1.5 shadow-xs animate-in fade-in duration-200">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        Proses Batch-Update: Batch {batchProgress.currentBatch} dari {batchProgress.totalBatches}
                      </span>
                      <span className="font-mono font-bold text-emerald-700">
                        {batchProgress.percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${batchProgress.percentage}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{batchProgress.message}</span>
                      {batchProgress.currentTables && batchProgress.currentTables.length > 0 && (
                        <span className="truncate max-w-[260px] text-[10px] text-emerald-800 font-mono">
                          {batchProgress.currentTables.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* AUTOMATED CODE.GS & DATABASE SCHEMA UPDATE PANEL */}
            <div className="pt-4 border-t border-slate-200/80 space-y-3">
              <div className="p-4 bg-gradient-to-r from-blue-50/80 via-emerald-50/70 to-teal-50/70 rounded-xl border border-emerald-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      v{gasSyncService.VERSION}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs flex items-center gap-2">
                        <span>Pembaruan Otomatis Code.gs & Skema Database (19 Sheet)</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Batch Engine v{gasSyncService.VERSION}
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-600">
                        Dilengkapi mesin batch-update multi-tabel untuk mengurangi request HTTP drastis, menghindari timeout, serta auto-migrasi skema 19 tabel.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <button
                      type="button"
                      disabled={isSyncingGas || !gasUrl}
                      onClick={handleAutoMigrateSchema}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 transition-colors"
                      title="Kirim instruksi ke Google Apps Script untuk otomatis membuat sheet atau kolom yang belum ada"
                    >
                      <Zap className={`w-3.5 h-3.5 ${isSyncingGas ? 'animate-bounce' : ''}`} />
                      <span>{isSyncingGas ? 'Memperbarui...' : '⚡ Update Skema Otomatis'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadCodeGs}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                      title="Unduh file Code.gs untuk disimpan atau disalin ke Google Apps Script"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh Code.gs</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadGasIndexHtml}
                      className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                      title="Unduh file index.html untuk portal web Google Apps Script"
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      <span>Unduh index.html</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setGuideErrorMessage(undefined);
                        setIsUpdateGuideModalOpen(true);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center gap-1 cursor-pointer shadow-2xs"
                      title="Lihat petunjuk langkah demi langkah update script Code.gs ke Google Spreadsheet"
                    >
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Panduan Update</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-emerald-200/60 text-[11px] text-slate-700">
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span><strong>19 Tabel Sinkron:</strong> DIR (Foto Aset), Sirkulasi, Mutu 15 Mnt, Audit, Pengadaan, Pemusnahan.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span><strong>Batch Update Cepat:</strong> Mengelompokkan tabel ke dalam paket efisien, memotong latensi hingga 70%.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span><strong>Portal Web index.html:</strong> UI dasbor pemantauan, auto-migrasi skema &amp; cari aset via browser.</span>
                  </div>
                </div>
              </div>

              {/* GAS Script & HTML Preview & Copy */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setGasFileTab('codegs')}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        gasFileTab === 'codegs'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Code2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Code.gs (v{gasSyncService.VERSION})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setGasFileTab('indexhtml')}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        gasFileTab === 'indexhtml'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5 text-teal-600" />
                      <span>index.html (Web Portal)</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {gasFileTab === 'codegs' ? (
                      <>
                        <button
                          type="button"
                          onClick={handleDownloadCodeGs}
                          className="px-2.5 py-1 rounded-md bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium text-[11px] cursor-pointer flex items-center gap-1"
                        >
                          <Download className="w-3 h-3 text-slate-500" />
                          <span>Unduh .gs</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleCopyCodeGs}
                          className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[11px] cursor-pointer shadow-xs flex items-center gap-1"
                        >
                          <CheckCheck className="w-3 h-3" />
                          <span>Salin Script Code.gs</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <a
                          href="/gas-index.html"
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-md bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium text-[11px] cursor-pointer flex items-center gap-1"
                          title="Buka pratinjau antarmuka index.html di tab baru"
                        >
                          <ExternalLink className="w-3 h-3 text-slate-500" />
                          <span>Pratinjau Portal</span>
                        </a>
                        <button
                          type="button"
                          onClick={handleDownloadGasIndexHtml}
                          className="px-2.5 py-1 rounded-md bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium text-[11px] cursor-pointer flex items-center gap-1"
                        >
                          <Download className="w-3 h-3 text-slate-500" />
                          <span>Unduh index.html</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleCopyGasIndexHtml}
                          className="px-2.5 py-1 rounded-md bg-teal-600 hover:bg-teal-500 text-white font-medium text-[11px] cursor-pointer shadow-xs flex items-center gap-1"
                        >
                          <CheckCheck className="w-3 h-3" />
                          <span>Salin index.html</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {gasFileTab === 'codegs' ? (
                  <div className="space-y-1.5">
                    <p className="text-[11px] text-slate-500">
                      File backend utama Google Apps Script. Buka Apps Script di Google Sheets, tempel ke file <code className="font-mono text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">Code.gs</code>.
                    </p>
                    <div className="max-h-40 overflow-y-auto bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-[11px] leading-relaxed">
                      <pre>{gasSyncService.generateCodeGs(gasConfig.apiKeySecret).slice(0, 500)}...</pre>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <p className="text-[11px] text-slate-500">
                      File antarmuka web portal Google Apps Script. Di Apps Script Editor, klik <strong>[+] &gt; HTML</strong>, beri nama <code className="font-mono text-teal-700 bg-teal-50 px-1 py-0.5 rounded">index</code> (atau <code className="font-mono text-teal-700 bg-teal-50 px-1 py-0.5 rounded">index.html</code>), lalu tempel seluruh kode di bawah ini.
                    </p>
                    <div className="max-h-40 overflow-y-auto bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-[11px] leading-relaxed">
                      <pre>{gasIndexHtmlContent ? gasIndexHtmlContent.slice(0, 500) + '...' : 'Memuat isi file index.html...'}</pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* BACKUP & RESTORE BOX */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-600" />
                  <span>Cadangan & Pemulihan Database Lengkap (Backup & Restore)</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Ekspor dan impor data format JSON untuk pengamanan offline dan pemulihan saat kendala Google Sheets.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setBackupRestoreTab('backup');
                  setIsBackupRestoreModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer self-start sm:self-auto"
              >
                <FolderArchive className="w-4 h-4" />
                <span>Buka Pusat Backup & Restore (Wizard)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              
              {/* Backup */}
              <div className="p-4 rounded-xl border border-blue-200/80 bg-blue-50/40 space-y-3 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-blue-600" />
                    <span>Ekspor Cadangan (.JSON)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Unduh snapshot lengkap seluruh master, DIR, foto aset, sirkulasi, kegiatan IPSRS, pengadaan, pemusnahan, dan akun pengguna.
                  </p>
                </div>
                
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={handleBackupJson}
                    className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download File JSON</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBackupRestoreTab('backup');
                      setIsBackupRestoreModalOpen(true);
                    }}
                    className="w-full py-1.5 rounded-lg bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 font-semibold text-[11px] text-center cursor-pointer"
                  >
                    Lihat Rincian / Salin JSON
                  </button>
                </div>
              </div>

              {/* Restore */}
              <div className="p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/40 space-y-3 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-emerald-600" />
                    <span>Pulihkan Data (Restore .JSON)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Unggah berkas JSON cadangan untuk memulihkan seluruh data dan konfigurasi saat sinkronisasi Google Sheets terkendala.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="w-full py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs cursor-pointer shadow-xs text-center flex items-center justify-center gap-1.5 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Pilih Berkas JSON</span>
                    <input type="file" accept=".json" onChange={handleRestoreJson} className="hidden" />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setBackupRestoreTab('restore');
                      setIsBackupRestoreModalOpen(true);
                    }}
                    className="w-full py-1.5 rounded-lg bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-50 font-semibold text-[11px] text-center cursor-pointer"
                  >
                    Pratinjau & Periksa Sebelum Restore
                  </button>
                </div>
              </div>

              {/* Reset */}
              <div className="p-4 rounded-xl border border-rose-200/80 bg-rose-50/30 space-y-3 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="font-bold text-rose-900 text-xs flex items-center gap-1.5">
                    <RefreshCw className="w-4 h-4 text-rose-600" />
                    <span>Reset ke Data Default RS</span>
                  </div>
                  <p className="text-[11px] text-rose-700/80 leading-relaxed">
                    Kembalikan seluruh database ke paket data contoh awal RS Medika Insani (untuk demonstrasi atau inisialisasi ulang).
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={handleResetDefault}
                    className="w-full py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset Database Default</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBackupRestoreTab('troubleshoot');
                      setIsBackupRestoreModalOpen(true);
                    }}
                    className="w-full py-1.5 rounded-lg bg-white border border-amber-300 text-amber-800 hover:bg-amber-50 font-semibold text-[11px] text-center cursor-pointer"
                  >
                    ⚠️ Panduan Darurat Sheets
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* 3. SETTING APLIKASI & BRANDING */}
      {activeTab === 'aplikasi' && (
        <SettingAplikasiSection
          appSettings={appSettings}
          actionAccess={actionAccess}
          onAppSettingsChange={onAppSettingsChange}
        />
      )}

      {/* USER MODAL */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingUser ? 'Edit Data Pengguna' : 'Tambah Pengguna Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="py-3.5 space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Nama Lengkap & Gelar *</label>
                <input
                  type="text"
                  required
                  value={formNama}
                  onChange={e => setFormNama(e.target.value)}
                  placeholder="e.g. dr. Hendra, Sp.A"
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Username Login *</label>
                  <input
                    type="text"
                    required
                    value={formUsername}
                    onChange={e => setFormUsername(e.target.value)}
                    placeholder="hendra"
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={formPassword}
                    onChange={e => setFormPassword(e.target.value)}
                    placeholder="••••••"
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">NIP / ID Staf</label>
                  <input
                    type="text"
                    value={formNip}
                    onChange={e => setFormNip(e.target.value)}
                    placeholder="199208202018012004"
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Nomor Kontak / WA</label>
                  <input
                    type="text"
                    value={formKontak}
                    onChange={e => setFormKontak(e.target.value)}
                    placeholder="081234567890"
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Unit Kerja / Ruangan</label>
                <input
                  type="text"
                  value={formUnitKerja}
                  onChange={e => setFormUnitKerja(e.target.value)}
                  placeholder="Instalasi Pemeliharaan Sarana RS (IPSRS)"
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Role Jabatan (Hak Akses Matriks)</label>
                <select
                  value={formRole}
                  onChange={e => setFormRole(e.target.value as RoleType)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-white font-medium text-slate-800 focus:ring-1 focus:ring-blue-500"
                >
                  {RSMI_ROLES.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Akun ini akan otomatis mendapatkan hak akses sesuai konfigurasi matriks role {formRole}.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-md border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium cursor-pointer shadow-xs"
                >
                  Simpan Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BACKUP & RESTORE MODAL (WIZARD) */}
      <BackupRestoreModal
        isOpen={isBackupRestoreModalOpen}
        onClose={() => setIsBackupRestoreModalOpen(false)}
        initialTab={backupRestoreTab}
        onDataRestored={() => {
          setUsers(dataStorage.getUsers());
          setGasConfig(dataStorage.getGasConfig());
          setGasUrl(dataStorage.getGasUrl());
          if (onPermissionsUpdated) {
            onPermissionsUpdated();
          }
        }}
      />

      {/* GAS CODE.GS UPDATE GUIDE MODAL */}
      <GasUpdateGuideModal
        isOpen={isUpdateGuideModalOpen}
        onClose={() => setIsUpdateGuideModalOpen(false)}
        apiKeySecret={gasConfig.apiKeySecret}
        errorMessage={guideErrorMessage}
        webAppUrl={gasConfig.webAppUrl || gasUrl}
      />

      {/* GITHUB AUTO-SYNC MODAL */}
      <GitHubSyncModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
        currentUser={currentUser}
      />

    </div>
  );
};
