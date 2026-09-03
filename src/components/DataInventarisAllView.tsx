import React, { useState, useEffect } from 'react';
import { 
  InventarisRuangan, 
  RuangInventaris, 
  JenisInventaris, 
  KategoriInventaris, 
  MerkInventaris, 
  SupplierInventaris,
  ActionPermission,
  AppSettings
} from '../types/inventory';
import { dataStorage } from '../services/dataStorage';
import { AppLogo } from './AppLogo';
import { DocumentHeader } from './DocumentHeader';
import { QrSignature } from './QrSignature';
import { AssetDetailModal } from './AssetDetailModal';
import { PhotoLightboxModal } from './PhotoLightboxModal';
import { formatRupiah, formatDateIndo, generateQrDataUrl, formatAssetQrText, exportToCsv, exportToExcel, exportToJson, printDiv } from '../utils/formatters';
import { useLazyList } from '../hooks/useLazyList';
import { 
  Building2, 
  Search, 
  Download, 
  Printer, 
  QrCode, 
  Layers, 
  CheckCircle2, 
  ShieldCheck, 
  AlertTriangle, 
  Boxes,
  X,
  FileSpreadsheet,
  FileText,
  FileCode,
  Zap,
  ChevronDown,
  ChevronUp,
  Loader2,
  Eye,
  History,
  SlidersHorizontal,
  Check,
  Sparkles,
  Info,
  Maximize2,
  Camera,
  Image as ImageIcon,
  Calendar,
  Coins,
  RotateCcw,
  Filter
} from 'lucide-react';


interface DataInventarisAllViewProps {
  actionAccess: ActionPermission;
  onInspectAsset?: (asset: InventarisRuangan) => void;
  appSettings?: AppSettings;
  initialSearch?: string;
  initialRuangId?: string;
  initialKategoriId?: string;
}

export const DataInventarisAllView: React.FC<DataInventarisAllViewProps> = ({
  actionAccess,
  onInspectAsset,
  appSettings: propAppSettings,
  initialSearch = '',
  initialRuangId = 'ALL',
  initialKategoriId = 'ALL',
}) => {
  const settings = propAppSettings || dataStorage.getAppSettings();
  const [inventaris, setInventaris] = useState<InventarisRuangan[]>(dataStorage.getInventarisRuangan());
  const [ruangList] = useState<RuangInventaris[]>(dataStorage.getRuang());
  const [jenisList] = useState<JenisInventaris[]>(dataStorage.getJenis());
  const [kategoriList] = useState<KategoriInventaris[]>(dataStorage.getKategori());
  const [merkList] = useState<MerkInventaris[]>(dataStorage.getMerk());
  const [supplierList] = useState<SupplierInventaris[]>(dataStorage.getSupplier());

  // Lightbox Modal state
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

  // Filters
  const [selectedRuangId, setSelectedRuangId] = useState<string>(initialRuangId);
  const [selectedJenisId, setSelectedJenisId] = useState<string>('ALL');
  const [selectedKategoriId, setSelectedKategoriId] = useState<string>(initialKategoriId);
  const [selectedKondisi, setSelectedKondisi] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState(initialSearch);

  // Advanced Filter state (Rentang Tahun Perolehan & Rentang Harga)
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);
  const [minYear, setMinYear] = useState<string>('');
  const [maxYear, setMaxYear] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  const activeAdvancedFilterCount = 
    (minYear.trim() !== '' ? 1 : 0) + 
    (maxYear.trim() !== '' ? 1 : 0) + 
    (minPrice.trim() !== '' ? 1 : 0) + 
    (maxPrice.trim() !== '' ? 1 : 0);

  const hasAnyActiveFilter =
    selectedRuangId !== 'ALL' ||
    selectedJenisId !== 'ALL' ||
    selectedKategoriId !== 'ALL' ||
    selectedKondisi !== 'ALL' ||
    searchTerm.trim() !== '' ||
    activeAdvancedFilterCount > 0;

  const handleResetAdvancedFilters = () => {
    setMinYear('');
    setMaxYear('');
    setMinPrice('');
    setMaxPrice('');
  };

  const handleResetAllFilters = () => {
    setSelectedRuangId('ALL');
    setSelectedJenisId('ALL');
    setSelectedKategoriId('ALL');
    setSelectedKondisi('ALL');
    setSearchTerm('');
    handleResetAdvancedFilters();
  };

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  useEffect(() => {
    if (initialSearch) setSearchTerm(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    if (initialRuangId) setSelectedRuangId(initialRuangId);
  }, [initialRuangId]);

  useEffect(() => {
    if (initialKategoriId) setSelectedKategoriId(initialKategoriId);
  }, [initialKategoriId]);

  // Bulk QR Print Modal
  const [isBulkQrModalOpen, setIsBulkQrModalOpen] = useState(false);
  const [bulkQrItems, setBulkQrItems] = useState<{ asset: InventarisRuangan; qrUrl: string }[]>([]);
  const [isGeneratingBulk, setIsGeneratingBulk] = useState(false);

  // Single QR modal
  const [activeQrAsset, setActiveQrAsset] = useState<InventarisRuangan | null>(null);
  const [activeQrUrl, setActiveQrUrl] = useState<string>('');

  // Asset Detail & Audit Trail Modal
  const [selectedDetailAsset, setSelectedDetailAsset] = useState<InventarisRuangan | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Custom Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'excel' | 'csv' | 'json'>('excel');
  const [exportScope, setExportScope] = useState<'filtered' | 'all'>('filtered');
  const [exportTemplate, setExportTemplate] = useState<'full' | 'physical' | 'financial'>('full');
  const [isExporting, setIsExporting] = useState(false);


  const filteredItems = inventaris.filter(item => {
    const matchRuang = selectedRuangId === 'ALL' || item.idRuang === selectedRuangId;
    const matchJenis = selectedJenisId === 'ALL' || item.idJenis === selectedJenisId;
    const matchKat = selectedKategoriId === 'ALL' || item.idKategori === selectedKategoriId;
    const matchKondisi = selectedKondisi === 'ALL' || item.kondisi === selectedKondisi;
    const q = (searchTerm || '').trim().toLowerCase();
    const matchSearch =
      q === '' ||
      (item.idBarang || '').toLowerCase().includes(q) ||
      (item.namaBarang || '').toLowerCase().includes(q) ||
      (item.nomorSeri || '').toLowerCase().includes(q) ||
      (item.spesifikasi || '').toLowerCase().includes(q);

    // Rentang Tahun Perolehan
    const itemYear = Number(item.tahunPerolehan);
    const parsedMinYear = minYear.trim() !== '' ? parseInt(minYear.trim(), 10) : null;
    const parsedMaxYear = maxYear.trim() !== '' ? parseInt(maxYear.trim(), 10) : null;
    const matchMinYear = parsedMinYear === null || (!isNaN(itemYear) && itemYear >= parsedMinYear);
    const matchMaxYear = parsedMaxYear === null || (!isNaN(itemYear) && itemYear <= parsedMaxYear);

    // Rentang Nilai Harga Perolehan
    const itemPrice = Number(item.hargaPerolehan) || 0;
    const parsedMinPrice = minPrice.trim() !== '' ? parseFloat(minPrice.trim()) : null;
    const parsedMaxPrice = maxPrice.trim() !== '' ? parseFloat(maxPrice.trim()) : null;
    const matchMinPrice = parsedMinPrice === null || itemPrice >= parsedMinPrice;
    const matchMaxPrice = parsedMaxPrice === null || itemPrice <= parsedMaxPrice;

    return (
      matchRuang &&
      matchJenis &&
      matchKat &&
      matchKondisi &&
      matchSearch &&
      matchMinYear &&
      matchMaxYear &&
      matchMinPrice &&
      matchMaxPrice
    );
  });

  // Lazy Loading for high-volume dataset performance
  const {
    displayedItems,
    visibleCount,
    hasMore,
    isLoadingMore,
    loadMore,
    loadAll,
    setSentinel
  } = useLazyList<InventarisRuangan>(filteredItems, {
    initialBatch: 30,
    batchSize: 30,
    resetTriggers: [
      selectedRuangId,
      selectedJenisId,
      selectedKategoriId,
      selectedKondisi,
      searchTerm,
      minYear,
      maxYear,
      minPrice,
      maxPrice
    ]
  });

  const totalFilteredValue = filteredItems.reduce((acc, curr) => acc + (curr.hargaPerolehan || 0), 0);

  const handleOpenBulkQr = async () => {
    setIsBulkQrModalOpen(true);
    setIsGeneratingBulk(true);
    const appSettings = dataStorage.getAppSettings();
    const itemsToProcess = filteredItems.slice(0, 30); // Top 30 for preview
    const results = await Promise.all(
      itemsToProcess.map(async asset => {
        const ruang = ruangList.find(r => r.id === asset.idRuang);
        const qrData = formatAssetQrText(
          asset,
          ruang?.namaRuang || asset.idRuang,
          settings?.appName || 'RS MEDIKA INSANI'
        );
        const url = await generateQrDataUrl(qrData);
        return { asset, qrUrl: url };
      })
    );
    setBulkQrItems(results);
    setIsGeneratingBulk(false);
  };

  const handleShowSingleQr = async (item: InventarisRuangan) => {
    setActiveQrAsset(item);
    const ruang = ruangList.find(r => r.id === item.idRuang);
    const qrData = formatAssetQrText(
      item,
      ruang?.namaRuang || item.idRuang,
      settings?.appName || 'RS MEDIKA INSANI'
    );
    const url = await generateQrDataUrl(qrData);
    setActiveQrUrl(url);
  };

  // Helper core function to execute export to Excel or CSV
  const executeExport = (
    format: 'excel' | 'csv' | 'json',
    scope: 'filtered' | 'all',
    template: 'full' | 'physical' | 'financial' = 'full'
  ) => {
    const targetItems = scope === 'filtered' ? filteredItems : inventaris;
    if (targetItems.length === 0) {
      alert('Tidak ada data inventaris untuk diekspor.');
      return;
    }

    const dateStr = new Date().toISOString().split('T')[0];
    const roomName = selectedRuangId !== 'ALL' ? (ruangList.find(r => r.id === selectedRuangId)?.namaRuang || selectedRuangId).replace(/[^a-zA-Z0-9]/g, '_') : 'SemuaRuang';
    const scopeLabel = scope === 'filtered' ? `Filter_${roomName}` : 'Semua_RS';
    const baseFilename = `Rekap_Inventaris_${settings?.systemShortName || 'RSMI'}_${scopeLabel}_${dateStr}`;

    if (format === 'json') {
      exportToJson(baseFilename, targetItems);
      showToast(`Berhasil mengekspor ${targetItems.length} aset ke format JSON`);
      setIsExportModalOpen(false);
      return;
    }

    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (template === 'full') {
      headers = [
        'No',
        'ID Barang (QR)',
        'No Urut',
        'Nama Barang',
        'Ruangan',
        'Jenis Aset',
        'Kategori',
        'Merk / Brand',
        'Supplier / Vendor',
        'Spesifikasi Teknis',
        'Nomor Seri (SN)',
        'Tahun Perolehan',
        'Nilai Perolehan (Rp)',
        'Kondisi Fisik',
        'Status Operasional',
        'Sumber Dana',
        'Tanggal Registrasi'
      ];

      rows = targetItems.map((item, idx) => [
        idx + 1,
        item.idBarang,
        item.noUrut,
        item.namaBarang,
        ruangList.find(r => r.id === item.idRuang)?.namaRuang || item.idRuang,
        jenisList.find(j => j.id === item.idJenis)?.namaJenis || item.idJenis,
        kategoriList.find(k => k.id === item.idKategori)?.namaKategori || item.idKategori,
        merkList.find(m => m.id === item.idMerk)?.namaMerk || item.idMerk || '-',
        supplierList.find(s => s.id === item.idSupplier)?.nama || item.idSupplier || '-',
        item.spesifikasi || '-',
        item.nomorSeri || '-',
        item.tahunPerolehan || '-',
        item.hargaPerolehan || 0,
        item.kondisi || 'Baik',
        item.status || 'Aktif Digunakan',
        item.sumberDana || 'APBD / Kas RS',
        item.tanggalInput || '-'
      ]);
    } else if (template === 'physical') {
      headers = [
        'No',
        'ID Barang (QR)',
        'Nama Barang',
        'Ruangan',
        'Jenis Aset',
        'Kategori',
        'Nomor Seri (SN)',
        'Kondisi Fisik',
        'Status Operasional',
        'Spesifikasi'
      ];

      rows = targetItems.map((item, idx) => [
        idx + 1,
        item.idBarang,
        item.namaBarang,
        ruangList.find(r => r.id === item.idRuang)?.namaRuang || item.idRuang,
        jenisList.find(j => j.id === item.idJenis)?.namaJenis || item.idJenis,
        kategoriList.find(k => k.id === item.idKategori)?.namaKategori || item.idKategori,
        item.nomorSeri || '-',
        item.kondisi || 'Baik',
        item.status || 'Aktif Digunakan',
        item.spesifikasi || '-'
      ]);
    } else {
      // financial template
      headers = [
        'No',
        'ID Barang (QR)',
        'Nama Barang',
        'Ruangan',
        'Tahun Perolehan',
        'Nilai Perolehan (Rp)',
        'Sumber Dana',
        'Kondisi Fisik',
        'Status Operasional'
      ];

      rows = targetItems.map((item, idx) => [
        idx + 1,
        item.idBarang,
        item.namaBarang,
        ruangList.find(r => r.id === item.idRuang)?.namaRuang || item.idRuang,
        item.tahunPerolehan || '-',
        item.hargaPerolehan || 0,
        item.sumberDana || 'APBD / Kas RS',
        item.kondisi || 'Baik',
        item.status || 'Aktif Digunakan'
      ]);
    }

    const totalValue = targetItems.reduce((acc, curr) => acc + (curr.hargaPerolehan || 0), 0);

    if (format === 'excel') {
      const activeRuangName = selectedRuangId !== 'ALL' ? (ruangList.find(r => r.id === selectedRuangId)?.namaRuang || selectedRuangId) : 'Seluruh Ruangan Rumah Sakit';
      const activeKategoriName = selectedKategoriId !== 'ALL' ? (kategoriList.find(k => k.id === selectedKategoriId)?.namaKategori || selectedKategoriId) : 'Semua Kategori';
      const activeJenisName = selectedJenisId !== 'ALL' ? (jenisList.find(j => j.id === selectedJenisId)?.namaJenis || selectedJenisId) : 'Semua Jenis';

      const metaInfo = [
        { label: 'Lingkup Data Rekapitulasi', value: scope === 'filtered' ? `Data Terfilter Aktif (${targetItems.length} Item)` : `Seluruh Master Inventaris RS (${targetItems.length} Item)` },
        { label: 'Filter Lokasi Ruangan', value: activeRuangName },
        { label: 'Filter Kategori & Jenis', value: `${activeKategoriName} | ${activeJenisName}` },
        { label: 'Filter Kondisi Fisik', value: selectedKondisi !== 'ALL' ? selectedKondisi : 'Semua Kondisi Fisik' },
        ...(minYear.trim() || maxYear.trim() ? [{ label: 'Rentang Tahun Perolehan', value: `${minYear.trim() || 'Awal'} s/d ${maxYear.trim() || 'Sekarang'}` }] : []),
        ...(minPrice.trim() || maxPrice.trim() ? [{ label: 'Rentang Harga Perolehan', value: `${minPrice.trim() ? formatRupiah(Number(minPrice)) : 'Rp 0'} s/d ${maxPrice.trim() ? formatRupiah(Number(maxPrice)) : 'Tanpa Batas'}` }] : []),
        { label: 'Total Aset Terdata', value: `${targetItems.length} Unit Barang` },
        { label: 'Total Estimasi Nilai Perolehan', value: formatRupiah(totalValue) }
      ];

      exportToExcel({
        filename: baseFilename,
        title: 'REKAPITULASI BUKU INDUK INVENTARIS & ASET RUMAH SAKIT',
        hospitalName: settings?.appName || 'RUMAH SAKIT MEDIKA INSANI',
        subtitle: settings?.appSubtitle || 'Sistem Informasi Manajemen Barang & Aset Rumah Sakit (SIMBARS)',
        unitName: 'Instalasi Pemeliharaan Sarana & Prasarana Rumah Sakit (IPSRS)',
        metaInfo,
        headers,
        rows,
        summaryRows: [
          {
            label: `TOTAL NILAI REKAPITULASI (${targetItems.length} UNIT ASET):`,
            value: formatRupiah(totalValue),
            colSpan: headers.length - 1
          }
        ]
      });

      showToast(`Berhasil mengunduh berkas Excel (${targetItems.length} aset)`);
    } else {
      // Export CSV
      exportToCsv(baseFilename, headers, rows);
      showToast(`Berhasil mengunduh berkas CSV (${targetItems.length} aset)`);
    }

    setIsExportModalOpen(false);
  };

  // Quick action shortcuts
  const handleQuickExportExcel = () => {
    executeExport('excel', 'filtered', 'full');
  };

  const handleQuickExportCsv = () => {
    executeExport('csv', 'filtered', 'full');
  };

  return (
    <div className="space-y-6">
      
      {/* Header Info */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <span>Rekapitulasi Data Inventaris Seluruh Rumah Sakit</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Data agregat terpadu seluruh aset ruangan. Dilengkapi generator QR Code stiker cetak massal.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleOpenBulkQr}
              className="px-3 py-1.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/70 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-blue-600" />
              <span>Cetak Stiker Massal</span>
            </button>

            {actionAccess.canExport && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Direct Excel Export */}
                <button
                  type="button"
                  onClick={handleQuickExportExcel}
                  className="px-3 py-1.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  title="Ekspor data hasil filter langsung ke format Microsoft Excel (.xls)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Export Excel</span>
                </button>

                {/* Direct CSV Export */}
                <button
                  type="button"
                  onClick={handleQuickExportCsv}
                  className="px-3 py-1.5 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  title="Ekspor data hasil filter langsung ke format CSV standar (.csv)"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-600" />
                  <span className="hidden sm:inline">Export CSV</span>
                </button>

                {/* Open Modal for Custom Scope & Template */}
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(true)}
                  className="px-2.5 py-1.5 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 font-medium text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                  title="Buka opsi ekspor kustom (Pilihan format, lingkup data, dan template kolom)"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden md:inline">Opsi Ekspor</span>
                </button>
              </div>
            )}

            {actionAccess.canPrint && (
              <button
                type="button"
                onClick={() => printDiv('print-all-inventaris-table', 'Rekapitulasi Inventaris RS Medika Insani')}
                className="px-3 py-1.5 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cetak Rekap</span>
              </button>
            )}
          </div>
        </div>

        {/* Multi-Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-2 border-t border-slate-100">
          {/* Ruang */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Ruangan:</label>
            <select
              value={selectedRuangId}
              onChange={e => setSelectedRuangId(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
            >
              <option value="ALL">Semua Ruang ({ruangList.length})</option>
              {ruangList.map(r => (
                <option key={r.id} value={r.id}>[{r.id}] {r.namaRuang}</option>
              ))}
            </select>
          </div>

          {/* Jenis */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Jenis Aset:</label>
            <select
              value={selectedJenisId}
              onChange={e => setSelectedJenisId(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
            >
              <option value="ALL">Semua Jenis ({jenisList.length})</option>
              {jenisList.map(j => (
                <option key={j.id} value={j.id}>[{j.id}] {j.namaJenis}</option>
              ))}
            </select>
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Kategori:</label>
            <select
              value={selectedKategoriId}
              onChange={e => setSelectedKategoriId(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
            >
              <option value="ALL">Semua Kategori</option>
              {kategoriList.map(k => (
                <option key={k.id} value={k.id}>[{k.id}] {k.namaKategori}</option>
              ))}
            </select>
          </div>

          {/* Kondisi */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Kondisi Fisik:</label>
            <select
              value={selectedKondisi}
              onChange={e => setSelectedKondisi(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
            >
              <option value="ALL">Semua Kondisi</option>
              <option value="Baik">Baik</option>
              <option value="Rusak Ringan">Rusak Ringan</option>
              <option value="Rusak Berat">Rusak Berat</option>
              <option value="Dalam Perbaikan">Dalam Perbaikan</option>
              <option value="Dimusnahkan">Dimusnahkan</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Cari Keyword:</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="ID, Nama, SN..."
                className="w-full pl-8 pr-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Action Toolbar & Advanced Filter Toggle */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsAdvancedFilterOpen(!isAdvancedFilterOpen)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isAdvancedFilterOpen || activeAdvancedFilterCount > 0
                  ? 'bg-blue-50 border-blue-300 text-blue-800 shadow-2xs'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
              <span>Filter Lanjutan</span>
              {activeAdvancedFilterCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-blue-600 text-white font-bold text-[10px]">
                  {activeAdvancedFilterCount}
                </span>
              )}
              {isAdvancedFilterOpen ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>

            {hasAnyActiveFilter && (
              <button
                type="button"
                onClick={handleResetAllFilters}
                className="px-2.5 py-1.5 rounded-lg text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="Reset semua filter pencarian dan filter lanjutan"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Semua Filter</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 self-end sm:self-auto">
            <span>Hasil: <strong className="text-slate-900">{filteredItems.length}</strong> aset</span>
            <span className="text-slate-300">|</span>
            <span>Total Nilai: <strong className="text-blue-700 font-semibold">{formatRupiah(totalFilteredValue)}</strong></span>
          </div>
        </div>

        {/* Panel Filter Lanjutan (Collapsible) */}
        {isAdvancedFilterOpen && (
          <div className="pt-2 border-t border-blue-100/80 mt-1">
            <div className="p-4 bg-gradient-to-br from-blue-50/50 via-slate-50/70 to-indigo-50/40 rounded-xl border border-blue-200 shadow-xs space-y-4">
              {/* Panel Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-blue-200/60">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                    <Filter className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                      <span>Panel Filter Lanjutan (Advanced Filter)</span>
                      {activeAdvancedFilterCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                          {activeAdvancedFilterCount} Kriteria Aktif
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Saring aset inventaris secara spesifik berdasarkan rentang tahun perolehan dan rentang harga perolehan (Rupiah).
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {activeAdvancedFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={handleResetAdvancedFilters}
                      className="px-2.5 py-1 rounded-md bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset Filter Lanjutan</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsAdvancedFilterOpen(false)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-white/80 cursor-pointer transition-colors"
                    title="Tutup panel filter lanjutan"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Grid: 2 Kolom (Rentang Tahun & Rentang Harga) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Kolom 1: Rentang Tahun Perolehan */}
                <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span>Rentang Tahun Perolehan</span>
                    </label>
                    {(minYear || maxYear) && (
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {minYear && maxYear ? `${minYear} - ${maxYear}` : minYear ? `≥ ${minYear}` : `≤ ${maxYear}`}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <span className="block text-[10px] font-semibold text-slate-500 mb-1">Dari Tahun (Min):</span>
                      <input
                        type="number"
                        min="1970"
                        max={new Date().getFullYear() + 5}
                        value={minYear}
                        onChange={e => setMinYear(e.target.value)}
                        placeholder="Contoh: 2018"
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] font-semibold text-slate-500 mb-1">Sampai Tahun (Max):</span>
                      <input
                        type="number"
                        min="1970"
                        max={new Date().getFullYear() + 5}
                        value={maxYear}
                        onChange={e => setMaxYear(e.target.value)}
                        placeholder={`Contoh: ${new Date().getFullYear()}`}
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Preset Buttons Tahun */}
                  <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-medium mr-1">Preset:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const y = new Date().getFullYear();
                        setMinYear(y.toString());
                        setMaxYear(y.toString());
                      }}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-600 text-[10px] font-medium transition-colors cursor-pointer"
                    >
                      Tahun Ini ({new Date().getFullYear()})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const y = new Date().getFullYear();
                        setMinYear((y - 2).toString());
                        setMaxYear(y.toString());
                      }}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-600 text-[10px] font-medium transition-colors cursor-pointer"
                    >
                      3 Thn Terakhir
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const y = new Date().getFullYear();
                        setMinYear((y - 4).toString());
                        setMaxYear(y.toString());
                      }}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-600 text-[10px] font-medium transition-colors cursor-pointer"
                    >
                      5 Thn Terakhir
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const y = new Date().getFullYear();
                        setMinYear((y - 9).toString());
                        setMaxYear(y.toString());
                      }}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-600 text-[10px] font-medium transition-colors cursor-pointer"
                    >
                      10 Thn Terakhir
                    </button>
                    {(minYear || maxYear) && (
                      <button
                        type="button"
                        onClick={() => {
                          setMinYear('');
                          setMaxYear('');
                        }}
                        className="px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-semibold transition-colors cursor-pointer"
                      >
                        Reset Tahun
                      </button>
                    )}
                  </div>
                </div>

                {/* Kolom 2: Rentang Harga Perolehan */}
                <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-emerald-600" />
                      <span>Rentang Nilai Harga Perolehan</span>
                    </label>
                    {(minPrice || maxPrice) && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {minPrice && maxPrice 
                          ? `${formatRupiah(Number(minPrice))} - ${formatRupiah(Number(maxPrice))}`
                          : minPrice 
                            ? `≥ ${formatRupiah(Number(minPrice))}` 
                            : `≤ ${formatRupiah(Number(maxPrice))}`}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <span className="block text-[10px] font-semibold text-slate-500 mb-1">Harga Minimum (Rp):</span>
                      <input
                        type="number"
                        min="0"
                        step="100000"
                        value={minPrice}
                        onChange={e => setMinPrice(e.target.value)}
                        placeholder="Contoh: 0"
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
                      />
                      {minPrice && !isNaN(Number(minPrice)) && Number(minPrice) > 0 && (
                        <div className="text-[10px] text-emerald-700 font-semibold mt-1 truncate">
                          {formatRupiah(Number(minPrice))}
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="block text-[10px] font-semibold text-slate-500 mb-1">Harga Maksimum (Rp):</span>
                      <input
                        type="number"
                        min="0"
                        step="100000"
                        value={maxPrice}
                        onChange={e => setMaxPrice(e.target.value)}
                        placeholder="Contoh: 50.000.000"
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
                      />
                      {maxPrice && !isNaN(Number(maxPrice)) && Number(maxPrice) > 0 && (
                        <div className="text-[10px] text-emerald-700 font-semibold mt-1 truncate">
                          {formatRupiah(Number(maxPrice))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Preset Buttons Harga */}
                  <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-medium mr-1">Preset:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setMinPrice('');
                        setMaxPrice('10000000');
                      }}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-600 text-[10px] font-medium transition-colors cursor-pointer"
                    >
                      &lt; 10 Juta
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMinPrice('10000000');
                        setMaxPrice('50000000');
                      }}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-600 text-[10px] font-medium transition-colors cursor-pointer"
                    >
                      10 - 50 Juta
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMinPrice('50000000');
                        setMaxPrice('250000000');
                      }}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-600 text-[10px] font-medium transition-colors cursor-pointer"
                    >
                      50 - 250 Juta
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMinPrice('250000000');
                        setMaxPrice('');
                      }}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-600 text-[10px] font-medium transition-colors cursor-pointer"
                    >
                      &gt; 250 Juta
                    </button>
                    {(minPrice || maxPrice) && (
                      <button
                        type="button"
                        onClick={() => {
                          setMinPrice('');
                          setMaxPrice('');
                        }}
                        className="px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-semibold transition-colors cursor-pointer"
                      >
                        Reset Harga
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Advanced Filter Chips Bar */}
        {activeAdvancedFilterCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100 text-xs">
            <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
              <Filter className="w-3 h-3 text-blue-600" />
              <span>Filter Lanjutan Aktif:</span>
            </span>

            {(minYear || maxYear) && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span>
                  Tahun: {minYear && maxYear ? `${minYear} - ${maxYear}` : minYear ? `≥ ${minYear}` : `≤ ${maxYear}`}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setMinYear('');
                    setMaxYear('');
                  }}
                  className="ml-0.5 hover:text-blue-900 cursor-pointer"
                  title="Hapus filter rentang tahun"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {(minPrice || maxPrice) && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                <Coins className="w-3.5 h-3.5 text-emerald-500" />
                <span>
                  Harga: {minPrice && maxPrice 
                    ? `${formatRupiah(Number(minPrice))} - ${formatRupiah(Number(maxPrice))}`
                    : minPrice 
                      ? `≥ ${formatRupiah(Number(minPrice))}` 
                      : `≤ ${formatRupiah(Number(maxPrice))}`}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setMinPrice('');
                    setMaxPrice('');
                  }}
                  className="ml-0.5 hover:text-emerald-900 cursor-pointer"
                  title="Hapus filter rentang harga"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={handleResetAdvancedFilters}
              className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold hover:underline cursor-pointer ml-1"
            >
              Hapus Filter Lanjutan
            </button>
          </div>
        )}
      </div>

      {/* Aggregate Table */}
      <div id="print-all-inventaris-table" className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        
        {/* Printable Official Header Terstandarisasi */}
        <div className="hidden print:block p-6 print-avoid-break">
          <DocumentHeader
            settings={settings}
            title="REKAPITULASI BUKU INDUK INVENTARIS & ASET RUMAH SAKIT"
            documentNumber={`Nomor: REKAP-ASET/${settings.systemShortName || 'RSMI'}/${new Date().getFullYear()}`}
            unitName="Instalasi Pemeliharaan Sarana & Prasarana Rumah Sakit (IPSRS) & Pengelola Barang Milik RS"
            extraMeta={
              <div className="flex flex-wrap justify-between items-center text-[11px] text-slate-600 font-medium px-2 pt-1 gap-x-4 gap-y-1">
                <span>Filter Ruang: <strong>{selectedRuangId !== 'ALL' ? (ruangList.find(r => r.id === selectedRuangId)?.namaRuang || selectedRuangId) : 'Seluruh Ruangan RS'}</strong></span>
                {(minYear || maxYear) && (
                  <span>Tahun Perolehan: <strong>{minYear && maxYear ? `${minYear} - ${maxYear}` : minYear ? `≥ ${minYear}` : `≤ ${maxYear}`}</strong></span>
                )}
                {(minPrice || maxPrice) && (
                  <span>Rentang Nilai: <strong>{minPrice && maxPrice ? `${formatRupiah(Number(minPrice))} - ${formatRupiah(Number(maxPrice))}` : minPrice ? `≥ ${formatRupiah(Number(minPrice))}` : `≤ ${formatRupiah(Number(maxPrice))}`}</strong></span>
                )}
                <span>Total Aset Terdaftar: <strong>{filteredItems.length} Item</strong></span>
                <span>Tgl Cetak: <strong>{formatDateIndo(new Date().toISOString())}</strong></span>
              </div>
            }
          />
        </div>

        {/* DESKTOP TABLE VIEW (Visible on screens >= 768px) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">Foto & QR</th>
                <th className="py-2.5 px-3">ID Barang</th>
                <th className="py-2.5 px-3">Nama Peralatan / Aset</th>
                <th className="py-2.5 px-3">Ruangan</th>
                <th className="py-2.5 px-3">Jenis & Kategori</th>
                <th className="py-2.5 px-3">Merk & SN</th>
                <th className="py-2.5 px-3">Tahun & Nilai</th>
                <th className="py-2.5 px-3">Kondisi</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right print:hidden">Aksi</th>
              </tr>
            </thead>
            
            {/* Screen Tbody (Lazy Loaded for fast rendering) */}
            <tbody className="divide-y divide-slate-100 text-slate-700 print:hidden">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 text-xs">
                    Tidak ada inventaris yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                <>
                  {displayedItems.map(item => {
                    const ruang = ruangList.find(r => r.id === item.idRuang);
                    const jenis = jenisList.find(j => j.id === item.idJenis);
                    const kategori = kategoriList.find(k => k.id === item.idKategori);
                    const merk = merkList.find(m => m.id === item.idMerk);

                    return (
                      <tr key={item.idBarang} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            {item.fotoUrl ? (
                              <button
                                type="button"
                                onClick={() => setLightboxPhoto({
                                  url: item.fotoUrl!,
                                  caption: item.namaBarang,
                                  kondisi: item.kondisi,
                                  assetId: item.idBarang,
                                  assetName: item.namaBarang,
                                })}
                                className="relative group w-8 h-8 rounded border border-slate-200 overflow-hidden bg-slate-100 shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all"
                                title="Klik untuk memperbesar foto aset"
                              >
                                <img src={item.fotoUrl} alt={item.namaBarang} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                  <Maximize2 className="w-3 h-3" />
                                </div>
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => handleShowSingleQr(item)}
                              className="p-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/60 cursor-pointer"
                              title="Lihat QR Code"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDetailAsset(item);
                              setIsDetailModalOpen(true);
                            }}
                            className="font-mono font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200/50 block w-max text-[11px] text-left cursor-pointer transition-colors"
                            title="Klik untuk melihat Detail & Riwayat Log (Audit Trail)"
                          >
                            {item.idBarang}
                          </button>
                        </td>

                        <td className="py-2.5 px-3 max-w-xs">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDetailAsset(item);
                              setIsDetailModalOpen(true);
                            }}
                            className="font-semibold text-slate-900 hover:text-blue-600 text-left transition-colors cursor-pointer block truncate max-w-full"
                            title="Klik untuk melihat Detail & Riwayat Log (Audit Trail)"
                          >
                            {item.namaBarang}
                          </button>
                          <div className="text-[11px] text-slate-500 line-clamp-1">{item.spesifikasi || '-'}</div>
                        </td>

                        <td className="py-2.5 px-3">
                          <span className="font-medium text-slate-800">{ruang?.namaRuang || item.idRuang}</span>
                          <div className="text-[10px] text-slate-400">{ruang?.gedungLantai}</div>
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="font-medium text-slate-700">{jenis?.namaJenis || item.idJenis}</div>
                          <div className="text-[10px] text-slate-400">{kategori?.namaKategori || item.idKategori}</div>
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="font-medium text-slate-700">{merk?.namaMerk || item.idMerk}</div>
                          <div className="text-[10px] font-mono text-slate-400">SN: {item.nomorSeri || '-'}</div>
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">{formatRupiah(item.hargaPerolehan)}</div>
                          <div className="text-[10px] text-slate-400">Th {item.tahunPerolehan} • {item.sumberDana}</div>
                        </td>

                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                            item.kondisi === 'Baik' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            item.kondisi === 'Rusak Ringan' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            item.kondisi === 'Rusak Berat' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {item.kondisi}
                          </span>
                        </td>

                        <td className="py-2.5 px-3">
                          <span className="text-[11px] font-medium text-slate-600">
                            {item.status}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-right print:hidden">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDetailAsset(item);
                              setIsDetailModalOpen(true);
                            }}
                            className="p-1.5 rounded text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors cursor-pointer inline-flex items-center gap-1 text-[11px] font-medium"
                            title="Lihat Detail & Riwayat Log (Audit Trail)"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Detail</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {hasMore && (
                    <tr ref={setSentinel} className="border-0">
                      <td colSpan={9} className="py-3 text-center bg-slate-50/70 text-slate-500 text-xs">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                          <span>Memuat batch data inventaris berikutnya...</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>

            {/* Print Tbody (Complete dataset without pagination) */}
            <tbody className="divide-y divide-slate-200 text-slate-700 hidden print:table-row-group">
              {filteredItems.map(item => {
                const ruang = ruangList.find(r => r.id === item.idRuang);
                const jenis = jenisList.find(j => j.id === item.idJenis);
                const kategori = kategoriList.find(k => k.id === item.idKategori);
                const merk = merkList.find(m => m.id === item.idMerk);

                return (
                  <tr key={`print-${item.idBarang}`}>
                    <td className="py-1 px-2 font-mono text-[10px]">{item.idBarang}</td>
                    <td className="py-1 px-2 font-mono text-[10px]">{item.idBarang}</td>
                    <td className="py-1 px-2">
                      <div className="font-semibold text-[11px]">{item.namaBarang}</div>
                      <div className="text-[9px] text-slate-500">{item.spesifikasi || '-'}</div>
                    </td>
                    <td className="py-1 px-2 text-[10px]">{ruang?.namaRuang || item.idRuang}</td>
                    <td className="py-1 px-2 text-[10px]">{jenis?.namaJenis || item.idJenis}</td>
                    <td className="py-1 px-2 text-[10px]">{merk?.namaMerk || item.idMerk} (SN: {item.nomorSeri || '-'})</td>
                    <td className="py-1 px-2 text-[10px]">{formatRupiah(item.hargaPerolehan)} (Th {item.tahunPerolehan})</td>
                    <td className="py-1 px-2 text-[10px]">{item.kondisi}</td>
                    <td className="py-1 px-2 text-[10px]">{item.status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARD VIEW (Optimized for screens < 768px) */}
        <div className="block md:hidden p-3 bg-slate-50/50 print:hidden">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center bg-white rounded-lg border border-slate-200 p-4 text-slate-400 text-xs">
              Tidak ada inventaris yang sesuai dengan filter.
            </div>
          ) : (
            <div className="space-y-3">
              {displayedItems.map(item => {
                const ruang = ruangList.find(r => r.id === item.idRuang);
                const jenis = jenisList.find(j => j.id === item.idJenis);
                const kategori = kategoriList.find(k => k.id === item.idKategori);
                const merk = merkList.find(m => m.id === item.idMerk);

                return (
                  <div 
                    key={item.idBarang}
                    className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs space-y-3 transition-all hover:border-slate-300"
                  >
                    {/* Top: ID Badge + Condition + Status */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {item.idBarang}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.kondisi === 'Baik' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          item.kondisi === 'Rusak Ringan' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          item.kondisi === 'Rusak Berat' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {item.kondisi}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-medium">
                          {item.status}
                        </span>
                      </div>
                    </div>

                    {/* Name & Specs */}
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm leading-snug">
                        {item.namaBarang}
                      </h4>
                      {item.spesifikasi && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                          {item.spesifikasi}
                        </p>
                      )}
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                      <div>
                        <span className="text-[10px] font-medium text-slate-400 block">Ruangan</span>
                        <span className="font-semibold text-slate-800 text-xs block truncate">{ruang?.namaRuang || item.idRuang}</span>
                        <span className="text-[10px] text-slate-500 block truncate">{ruang?.gedungLantai || '-'}</span>
                      </div>

                      <div>
                        <span className="text-[10px] font-medium text-slate-400 block">Jenis & Kategori</span>
                        <span className="font-semibold text-slate-800 text-xs block truncate">{jenis?.namaJenis || item.idJenis}</span>
                        <span className="text-[10px] text-slate-500 block truncate">{kategori?.namaKategori || item.idKategori}</span>
                      </div>

                      <div className="pt-1.5 border-t border-slate-200/60">
                        <span className="text-[10px] font-medium text-slate-400 block">Merk & SN</span>
                        <span className="font-semibold text-slate-800 text-xs block truncate">{merk?.namaMerk || item.idMerk}</span>
                        <span className="text-[10px] font-mono text-slate-500 block truncate">SN: {item.nomorSeri || '-'}</span>
                      </div>

                      <div className="pt-1.5 border-t border-slate-200/60">
                        <span className="text-[10px] font-medium text-slate-400 block">Nilai Perolehan</span>
                        <span className="font-bold text-slate-900 text-xs block">{formatRupiah(item.hargaPerolehan)}</span>
                        <span className="text-[10px] text-slate-500 block">Th {item.tahunPerolehan} ({item.sumberDana})</span>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="pt-1 grid grid-cols-2 gap-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDetailAsset(item);
                          setIsDetailModalOpen(true);
                        }}
                        className="w-full py-2 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/70 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[40px]"
                      >
                        <History className="w-4 h-4" />
                        <span>Riwayat Log</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleShowSingleQr(item)}
                        className="w-full py-2 px-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/70 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[40px]"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>Lihat QR</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {hasMore && (
                <div ref={setSentinel} className="py-3 text-center bg-white rounded-xl border border-slate-200 p-3 shadow-2xs">
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    <span>Memuat kartu data aset berikutnya...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Lazy Loading Interactive Control & Progress Bar */}
        {filteredItems.length > 0 && (
          <div className="px-4 py-3 bg-slate-50/90 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-semibold">
                <Zap className="w-3 h-3 text-blue-600" />
                Lazy Loading Aktif
              </span>
              <span className="text-slate-600 font-medium">
                Menampilkan <b>{displayedItems.length}</b> dari <b>{filteredItems.length}</b> aset
              </span>
            </div>

            {hasMore ? (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => loadMore(30)}
                  disabled={isLoadingMore}
                  className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
                >
                  {isLoadingMore ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                  <span>Muat +30 Baris</span>
                </button>
                <button
                  type="button"
                  onClick={loadAll}
                  className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/70 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Tampilkan Semua ({filteredItems.length})
                </button>
              </div>
            ) : (
              <span className="text-emerald-700 font-medium text-[11px] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Seluruh data ({filteredItems.length} aset) telah dimuat
              </span>
            )}
          </div>
        )}

        {/* Table Footer Stats */}
        <div className="p-4 bg-white border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>Total Nilai Akumulasi Hasil Filter:</span>
          <span className="font-bold text-blue-700 text-sm">
            {formatRupiah(totalFilteredValue)}
          </span>
        </div>

        {/* Printable Signatures with TTE QR Codes */}
        <div className="hidden print:grid grid-cols-2 gap-8 p-6 text-center text-xs border-t-2 border-slate-300 print-avoid-break">
          <QrSignature
            role="Pengurus Barang / Petugas Aset RS"
            name="Agus Triono, AMd.TEM"
            nip="19890412 201402 1 004"
            docName="Rekapitulasi Buku Induk Inventaris RS"
            docNumber={`REKAP-ASET-${new Date().getFullYear()}`}
            hospitalName={settings.appName}
            locationDate={formatDateIndo(new Date().toISOString())}
          />

          <QrSignature
            role="Kepala Instalasi IPSRS"
            name="Ir. H. Rahardian, MT"
            nip="19820315 200804 1 002"
            docName="Rekapitulasi Buku Induk Inventaris RS"
            docNumber={`REKAP-ASET-${new Date().getFullYear()}`}
            hospitalName={settings.appName}
            locationDate={formatDateIndo(new Date().toISOString())}
          />
        </div>
      </div>

      {/* BULK QR STICKER PRINT MODAL */}
      {isBulkQrModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full p-5 shadow-xl border border-slate-200 max-h-[90vh] flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <QrCode className="w-4 h-4 text-blue-600" />
                <span>Cetak Lembar Stiker QR Code Massal ({bulkQrItems.length} Stiker)</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsBulkQrModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Grid Container for Print */}
            <div id="bulk-stickers-container" className="flex-1 overflow-y-auto p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {isGeneratingBulk ? (
                <div className="col-span-full py-12 text-center text-xs text-slate-500">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  Membuat batch stiker QR Code inventaris...
                </div>
              ) : (
                bulkQrItems.map(({ asset, qrUrl }) => (
                  <div
                    key={asset.idBarang}
                    className="p-3 rounded-lg border border-slate-200 bg-white space-y-2 shadow-2xs break-inside-avoid"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                      <span className="font-bold text-[9px] text-slate-900">{settings.appName || 'RS MEDIKA INSANI'}</span>
                      <span className="font-mono text-[8px] text-slate-500">{asset.tahunPerolehan}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <img src={qrUrl} alt="QR" className="w-14 h-14 shrink-0 border border-slate-200 rounded p-0.5" />
                      <div className="overflow-hidden">
                        <div className="text-[10px] font-bold text-slate-900 line-clamp-1">{asset.namaBarang}</div>
                        <div className="text-[9px] font-mono font-bold text-blue-700">{asset.idBarang}</div>
                        <div className="text-[8px] text-slate-500 truncate">
                          Ruang: {ruangList.find(r => r.id === asset.idRuang)?.namaRuang || asset.idRuang}
                        </div>
                        <div className="text-[8px] font-mono text-slate-400">SN: {asset.nomorSeri}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsBulkQrModalOpen(false)}
                className="px-3.5 py-1.5 rounded-md border border-slate-200 text-slate-600 font-medium text-xs hover:bg-slate-50 cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => printDiv('bulk-stickers-container', 'Lembar Stiker QR Code RS Medika Insani')}
                className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Lembar Stiker</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE QR MODAL */}
      {activeQrAsset && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                <QrCode className="w-4 h-4 text-blue-600" />
                <span>Identitas & Stiker QR Barcode Aset</span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveQrAsset(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Sticker Container */}
            <div id="printable-single-qr" className="p-3.5 rounded-lg border border-slate-300 bg-slate-50/70 text-slate-900 space-y-2.5">
              <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AppLogo settings={settings} size="sm" />
                  <div>
                    <div className="font-bold text-xs tracking-tight text-slate-900">
                      {settings.appName || 'RS MEDIKA INSANI'}
                    </div>
                    <div className="text-[8px] text-slate-500 font-medium uppercase tracking-wider">LABEL INVENTARIS RESMI</div>
                  </div>
                </div>
                <div className="text-right font-mono text-[9px] font-semibold text-blue-800">
                  {activeQrAsset.tahunPerolehan} • {activeQrAsset.sumberDana}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <img
                  src={activeQrUrl}
                  alt="QR Code"
                  className="w-20 h-20 border border-slate-200 rounded p-1 bg-white shrink-0"
                />

                <div className="space-y-0.5 overflow-hidden">
                  <div className="font-bold text-xs text-slate-900 leading-tight">
                    {activeQrAsset.namaBarang}
                  </div>
                  <div className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-1 py-0.5 rounded inline-block border border-blue-200/50">
                    {activeQrAsset.idBarang}
                  </div>
                  <div className="text-[10px] text-slate-600">
                    Ruang: <b>{ruangList.find(r => r.id === activeQrAsset.idRuang)?.namaRuang || activeQrAsset.idRuang}</b>
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono">
                    SN: {activeQrAsset.nomorSeri || '-'}
                  </div>
                </div>
              </div>

              <div className="text-center text-[8px] text-slate-400 border-t border-slate-200 pt-1">
                Dilarang memindahkan label tanpa izin resmi IPSRS
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <a
                href={activeQrUrl}
                download={`QR_${activeQrAsset.idBarang}.png`}
                className="px-3 py-1.5 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh PNG</span>
              </a>

              <button
                type="button"
                onClick={() => printDiv('printable-single-qr', `QR-${activeQrAsset.idBarang}`)}
                className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Label</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ASSET DETAIL & AUDIT TRAIL MODAL */}
      <AssetDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedDetailAsset(null);
        }}
        asset={selectedDetailAsset}
        onAssetUpdated={() => {
          setInventaris(dataStorage.getInventarisRuangan());
        }}
        actionAccess={actionAccess}
      />

      {/* PHOTO LIGHTBOX MODAL */}
      <PhotoLightboxModal
        isOpen={Boolean(lightboxPhoto)}
        onClose={() => setLightboxPhoto(null)}
        imageUrl={lightboxPhoto?.url || ''}
        caption={lightboxPhoto?.caption}
        tipeFoto={lightboxPhoto?.tipeFoto}
        kondisi={lightboxPhoto?.kondisi}
        timestamp={lightboxPhoto?.timestamp}
        petugas={lightboxPhoto?.petugas}
        assetId={lightboxPhoto?.assetId}
        assetName={lightboxPhoto?.assetName}
      />

      {/* DEDICATED EXPORT MODAL */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-white/10 text-white backdrop-blur-xs">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight text-white">
                    Ekspor & Rekapitulasi Data Inventaris RS
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Unduh data inventaris untuk arsip offline, pengolahan spreadsheet Excel/CSV, atau pelaporan.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 overflow-y-auto">
              
              {/* Step 1: Format Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  1. Pilih Format Berkas Ekspor:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Excel */}
                  <button
                    type="button"
                    onClick={() => setExportFormat('excel')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      exportFormat === 'excel'
                        ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="p-1.5 rounded-md bg-emerald-100 text-emerald-700">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      {exportFormat === 'excel' && (
                        <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                          <Check className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-xs">Microsoft Excel</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                      Format .xls dengan kop resmi & total nilai
                    </div>
                  </button>

                  {/* CSV */}
                  <button
                    type="button"
                    onClick={() => setExportFormat('csv')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      exportFormat === 'csv'
                        ? 'border-blue-500 bg-blue-50/70 text-blue-950 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="p-1.5 rounded-md bg-blue-100 text-blue-700">
                        <FileText className="w-4 h-4" />
                      </div>
                      {exportFormat === 'csv' && (
                        <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                          <Check className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-xs">Standard CSV</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                      Format .csv UTF-8 universal & database
                    </div>
                  </button>

                  {/* JSON */}
                  <button
                    type="button"
                    onClick={() => setExportFormat('json')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      exportFormat === 'json'
                        ? 'border-purple-500 bg-purple-50/70 text-purple-950 ring-2 ring-purple-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="p-1.5 rounded-md bg-purple-100 text-purple-700">
                        <FileCode className="w-4 h-4" />
                      </div>
                      {exportFormat === 'json' && (
                        <span className="w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">
                          <Check className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-xs">JSON Backup</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                      Data terstruktur mentah untuk migrasi
                    </div>
                  </button>
                </div>
              </div>

              {/* Step 2: Data Scope */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  2. Pilih Lingkup Data:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Filtered Scope */}
                  <button
                    type="button"
                    onClick={() => setExportScope('filtered')}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      exportScope === 'filtered'
                        ? 'border-blue-500 bg-blue-50/60 text-blue-950 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-blue-600" />
                        Data Terfilter Saat Ini
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                        {filteredItems.length} Item
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Sesuai filter ruangan <b>[{selectedRuangId !== 'ALL' ? (ruangList.find(r => r.id === selectedRuangId)?.namaRuang || selectedRuangId) : 'Semua Ruang'}]</b>, jenis, kategori, & keyword saat ini.
                    </p>
                  </button>

                  {/* All Master Scope */}
                  <button
                    type="button"
                    onClick={() => setExportScope('all')}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      exportScope === 'all'
                        ? 'border-blue-500 bg-blue-50/60 text-blue-950 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                        Seluruh Master RS
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full">
                        {inventaris.length} Item
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Mencakup seluruh data buku induk inventaris dan aset di seluruh ruangan rumah sakit tanpa batasan filter.
                    </p>
                  </button>
                </div>
              </div>

              {/* Step 3: Column Template Selection (Only for Excel / CSV) */}
              {exportFormat !== 'json' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    3. Format Kolom & Template Rekapitulasi:
                  </label>
                  <div className="space-y-2">
                    <label className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      exportTemplate === 'full' ? 'border-blue-500 bg-blue-50/40 text-blue-950' : 'border-slate-200 bg-white text-slate-700'
                    }`}>
                      <input
                        type="radio"
                        name="exportTemplate"
                        checked={exportTemplate === 'full'}
                        onChange={() => setExportTemplate('full')}
                        className="mt-0.5 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          Standar Lengkap (17 Kolom)
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Semua atribut: ID (QR), No Urut, Nama, Ruang, Jenis, Kategori, Merk, Vendor, Spesifikasi, SN, Tahun, Nilai (Rp), Kondisi, Status, Sumber Dana, Tgl Registrasi.
                        </div>
                      </div>
                    </label>

                    <label className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      exportTemplate === 'physical' ? 'border-blue-500 bg-blue-50/40 text-blue-950' : 'border-slate-200 bg-white text-slate-700'
                    }`}>
                      <input
                        type="radio"
                        name="exportTemplate"
                        checked={exportTemplate === 'physical'}
                        onChange={() => setExportTemplate('physical')}
                        className="mt-0.5 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          Rekapitulasi Fisik & Lokasi Ruangan (10 Kolom)
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Fokus opname fisik: ID Barang, Nama Barang, Lokasi Ruang, Jenis, Kategori, Nomor Seri, Kondisi Fisik, Status, dan Spesifikasi.
                        </div>
                      </div>
                    </label>

                    <label className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      exportTemplate === 'financial' ? 'border-blue-500 bg-blue-50/40 text-blue-950' : 'border-slate-200 bg-white text-slate-700'
                    }`}>
                      <input
                        type="radio"
                        name="exportTemplate"
                        checked={exportTemplate === 'financial'}
                        onChange={() => setExportTemplate('financial')}
                        className="mt-0.5 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          Laporan Nilai Akuntansi & Keuangan Aset BMN/BMS (9 Kolom)
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Fokus valuasi aset: ID Barang, Nama Barang, Ruangan, Tahun Perolehan, Nilai Perolehan (Rp), Sumber Dana, Kondisi, dan Status.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Summary Box */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="font-semibold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-blue-600" />
                    Ringkasan Berkas yang Akan Dihasilkan:
                  </span>
                  <span className="text-[11px] font-mono font-bold text-slate-600">
                    Format: {exportFormat.toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div>
                    <span className="text-slate-500">Jumlah Aset:</span>{' '}
                    <strong className="text-slate-800">
                      {exportScope === 'filtered' ? filteredItems.length : inventaris.length} Item
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Total Nilai Aset:</span>{' '}
                    <strong className="text-emerald-700 font-bold">
                      {formatRupiah(
                        (exportScope === 'filtered' ? filteredItems : inventaris).reduce(
                          (acc, curr) => acc + (curr.hargaPerolehan || 0),
                          0
                        )
                      )}
                    </strong>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={() => executeExport(exportFormat, exportScope, exportTemplate)}
                className={`px-5 py-2 rounded-lg text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer ${
                  exportFormat === 'excel'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : exportFormat === 'csv'
                    ? 'bg-blue-600 hover:bg-blue-500'
                    : 'bg-purple-600 hover:bg-purple-500'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>Unduh Berkas Sekarang ({exportFormat === 'excel' ? '.xls' : exportFormat === 'csv' ? '.csv' : '.json'})</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-slate-700 animate-in slide-in-from-bottom-3 duration-200">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-xs font-medium text-slate-100">
            {toastMessage}
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

    </div>
  );
};
