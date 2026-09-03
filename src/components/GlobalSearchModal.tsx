import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  InventarisRuangan, 
  RuangInventaris, 
  KategoriInventaris, 
  JenisInventaris, 
  MerkInventaris,
  KondisiBarang,
  StatusBarang,
  AppSettings
} from '../types/inventory';
import { dataStorage } from '../services/dataStorage';
import { formatRupiah, formatDateIndo } from '../utils/formatters';
import { 
  Search, 
  X, 
  Filter, 
  DoorOpen, 
  Building2, 
  Tag, 
  Layers, 
  QrCode, 
  ExternalLink, 
  Wrench, 
  ArrowRightLeft, 
  Copy, 
  Check, 
  Sparkles, 
  SlidersHorizontal, 
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Clock,
  Eye,
  DollarSign,
  Box
} from 'lucide-react';

export type SearchFieldTarget = 'all' | 'name' | 'id' | 'category' | 'room';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInspectAsset?: (asset: InventarisRuangan) => void;
  onNavigateToTab?: (tab: string, context?: { assetId?: string; roomId?: string; categoryId?: string; search?: string }) => void;
  appSettings?: AppSettings;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onInspectAsset,
  onNavigateToTab,
  appSettings,
}) => {
  const [query, setQuery] = useState('');
  const [fieldTarget, setFieldTarget] = useState<SearchFieldTarget>('all');
  const [selectedRuangId, setSelectedRuangId] = useState<string>('ALL');
  const [selectedKategoriId, setSelectedKategoriId] = useState<string>('ALL');
  const [selectedJenisId, setSelectedJenisId] = useState<string>('ALL');
  const [selectedKondisi, setSelectedKondisi] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Load master data from storage
  const [allAssets, setAllAssets] = useState<InventarisRuangan[]>([]);
  const [ruangList, setRuangList] = useState<RuangInventaris[]>([]);
  const [kategoriList, setKategoriList] = useState<KategoriInventaris[]>([]);
  const [jenisList, setJenisList] = useState<JenisInventaris[]>([]);
  const [merkList, setMerkList] = useState<MerkInventaris[]>([]);

  useEffect(() => {
    if (isOpen) {
      setAllAssets(dataStorage.getInventarisRuangan());
      setRuangList(dataStorage.getRuang());
      setKategoriList(dataStorage.getKategori());
      setJenisList(dataStorage.getJenis());
      setMerkList(dataStorage.getMerk());

      // Auto-focus input
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Keyboard shortcut listener (ESC to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResetFilters = () => {
    setQuery('');
    setFieldTarget('all');
    setSelectedRuangId('ALL');
    setSelectedKategoriId('ALL');
    setSelectedJenisId('ALL');
    setSelectedKondisi('ALL');
    setSelectedStatus('ALL');
  };

  // Helper map lookups
  const ruangMap = useMemo(() => {
    const map = new Map<string, RuangInventaris>();
    ruangList.forEach(r => map.set(r.id, r));
    return map;
  }, [ruangList]);

  const kategoriMap = useMemo(() => {
    const map = new Map<string, KategoriInventaris>();
    kategoriList.forEach(k => map.set(k.id, k));
    return map;
  }, [kategoriList]);

  const jenisMap = useMemo(() => {
    const map = new Map<string, JenisInventaris>();
    jenisList.forEach(j => map.set(j.id, j));
    return map;
  }, [jenisList]);

  const merkMap = useMemo(() => {
    const map = new Map<string, MerkInventaris>();
    merkList.forEach(m => map.set(m.id, m));
    return map;
  }, [merkList]);

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    const q = query.trim().toLowerCase();

    return allAssets.filter(item => {
      // 1. Room filter
      if (selectedRuangId !== 'ALL' && item.idRuang !== selectedRuangId) {
        return false;
      }

      // 2. Kategori filter
      if (selectedKategoriId !== 'ALL' && item.idKategori !== selectedKategoriId) {
        return false;
      }

      // 3. Jenis filter
      if (selectedJenisId !== 'ALL' && item.idJenis !== selectedJenisId) {
        return false;
      }

      // 4. Kondisi filter
      if (selectedKondisi !== 'ALL' && item.kondisi !== selectedKondisi) {
        return false;
      }

      // 5. Status filter
      if (selectedStatus !== 'ALL' && item.status !== selectedStatus) {
        return false;
      }

      // 6. Query Match
      if (!q) return true;

      const nama = (item.namaBarang || '').toLowerCase();
      const id = (item.idBarang || '').toLowerCase();
      const serial = (item.nomorSeri || '').toLowerCase();
      const spek = (item.spesifikasi || '').toLowerCase();
      const ruangObj = ruangMap.get(item.idRuang);
      const ruangName = (ruangObj?.namaRuang || '').toLowerCase();
      const katObj = kategoriMap.get(item.idKategori);
      const katName = (katObj?.namaKategori || '').toLowerCase();
      const jenisObj = jenisMap.get(item.idJenis);
      const jenisName = (jenisObj?.namaJenis || '').toLowerCase();
      const merkObj = merkMap.get(item.idMerk);
      const merkName = (merkObj?.namaMerk || '').toLowerCase();

      switch (fieldTarget) {
        case 'name':
          return nama.includes(q) || merkName.includes(q);
        case 'id':
          return id.includes(q) || serial.includes(q);
        case 'category':
          return katName.includes(q) || jenisName.includes(q);
        case 'room':
          return ruangName.includes(q) || item.idRuang.toLowerCase().includes(q);
        case 'all':
        default:
          return (
            nama.includes(q) ||
            id.includes(q) ||
            serial.includes(q) ||
            spek.includes(q) ||
            ruangName.includes(q) ||
            item.idRuang.toLowerCase().includes(q) ||
            katName.includes(q) ||
            jenisName.includes(q) ||
            merkName.includes(q)
          );
      }
    });
  }, [
    allAssets,
    query,
    fieldTarget,
    selectedRuangId,
    selectedKategoriId,
    selectedJenisId,
    selectedKondisi,
    selectedStatus,
    ruangMap,
    kategoriMap,
    jenisMap,
    merkMap,
  ]);

  if (!isOpen) return null;

  const activeFiltersCount = 
    (selectedRuangId !== 'ALL' ? 1 : 0) +
    (selectedKategoriId !== 'ALL' ? 1 : 0) +
    (selectedJenisId !== 'ALL' ? 1 : 0) +
    (selectedKondisi !== 'ALL' ? 1 : 0) +
    (selectedStatus !== 'ALL' ? 1 : 0) +
    (fieldTarget !== 'all' ? 1 : 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-3 sm:p-4 md:p-6 animate-fadeIn">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-5xl my-4 sm:my-8 overflow-hidden flex flex-col max-h-[92vh] transition-all"
        onClick={e => e.stopPropagation()}
      >
        {/* MODAL HEADER WITH GLOBAL SEARCH INPUT */}
        <div className="p-4 sm:p-5 border-b border-slate-200/90 bg-gradient-to-b from-slate-50 to-white">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Search className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  Pencarian Global Aset Inventaris
                </h3>
                <p className="text-xs text-slate-500">
                  Telusuri data inventaris lintas seluruh ruangan, kategori, & buku induk RS
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  showAdvancedFilters || activeFiltersCount > 0
                    ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
                title="Buka Filter Kategori, Ruangan, Kondisi"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Filter Khusus</span>
                {activeFiltersCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Tutup (ESC)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* MAIN SEARCH INPUT */}
          <div className="relative flex items-center">
            <Search className="w-5 h-5 text-blue-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Ketik kata kunci (misal: USG, ESU, Force FX, ICU, J01-K04-R03-0006, Bed Pasien)..."
              className="w-full pl-11 pr-24 py-3 text-sm sm:text-base font-medium rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400 bg-white shadow-inner"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className="absolute right-12 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 cursor-pointer"
                title="Bersihkan teks"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
              <span>ESC</span>
            </div>
          </div>

          {/* TARGET FIELD TABS */}
          <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2 border-t border-slate-200/60 text-xs">
            <span className="text-slate-400 text-[11px] font-medium mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-400" /> Target Kolom:
            </span>
            {[
              { id: 'all', label: 'Semua Bidang' },
              { id: 'name', label: 'Nama & Merk' },
              { id: 'id', label: 'ID & No Seri' },
              { id: 'category', label: 'Kategori / Jenis' },
              { id: 'room', label: 'Ruangan / Unit' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFieldTarget(tab.id as SearchFieldTarget)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer text-xs ${
                  fieldTarget === tab.id
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ADVANCED MULTI-FACET FILTER PANEL */}
          {showAdvancedFilters && (
            <div className="mt-3 p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 text-xs space-y-3 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {/* 1. Ruangan */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <DoorOpen className="w-3.5 h-3.5 text-blue-600" /> Ruangan / Unit
                  </label>
                  <select
                    value={selectedRuangId}
                    onChange={e => setSelectedRuangId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 text-xs text-slate-700"
                  >
                    <option value="ALL">-- Semua Ruangan RS --</option>
                    {ruangList.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.namaRuang} ({r.id})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Kategori */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-blue-600" /> Kategori
                  </label>
                  <select
                    value={selectedKategoriId}
                    onChange={e => setSelectedKategoriId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 text-xs text-slate-700"
                  >
                    <option value="ALL">-- Semua Kategori --</option>
                    {kategoriList.map(k => (
                      <option key={k.id} value={k.id}>
                        {k.namaKategori} ({k.id})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Jenis */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-blue-600" /> Jenis Aset
                  </label>
                  <select
                    value={selectedJenisId}
                    onChange={e => setSelectedJenisId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 text-xs text-slate-700"
                  >
                    <option value="ALL">-- Semua Jenis --</option>
                    {jenisList.map(j => (
                      <option key={j.id} value={j.id}>
                        {j.namaJenis} ({j.id})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Kondisi */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Kondisi
                  </label>
                  <select
                    value={selectedKondisi}
                    onChange={e => setSelectedKondisi(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 text-xs text-slate-700"
                  >
                    <option value="ALL">-- Semua Kondisi --</option>
                    <option value="Baik">Baik (Normal)</option>
                    <option value="Rusak Ringan">Rusak Ringan</option>
                    <option value="Rusak Berat">Rusak Berat</option>
                  </select>
                </div>
              </div>

              {/* Reset button inside filter */}
              {activeFiltersCount > 0 && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset Semua Filter
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RESULTS HEADER INFO */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 font-medium">
          <div className="flex items-center gap-2">
            <span>
              Ditemukan <strong>{filteredAssets.length}</strong> aset dari total {allAssets.length}
            </span>
            {query && (
              <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded">
                Kata kunci: &ldquo;{query}&rdquo;
              </span>
            )}
          </div>

          {filteredAssets.length > 0 && (
            <span className="text-[11px] text-slate-400">
              Total Nilai Aset: <strong>{formatRupiah(filteredAssets.reduce((acc, curr) => acc + (curr.hargaPerolehan || 0), 0))}</strong>
            </span>
          )}
        </div>

        {/* RESULTS LIST CONTAINER */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 divide-y divide-slate-100">
          {filteredAssets.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                Tidak ada aset yang cocok dengan kriteria pencarian
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Coba periksa ejaan kata kunci, ganti target kolom ke &ldquo;Semua Bidang&rdquo;, atau reset filter ruangan/kategori yang aktif.
              </p>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Filter & Pencarian
                </button>
              )}
            </div>
          ) : (
            filteredAssets.map(asset => {
              const ruang = ruangMap.get(asset.idRuang);
              const kategori = kategoriMap.get(asset.idKategori);
              const jenis = jenisMap.get(asset.idJenis);
              const merk = merkMap.get(asset.idMerk);

              // Kondisi styling
              const kondisiBadge = 
                asset.kondisi === 'Baik'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : asset.kondisi === 'Rusak Ringan'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200';

              return (
                <div
                  key={asset.idBarang}
                  className="pt-3 first:pt-0 group hover:bg-slate-50/80 p-3 rounded-xl border border-transparent hover:border-slate-200 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    {/* Left: Asset info */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* ID Code Badge */}
                        <div className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 font-mono text-[11px] font-bold px-2 py-0.5 rounded border border-slate-200">
                          <span>{asset.idBarang}</span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyId(asset.idBarang, e)}
                            className="text-slate-400 hover:text-blue-600 transition-colors ml-0.5 cursor-pointer"
                            title="Salin ID Aset"
                          >
                            {copiedId === asset.idBarang ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>

                        {/* Room Location */}
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          <DoorOpen className="w-3 h-3" />
                          {ruang?.namaRuang || asset.idRuang}
                        </span>

                        {/* Category */}
                        <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {kategori?.namaKategori || asset.idKategori} &bull; {jenis?.namaJenis || asset.idJenis}
                        </span>

                        {/* Condition Badge */}
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${kondisiBadge}`}>
                          {asset.kondisi}
                        </span>
                      </div>

                      {/* Name & Brand */}
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {asset.namaBarang}
                        </h4>
                        <p className="text-xs text-slate-500">
                          Merk/Tipe: <strong className="text-slate-700">{merk?.namaMerk || '-'}</strong> {asset.spesifikasi ? `| Spek: ${asset.spesifikasi}` : ''} {asset.nomorSeri ? `| SN: ${asset.nomorSeri}` : ''}
                        </p>
                      </div>

                      {/* Meta stats */}
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                        <span>Tahun Perolehan: <strong>{asset.tahunPerolehan || '-'}</strong></span>
                        <span>Nilai: <strong className="text-slate-800">{formatRupiah(asset.hargaPerolehan || 0)}</strong></span>
                        {ruang?.penanggungJawab && (
                          <span>PJ: <strong>{ruang.penanggungJawab}</strong></span>
                        )}
                      </div>
                    </div>

                    {/* Right: Quick Action Buttons */}
                    <div className="flex flex-wrap sm:flex-col items-end gap-1.5 pt-1 sm:pt-0 shrink-0">
                      {/* Button: Detail & QR */}
                      {onInspectAsset && (
                        <button
                          type="button"
                          onClick={() => {
                            onInspectAsset(asset);
                            onClose();
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer w-full sm:w-auto justify-center"
                          title="Lihat Detail Lengkap & QR Code"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detail & QR</span>
                        </button>
                      )}

                      {/* Navigation Actions */}
                      <div className="flex items-center gap-1">
                        {onNavigateToTab && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                onNavigateToTab('data_ruangan', { roomId: asset.idRuang, assetId: asset.idBarang });
                                onClose();
                              }}
                              className="px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium transition-colors cursor-pointer"
                              title="Buka Daftar Inventaris Ruangan (DIR)"
                            >
                              DIR Ruang
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                onNavigateToTab('data_semua_rs', { search: asset.idBarang });
                                onClose();
                              }}
                              className="px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium transition-colors cursor-pointer"
                              title="Buka Buku Induk Semua RS"
                            >
                              Buku Induk
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                onNavigateToTab('permintaan_perbaikan', { assetId: asset.idBarang });
                                onClose();
                              }}
                              className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
                              title="Ajukan Permintaan Perbaikan Alat"
                            >
                              <Wrench className="w-3 h-3" />
                              <span>Perbaikan</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-3.5 sm:px-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="font-mono bg-white border border-slate-300 px-1.5 py-0.5 rounded text-[10px] text-slate-600 font-bold">ESC</kbd> Tutup
            </span>
            <span className="flex items-center gap-1">
              <kbd className="font-mono bg-white border border-slate-300 px-1.5 py-0.5 rounded text-[10px] text-slate-600 font-bold">Ctrl+K</kbd> / <kbd className="font-mono bg-white border border-slate-300 px-1.5 py-0.5 rounded text-[10px] text-slate-600 font-bold">⌘K</kbd> Pintasan
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold transition-colors cursor-pointer text-xs"
          >
            Tutup Pencarian
          </button>
        </div>
      </div>
    </div>
  );
};
