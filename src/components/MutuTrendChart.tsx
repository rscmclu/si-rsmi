import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  BarChart,
  LineChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Calendar,
  Building2,
  Info,
  Target,
  Sparkles,
} from 'lucide-react';
import { LaporanMutuIPSRS, RuangInventaris } from '../types/inventory';

interface MutuTrendChartProps {
  data: LaporanMutuIPSRS[];
  ruangList: RuangInventaris[];
  selectedRuang: string;
  selectedTahun: string;
  onSelectMonth?: (monthStr: string) => void;
  selectedBulan?: string;
}

const MONTH_NAMES = [
  { num: '01', short: 'Jan', full: 'Januari' },
  { num: '02', short: 'Feb', full: 'Februari' },
  { num: '03', short: 'Mar', full: 'Maret' },
  { num: '04', short: 'Apr', full: 'April' },
  { num: '05', short: 'Mei', full: 'Mei' },
  { num: '06', short: 'Jun', full: 'Juni' },
  { num: '07', short: 'Jul', full: 'Juli' },
  { num: '08', short: 'Agu', full: 'Agustus' },
  { num: '09', short: 'Sep', full: 'September' },
  { num: '10', short: 'Okt', full: 'Oktober' },
  { num: '11', short: 'Nov', full: 'November' },
  { num: '12', short: 'Des', full: 'Desember' },
];

export const MutuTrendChart: React.FC<MutuTrendChartProps> = ({
  data,
  ruangList,
  selectedRuang,
  selectedTahun,
  onSelectMonth,
  selectedBulan,
}) => {
  const [activeTab, setActiveTab] = useState<'trend' | 'composition' | 'duration'>('trend');
  const [activeYear, setActiveYear] = useState<string>(() => {
    if (selectedTahun !== 'all') return selectedTahun;
    return new Date().getFullYear().toString();
  });

  // Keep activeYear in sync if parent selectedTahun changes
  React.useEffect(() => {
    if (selectedTahun !== 'all') {
      setActiveYear(selectedTahun);
    }
  }, [selectedTahun]);

  // Extract available years from dataset
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    data.forEach(item => {
      if (item.tglJamLapor) {
        const y = item.tglJamLapor.slice(0, 4);
        if (y && !isNaN(Number(y))) years.add(y);
      }
    });
    years.add(new Date().getFullYear().toString());
    return Array.from(years).sort().reverse();
  }, [data]);

  // Selected Room info
  const selectedRuangObj = useMemo(() => {
    if (selectedRuang === 'all') return null;
    return ruangList.find(r => r.id === selectedRuang) || null;
  }, [selectedRuang, ruangList]);

  // Filter data by chosen activeYear (and room if filtered)
  const yearFilteredData = useMemo(() => {
    return data.filter(item => {
      if (selectedRuang !== 'all' && item.unitPelapor !== selectedRuang) {
        return false;
      }
      if (activeYear !== 'all' && item.tglJamLapor) {
        const y = item.tglJamLapor.slice(0, 4);
        if (y !== activeYear) return false;
      }
      return true;
    });
  }, [data, selectedRuang, activeYear]);

  // Aggregate monthly data for 12 months
  const monthlyData = useMemo(() => {
    return MONTH_NAMES.map(m => {
      const itemsInMonth = yearFilteredData.filter(item => {
        if (!item.tglJamLapor) return false;
        return item.tglJamLapor.slice(5, 7) === m.num;
      });

      const total = itemsInMonth.length;
      const tepatWaktu = itemsInMonth.filter(
        item => item.statusRespon === 'Tepat Waktu' || (item.durasiRespon !== undefined && item.durasiRespon <= 15 && item.tglJamRespon)
      ).length;
      const terlambat = itemsInMonth.filter(
        item => item.statusRespon === 'Terlambat' || (item.durasiRespon !== undefined && item.durasiRespon > 15)
      ).length;
      const menunggu = itemsInMonth.filter(
        item => item.statusRespon === 'Menunggu Respon' || !item.tglJamRespon
      ).length;

      // Capaian formula: (tepatWaktu / total) * 100
      let persentase = 0;
      if (total > 0) {
        persentase = Number(((tepatWaktu / total) * 100).toFixed(1));
      }

      // Average duration calculation
      const respondedItems = itemsInMonth.filter(
        i => i.durasiRespon !== undefined && i.durasiRespon !== null && !isNaN(i.durasiRespon) && i.tglJamRespon
      );
      const avgDuration =
        respondedItems.length > 0
          ? Number((respondedItems.reduce((acc, curr) => acc + (curr.durasiRespon || 0), 0) / respondedItems.length).toFixed(1))
          : 0;

      const isTargetMet = total > 0 && persentase >= 80;

      return {
        bulanNum: m.num,
        bulan: m.short,
        bulanFull: m.full,
        total,
        tepatWaktu,
        terlambat,
        menunggu,
        persentase,
        targetSPM: 80,
        avgDuration,
        isTargetMet,
        hasData: total > 0,
      };
    });
  }, [yearFilteredData]);

  // Overall Statistics from Monthly Aggregation
  const summaryStats = useMemo(() => {
    const monthsWithData = monthlyData.filter(m => m.hasData);
    if (monthsWithData.length === 0) {
      return {
        avgCapaian: 0,
        totalTahun: 0,
        totalTepat: 0,
        bestMonth: null,
        metCount: 0,
        totalMonthsWithData: 0,
      };
    }

    const totalTahun = monthsWithData.reduce((acc, m) => acc + m.total, 0);
    const totalTepat = monthsWithData.reduce((acc, m) => acc + m.tepatWaktu, 0);
    const avgCapaian = totalTahun > 0 ? Number(((totalTepat / totalTahun) * 100).toFixed(1)) : 0;

    let bestMonth = monthsWithData[0];
    monthsWithData.forEach(m => {
      if (m.persentase > bestMonth.persentase || (m.persentase === bestMonth.persentase && m.total > bestMonth.total)) {
        bestMonth = m;
      }
    });

    const metCount = monthsWithData.filter(m => m.persentase >= 80).length;

    return {
      avgCapaian,
      totalTahun,
      totalTepat,
      bestMonth,
      metCount,
      totalMonthsWithData: monthsWithData.length,
    };
  }, [monthlyData]);

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const dataPoint = monthlyData.find(m => m.bulan === label);
    if (!dataPoint) return null;

    return (
      <div className="bg-slate-900 text-white rounded-lg p-3 shadow-xl border border-slate-700 text-xs z-50 min-w-[200px]">
        <div className="flex items-center justify-between border-b border-slate-700 pb-1.5 mb-2">
          <span className="font-bold text-sm text-white">
            {dataPoint.bulanFull} {activeYear}
          </span>
          {dataPoint.hasData && (
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                dataPoint.persentase >= 80 ? 'bg-emerald-500/30 text-emerald-300' : 'bg-rose-500/30 text-rose-300'
              }`}
            >
              {dataPoint.persentase >= 80 ? 'SPM TERCAPAI' : 'BELUM TERCAPAI'}
            </span>
          )}
        </div>

        {!dataPoint.hasData ? (
          <p className="text-slate-400 italic text-[11px]">Belum ada tiket laporan kerusakan pada bulan ini.</p>
        ) : (
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-slate-300">
              <span>Capaian Mutu:</span>
              <span
                className={`font-black text-sm ${
                  dataPoint.persentase >= 80 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {dataPoint.persentase}%
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span>Target SPM:</span>
              <span className="font-mono text-amber-400 font-semibold">≥ 80%</span>
            </div>

            <div className="border-t border-slate-800 pt-1.5 space-y-1">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-emerald-300 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Respon ≤ 15m:
                </span>
                <span className="font-bold text-white">{dataPoint.tepatWaktu} Tiket</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-rose-300 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" /> Terlambat (&gt;15m):
                </span>
                <span className="font-bold text-white">{dataPoint.terlambat} Tiket</span>
              </div>
              {dataPoint.menunggu > 0 && (
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-amber-300 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Menunggu:
                  </span>
                  <span className="font-bold text-white">{dataPoint.menunggu} Tiket</span>
                </div>
              )}
              <div className="flex justify-between items-center text-[11px] font-bold text-slate-200 pt-0.5 border-t border-slate-800/60">
                <span>Total Laporan:</span>
                <span>{dataPoint.total} Tiket</span>
              </div>
              {dataPoint.avgDuration > 0 && (
                <div className="flex justify-between items-center text-[11px] text-cyan-300 pt-0.5">
                  <span>Rata-rata Waktu Tanggap:</span>
                  <span className="font-mono">{dataPoint.avgDuration} Menit</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all">
      {/* Header Visualisasi Tren */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 tracking-wider uppercase flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-blue-600" />
                <span>GRAFIK TREN BULANAN</span>
              </span>
              {selectedRuang !== 'all' && selectedRuangObj && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-amber-700" />
                  <span>Area: {selectedRuangObj.namaRuang}</span>
                </span>
              )}
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Tren Capaian Waktu Tanggap Pelayanan IPSRS</span>
              <span className="text-xs font-normal text-slate-500">(Response Time ≤ 15 Menit)</span>
            </h3>
            <p className="text-xs text-slate-600">
              Monitoring performa respon teknisi terhadap standar minimal pelayanan rumah sakit (SPM $\ge 80\%$) per bulan.
            </p>
          </div>

          {/* Controls: View Tabs & Tahun Selector */}
          <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
            {/* View Switcher Tabs */}
            <div className="inline-flex p-0.5 bg-slate-200/80 rounded-lg text-xs font-medium text-slate-600">
              <button
                type="button"
                onClick={() => setActiveTab('trend')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  activeTab === 'trend'
                    ? 'bg-white text-blue-700 font-bold shadow-2xs'
                    : 'hover:text-slate-900'
                }`}
                title="Lihat grafik kurva persentase capaian mutu vs target SPM"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Capaian Mutu (%)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('composition')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  activeTab === 'composition'
                    ? 'bg-white text-blue-700 font-bold shadow-2xs'
                    : 'hover:text-slate-900'
                }`}
                title="Lihat komposisi volume tiket (Tepat Waktu vs Terlambat vs Menunggu)"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Komposisi Respon</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('duration')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  activeTab === 'duration'
                    ? 'bg-white text-blue-700 font-bold shadow-2xs'
                    : 'hover:text-slate-900'
                }`}
                title="Lihat rata-rata durasi waktu tanggap per bulan"
              >
                <Clock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Rata-rata Menit</span>
              </button>
            </div>

            {/* Selector Tahun */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1 shadow-2xs text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={activeYear}
                onChange={e => setActiveYear(e.target.value)}
                className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                {availableYears.map(y => (
                  <option key={y} value={y}>
                    Tahun {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Highlight KPI Pills di atas Chart */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-3 border-t border-slate-200/70 text-xs">
          <div className="bg-white rounded-lg p-2.5 border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-500 font-medium">Rata-rata Tahunan</div>
              <div className="text-base font-black text-slate-900 mt-0.5">
                {summaryStats.avgCapaian}%
              </div>
            </div>
            <div className={`p-1.5 rounded-md ${summaryStats.avgCapaian >= 80 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              <Target className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-2.5 border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-500 font-medium">Kepatuhan SPM RS</div>
              <div className="text-base font-black text-slate-900 mt-0.5">
                {summaryStats.metCount} <span className="text-xs font-normal text-slate-500">/ {summaryStats.totalMonthsWithData || 12} Bln</span>
              </div>
            </div>
            <div className="p-1.5 rounded-md bg-blue-50 text-blue-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-2.5 border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-500 font-medium">Bulan Terbaik</div>
              <div className="text-sm font-black text-emerald-700 mt-0.5">
                {summaryStats.bestMonth ? `${summaryStats.bestMonth.bulanFull} (${summaryStats.bestMonth.persentase}%)` : '-'}
              </div>
            </div>
            <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-600">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-2.5 border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-500 font-medium">Total Aduan Selesai Tepat</div>
              <div className="text-base font-black text-slate-900 mt-0.5">
                {summaryStats.totalTepat} <span className="text-xs font-normal text-slate-500">/ {summaryStats.totalTahun}</span>
              </div>
            </div>
            <div className="p-1.5 rounded-md bg-indigo-50 text-indigo-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Area Canvas Grafik Recharts */}
      <div className="p-4 sm:p-5">
        <div className="w-full h-[300px] sm:h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            {activeTab === 'trend' ? (
              <ComposedChart
                data={monthlyData}
                margin={{ top: 15, right: 15, left: -10, bottom: 5 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload[0] && onSelectMonth) {
                    const mNum = e.activePayload[0].payload.bulanNum;
                    onSelectMonth(mNum);
                  }
                }}
              >
                <defs>
                  <linearGradient id="colorCapaian" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="bulan"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 20, 40, 60, 80, 100]}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={v => `${v}%`}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
                />

                {/* Garis Referensi Target SPM 80% */}
                <ReferenceLine
                  y={80}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  strokeWidth={1.8}
                  label={{
                    value: 'Standar SPM (≥ 80%)',
                    position: 'top',
                    fill: '#b91c1c',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="persentase"
                  name="Capaian Respon ≤ 15m (%)"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorCapaian)"
                  activeDot={{ r: 6, stroke: '#1d4ed8', strokeWidth: 2, fill: '#ffffff' }}
                />

                <Line
                  type="monotone"
                  dataKey="persentase"
                  name="Capaian Mutu"
                  legendType="none"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    if (!payload.hasData) return null;
                    const isMet = payload.persentase >= 80;
                    return (
                      <circle
                        key={`dot-${payload.bulan}`}
                        cx={cx}
                        cy={cy}
                        r={4.5}
                        fill={isMet ? '#10b981' : '#f43f5e'}
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    );
                  }}
                />
              </ComposedChart>
            ) : activeTab === 'composition' ? (
              <BarChart
                data={monthlyData}
                margin={{ top: 15, right: 15, left: -10, bottom: 5 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload[0] && onSelectMonth) {
                    const mNum = e.activePayload[0].payload.bulanNum;
                    onSelectMonth(mNum);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="bulan"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
                />

                <Bar
                  dataKey="tepatWaktu"
                  name="Respon Tepat Waktu (≤ 15m)"
                  stackId="a"
                  fill="#10b981"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="terlambat"
                  name="Respon Terlambat (> 15m)"
                  stackId="a"
                  fill="#f43f5e"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="menunggu"
                  name="Menunggu Respon"
                  stackId="a"
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            ) : (
              <BarChart
                data={monthlyData}
                margin={{ top: 15, right: 15, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="bulan"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={v => `${v}m`}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
                />

                {/* Batas Maksimal SOP 15 Menit */}
                <ReferenceLine
                  y={15}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  strokeWidth={1.8}
                  label={{
                    value: 'Batas Maks Respon Cepat (15 Menit)',
                    position: 'top',
                    fill: '#b91c1c',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                />

                <Bar
                  dataKey="avgDuration"
                  name="Rata-rata Waktu Tanggap (Menit)"
                  fill="#0284c7"
                  radius={[4, 4, 0, 0]}
                >
                  {monthlyData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.avgDuration <= 15 ? '#0284c7' : '#e11d48'}
                    />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Footer Legend Guide */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span>Titik Hijau: Capaian $\ge 80\%$ (Memenuhi Standar)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              <span>Titik Merah: Capaian $&lt; 80\%$ (Di Bawah Target)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-b-2 border-dashed border-red-500 inline-block" />
              <span>Garis Merah Putus-putus: Standar Pelayanan Minimal (80%)</span>
            </span>
          </div>

          <div className="text-slate-400 italic">
            Klik titik/batang bulan untuk memfilter tabel di bawah
          </div>
        </div>
      </div>
    </div>
  );
};
