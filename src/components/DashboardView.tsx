import React, { useState } from 'react';
import { 
  InventarisRuangan, 
  PermintaanPerbaikan, 
  PerbaikanInventaris, 
  JadwalPemeliharaan, 
  PengadaanInventaris, 
  PelaksanaanPemusnahan,
  RuangInventaris,
  JenisInventaris,
  AppSettings,
  UserAccount
} from '../types/inventory';
import { dataStorage } from '../services/dataStorage';
import { formatRupiah, formatDateIndo, printDiv } from '../utils/formatters';
import { exportLaporanMutuPdf } from '../utils/mutuPdfExport';
import { 
  Boxes, 
  ShieldCheck, 
  AlertTriangle, 
  Wrench, 
  ShoppingBag, 
  Trash2, 
  QrCode, 
  Search, 
  ArrowRight, 
  Building2, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  TrendingUp,
  FileSpreadsheet,
  Layers,
  ArrowUpRight,
  Activity,
  Target,
  FileDown,
  Printer,
  Check,
  XCircle,
  BarChart3,
  ChevronRight,
  Gauge
} from 'lucide-react';
import { ActiveTab } from './Sidebar';

interface DashboardViewProps {
  inventaris?: InventarisRuangan[];
  ruangList?: RuangInventaris[];
  jenisList?: JenisInventaris[];
  permintaanPerbaikan?: PermintaanPerbaikan[];
  perbaikan?: PerbaikanInventaris[];
  jadwalPM?: JadwalPemeliharaan[];
  pengadaan?: PengadaanInventaris[];
  pemusnahan?: PelaksanaanPemusnahan[];
  appSettings?: AppSettings;
  currentUser?: UserAccount;
  isAdmin?: boolean;
  onNavigate: (tab: ActiveTab) => void;
  onOpenQrScanner?: () => void;
  onInspectAsset?: (asset: InventarisRuangan) => void;
  onOpenGlobalSearch?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  inventaris: propInventaris,
  ruangList: propRuangList,
  jenisList: propJenisList,
  permintaanPerbaikan: propPermintaanPerbaikan,
  perbaikan: propPerbaikan,
  jadwalPM: propJadwalPM,
  pengadaan: propPengadaan,
  pemusnahan: propPemusnahan,
  appSettings: propAppSettings,
  currentUser: propCurrentUser,
  isAdmin: propIsAdmin,
  onNavigate,
  onOpenQrScanner,
  onInspectAsset,
  onOpenGlobalSearch,
}) => {
  const settings = propAppSettings || dataStorage.getAppSettings();
  const inventaris = propInventaris ?? dataStorage.getInventarisRuangan();
  const ruangList = propRuangList ?? dataStorage.getRuang();
  const jenisList = propJenisList ?? dataStorage.getJenis();
  const permintaanPerbaikan = propPermintaanPerbaikan ?? dataStorage.getPermintaanPerbaikan();
  const perbaikan = propPerbaikan ?? dataStorage.getPerbaikan();
  const jadwalPM = propJadwalPM ?? dataStorage.getJadwalPemeliharaan();
  const pengadaan = propPengadaan ?? dataStorage.getPengadaan();
  const pemusnahan = propPemusnahan ?? dataStorage.getPelaksanaanPemusnahan();

  const currentUser = propCurrentUser || dataStorage.getCurrentUser();
  const isAdmin = propIsAdmin !== undefined 
    ? propIsAdmin 
    : (
      currentUser?.role === 'Super Admin' || 
      currentUser?.role?.toLowerCase().includes('admin') || 
      currentUser?.username?.toLowerCase() === 'admin'
    );

  const [searchTerm, setSearchTerm] = useState('');

  // Calculations
  const activeAssets = inventaris.filter(i => i.kondisi !== 'Dimusnahkan');
  const totalAssetsCount = activeAssets.length;
  const totalAssetValue = activeAssets.reduce((acc, curr) => acc + (curr.hargaPerolehan || 0), 0);

  const baikCount = activeAssets.filter(i => i.kondisi === 'Baik').length;
  const rusakRinganCount = activeAssets.filter(i => i.kondisi === 'Rusak Ringan').length;
  const rusakBeratCount = activeAssets.filter(i => i.kondisi === 'Rusak Berat').length;
  const dalamPerbaikanCount = activeAssets.filter(i => i.kondisi === 'Dalam Perbaikan' || i.status === 'Perbaikan').length;

  const urgentPerbaikan = permintaanPerbaikan.filter(p => p.prioritas === 'Darurat' || p.prioritas === 'Tinggi');
  const activeProcurements = pengadaan.filter(p => p.statusPengadaan !== 'Selesai');

  // Laporan Mutu IPSRS Calculations
  const mutuList = dataStorage.getLaporanMutu();
  const totalMutu = mutuList.length;
  const tepatWaktuMutu = mutuList.filter(
    m => m.statusRespon === 'Tepat Waktu' || (m.durasiRespon !== undefined && m.durasiRespon <= 15 && m.tglJamRespon)
  ).length;
  const terlambatMutu = mutuList.filter(
    m => m.statusRespon === 'Terlambat' || (m.durasiRespon !== undefined && m.durasiRespon > 15)
  ).length;
  const pendingMutuCount = mutuList.filter(m => m.statusRespon === 'Menunggu Respon' || !m.tglJamRespon).length;
  const capaianMutu = totalMutu > 0 ? Number(((tepatWaktuMutu / totalMutu) * 100).toFixed(1)) : 100;
  const isMutuTercapai = capaianMutu >= 80;

  // Average response time in minutes
  const itemsWithDurasi = mutuList.filter(
    i => i.durasiRespon !== undefined && i.durasiRespon !== null && !isNaN(i.durasiRespon) && i.tglJamRespon
  );
  const avgDurationMinutes = itemsWithDurasi.length > 0 
    ? Number((itemsWithDurasi.reduce((acc, curr) => acc + (curr.durasiRespon || 0), 0) / itemsWithDurasi.length).toFixed(1))
    : 0;

  // Unit Mutu breakdown for top reporting units
  const topUnitMutu = ruangList.map(ruang => {
    const roomTickets = mutuList.filter(m => m.unitPelapor === ruang.id);
    const total = roomTickets.length;
    const tepat = roomTickets.filter(
      m => m.statusRespon === 'Tepat Waktu' || (m.durasiRespon !== undefined && m.durasiRespon <= 15 && m.tglJamRespon)
    ).length;
    const persentase = total > 0 ? Math.round((tepat / total) * 100) : 0;
    return {
      ruang,
      total,
      tepat,
      persentase,
    };
  }).filter(u => u.total > 0).sort((a, b) => b.total - a.total).slice(0, 4);

  // Quick PDF Export handler
  const handleExportMutuPdf = () => {
    exportLaporanMutuPdf({
      filteredList: mutuList,
      ruangList,
      appSettings: settings,
      selectedBulan: 'all',
      selectedTahun: 'all',
      selectedRuang: 'all',
      selectedStatusRespon: 'all',
      totalLaporan: totalMutu,
      responTepatWaktu: tepatWaktuMutu,
      responTerlambat: terlambatMutu,
      menungguResponCount: pendingMutuCount,
      persentaseCapaian: capaianMutu,
      isTargetTercapai: isMutuTercapai,
      printedBy: currentUser?.namaLengkap || currentUser?.username || 'Pimpinan RS / Direksi',
    });
  };

  // Filter for search
  const query = (searchTerm || '').trim().toLowerCase();
  const filteredQuickSearch = query === '' ? [] : inventaris.filter(item => 
    (item.idBarang || '').toLowerCase().includes(query) ||
    (item.namaBarang || '').toLowerCase().includes(query) ||
    (item.nomorSeri || '').toLowerCase().includes(query)
  ).slice(0, 5);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white p-6 sm:p-7 shadow-sm border border-slate-800">
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-500/20 text-blue-300 text-xs font-medium border border-blue-400/30">
            <Sparkles className="w-3.5 h-3.5" />
            Dashboard Eksekutif {settings.systemShortName || 'SIMBARS'} {settings.appName || 'RS Medika Insani'}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {settings.appName || 'Sistem Inventaris & Manajemen Aset Medis'}
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl">
            {settings.appSubtitle || 'Monitoring menyeluruh status peralatan medis, inventaris ruangan, jadwal pemeliharaan berkala (IPSRS), pengadaan logistik, dan pengelolaan aset.'}
          </p>

          {/* Quick Search and Scan Bar */}
          <div className="pt-3 flex flex-col sm:flex-row gap-2 max-w-xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Cari ID Barang / Nama Aset / No Seri..."
                className="w-full pl-9 pr-4 py-2 bg-slate-800/90 border border-slate-700 rounded-md text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {onOpenGlobalSearch && (
              <button
                type="button"
                onClick={onOpenGlobalSearch}
                className="px-3 py-2 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="Pencarian Global dengan Filter Lengkap (Ctrl+K)"
              >
                <Search className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">Filter Global</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onOpenQrScanner ? onOpenQrScanner() : onNavigate('data_semua_rs')}
              className="px-3.5 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-sm shadow-blue-900/40 transition-all cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>Scan QR</span>
            </button>
          </div>

          {/* Quick search dropdown results */}
          {filteredQuickSearch.length > 0 && (
            <div className="bg-white rounded-lg shadow-xl border border-slate-200 text-slate-800 p-2 space-y-1 mt-2 max-w-xl">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                Hasil Pencarian Instan ({filteredQuickSearch.length}):
              </div>
              {filteredQuickSearch.map(item => (
                <div
                  key={item.idBarang}
                  onClick={() => onInspectAsset ? onInspectAsset(item) : onNavigate('data_semua_rs')}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-800">{item.namaBarang}</div>
                    <div className="text-[10px] font-mono text-blue-600">{item.idBarang} • SN: {item.nomorSeri}</div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                    item.kondisi === 'Baik' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {item.kondisi}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Decorative Watermark */}
        <div className="absolute right-6 -bottom-6 opacity-5 pointer-events-none text-9xl">
          🏥
        </div>
      </div>

      {/* EXECUTIVE REAL-TIME SUMMARY CARD: INDIKATOR MUTU PELAYANAN IPSRS (STANDAR PELAYANAN MINIMAL) */}
      <div id="print-mutu-summary" className={`rounded-xl border shadow-sm overflow-hidden transition-all ${
        isMutuTercapai 
          ? 'bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-900 border-emerald-800 text-white' 
          : 'bg-gradient-to-br from-rose-950 via-slate-900 to-slate-900 border-rose-800 text-white'
      }`}>
        {/* Header Section */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                MONITORING REAL-TIME EKSEKUTIF
              </span>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                <Target className="w-3 h-3 text-amber-400" />
                STANDAR SPM RS: ≥ 80.0%
              </span>
            </div>

            <div className="flex items-center gap-2 pt-0.5">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Indikator Mutu IPSRS: Waktu Tanggap Kerusakan Alat Medis (≤ 15 Menit)
              </h2>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Standar Pelayanan Minimal (SPM) respon teknisi terhadap aduan kerusakan sarana, prasarana, dan peralatan medis rumah sakit.
            </p>
          </div>

          {/* Status Badge & Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 self-start md:self-auto print:hidden">
            {/* Real-time Achievement Badge */}
            <div className={`px-3.5 py-1.5 rounded-lg flex items-center gap-2 font-bold text-xs shadow-sm border ${
              isMutuTercapai 
                ? 'bg-emerald-500 text-emerald-950 border-emerald-400' 
                : 'bg-rose-500 text-white border-rose-400 animate-pulse'
            }`}>
              {isMutuTercapai ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>STATUS: TARGET TERCAPAI (≥ 80%)</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  <span>STATUS: BELUM TERCAPAI (&lt; 80%)</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => printDiv('print-mutu-summary', 'Ringkasan Eksekutif Indikator Mutu IPSRS')}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/20 cursor-pointer"
                title="Cetak Ringkasan Eksekutif Mutu"
              >
                <Printer className="w-3.5 h-3.5 text-blue-300" />
                <span className="hidden sm:inline">Cetak</span>
              </button>

              <button
                type="button"
                onClick={handleExportMutuPdf}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/20 cursor-pointer"
                title="Unduh dokumen laporan indikator mutu resmi PDF"
              >
                <FileDown className="w-3.5 h-3.5 text-rose-300" />
                <span className="hidden sm:inline">PDF</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('laporan_mutu')}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-blue-900/50 cursor-pointer"
              >
                <span>Buka Laporan Mutu</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Body Metrics Grid */}
        <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left (5 cols): Large Percentage Meter */}
          <div className="lg:col-span-5 bg-white/5 rounded-xl p-4 sm:p-5 border border-white/10 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-blue-400" />
                <span>Tingkat Kepatuhan Waktu Tanggap:</span>
              </span>
              <span className="font-mono text-xs text-amber-300 font-bold">Target ≥ 80%</span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className={`text-4xl sm:text-5xl font-black font-mono tracking-tight ${
                isMutuTercapai ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {capaianMutu.toFixed(1)}%
              </span>
              <span className="text-xs text-slate-300 font-medium">
                ({tepatWaktuMutu} dari {totalMutu} aduan direspon ≤ 15m)
              </span>
            </div>

            {/* Progress Bar with Target Reference Line at 80% */}
            <div className="space-y-1.5">
              <div className="relative w-full bg-slate-800/90 h-3.5 rounded-full overflow-hidden border border-white/10 p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    isMutuTercapai ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-rose-500 to-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(3, capaianMutu))}%` }}
                />
                {/* 80% marker line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white shadow-sm shadow-black z-10"
                  style={{ left: '80%' }}
                  title="Batas Target SPM (80%)"
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0%</span>
                <span className="text-amber-300 font-bold pl-8">| 80% (Standar SPM)</span>
                <span>100%</span>
              </div>
            </div>

            <div className="pt-1 text-[11px] text-slate-300 flex items-center justify-between border-t border-white/10">
              <span>Formula Standar SPM:</span>
              <span className="font-mono text-cyan-300 font-medium">D / N × 100%</span>
            </div>
          </div>

          {/* Right (7 cols): 4 Micro KPIs & Top Unit Breakdown */}
          <div className="lg:col-span-7 space-y-4">
            {/* 4 KPI Metric Boxes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="text-[11px] text-slate-300">Total Aduan (N)</div>
                <div className="text-lg font-bold text-white mt-0.5">{totalMutu} <span className="text-xs font-normal text-slate-400">Tiket</span></div>
                <div className="text-[10px] text-slate-400 mt-0.5">Seluruh aduan masuk</div>
              </div>

              <div className="bg-emerald-950/40 rounded-lg p-3 border border-emerald-500/30">
                <div className="text-[11px] text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Tepat Waktu (D)</span>
                </div>
                <div className="text-lg font-bold text-emerald-400 mt-0.5">{tepatWaktuMutu} <span className="text-xs font-normal text-emerald-300">Tiket</span></div>
                <div className="text-[10px] text-emerald-300/80 mt-0.5">Respon ≤ 15 menit</div>
              </div>

              <div className="bg-rose-950/40 rounded-lg p-3 border border-rose-500/30">
                <div className="text-[11px] text-rose-300 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-rose-400" />
                  <span>Terlambat</span>
                </div>
                <div className="text-lg font-bold text-rose-400 mt-0.5">{terlambatMutu} <span className="text-xs font-normal text-rose-300">Tiket</span></div>
                <div className="text-[10px] text-rose-300/80 mt-0.5">Respon &gt; 15 menit</div>
              </div>

              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="text-[11px] text-blue-300">Rata-rata Respon</div>
                <div className="text-lg font-bold text-cyan-300 mt-0.5">{avgDurationMinutes > 0 ? `${avgDurationMinutes}m` : '-'}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Durasi respon teknisi</div>
              </div>
            </div>

            {/* Top Reporting Unit Response Compliance */}
            <div className="bg-white/5 rounded-lg p-3 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Performa Respon di Unit/Ruangan Utama:</span>
                </span>
                <button
                  type="button"
                  onClick={() => onNavigate('laporan_mutu')}
                  className="text-cyan-300 hover:text-cyan-200 text-[11px] font-bold flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Lihat Grafik & Tren</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {topUnitMutu.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">Belum ada riwayat aduan per ruangan.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {topUnitMutu.map(item => (
                    <div key={item.ruang.id} className="bg-white/5 rounded p-2 border border-white/5">
                      <div className="text-[11px] font-bold text-white truncate" title={item.ruang.namaRuang}>
                        {item.ruang.namaRuang}
                      </div>
                      <div className="flex items-center justify-between text-[10px] mt-1 text-slate-300">
                        <span>Capaian:</span>
                        <span className={`font-mono font-bold ${item.persentase >= 80 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {item.persentase}%
                        </span>
                      </div>
                      <div className="text-[9px] text-slate-400 mt-0.5">
                        {item.tepat}/{item.total} Tepat
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pending Alert if any */}
            {pendingMutuCount > 0 && (
              <div className="p-2.5 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2 font-medium">
                  <Clock className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
                  <span>Perhatian: Terdapat <strong>{pendingMutuCount}</strong> aduan kerusakan aktif yang belum direspon oleh teknisi IPSRS.</span>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('laporan_mutu')}
                  className="px-2.5 py-1 rounded bg-amber-400 text-slate-950 font-bold text-[11px] shrink-0 hover:bg-amber-300 transition-colors cursor-pointer"
                >
                  Tindak Lanjut
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Aset */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2 hover:border-blue-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Unit Aset Aktif</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800">
            {totalAssetsCount} <span className="text-xs font-normal text-slate-400">Unit</span>
          </div>
          <div className="text-xs text-slate-500">
            Nilai Perolehan: <span className="font-semibold text-slate-800">{formatRupiah(totalAssetValue)}</span>
          </div>
        </div>

        {/* Card 2: Kondisi Baik */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2 hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Kondisi Siap Pakai (Baik)</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            {baikCount} <span className="text-xs font-normal text-slate-400">Unit</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full" 
              style={{ width: `${totalAssetsCount ? (baikCount / totalAssetsCount) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Card 3: Kerusakan / Butuh Perbaikan */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2 hover:border-rose-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Kendala & Perbaikan</span>
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600">
            {rusakRinganCount + rusakBeratCount + dalamPerbaikanCount} <span className="text-xs font-normal text-slate-400">Unit</span>
          </div>
          <div className="text-[11px] text-slate-500 flex gap-3">
            <span>Ringan: <b className="text-amber-600 font-semibold">{rusakRinganCount}</b></span>
            <span>Berat: <b className="text-rose-600 font-semibold">{rusakBeratCount}</b></span>
          </div>
        </div>

        {/* Card 4: Pengadaan & Pemusnahan */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2 hover:border-indigo-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pengadaan Berjalan</span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-indigo-600">
            {activeProcurements.length} <span className="text-xs font-normal text-slate-400">PO Aktif</span>
          </div>
          <div className="text-xs text-slate-500">
            Pemusnahan: <span className="font-semibold text-slate-700">{pemusnahan.length} Aset</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Urgent Items & Room Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (7 cols): Urgent Maintenance & Action Lists */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Urgent Repairs Alert Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Permintaan Perbaikan Prioritas</h2>
                  <p className="text-[11px] text-slate-500">Peralatan medis mendesak yang memerlukan tindakan teknisi IPSRS</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('permintaan_perbaikan')}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {permintaanPerbaikan.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                Tidak ada antrean perbaikan aktif saat ini.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {permintaanPerbaikan.slice(0, 3).map(item => {
                  const ruang = ruangList.find(r => r.id === item.idRuang);
                  return (
                    <div key={item.idPermintaan} className="py-3 flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-800">{item.namaBarang}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                            item.prioritas === 'Darurat' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            item.prioritas === 'Tinggi' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                            'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {item.prioritas}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-1">{item.deskripsiKerusakan}</p>
                        <div className="text-[10px] text-slate-400 font-medium flex items-center gap-3">
                          <span>📍 {ruang?.namaRuang || item.idRuang}</span>
                          <span>👤 {item.pelapor}</span>
                          <span>📅 {formatDateIndo(item.tanggal)}{item.jam ? ` (${item.jam} WIB)` : ''}</span>
                        </div>
                      </div>

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => onNavigate('perbaikan')}
                          className="px-2.5 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-xs shrink-0 cursor-pointer border border-blue-200 transition-colors"
                        >
                          Tindak Lanjut
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Preventive Maintenance Calendar Card (Admin Only) */}
          {isAdmin && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-800">Jadwal Pemeliharaan Preventif (IPSRS)</h2>
                    <p className="text-[11px] text-slate-500">Kalibrasi & inspeksi rutin alat medis RS Medika Insani</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('pemeliharaan')}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>Kelola Jadwal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {jadwalPM.slice(0, 4).map(pm => {
                  const ruang = ruangList.find(r => r.id === pm.idRuang);
                  return (
                    <div key={pm.idJadwal} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1.5">
                      <div className="flex items-start justify-between">
                        <div className="text-xs font-semibold text-slate-800 truncate pr-2">
                          {pm.namaBarang}
                        </div>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                          {pm.frekuensi}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Ruang: <span className="font-medium text-slate-700">{ruang?.namaRuang || pm.idRuang}</span>
                      </div>
                      <div className="text-[11px] text-blue-600 font-medium">
                        Jadwal: {formatDateIndo(pm.tanggalBerikutnya)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Right Column (5 cols): Distribution by Room & Quick Shortcuts */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Quality Indicator Widget (Laporan Mutu IPSRS) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3.5 hover:border-blue-300 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Indikator Mutu IPSRS</h2>
                  <p className="text-[11px] text-slate-500">Waktu Tanggap Kerusakan (≤ 15 Menit)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('laporan_mutu')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <span>Lihat Laporan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">Capaian Respons ≤ 15m:</span>
                <span className={`text-base font-black font-mono ${isMutuTercapai ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {capaianMutu.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isMutuTercapai ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, capaianMutu))}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Target SPM: ≥ 80%</span>
                <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                  isMutuTercapai ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {isMutuTercapai ? 'STATUS: TERCAPAI' : 'STATUS: TIDAK TERCAPAI'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
                <div className="text-[10px] text-slate-500">Tepat Waktu (≤15m)</div>
                <div className="text-sm font-bold text-emerald-600 mt-0.5">{tepatWaktuMutu} / {totalMutu} Tiket</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
                <div className="text-[10px] text-slate-500">Rata-rata Respon</div>
                <div className="text-sm font-bold text-slate-800 mt-0.5">{avgDurationMinutes > 0 ? `${avgDurationMinutes} Menit` : '-'}</div>
              </div>
            </div>

            {pendingMutuCount > 0 && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                  <span>{pendingMutuCount} aduan belum direspon</span>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('laporan_mutu')}
                  className="font-bold text-blue-700 hover:underline cursor-pointer text-[11px]"
                >
                  Respon
                </button>
              </div>
            )}
          </div>

          {/* Quick Action Shortcuts */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-slate-800">Aksi Cepat Inventaris</h2>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => onNavigate('data_ruangan')}
                className="p-3 rounded-lg bg-slate-50 hover:bg-blue-50/60 border border-slate-200 text-slate-800 text-left transition-all cursor-pointer group"
              >
                <div className="font-semibold text-xs flex items-center justify-between text-slate-800">
                  <span>Input Inventaris</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-blue-500 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">Tambah aset ruangan baru</p>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('sirkulasi')}
                className="p-3 rounded-lg bg-slate-50 hover:bg-blue-50/60 border border-slate-200 text-slate-800 text-left transition-all cursor-pointer group"
              >
                <div className="font-semibold text-xs flex items-center justify-between text-slate-800">
                  <span>Mutasi / Sirkulasi</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-blue-500 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">Distribusi barang antar ruang</p>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('pengajuan')}
                className="p-3 rounded-lg bg-slate-50 hover:bg-blue-50/60 border border-slate-200 text-slate-800 text-left transition-all cursor-pointer group"
              >
                <div className="font-semibold text-xs flex items-center justify-between text-slate-800">
                  <span>Pengajuan Barang</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-blue-500 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">Form permohonan logistik</p>
              </button>

              {isAdmin ? (
                <button
                  type="button"
                  onClick={() => onNavigate('gas_sync')}
                  className="p-3 rounded-lg bg-slate-50 hover:bg-blue-50/60 border border-slate-200 text-slate-800 text-left transition-all cursor-pointer group"
                >
                  <div className="font-semibold text-xs flex items-center justify-between text-slate-800">
                    <span>Spreadsheet Sync</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-blue-500 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">Konektor Google Sheets</p>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigate('permintaan_perbaikan')}
                  className="p-3 rounded-lg bg-slate-50 hover:bg-blue-50/60 border border-slate-200 text-slate-800 text-left transition-all cursor-pointer group"
                >
                  <div className="font-semibold text-xs flex items-center justify-between text-slate-800">
                    <span>Permintaan Perbaikan</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-blue-500 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">Lapor kerusakan alat medis</p>
                </button>
              )}
            </div>
          </div>

          {/* Distribution by Room List */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800">Distribusi Aset per Ruangan</h2>
              <button
                type="button"
                onClick={() => onNavigate('data_semua_rs')}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                Rekap Total
              </button>
            </div>

            <div className="space-y-3">
              {ruangList.slice(0, 5).map(ruang => {
                const count = activeAssets.filter(a => a.idRuang === ruang.id).length;
                const percent = totalAssetsCount ? Math.round((count / totalAssetsCount) * 100) : 0;
                return (
                  <div key={ruang.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">{ruang.namaRuang}</span>
                      <span className="font-mono text-slate-500 font-semibold">{count} Unit ({percent}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-blue-600 h-full rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
