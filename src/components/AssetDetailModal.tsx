import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  History,
  Info,
  FileText,
  Truck,
  Wrench,
  AlertTriangle,
  ShieldCheck,
  Tag,
  Calendar,
  Building2,
  DollarSign,
  User,
  CheckCircle2,
  Printer,
  Download,
  Search,
  Filter,
  PlusCircle,
  Copy,
  Check,
  Layers,
  ArrowRight,
  ExternalLink,
  Clock,
  Sparkles,
  QrCode,
  Archive,
  RefreshCw,
  Camera,
  Image as ImageIcon,
  Maximize2,
  Eye,
  Trash2,
} from 'lucide-react';
import QRCode from 'qrcode';
import {
  InventarisRuangan,
  AssetAuditLog,
  AssetPhotoRecord,
  AuditLogActionType,
  ActionPermission,
  RuangInventaris,
  MerkInventaris,
  JenisInventaris,
  KategoriInventaris,
  SupplierInventaris,
  AppSettings,
} from '../types/inventory';
import { dataStorage } from '../services/dataStorage';
import { formatRupiah, formatAssetQrText, formatDateIndo } from '../utils/formatters';
import { AssetCameraModal } from './AssetCameraModal';
import { PhotoLightboxModal } from './PhotoLightboxModal';

interface AssetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: InventarisRuangan | null;
  actionAccess?: ActionPermission;
  onAssetUpdated?: () => void;
  onNavigateToModule?: (tab: string, filterData?: any) => void;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  isOpen,
  onClose,
  asset,
  actionAccess,
  onAssetUpdated,
  onNavigateToModule,
}) => {
  const [activeTab, setActiveTab] = useState<'audit' | 'info' | 'photos' | 'add_log'>('audit');
  const [currentAsset, setCurrentAsset] = useState<InventarisRuangan | null>(asset);
  const [auditLogs, setAuditLogs] = useState<AssetAuditLog[]>([]);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isPrinting, setIsPrinting] = useState(false);

  // Camera and Photo Lightbox State
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [cameraContext, setCameraContext] = useState<'direct_asset' | 'form_log'>('direct_asset');
  const [lightboxPhoto, setLightboxPhoto] = useState<{
    url: string;
    caption?: string;
    tipeFoto?: string;
    kondisi?: string;
    timestamp?: string;
    petugas?: string;
    assetId?: string;
    assetName?: string;
  } | null>(null);

  // Form State for Adding Manual Audit Log
  const [formTipeAksi, setFormTipeAksi] = useState<AuditLogActionType>('CATATAN_MANUAL');
  const [formJudul, setFormJudul] = useState('');
  const [formDeskripsi, setFormDeskripsi] = useState('');
  const [formUser, setFormUser] = useState('');
  const [formDokumenRef, setFormDokumenRef] = useState('');
  const [formKondisiBaru, setFormKondisiBaru] = useState<string>('');
  const [formStatusBaru, setFormStatusBaru] = useState<string>('');
  const [formBiaya, setFormBiaya] = useState<number | ''>('');
  const [formPhotoUrl, setFormPhotoUrl] = useState<string | null>(null);
  const [formPhotoCaption, setFormPhotoCaption] = useState<string>('');
  const [formSuccessMessage, setFormSuccessMessage] = useState('');

  // Master Data Reference
  const [ruangList, setRuangList] = useState<RuangInventaris[]>([]);
  const [merkList, setMerkList] = useState<MerkInventaris[]>([]);
  const [jenisList, setJenisList] = useState<JenisInventaris[]>([]);
  const [kategoriList, setKategoriList] = useState<KategoriInventaris[]>([]);
  const [supplierList, setSupplierList] = useState<SupplierInventaris[]>([]);
  const [settings, setSettings] = useState<AppSettings>(dataStorage.getAppSettings());

  // Load audit logs and generate QR when asset changes
  const loadData = () => {
    if (!asset) return;
    const latestAsset = dataStorage.getAssetById(asset.idBarang) || asset;
    setCurrentAsset(latestAsset);

    const logs = dataStorage.getAuditLogsByAssetId(asset.idBarang);
    setAuditLogs(logs);

    setRuangList(dataStorage.getRuang());
    setMerkList(dataStorage.getMerk());
    setJenisList(dataStorage.getJenis());
    setKategoriList(dataStorage.getKategori());
    setSupplierList(dataStorage.getSupplier());
    const appSettings = dataStorage.getAppSettings();
    setSettings(appSettings);

    const currentUser = dataStorage.getCurrentUser();
    if (currentUser) {
      setFormUser(currentUser.namaLengkap || currentUser.username);
    }
    setFormKondisiBaru(latestAsset.kondisi);
    setFormStatusBaru(latestAsset.status);

    // Generate QR Code data URL
    const ruang = dataStorage.getRuang().find(r => r.id === latestAsset.idRuang);
    const qrText = formatAssetQrText(
      latestAsset,
      ruang?.namaRuang || latestAsset.idRuang,
      appSettings.appName || 'RS MEDIKA INSANI'
    );
    QRCode.toDataURL(qrText, { width: 160, margin: 1 })
      .then(url => setQrCodeDataUrl(url))
      .catch(err => console.error('Error generating QR in detail modal:', err));
  };

  useEffect(() => {
    if (isOpen && asset) {
      loadData();
      setActiveTab('audit');
      setSearchQuery('');
      setSelectedTypeFilter('ALL');
      setFormSuccessMessage('');
      setFormPhotoUrl(null);
      setFormPhotoCaption('');
    }
  }, [isOpen, asset?.idBarang]);

  if (!isOpen || !asset) return null;

  const displayAsset = currentAsset || asset;
  const currentRoom = ruangList.find(r => r.id === displayAsset.idRuang);
  const currentMerk = merkList.find(m => m.id === displayAsset.idMerk);
  const currentJenis = jenisList.find(j => j.id === displayAsset.idJenis);
  const currentKategori = kategoriList.find(k => k.id === asset.idKategori);
  const currentSupplier = supplierList.find(s => s.id === asset.idSupplier);

  // Filtered logs
  const filteredLogs = auditLogs.filter(log => {
    const matchType = selectedTypeFilter === 'ALL' || log.tipeAksi === selectedTypeFilter;
    if (!matchType) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (log.judul && log.judul.toLowerCase().includes(q)) ||
      (log.deskripsi && log.deskripsi.toLowerCase().includes(q)) ||
      (log.user && log.user.toLowerCase().includes(q)) ||
      (log.dokumenRef && log.dokumenRef.toLowerCase().includes(q)) ||
      (log.referensiId && log.referensiId.toLowerCase().includes(q)) ||
      (log.ruangAsalNama && log.ruangAsalNama.toLowerCase().includes(q)) ||
      (log.ruangTujuanNama && log.ruangTujuanNama.toLowerCase().includes(q)) ||
      (log.catatan && log.catatan.toLowerCase().includes(q))
    );
  });

  // Calculations for stats summary
  const totalMutasi = auditLogs.filter(l => l.tipeAksi === 'MUTASI_RUANGAN').length;
  const totalPerbaikan = auditLogs.filter(l => l.tipeAksi === 'PERBAIKAN' || l.tipeAksi === 'PERMINTAAN_PERBAIKAN').length;
  const totalBiaya = auditLogs.reduce((acc, curr) => acc + (curr.biaya || 0), 0);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleCaptureAssetPhoto = (
    dataUrl: string,
    meta?: { caption?: string; tipeFoto?: string; kondisi?: any }
  ) => {
    if (!asset) return;

    if (cameraContext === 'form_log') {
      setFormPhotoUrl(dataUrl);
      if (meta?.caption) setFormPhotoCaption(meta.caption);
      if (meta?.kondisi) setFormKondisiBaru(meta.kondisi);
    } else {
      // Direct asset photo update
      const updated = dataStorage.updateAssetPhoto(asset.idBarang, dataUrl, {
        caption: meta?.caption,
        tipeFoto: meta?.tipeFoto || 'Kondisi Fisik',
        kondisi: meta?.kondisi || asset.kondisi,
      });

      if (updated) {
        setCurrentAsset(updated);
        loadData();
        if (onAssetUpdated) onAssetUpdated();
      }
    }
  };

  const handleSetMainPhoto = (photoUrl: string) => {
    if (!asset) return;
    const list = dataStorage.getInventarisRuangan();
    const updatedList = list.map(item => {
      if (item.idBarang === asset.idBarang) {
        return { ...item, fotoUrl: photoUrl };
      }
      return item;
    });
    dataStorage.saveInventarisRuangan(updatedList);
    loadData();
    if (onAssetUpdated) onAssetUpdated();
  };

  const handleAddManualLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formJudul.trim() || !formDeskripsi.trim()) return;

    const currentUser = dataStorage.getCurrentUser();
    const newLog: Omit<AssetAuditLog, 'idLog'> = {
      idBarang: asset.idBarang,
      timestamp: new Date().toISOString(),
      tipeAksi: formTipeAksi,
      judul: formJudul.trim(),
      deskripsi: formDeskripsi.trim(),
      user: formUser.trim() || (currentUser?.namaLengkap || 'Petugas RS'),
      roleUser: currentUser?.role || 'Petugas Ruangan / IPSRS',
      ruangAsalId: asset.idRuang,
      ruangAsalNama: currentRoom?.namaRuang,
      kondisiLama: asset.kondisi,
      kondisiBaru: formKondisiBaru || asset.kondisi,
      statusLama: asset.status,
      statusBaru: formStatusBaru || asset.status,
      dokumenRef: formDokumenRef.trim() || undefined,
      biaya: formBiaya ? Number(formBiaya) : undefined,
      fotoUrl: formPhotoUrl || undefined,
    };

    dataStorage.addAuditLog(newLog);

    // If photo attached, also store in asset fotoList
    let assetNeedsUpdate = false;
    const allInventaris = dataStorage.getInventarisRuangan();
    const updatedInventaris = allInventaris.map(item => {
      if (item.idBarang === asset.idBarang) {
        let upd = { ...item };
        let changed = false;

        if (formKondisiBaru && formKondisiBaru !== item.kondisi) {
          upd.kondisi = formKondisiBaru as any;
          changed = true;
        }
        if (formStatusBaru && formStatusBaru !== item.status) {
          upd.status = formStatusBaru as any;
          changed = true;
        }
        if (formPhotoUrl) {
          upd.fotoUrl = formPhotoUrl;
          const newPhotoRecord: AssetPhotoRecord = {
            id: `FOTO-${Date.now()}`,
            url: formPhotoUrl,
            caption: formJudul.trim() + (formPhotoCaption ? ` • ${formPhotoCaption}` : ''),
            kondisiSaatFoto: formKondisiBaru || item.kondisi,
            tipeFoto: formTipeAksi === 'PERBAIKAN' ? 'Perbaikan' : formTipeAksi === 'PEMELIHARAAN' ? 'Uji Fungsi' : 'Kondisi Fisik',
            timestamp: new Date().toISOString(),
            petugas: formUser.trim() || (currentUser?.namaLengkap || 'Petugas RS'),
          };
          upd.fotoList = [newPhotoRecord, ...(item.fotoList || [])];
          changed = true;
        }

        if (changed) {
          assetNeedsUpdate = true;
          return upd;
        }
      }
      return item;
    });

    if (assetNeedsUpdate) {
      dataStorage.saveInventarisRuangan(updatedInventaris);
      if (onAssetUpdated) onAssetUpdated();
    }

    setFormSuccessMessage('Catatan riwayat log & dokumentasi berhasil disimpan ke sistem!');
    setFormJudul('');
    setFormDeskripsi('');
    setFormDokumenRef('');
    setFormBiaya('');
    setFormPhotoUrl(null);
    setFormPhotoCaption('');

    // Refresh logs
    loadData();

    setTimeout(() => {
      setFormSuccessMessage('');
      setActiveTab('audit');
    }, 1200);
  };

  const handlePrintAuditTrail = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const headers = ['ID Log', 'Waktu', 'Tipe Aksi', 'Judul', 'Deskripsi', 'Pelaksana / User', 'Ruangan Terkait', 'Kondisi', 'Status', 'Biaya (Rp)', 'No. Dokumen / Ref'];
    const rows = auditLogs.map(l => [
      `"${l.idLog}"`,
      `"${new Date(l.timestamp).toLocaleString('id-ID')}"`,
      `"${l.tipeAksi}"`,
      `"${(l.judul || '').replace(/"/g, '""')}"`,
      `"${(l.deskripsi || '').replace(/"/g, '""')}"`,
      `"${(l.user || '').replace(/"/g, '""')}"`,
      `"${(l.ruangTujuanNama || l.ruangAsalNama || '').replace(/"/g, '""')}"`,
      `"${l.kondisiBaru || l.kondisiLama || '-'}"`,
      `"${l.statusBaru || l.statusLama || '-'}"`,
      l.biaya || 0,
      `"${l.dokumenRef || l.referensiId || '-'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Audit_Trail_${asset.idBarang}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to get action icon and color
  const getActionBadge = (tipe: AuditLogActionType) => {
    switch (tipe) {
      case 'MUTASI_RUANGAN':
        return {
          icon: <Truck className="w-4 h-4 text-blue-600" />,
          bg: 'bg-blue-50 border-blue-200 text-blue-800',
          dot: 'bg-blue-500',
          label: 'Mutasi Ruangan',
        };
      case 'PERBAIKAN':
        return {
          icon: <Wrench className="w-4 h-4 text-amber-600" />,
          bg: 'bg-amber-50 border-amber-200 text-amber-800',
          dot: 'bg-amber-500',
          label: 'Perbaikan IPSRS',
        };
      case 'PERMINTAAN_PERBAIKAN':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-rose-600" />,
          bg: 'bg-rose-50 border-rose-200 text-rose-800',
          dot: 'bg-rose-500',
          label: 'Keluhan / Aduan',
        };
      case 'PEMELIHARAAN':
        return {
          icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />,
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          dot: 'bg-emerald-500',
          label: 'Pemeliharaan / Kalibrasi',
        };
      case 'STATUS_CHANGE':
      case 'KONDISI_CHANGE':
        return {
          icon: <RefreshCw className="w-4 h-4 text-purple-600" />,
          bg: 'bg-purple-50 border-purple-200 text-purple-800',
          dot: 'bg-purple-500',
          label: 'Update Status / Fisik',
        };
      case 'REGISTRASI':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-teal-600" />,
          bg: 'bg-teal-50 border-teal-200 text-teal-800',
          dot: 'bg-teal-500',
          label: 'Registrasi & BAST',
        };
      case 'PEMUSNAHAN':
        return {
          icon: <Archive className="w-4 h-4 text-red-600" />,
          bg: 'bg-red-50 border-red-200 text-red-800',
          dot: 'bg-red-500',
          label: 'Pemusnahan Aset',
        };
      default:
        return {
          icon: <FileText className="w-4 h-4 text-slate-600" />,
          bg: 'bg-slate-50 border-slate-200 text-slate-800',
          dot: 'bg-slate-400',
          label: 'Catatan Audit',
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      {/* Modal Container */}
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white flex items-start justify-between gap-4 shrink-0">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded-md font-mono text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                {asset.idBarang}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                  asset.kondisi === 'Baik'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                    : asset.kondisi === 'Rusak Ringan'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                }`}
              >
                {asset.kondisi}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-700/80 text-slate-200 border border-slate-600">
                {asset.status}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300">
                {currentRoom?.namaRuang || asset.idRuang}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight truncate">
              {asset.namaBarang}
            </h2>
            <p className="text-xs text-slate-300 truncate">
              {currentMerk?.namaMerk || asset.idMerk} • SN: {asset.nomorSeri || '-'} • Th {asset.tahunPerolehan} • {formatRupiah(asset.hargaPerolehan)}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
            <button
              type="button"
              onClick={() => {
                setCameraContext('direct_asset');
                setIsCameraModalOpen(true);
              }}
              title="Ambil / Perbarui Foto Aset via Kamera Langsung"
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-emerald-500/30 shadow-xs"
            >
              <Camera className="w-4 h-4 text-emerald-200" />
              <span className="hidden sm:inline">Ambil Foto</span>
            </button>
            <button
              type="button"
              onClick={handlePrintAuditTrail}
              title="Cetak Lembar Riwayat Aset (Print)"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer border border-slate-700"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              title="Export Log ke CSV / Excel"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer border border-slate-700"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="flex items-center gap-1 py-2">
            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className={`px-3.5 py-2 rounded-lg font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Riwayat Log & Audit Trail</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'audit' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {auditLogs.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className={`px-3.5 py-2 rounded-lg font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'info'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              <Info className="w-4 h-4" />
              <span>Spesifikasi & Identitas</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('photos')}
              className={`px-3.5 py-2 rounded-lg font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'photos'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Foto & Galeri Visual</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'photos' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {displayAsset.fotoList?.length || (displayAsset.fotoUrl ? 1 : 0)}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('add_log')}
              className={`px-3.5 py-2 rounded-lg font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'add_log'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Tambah Catatan Audit</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center text-xs text-slate-500 font-mono">
            RS Medika Insani • SIMBARS
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          
          {/* TAB 1: AUDIT TRAIL & LOGS */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              
              {/* Quick KPI Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl">
                  <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Total Entri Log</div>
                  <div className="text-xl font-extrabold text-blue-950 mt-0.5">{auditLogs.length} <span className="text-xs font-normal text-blue-700">riwayat</span></div>
                </div>
                <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl">
                  <div className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Perpindahan Ruang</div>
                  <div className="text-xl font-extrabold text-indigo-950 mt-0.5">{totalMutasi} <span className="text-xs font-normal text-indigo-700">mutasi</span></div>
                </div>
                <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl">
                  <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Tindakan / Aduan</div>
                  <div className="text-xl font-extrabold text-amber-950 mt-0.5">{totalPerbaikan} <span className="text-xs font-normal text-amber-700">tiket</span></div>
                </div>
                <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                  <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Total Biaya Perbaikan</div>
                  <div className="text-base sm:text-lg font-extrabold text-emerald-950 mt-0.5">{formatRupiah(totalBiaya)}</div>
                </div>
              </div>

              {/* Filter & Search Toolbar */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5" /> Filter:
                  </span>
                  {[
                    { id: 'ALL', label: 'Semua' },
                    { id: 'MUTASI_RUANGAN', label: 'Mutasi Ruang' },
                    { id: 'PERBAIKAN', label: 'Perbaikan IPSRS' },
                    { id: 'PERMINTAAN_PERBAIKAN', label: 'Aduan' },
                    { id: 'PEMELIHARAAN', label: 'Pemeliharaan' },
                    { id: 'STATUS_CHANGE', label: 'Status/Fisik' },
                    { id: 'CATATAN_MANUAL', label: 'Catatan' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSelectedTypeFilter(tab.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                        selectedTypeFilter === tab.id
                          ? 'bg-slate-900 text-white'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari log, teknisi, no surat..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Timeline Container */}
              <div className="space-y-3 pt-1">
                {filteredLogs.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                    <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-600">Tidak ada riwayat log yang sesuai kriteria filter.</p>
                    <p className="text-xs text-slate-400 mt-1">Gunakan tombol "+ Tambah Catatan Audit" untuk mencatat aktivitas baru.</p>
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                    {filteredLogs.map((log, index) => {
                      const badge = getActionBadge(log.tipeAksi);
                      const dateObj = new Date(log.timestamp);
                      const formattedDate = dateObj.toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      });
                      const formattedTime = dateObj.toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <div key={log.idLog || index} className="relative group">
                          {/* Timeline Dot Indicator */}
                          <div className={`absolute -left-6 top-1.5 w-5 h-5 rounded-full border-2 border-white shadow-xs flex items-center justify-center ${badge.dot}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                          </div>

                          {/* Card Content */}
                          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-md transition-all space-y-2.5">
                            
                            {/* Card Top Meta */}
                            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border flex items-center gap-1.5 ${badge.bg}`}>
                                    {badge.icon}
                                    <span>{badge.label}</span>
                                  </span>
                                  <span className="text-xs font-bold text-slate-800">
                                    {log.judul}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 text-right">
                                <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span>{formattedDate} • {formattedTime} WIB</span>
                                </span>
                              </div>
                            </div>

                            {/* Card Body Description */}
                            <p className="text-xs text-slate-700 leading-relaxed font-normal whitespace-pre-line">
                              {log.deskripsi}
                            </p>

                            {/* Specific Context Badges (Mutasi, Perbaikan, Kondisi) */}
                            {(log.ruangAsalNama || log.ruangTujuanNama || log.kondisiBaru || log.biaya || log.dokumenRef) && (
                              <div className="flex flex-wrap items-center gap-2 pt-1">
                                
                                {/* Room Movement Pathway */}
                                {(log.ruangAsalNama || log.ruangTujuanNama) && (
                                  <div className="flex items-center gap-1.5 text-xs bg-blue-50/80 border border-blue-200 text-blue-900 px-2.5 py-1 rounded-lg">
                                    <span className="font-semibold">{log.ruangAsalNama || 'Ruang Asal'}</span>
                                    <ArrowRight className="w-3 h-3 text-blue-500" />
                                    <span className="font-bold text-blue-700">{log.ruangTujuanNama || 'Ruang Tujuan'}</span>
                                  </div>
                                )}

                                {/* Condition Change */}
                                {(log.kondisiLama || log.kondisiBaru) && log.tipeAksi !== 'MUTASI_RUANGAN' && (
                                  <div className="text-xs bg-purple-50 border border-purple-200 text-purple-900 px-2.5 py-1 rounded-lg flex items-center gap-1">
                                    <span className="text-purple-600">Kondisi:</span>
                                    {log.kondisiLama && <span className="line-through text-slate-400 mr-1">{log.kondisiLama}</span>}
                                    <span className="font-bold text-purple-800">{log.kondisiBaru || log.kondisiLama}</span>
                                  </div>
                                )}

                                {/* Cost Badge */}
                                {log.biaya && log.biaya > 0 && (
                                  <div className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-1 rounded-lg flex items-center gap-1 font-semibold">
                                    <DollarSign className="w-3 h-3 text-emerald-600" />
                                    <span>Biaya: {formatRupiah(log.biaya)}</span>
                                  </div>
                                )}

                                {/* Document Reference */}
                                {log.dokumenRef && (
                                  <div className="text-xs bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg flex items-center gap-1 font-mono">
                                    <FileText className="w-3 h-3 text-slate-500" />
                                    <span>Dok: {log.dokumenRef}</span>
                                  </div>
                                )}

                                {log.referensiId && (
                                  <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                    Ref: {log.referensiId}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Photo Evidence in Audit Log */}
                            {log.fotoUrl && (
                              <div className="pt-1">
                                <div
                                  onClick={() => setLightboxPhoto({
                                    url: log.fotoUrl!,
                                    caption: log.judul,
                                    kondisi: log.kondisiBaru,
                                    timestamp: log.timestamp,
                                    petugas: log.user,
                                  })}
                                  className="inline-flex items-center gap-2.5 p-1.5 pr-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl cursor-pointer transition-all group/photo"
                                >
                                  <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-slate-300 shadow-2xs">
                                    <img
                                      src={log.fotoUrl}
                                      alt="Bukti Foto"
                                      className="w-full h-full object-cover group-hover/photo:scale-105 transition-transform"
                                    />
                                    <div className="absolute inset-0 bg-black/20 group-hover/photo:bg-transparent flex items-center justify-center">
                                      <Maximize2 className="w-4 h-4 text-white opacity-0 group-hover/photo:opacity-100 transition-opacity drop-shadow-md" />
                                    </div>
                                  </div>
                                  <div className="text-left space-y-0.5">
                                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1 group-hover/photo:text-blue-700">
                                      <Camera className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>Foto Bukti Kondisi</span>
                                    </div>
                                    <div className="text-[11px] text-slate-500">
                                      Klik untuk memperbesar foto resolusi penuh
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Additional Notes */}
                            {log.catatan && (
                              <div className="p-2 bg-amber-50/60 border border-amber-200/80 rounded-lg text-[11px] text-amber-900 italic">
                                <span className="font-semibold not-italic">Catatan Tambahan:</span> {log.catatan}
                              </div>
                            )}

                            {/* Card Footer: Actor & Role */}
                            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 border-t border-slate-100">
                              <div className="flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                <span className="font-semibold text-slate-700">{log.user || 'Sistem RS'}</span>
                                {log.roleUser && (
                                  <span className="text-slate-400">({log.roleUser})</span>
                                )}
                              </div>
                              <span className="font-mono text-[10px] text-slate-400">{log.idLog}</span>
                            </div>

                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: SPESIFIKASI & IDENTITAS ASET */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Left 2 Cols: Detailed Spec Table */}
                <div className="md:col-span-2 space-y-3">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-blue-600" />
                      Informasi Utama Aset
                    </h3>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="text-slate-400">ID Inventaris (Barcode)</div>
                        <div className="font-mono font-bold text-blue-700 text-sm">{displayAsset.idBarang}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Nomor Urut</div>
                        <div className="font-mono font-bold text-slate-800">{displayAsset.noUrut || '-'}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Nama Lengkap Barang</div>
                        <div className="font-semibold text-slate-900">{displayAsset.namaBarang}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Merk / Pabrikan</div>
                        <div className="font-semibold text-slate-800">{currentMerk?.namaMerk || displayAsset.idMerk}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Nomor Seri Pabrik (SN)</div>
                        <div className="font-mono font-bold text-slate-800">{displayAsset.nomorSeri || '-'}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Tahun Perolehan</div>
                        <div className="font-semibold text-slate-800">{displayAsset.tahunPerolehan || '-'}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Jenis Inventaris</div>
                        <div className="font-medium text-slate-800">{currentJenis?.namaJenis || displayAsset.idJenis}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Kategori Kelompok</div>
                        <div className="font-medium text-slate-800">{currentKategori?.namaKategori || displayAsset.idKategori}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Harga Perolehan</div>
                        <div className="font-bold text-emerald-700 text-sm">{formatRupiah(displayAsset.hargaPerolehan)}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Sumber Dana</div>
                        <div className="font-semibold text-slate-800">{displayAsset.sumberDana}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Supplier / Rekanan</div>
                        <div className="font-medium text-slate-800">{currentSupplier?.nama || displayAsset.idSupplier || '-'}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Tanggal Input Sistem</div>
                        <div className="font-mono text-slate-700">{displayAsset.tanggalInput || '-'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Spesifikasi Teknis Box */}
                  <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                    <h4 className="text-xs font-bold text-slate-700 uppercase">Spesifikasi Teknis & Deskripsi</h4>
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-line">
                      {displayAsset.spesifikasi || 'Tidak ada catatan spesifikasi tambahan.'}
                    </p>
                  </div>

                  {/* Catatan Khusus Box */}
                  {displayAsset.catatan && (
                    <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                      <h4 className="text-xs font-bold text-amber-900 uppercase">Catatan Operasional & Kalibrasi</h4>
                      <p className="text-xs text-amber-800">{displayAsset.catatan}</p>
                    </div>
                  )}
                </div>

                {/* Right Col: Photo Card, QR Code & Placement */}
                <div className="space-y-3">
                  
                  {/* Photo Card Preview */}
                  <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase">
                      <span className="flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                        Foto Utama Aset
                      </span>
                      {displayAsset.fotoUrl && (
                        <button
                          type="button"
                          onClick={() => setActiveTab('photos')}
                          className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                        >
                          Lihat Semua ({displayAsset.fotoList?.length || 1})
                        </button>
                      )}
                    </div>

                    {displayAsset.fotoUrl ? (
                      <div
                        onClick={() => setLightboxPhoto({
                          url: displayAsset.fotoUrl!,
                          caption: displayAsset.namaBarang,
                          kondisi: displayAsset.kondisi,
                          assetId: displayAsset.idBarang,
                          assetName: displayAsset.namaBarang,
                        })}
                        className="relative rounded-lg overflow-hidden bg-slate-900 aspect-4/3 cursor-pointer group border border-slate-200"
                      >
                        <img
                          src={displayAsset.fotoUrl}
                          alt={displayAsset.namaBarang}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent flex items-center justify-center">
                          <Maximize2 className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                        </div>
                        <div className="absolute bottom-1.5 left-1.5 right-1.5 px-2 py-0.5 bg-slate-950/70 text-white text-[10px] rounded backdrop-blur-xs flex items-center justify-between pointer-events-none">
                          <span className="truncate">{displayAsset.namaBarang}</span>
                          <span className="text-emerald-300 font-bold">{displayAsset.kondisi}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg text-center space-y-2">
                        <Camera className="w-7 h-7 text-slate-400 mx-auto" />
                        <p className="text-[11px] text-slate-500">Belum ada foto utama aset.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setCameraContext('direct_asset');
                            setIsCameraModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs cursor-pointer"
                        >
                          Ambil Foto via Kamera
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Current Placement Box */}
                  <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                    <div className="text-[11px] font-bold text-blue-600 uppercase flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" />
                      Lokasi Terkini
                    </div>
                    <div className="font-bold text-blue-950 text-sm">
                      {currentRoom?.namaRuang || displayAsset.idRuang}
                    </div>
                    {currentRoom?.gedungLantai && (
                      <div className="text-xs text-blue-800 font-medium">
                        {currentRoom.gedungLantai}
                      </div>
                    )}
                    {currentRoom?.penanggungJawab && (
                      <div className="text-[11px] text-blue-700 pt-1 border-t border-blue-200">
                        PJ: {currentRoom.penanggungJawab}
                      </div>
                    )}
                  </div>

                  {/* Stiker Label QR Code */}
                  <div className="p-4 bg-white border-2 border-dashed border-slate-300 rounded-xl text-center space-y-2.5">
                    <div className="text-xs font-bold text-slate-700 uppercase flex items-center justify-center gap-1">
                      <QrCode className="w-3.5 h-3.5 text-blue-600" />
                      Label QR Code Aset
                    </div>

                    {qrCodeDataUrl ? (
                      <div className="inline-block p-2 bg-white rounded-lg border border-slate-200 shadow-xs">
                        <img src={qrCodeDataUrl} alt="QR Code" className="w-32 h-32 mx-auto" />
                      </div>
                    ) : (
                      <div className="w-32 h-32 mx-auto bg-slate-100 flex items-center justify-center rounded text-xs text-slate-400">
                        Membuat QR...
                      </div>
                    )}

                    <div className="font-mono text-[11px] font-bold text-slate-800">
                      {displayAsset.idBarang}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(displayAsset.idBarang, 'id')}
                      className="w-full py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      {copiedText === 'id' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">ID Disalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Salin ID Barang</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* TAB 3: GALERI FOTO & DOKUMENTASI VISUAL */}
          {activeTab === 'photos' && (
            <div className="space-y-4">
              
              {/* Header Action Bar */}
              <div className="p-4 bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-950 text-white rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Camera className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-bold text-sm text-white">Dokumentasi Visual & Kamera Aset</h3>
                  </div>
                  <p className="text-xs text-slate-300">
                    Dokumentasikan foto kondisi fisik, bukti pemeliharaan/perbaikan, atau plat nomor seri langsung menggunakan kamera perangkat.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCameraContext('direct_asset');
                    setIsCameraModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
                >
                  <Camera className="w-4 h-4" />
                  <span>Ambil Foto via Kamera</span>
                </button>
              </div>

              {/* Photos Gallery Grid */}
              {(!displayAsset.fotoList || displayAsset.fotoList.length === 0) && !displayAsset.fotoUrl ? (
                <div className="p-12 text-center bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-full bg-slate-200 text-slate-500 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-slate-800">Belum Ada Dokumentasi Foto</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Belum ada foto yang diambil untuk aset ini. Anda dapat mengambil foto kondisi aset secara real-time dengan kamera atau mengunggah berkas.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCameraContext('direct_asset');
                      setIsCameraModalOpen(true);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Mulai Ambil Foto Aset</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  
                  {/* Main Highlight Photo */}
                  {displayAsset.fotoUrl && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Foto Utama Terpasang
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setCameraContext('direct_asset');
                            setIsCameraModalOpen(true);
                          }}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Perbarui Foto Utama</span>
                        </button>
                      </div>

                      <div className="relative max-h-72 rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-300 group">
                        <img
                          src={displayAsset.fotoUrl}
                          alt="Foto Utama Aset"
                          className="max-h-72 w-full object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => setLightboxPhoto({
                            url: displayAsset.fotoUrl!,
                            caption: `Foto Utama: ${displayAsset.namaBarang}`,
                            kondisi: displayAsset.kondisi,
                            assetId: displayAsset.idBarang,
                            assetName: displayAsset.namaBarang,
                          })}
                          className="absolute inset-0 bg-black/30 group-hover:bg-black/10 flex items-center justify-center transition-all cursor-pointer"
                        >
                          <div className="px-3.5 py-1.5 rounded-lg bg-slate-900/80 text-white text-xs font-semibold backdrop-blur-xs flex items-center gap-1.5 opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all">
                            <Maximize2 className="w-4 h-4" />
                            <span>Perbesar Foto</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Historical Condition Photos Grid */}
                  {displayAsset.fotoList && displayAsset.fotoList.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <History className="w-4 h-4 text-slate-500" />
                        Riwayat Seluruh Foto Kondisi ({displayAsset.fotoList.length})
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {displayAsset.fotoList.map((photo, pIdx) => {
                          const isMain = displayAsset.fotoUrl === photo.url;
                          return (
                            <div
                              key={photo.id || pIdx}
                              className={`bg-white border rounded-xl overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col ${
                                isMain ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200'
                              }`}
                            >
                              <div
                                onClick={() => setLightboxPhoto({
                                  url: photo.url,
                                  caption: photo.caption,
                                  tipeFoto: photo.tipeFoto,
                                  kondisi: photo.kondisiSaatFoto,
                                  timestamp: photo.timestamp,
                                  petugas: photo.petugas,
                                  assetId: displayAsset.idBarang,
                                  assetName: displayAsset.namaBarang,
                                })}
                                className="relative bg-slate-950 aspect-4/3 cursor-pointer group overflow-hidden"
                              >
                                <img
                                  src={photo.url}
                                  alt={photo.caption || 'Foto Aset'}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent flex items-center justify-center">
                                  <Maximize2 className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                {isMain && (
                                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-emerald-600 text-white font-bold text-[10px] rounded-md shadow-xs flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Foto Utama
                                  </div>
                                )}
                                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-slate-900/80 text-slate-200 text-[10px] rounded backdrop-blur-xs font-mono">
                                  {photo.kondisiSaatFoto || 'Baik'}
                                </div>
                              </div>

                              <div className="p-2.5 space-y-1.5 flex-1 flex flex-col justify-between text-xs">
                                <div>
                                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                                    <span className="font-semibold text-slate-700">{photo.tipeFoto || 'Kondisi Fisik'}</span>
                                    <span>{formatDateIndo(photo.timestamp)}</span>
                                  </div>
                                  {photo.caption && (
                                    <p className="text-slate-700 text-xs line-clamp-2 mt-1 font-medium">
                                      {photo.caption}
                                    </p>
                                  )}
                                </div>

                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                                  <span className="text-slate-500 truncate max-w-[120px]">
                                    Oleh: {photo.petugas || 'Petugas RS'}
                                  </span>
                                  {!isMain && (
                                    <button
                                      type="button"
                                      onClick={() => handleSetMainPhoto(photo.url)}
                                      className="text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer"
                                    >
                                      Jadikan Utama
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          )}

          {/* TAB 4: TAMBAH CATATAN AUDIT & UPDATE KONDISI MANUAL */}
          {activeTab === 'add_log' && (
            <form onSubmit={handleAddManualLog} className="space-y-4 max-w-2xl mx-auto">
              
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900 space-y-1">
                  <p className="font-bold">Form Audit Trail & Riwayat Operasional</p>
                  <p className="text-blue-800">
                    Gunakan formulir ini untuk mencatat verifikasi fisik berkala, catatan uji fungsi kelistrikan, catatan insidental dari perawat/teknisi, atau pembaruan status kondisi barang lengkap dengan lampiran foto kamera langsung.
                  </p>
                </div>
              </div>

              {formSuccessMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{formSuccessMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                {/* Tipe Aksi */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipe Log Audit *</label>
                  <select
                    value={formTipeAksi}
                    onChange={e => setFormTipeAksi(e.target.value as AuditLogActionType)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="CATATAN_MANUAL">📝 Catatan Audit & Verifikasi Fisik</option>
                    <option value="PEMELIHARAAN">🛡️ Pemeliharaan & Uji Fungsi</option>
                    <option value="KONDISI_CHANGE">🔄 Perubahan Kondisi Fisik</option>
                    <option value="STATUS_CHANGE">⚙️ Perubahan Status Ketersediaan</option>
                    <option value="MUTASI_RUANGAN">🚚 Catatan Perpindahan Ruangan</option>
                    <option value="PERBAIKAN">🔧 Catatan Tindakan Perbaikan</option>
                  </select>
                </div>

                {/* Pelaksana / User */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Petugas / Pelaksana *</label>
                  <input
                    type="text"
                    required
                    value={formUser}
                    onChange={e => setFormUser(e.target.value)}
                    placeholder="Nama pemeriksa/teknisi"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                {/* Judul Log */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Judul Ringkasan Log *</label>
                  <input
                    type="text"
                    required
                    value={formJudul}
                    onChange={e => setFormJudul(e.target.value)}
                    placeholder="Contoh: Pemeriksaan Kelistrikan & Grounding Berkala"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                {/* Deskripsi Lengkap */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Hasil Pemeriksaan / Tindakan *</label>
                  <textarea
                    required
                    rows={3}
                    value={formDeskripsi}
                    onChange={e => setFormDeskripsi(e.target.value)}
                    placeholder="Tuliskan temuan fisik, hasil kalibrasi, pengujian beban, atau kronologi perubahan..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                {/* Kondisi Terkini */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kondisi Fisik Terkini</label>
                  <select
                    value={formKondisiBaru}
                    onChange={e => setFormKondisiBaru(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="Baik">Baik (Siap Pakai)</option>
                    <option value="Rusak Ringan">Rusak Ringan</option>
                    <option value="Rusak Berat">Rusak Berat (Afkir)</option>
                  </select>
                </div>

                {/* Status Terkini */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status Operasional</label>
                  <select
                    value={formStatusBaru}
                    onChange={e => setFormStatusBaru(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="Tersedia">Tersedia di Ruangan</option>
                    <option value="Perbaikan">Sedang Dalam Perbaikan</option>
                    <option value="Dipinjam">Dipinjamkan Sementara</option>
                    <option value="Diajukan Pemusnahan">Diajukan Pemusnahan</option>
                    <option value="Dimusnahkan">Telah Dimusnahkan</option>
                  </select>
                </div>

                {/* No Dokumen Ref */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">No. Dokumen / Berita Acara (Opsional)</label>
                  <input
                    type="text"
                    value={formDokumenRef}
                    onChange={e => setFormDokumenRef(e.target.value)}
                    placeholder="Contoh: BA-INSP/2025/02/09"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                {/* Biaya */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Biaya Terkait (Rp, Opsional)</label>
                  <input
                    type="number"
                    value={formBiaya}
                    onChange={e => setFormBiaya(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Contoh: 500000"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                {/* LAMPIRAN FOTO BUKTI VIA KAMERA */}
                <div className="sm:col-span-2 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-emerald-600" />
                      Foto Bukti Kondisi / Dokumen (Kamera)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setCameraContext('form_log');
                        setIsCameraModalOpen(true);
                      }}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{formPhotoUrl ? 'Ganti Foto' : 'Ambil Foto Bukti'}</span>
                    </button>
                  </div>

                  {formPhotoUrl ? (
                    <div className="flex items-center gap-3 p-2 bg-white border border-emerald-300 rounded-lg animate-in fade-in">
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-slate-300">
                        <img src={formPhotoUrl} alt="Foto Terlampir" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Foto Bukti Berhasil Terlampir</span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">
                          Foto akan disimpan ke dalam riwayat log audit dan galeri kondisi aset.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormPhotoUrl(null)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="Hapus Foto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 italic bg-white p-2.5 rounded-lg border border-slate-200">
                      Opsional: Ambil foto langsung menggunakan kamera untuk mendokumentasikan kondisi terkini secara visual.
                    </div>
                  )}
                </div>

              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('audit')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Simpan Catatan Audit</span>
                </button>
              </div>

            </form>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="font-bold text-slate-700">{displayAsset.idBarang}</span>
            <span>•</span>
            <span>{currentRoom?.namaRuang || displayAsset.idRuang}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs cursor-pointer transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>

      </div>

      {/* Embedded Camera Capture Modal */}
      <AssetCameraModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={handleCaptureAssetPhoto}
        assetId={displayAsset.idBarang}
        assetName={displayAsset.namaBarang}
        currentKondisi={displayAsset.kondisi}
        title={cameraContext === 'form_log' ? 'Ambil Foto Bukti Audit Log' : 'Ambil Foto Dokumentasi Aset'}
      />

      {/* Embedded Photo Lightbox Viewer */}
      <PhotoLightboxModal
        isOpen={!!lightboxPhoto}
        onClose={() => setLightboxPhoto(null)}
        imageUrl={lightboxPhoto?.url || null}
        caption={lightboxPhoto?.caption}
        tipeFoto={lightboxPhoto?.tipeFoto}
        kondisi={lightboxPhoto?.kondisi}
        timestamp={lightboxPhoto?.timestamp}
        petugas={lightboxPhoto?.petugas}
        assetId={displayAsset.idBarang}
        assetName={displayAsset.namaBarang}
      />

    </div>
  );
};
