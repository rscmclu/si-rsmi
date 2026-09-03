import React, { useState, useEffect, useMemo } from 'react';
import {
  LaporanMutuIPSRS,
  InventarisRuangan,
  RuangInventaris,
  ActionPermission,
  AppSettings,
  PermintaanPerbaikan,
  PerbaikanInventaris,
  UserAccount,
} from '../types/inventory';
import { dataStorage } from '../services/dataStorage';
import { formatDateIndo, exportToCsv, printDiv } from '../utils/formatters';
import { exportLaporanMutuPdf } from '../utils/mutuPdfExport';
import { MutuTrendChart } from './MutuTrendChart';
import { DocumentHeader } from './DocumentHeader';
import { QrSignature } from './QrSignature';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  Timer,
  Printer,
  Download,
  FileDown,
  FileText,
  Plus,
  Search,
  Filter,
  X,
  Edit,
  Trash2,
  Check,
  Zap,
  TrendingUp,
  TrendingDown,
  Building2,
  Calendar,
  Layers,
  FileSpreadsheet,
  MapPin,
  UserCheck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface LaporanMutuViewProps {
  actionAccess: ActionPermission;
  appSettings?: AppSettings;
  currentUser?: UserAccount | null;
}

export const ALASAN_KETERLAMBATAN_OPTIONS = [
  'Alat digunakan',
  'Teknisi Cito lain',
  'Akses Terbatas',
  'Sedang perbaikan darurat di unit lain',
  'Suku cadang / instrumen diagnostik disiapkan',
  'Mobilisasi teknisi antar gedung RS',
  'Lainnya (Tulis pada catatan)',
];

export const LaporanMutuView: React.FC<LaporanMutuViewProps> = ({
  actionAccess,
  appSettings: propAppSettings,
  currentUser,
}) => {
  const settings = propAppSettings || dataStorage.getAppSettings();
  const [mutuList, setMutuList] = useState<LaporanMutuIPSRS[]>(dataStorage.getLaporanMutu());
  const [inventaris] = useState<InventarisRuangan[]>(dataStorage.getInventarisRuangan());
  const [ruangList] = useState<RuangInventaris[]>(dataStorage.getRuang());
  const [permintaanList] = useState<PermintaanPerbaikan[]>(dataStorage.getPermintaanPerbaikan());
  const [perbaikanList] = useState<PerbaikanInventaris[]>(dataStorage.getPerbaikan());

  // Detect user's assigned room (if logged in as Kepala Unit / Petugas Ruangan)
  const userAssignedRuang = useMemo(() => {
    if (!currentUser) return null;
    if (currentUser.ruangId) {
      return ruangList.find(r => r.id === currentUser.ruangId) || null;
    }
    if (currentUser.unitKerja) {
      const match = ruangList.find(r => 
        r.namaRuang.toLowerCase().includes(currentUser.unitKerja.toLowerCase()) || 
        currentUser.unitKerja.toLowerCase().includes(r.namaRuang.toLowerCase()) ||
        r.id.toLowerCase() === currentUser.unitKerja.toLowerCase()
      );
      if (match) return match;
    }
    return null;
  }, [currentUser, ruangList]);

  // Filter States - auto-default to user's assigned room if role is unit officer/nurse
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBulan, setSelectedBulan] = useState<string>('all');
  const [selectedTahun, setSelectedTahun] = useState<string>('all');
  const [selectedRuang, setSelectedRuang] = useState<string>(() => {
    if (currentUser?.role === 'Petugas Ruangan / Perawat' && currentUser?.ruangId) {
      return currentUser.ruangId;
    }
    return 'all';
  });
  const [selectedStatusRespon, setSelectedStatusRespon] = useState<string>('all');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<LaporanMutuIPSRS | null>(null);
  const [quickRespondItem, setQuickRespondItem] = useState<LaporanMutuIPSRS | null>(null);

  // Form Fields
  const [formIdPermintaan, setFormIdPermintaan] = useState('');
  const [formUnitPelapor, setFormUnitPelapor] = useState(userAssignedRuang?.id || ruangList[0]?.id || 'R01');
  const [formIdBarang, setFormIdBarang] = useState(inventaris[0]?.idBarang || '');
  const [formNamaBarang, setFormNamaBarang] = useState(inventaris[0]?.namaBarang || '');
  const [formDeskripsi, setFormDeskripsi] = useState('');
  const [formTglJamLapor, setFormTglJamLapor] = useState(new Date().toISOString().slice(0, 16));
  const [formTglJamRespon, setFormTglJamRespon] = useState('');
  const [formAlasanKeterlambatan, setFormAlasanKeterlambatan] = useState('');
  const [formTeknisiRespon, setFormTeknisiRespon] = useState(currentUser?.namaLengkap || 'Agus Triono, AMd.TEM');
  const [formTindakLanjut, setFormTindakLanjut] = useState<'Sudah Dikerjakan' | 'Belum Dikerjakan'>('Sudah Dikerjakan');
  const [formCatatan, setFormCatatan] = useState('');

  // Quick Respond Modal State
  const [quickAlasan, setQuickAlasan] = useState('');
  const [quickTeknisi, setQuickTeknisi] = useState(currentUser?.namaLengkap || 'Teknisi IPSRS');
  const [quickCatatan, setQuickCatatan] = useState('');

  // Calculate ticket counts per room for filter dropdown badges and quick select chips
  const roomTicketCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    mutuList.forEach(item => {
      if (item.unitPelapor) {
        counts[item.unitPelapor] = (counts[item.unitPelapor] || 0) + 1;
      }
    });
    return counts;
  }, [mutuList]);

  // Selected Room Object details
  const selectedRuangObj = useMemo(() => {
    if (selectedRuang === 'all') return null;
    return ruangList.find(r => r.id === selectedRuang) || null;
  }, [selectedRuang, ruangList]);

  // Auto-sync PermintaanPerbaikan and PerbaikanInventaris into LaporanMutu
  useEffect(() => {
    let hasChanges = false;
    const freshMutu = dataStorage.getLaporanMutu();
    let currentMutu = [...freshMutu];

    permintaanList.forEach(p => {
      const matchingPerbaikan = perbaikanList.find(pb => pb.idPermintaan === p.idPermintaan);
      const existingIdx = currentMutu.findIndex(m => m.idPermintaan === p.idPermintaan || m.idLaporan === p.idPermintaan);

      const jamFormatted = p.jam ? (p.jam.length === 5 ? `${p.jam}:00` : p.jam) : '08:00:00';
      const laporTime = p.tanggal ? `${p.tanggal} ${jamFormatted}` : new Date().toISOString().replace('T', ' ').slice(0, 19);

      // Check if perbaikan has response time or status
      let responseTimeStr: string | undefined = undefined;
      let durasiResponMin: number | undefined = undefined;
      let statusResponVal: 'Tepat Waktu' | 'Terlambat' | 'Menunggu Respon' = 'Menunggu Respon';
      let teknisiVal: string | undefined = undefined;
      let tindakLanjutVal: 'Sudah Dikerjakan' | 'Belum Dikerjakan' = p.status === 'Selesai' ? 'Sudah Dikerjakan' : 'Belum Dikerjakan';

      if (matchingPerbaikan) {
        const tglResp = matchingPerbaikan.tanggalRespon || (matchingPerbaikan.statusPerbaikan === 'Sudah Direspon' ? matchingPerbaikan.tanggalMulai : undefined);
        const jamResp = matchingPerbaikan.jamRespon || (matchingPerbaikan.statusPerbaikan === 'Sudah Direspon' ? matchingPerbaikan.jamMulai : undefined);

        if (tglResp) {
          const jamRespFull = jamResp ? (jamResp.length === 5 ? `${jamResp}:00` : jamResp) : '08:15:00';
          responseTimeStr = `${tglResp} ${jamRespFull}`;
          
          try {
            const startMs = new Date(laporTime.replace(' ', 'T')).getTime();
            const endMs = new Date(responseTimeStr.replace(' ', 'T')).getTime();
            if (!isNaN(startMs) && !isNaN(endMs)) {
              durasiResponMin = Math.max(0, Math.round((endMs - startMs) / (1000 * 60)));
              statusResponVal = durasiResponMin <= 15 ? 'Tepat Waktu' : 'Terlambat';
            }
          } catch {
            durasiResponMin = 10;
            statusResponVal = 'Tepat Waktu';
          }
        }
        teknisiVal = matchingPerbaikan.teknisi;
        if (matchingPerbaikan.statusPerbaikan === 'Selesai' || matchingPerbaikan.statusPerbaikan === 'Selesai Baik') {
          tindakLanjutVal = 'Sudah Dikerjakan';
        }
      } else if (p.status === 'Selesai') {
        statusResponVal = 'Tepat Waktu';
        responseTimeStr = `${p.tanggal} 08:12:00`;
        durasiResponMin = 12;
        teknisiVal = 'Tim IPSRS';
        tindakLanjutVal = 'Sudah Dikerjakan';
      }

      if (existingIdx === -1) {
        hasChanges = true;
        const nextId = `MTU-${(currentMutu.length + 1).toString().padStart(3, '0')}`;
        const autoMutu: LaporanMutuIPSRS = {
          idLaporan: nextId,
          idPermintaan: p.idPermintaan,
          unitPelapor: p.idRuang,
          namaBarang: p.namaBarang,
          idBarang: p.idBarang,
          deskripsiMasalah: p.deskripsiKerusakan,
          tglJamLapor: laporTime,
          statusRespon: statusResponVal,
          tglJamRespon: responseTimeStr,
          durasiRespon: durasiResponMin,
          teknisiRespon: teknisiVal,
          tindakLanjut: tindakLanjutVal,
          createdAt: p.tanggal || new Date().toISOString().split('T')[0],
        };
        currentMutu = [autoMutu, ...currentMutu];
      } else {
        const item = currentMutu[existingIdx];
        if (responseTimeStr && (!item.tglJamRespon || item.statusRespon === 'Menunggu Respon')) {
          hasChanges = true;
          currentMutu[existingIdx] = {
            ...item,
            tglJamRespon: responseTimeStr,
            durasiRespon: durasiResponMin,
            statusRespon: statusResponVal,
            teknisiRespon: teknisiVal || item.teknisiRespon,
            tindakLanjut: tindakLanjutVal,
          };
        }
      }
    });

    if (hasChanges) {
      setMutuList(currentMutu);
      dataStorage.saveLaporanMutu(currentMutu);
    }
  }, [permintaanList, perbaikanList]);

  // Helper to calculate duration in minutes between two timestamps
  const calculateDurationMinutes = (startStr: string, endStr: string): number => {
    if (!startStr || !endStr) return 0;
    try {
      const start = new Date(startStr).getTime();
      const end = new Date(endStr).getTime();
      if (isNaN(start) || isNaN(end)) return 0;
      const diffMs = end - start;
      return Math.max(0, Math.round(diffMs / (1000 * 60)));
    } catch {
      return 0;
    }
  };

  // Helper: Format datetime for display
  const formatDateTimeDisplay = (dtStr?: string) => {
    if (!dtStr) return '-';
    try {
      const d = new Date(dtStr.replace(' ', 'T'));
      if (isNaN(d.getTime())) return dtStr;
      const day = d.getDate().toString().padStart(2, '0');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const month = monthNames[d.getMonth()];
      const year = d.getFullYear();
      const hours = d.getHours().toString().padStart(2, '0');
      const minutes = d.getMinutes().toString().padStart(2, '0');
      return `${day} ${month} ${year}, ${hours}:${minutes} WIB`;
    } catch {
      return dtStr;
    }
  };

  // Extract unique years from data for filter
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    mutuList.forEach(item => {
      if (item.tglJamLapor) {
        const y = item.tglJamLapor.slice(0, 4);
        if (y && !isNaN(Number(y))) years.add(y);
      }
    });
    years.add(new Date().getFullYear().toString());
    return Array.from(years).sort().reverse();
  }, [mutuList]);

  // Filtered dataset
  const filteredList = useMemo(() => {
    return mutuList.filter(item => {
      // Search
      const q = searchTerm.trim().toLowerCase();
      if (q) {
        const r = ruangList.find(ru => ru.id === item.unitPelapor);
        const matchSearch =
          (item.idLaporan || '').toLowerCase().includes(q) ||
          (item.idPermintaan || '').toLowerCase().includes(q) ||
          (item.namaBarang || '').toLowerCase().includes(q) ||
          (item.teknisiRespon || '').toLowerCase().includes(q) ||
          (item.deskripsiMasalah || '').toLowerCase().includes(q) ||
          (r?.namaRuang || '').toLowerCase().includes(q);
        if (!matchSearch) return false;
      }

      // Filter Unit
      if (selectedRuang !== 'all' && item.unitPelapor !== selectedRuang) {
        return false;
      }

      // Filter Status Respon
      if (selectedStatusRespon !== 'all') {
        if (selectedStatusRespon === 'Tepat Waktu' && item.statusRespon !== 'Tepat Waktu') return false;
        if (selectedStatusRespon === 'Terlambat' && item.statusRespon !== 'Terlambat') return false;
        if (selectedStatusRespon === 'Menunggu Respon' && item.statusRespon !== 'Menunggu Respon') return false;
      }

      // Filter Tahun
      if (selectedTahun !== 'all' && item.tglJamLapor) {
        const y = item.tglJamLapor.slice(0, 4);
        if (y !== selectedTahun) return false;
      }

      // Filter Bulan
      if (selectedBulan !== 'all' && item.tglJamLapor) {
        const m = item.tglJamLapor.slice(5, 7);
        if (m !== selectedBulan) return false;
      }

      return true;
    });
  }, [mutuList, searchTerm, selectedRuang, selectedStatusRespon, selectedTahun, selectedBulan, ruangList]);

  // Realtime Pending alerts (Menunggu Respon)
  const pendingTickets = useMemo(() => {
    return mutuList.filter(m => m.statusRespon === 'Menunggu Respon' || !m.tglJamRespon);
  }, [mutuList]);

  // KPI Calculations according to user's formula:
  // Capaian Mutu (%) = (Jumlah Laporan dengan Respons <= 15 Menit / Total Seluruh Laporan Masuk) * 100%
  // Target Standar: >= 80%
  const totalLaporan = filteredList.length;
  const responTepatWaktu = filteredList.filter(
    item => item.statusRespon === 'Tepat Waktu' || (item.durasiRespon !== undefined && item.durasiRespon <= 15 && item.tglJamRespon)
  ).length;
  const responTerlambat = filteredList.filter(
    item => item.statusRespon === 'Terlambat' || (item.durasiRespon !== undefined && item.durasiRespon > 15)
  ).length;
  const menungguResponCount = filteredList.filter(
    item => item.statusRespon === 'Menunggu Respon' || !item.tglJamRespon
  ).length;

  const persentaseCapaian = totalLaporan > 0 ? (responTepatWaktu / totalLaporan) * 100 : 100;
  const targetMinimal = 80; // 80%
  const isTargetTercapai = persentaseCapaian >= targetMinimal;

  // Average response time in minutes for the currently filtered items (with valid response time)
  const avgDurationMinutes = useMemo(() => {
    const itemsWithDurasi = filteredList.filter(
      i => i.durasiRespon !== undefined && i.durasiRespon !== null && !isNaN(i.durasiRespon) && i.tglJamRespon
    );
    if (itemsWithDurasi.length === 0) return 0;
    const sum = itemsWithDurasi.reduce((acc, curr) => acc + (curr.durasiRespon || 0), 0);
    return Number((sum / itemsWithDurasi.length).toFixed(1));
  }, [filteredList]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingId(null);
    setFormIdPermintaan('');
    setFormUnitPelapor(ruangList[0]?.id || 'R01');
    setFormIdBarang(inventaris[0]?.idBarang || '');
    setFormNamaBarang(inventaris[0]?.namaBarang || '');
    setFormDeskripsi('');
    setFormTglJamLapor(new Date().toISOString().slice(0, 16));
    setFormTglJamRespon('');
    setFormAlasanKeterlambatan('');
    setFormTeknisiRespon(currentUser?.namaLengkap || 'Agus Triono, AMd.TEM');
    setFormTindakLanjut('Sudah Dikerjakan');
    setFormCatatan('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item: LaporanMutuIPSRS) => {
    setEditingId(item.idLaporan);
    setFormIdPermintaan(item.idPermintaan || '');
    setFormUnitPelapor(item.unitPelapor);
    setFormIdBarang(item.idBarang || '');
    setFormNamaBarang(item.namaBarang);
    setFormDeskripsi(item.deskripsiMasalah || '');
    
    // Normalize format for datetime-local (YYYY-MM-DDTHH:mm)
    const laporNorm = item.tglJamLapor ? item.tglJamLapor.replace(' ', 'T').slice(0, 16) : '';
    const responNorm = item.tglJamRespon ? item.tglJamRespon.replace(' ', 'T').slice(0, 16) : '';
    setFormTglJamLapor(laporNorm);
    setFormTglJamRespon(responNorm);
    setFormAlasanKeterlambatan(item.alasanKeterlambatan || '');
    setFormTeknisiRespon(item.teknisiRespon || currentUser?.namaLengkap || 'Agus Triono, AMd.TEM');
    setFormTindakLanjut((item.tindakLanjut as any) || 'Sudah Dikerjakan');
    setFormCatatan(item.catatan || '');
    setIsModalOpen(true);
  };

  // Save Modal (Create / Update)
  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();

    let durasi: number | undefined = undefined;
    let statusRespon = 'Menunggu Respon';

    if (formTglJamRespon) {
      durasi = calculateDurationMinutes(formTglJamLapor, formTglJamRespon);
      statusRespon = durasi <= 15 ? 'Tepat Waktu' : 'Terlambat';
    }

    if (statusRespon === 'Terlambat' && !formAlasanKeterlambatan.trim()) {
      alert('Waktu respon melebihi 15 menit. Mohon pilih alasan keterlambatan respon!');
      return;
    }

    if (editingId) {
      const updated = mutuList.map(item => {
        if (item.idLaporan === editingId) {
          return {
            ...item,
            idPermintaan: formIdPermintaan.trim() || undefined,
            unitPelapor: formUnitPelapor,
            idBarang: formIdBarang || undefined,
            namaBarang: formNamaBarang.trim(),
            deskripsiMasalah: formDeskripsi.trim() || undefined,
            tglJamLapor: formTglJamLapor.replace('T', ' '),
            tglJamRespon: formTglJamRespon ? formTglJamRespon.replace('T', ' ') : undefined,
            durasiRespon: durasi,
            statusRespon,
            alasanKeterlambatan: statusRespon === 'Terlambat' ? formAlasanKeterlambatan : undefined,
            teknisiRespon: formTeknisiRespon.trim() || undefined,
            tindakLanjut: formTindakLanjut,
            catatan: formCatatan.trim() || undefined,
          };
        }
        return item;
      });
      setMutuList(updated);
      dataStorage.saveLaporanMutu(updated);
    } else {
      const nextId = dataStorage.getNextLaporanMutuId();
      const newItem: LaporanMutuIPSRS = {
        idLaporan: nextId,
        idPermintaan: formIdPermintaan.trim() || undefined,
        unitPelapor: formUnitPelapor,
        idBarang: formIdBarang || undefined,
        namaBarang: formNamaBarang.trim(),
        deskripsiMasalah: formDeskripsi.trim() || undefined,
        tglJamLapor: formTglJamLapor.replace('T', ' '),
        tglJamRespon: formTglJamRespon ? formTglJamRespon.replace('T', ' ') : undefined,
        durasiRespon: durasi,
        statusRespon,
        alasanKeterlambatan: statusRespon === 'Terlambat' ? formAlasanKeterlambatan : undefined,
        teknisiRespon: formTeknisiRespon.trim() || undefined,
        tindakLanjut: formTindakLanjut,
        catatan: formCatatan.trim() || undefined,
        createdAt: formTglJamLapor.slice(0, 10),
      };
      const updated = [newItem, ...mutuList];
      setMutuList(updated);
      dataStorage.saveLaporanMutu(updated);
    }

    setIsModalOpen(false);
  };

  // Quick Respond (1-Click Action for Technicians)
  const handleOpenQuickRespond = (item: LaporanMutuIPSRS) => {
    setQuickRespondItem(item);
    setQuickAlasan('');
    setQuickTeknisi(currentUser?.namaLengkap || (currentUser as any)?.name || 'Agus Triono, AMd.TEM');
    setQuickCatatan('');
  };

  const handleExecuteQuickRespond = () => {
    if (!quickRespondItem) return;

    const now = new Date();
    const nowStr = now.toISOString().replace('T', ' ').slice(0, 19);
    const durasi = calculateDurationMinutes(quickRespondItem.tglJamLapor, nowStr);
    const statusRespon = durasi <= 15 ? 'Tepat Waktu' : 'Terlambat';

    if (statusRespon === 'Terlambat' && !quickAlasan.trim()) {
      alert('Durasi respon tercatat > 15 Menit. Wajib memilih alasan keterlambatan!');
      return;
    }

    const updated = mutuList.map(item => {
      if (item.idLaporan === quickRespondItem.idLaporan) {
        return {
          ...item,
          tglJamRespon: nowStr,
          durasiRespon: durasi,
          statusRespon,
          alasanKeterlambatan: statusRespon === 'Terlambat' ? quickAlasan : undefined,
          teknisiRespon: quickTeknisi,
          tindakLanjut: 'Sudah Dikerjakan',
          catatan: quickCatatan.trim() || item.catatan,
        };
      }
      return item;
    });

    setMutuList(updated);
    dataStorage.saveLaporanMutu(updated);
    setQuickRespondItem(null);
  };

  // Delete Item
  const handleConfirmDelete = () => {
    if (!deleteConfirmItem) return;
    const updated = mutuList.filter(m => m.idLaporan !== deleteConfirmItem.idLaporan);
    setMutuList(updated);
    dataStorage.saveLaporanMutu(updated);
    setDeleteConfirmItem(null);
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'ID Laporan',
      'ID Tiket Aduan',
      'Unit Pelapor',
      'Nama Barang / Sarana',
      'ID Barang',
      'Tgl & Jam Lapor',
      'Tgl & Jam Respon',
      'Durasi Respon (Menit)',
      'Status Respon (<= 15 Menit)',
      'Alasan Keterlambatan',
      'Teknisi Respon',
      'Tindak Lanjut',
      'Deskripsi Masalah / Catatan',
    ];

    const rows = filteredList.map(item => {
      const r = ruangList.find(ru => ru.id === item.unitPelapor);
      return [
        item.idLaporan,
        item.idPermintaan || '-',
        r ? `${r.id} - ${r.namaRuang}` : item.unitPelapor,
        item.namaBarang,
        item.idBarang || '-',
        item.tglJamLapor,
        item.tglJamRespon || 'Belum Direspon',
        item.durasiRespon !== undefined ? `${item.durasiRespon} Menit` : '-',
        item.statusRespon,
        item.alasanKeterlambatan || '-',
        item.teknisiRespon || '-',
        item.tindakLanjut || '-',
        item.deskripsiMasalah || item.catatan || '-',
      ];
    });

    exportToCsv(`Laporan_Indikator_Mutu_IPSRS_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  // Export PDF Ringkasan Indikator Mutu
  const handleExportPdf = () => {
    exportLaporanMutuPdf({
      filteredList,
      ruangList,
      appSettings: settings,
      selectedBulan,
      selectedTahun,
      selectedRuang,
      selectedStatusRespon,
      totalLaporan,
      responTepatWaktu,
      responTerlambat,
      menungguResponCount,
      persentaseCapaian,
      isTargetTercapai,
      printedBy: currentUser?.namaLengkap || currentUser?.username || 'Petugas IPSRS',
    });
  };

  // Print Laporan Mutu Resmi dengan CSS print layout
  const handlePrintLaporan = () => {
    try {
      window.print();
    } catch {
      printDiv('print-laporan-mutu-container', `Laporan Mutu IPSRS ${settings.appName || 'RS Medika Insani'}`);
    }
  };

  // Calculate live preview duration inside Modal
  const modalLiveDuration = calculateDurationMinutes(formTglJamLapor, formTglJamRespon);
  const modalLiveStatus = formTglJamRespon
    ? modalLiveDuration <= 15
      ? 'Tepat Waktu'
      : 'Terlambat'
    : 'Menunggu Respon';

  return (
    <div className="space-y-6">
      {/* 1. HEADER & ACTION BUTTONS */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Activity className="w-5 h-5 text-blue-600" />
              <span>d. Laporan Mutu Layanan IPSRS</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Indikator Mutu Unit: <b>Waktu Tanggap Penanganan / Kerusakan Alat IPSRS (Response Time ≤ 15 Menit)</b>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {actionAccess.canExport && (
              <>
                <button
                  type="button"
                  onClick={handleExportPdf}
                  className="px-3 py-1.5 rounded-md bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  title="Unduh Ringkasan Parameter Indikator Mutu dalam format PDF"
                >
                  <FileText className="w-3.5 h-3.5 text-rose-600" />
                  <span>Export PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="px-3 py-1.5 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  title="Download Data CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export Excel/CSV</span>
                </button>
              </>
            )}

            {actionAccess.canPrint && (
              <button
                type="button"
                onClick={handlePrintLaporan}
                className="px-3 py-1.5 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                title="Cetak Laporan Mutu Resmi dengan Tata Letak Khusus (CSS Print)"
              >
                <Printer className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Print Laporan</span>
              </button>
            )}

            {actionAccess.canCreate && (
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Catat Laporan Mutu</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. FILTER CONTROLS */}
        <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
          {/* Baris 1: Filter Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-2.5">
            {/* Search */}
            <div className="relative md:col-span-4">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Cari ID tiket, nama alat medis, teknisi, ruangan..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            {/* Filter Ruangan / Unit (Fokus Utama Kepala Unit) */}
            <div className="md:col-span-3">
              <div className="relative">
                <Building2 className="w-3.5 h-3.5 text-blue-600 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={selectedRuang}
                  onChange={e => setSelectedRuang(e.target.value)}
                  className={`w-full pl-8 pr-2.5 py-1.5 border rounded-md text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer ${
                    selectedRuang !== 'all'
                      ? 'bg-blue-50/80 border-blue-300 text-blue-900 ring-1 ring-blue-200'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                  title="Pilih unit atau ruangan untuk memantau performa respon khusus area kerja"
                >
                  <option value="all">🏢 Semua Ruangan / Unit RS ({mutuList.length} Tiket)</option>
                  {ruangList.map(r => {
                    const cnt = roomTicketCounts[r.id] || 0;
                    return (
                      <option key={r.id} value={r.id}>
                        [{r.id}] {r.namaRuang} ({cnt} Aduan)
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Filter Status Respon */}
            <div className="md:col-span-2">
              <select
                value={selectedStatusRespon}
                onChange={e => setSelectedStatusRespon(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white cursor-pointer"
              >
                <option value="all">Semua Status Respon</option>
                <option value="Tepat Waktu">Tepat Waktu (≤ 15m)</option>
                <option value="Terlambat">Terlambat (&gt; 15m)</option>
                <option value="Menunggu Respon">Menunggu Respon</option>
              </select>
            </div>

            {/* Filter Bulan */}
            <div className="md:col-span-1.5 sm:col-span-1">
              <select
                value={selectedBulan}
                onChange={e => setSelectedBulan(e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white cursor-pointer"
              >
                <option value="all">Semua Bln</option>
                <option value="01">Jan</option>
                <option value="02">Feb</option>
                <option value="03">Mar</option>
                <option value="04">Apr</option>
                <option value="05">Mei</option>
                <option value="06">Jun</option>
                <option value="07">Jul</option>
                <option value="08">Agu</option>
                <option value="09">Sep</option>
                <option value="10">Okt</option>
                <option value="11">Nov</option>
                <option value="12">Des</option>
              </select>
            </div>

            {/* Filter Tahun */}
            <div className="md:col-span-1.5 sm:col-span-1">
              <select
                value={selectedTahun}
                onChange={e => setSelectedTahun(e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white cursor-pointer"
              >
                <option value="all">Semua Thn</option>
                {availableYears.map(y => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Baris 2: Quick Filter Chips Unit / Ruangan */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-400" />
              <span>Akses Cepat Unit:</span>
            </span>

            {/* Tombol Semua Unit */}
            <button
              type="button"
              onClick={() => setSelectedRuang('all')}
              className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                selectedRuang === 'all'
                  ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>Semua Unit</span>
              <span className="text-[10px] opacity-80">({mutuList.length})</span>
            </button>

            {/* Tombol Area Kerja Saya (Jika User Terdaftar di Unit) */}
            {userAssignedRuang && (
              <button
                type="button"
                onClick={() => setSelectedRuang(userAssignedRuang.id)}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 border ${
                  selectedRuang === userAssignedRuang.id
                    ? 'bg-emerald-600 border-emerald-700 text-white shadow-xs'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                }`}
                title={`Filter khusus area kerja ${userAssignedRuang.namaRuang} (${currentUser?.namaLengkap || currentUser?.username || 'Saya'})`}
              >
                <UserCheck className="w-3 h-3" />
                <span>Area Saya: {userAssignedRuang.namaRuang}</span>
                <span className="text-[10px] px-1 py-0.1 bg-white/30 rounded-full">
                  {roomTicketCounts[userAssignedRuang.id] || 0}
                </span>
              </button>
            )}

            {/* Top Unit Chips yang memiliki data tiket */}
            {ruangList
              .filter(r => (roomTicketCounts[r.id] || 0) > 0 && r.id !== userAssignedRuang?.id)
              .slice(0, 6)
              .map(r => {
                const isSelected = selectedRuang === r.id;
                const count = roomTicketCounts[r.id] || 0;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedRuang(r.id)}
                    className={`px-2 py-0.5 rounded-full text-[11px] transition-colors cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{r.namaRuang}</span>
                    <span className="text-[10px] opacity-75 font-mono">({count})</span>
                  </button>
                );
              })}

            {selectedRuang !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedRuang('all')}
                className="px-2 py-0.5 rounded-full text-[11px] text-rose-600 hover:bg-rose-50 font-medium flex items-center gap-1 cursor-pointer ml-auto"
                title="Reset filter unit ke seluruh rumah sakit"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filter Unit</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2.5 SPECIALIZED UNIT PERFORMANCE BANNER (Saat Filter Unit / Ruangan Aktif) */}
      {selectedRuang !== 'all' && selectedRuangObj && (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-xl p-4 shadow-sm border border-blue-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-500/30 border border-blue-400/40 flex items-center justify-center text-blue-200">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/40 text-blue-200">
                    PANEL PEMANTAUAN KHUSUS AREA KERJA
                  </span>
                  <span className="font-mono text-xs font-bold text-amber-300">
                    KODE: {selectedRuangObj.id}
                  </span>
                </div>
                <h2 className="text-base font-bold text-white mt-0.5">
                  Ruangan / Poli: {selectedRuangObj.namaRuang}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={handleExportPdf}
                className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/20 cursor-pointer"
                title="Unduh laporan indikator mutu PDF khusus unit ini"
              >
                <FileDown className="w-3.5 h-3.5 text-rose-300" />
                <span>PDF Unit Ini</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRuang('all')}
                className="px-2.5 py-1 rounded bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
              >
                <RotateCcw className="w-3 h-3 text-slate-700" />
                <span>Lihat Seluruh RS</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar khusus Ruangan terpilih */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-white/10 text-xs">
            <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
              <div className="text-[10px] text-blue-200 font-medium">Total Aduan Masuk</div>
              <div className="text-lg font-bold text-white mt-0.5">{totalLaporan} Tiket</div>
            </div>

            <div className="bg-emerald-950/40 rounded-lg p-2.5 border border-emerald-500/30">
              <div className="text-[10px] text-emerald-300 font-medium">Respon Cepat (≤ 15m)</div>
              <div className="text-lg font-bold text-emerald-400 mt-0.5">
                {responTepatWaktu} ({totalLaporan > 0 ? ((responTepatWaktu / totalLaporan) * 100).toFixed(0) : 0}%)
              </div>
            </div>

            <div className="bg-rose-950/40 rounded-lg p-2.5 border border-rose-500/30">
              <div className="text-[10px] text-rose-300 font-medium">Respon Terlambat</div>
              <div className="text-lg font-bold text-rose-400 mt-0.5">{responTerlambat} Tiket</div>
            </div>

            <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
              <div className="text-[10px] text-blue-200 font-medium">Rata-rata Respon</div>
              <div className="text-lg font-bold text-cyan-300 mt-0.5">
                {avgDurationMinutes > 0 ? `${avgDurationMinutes} Menit` : '-'}
              </div>
            </div>

            <div className={`col-span-2 sm:col-span-1 rounded-lg p-2.5 border ${
              isTargetTercapai ? 'bg-emerald-900/60 border-emerald-500/50' : 'bg-rose-900/60 border-rose-500/50'
            }`}>
              <div className="text-[10px] text-slate-200 font-medium">Status Capaian SPM</div>
              <div className={`text-sm font-black mt-0.5 ${isTargetTercapai ? 'text-emerald-300' : 'text-rose-300'}`}>
                {persentaseCapaian.toFixed(1)}% {isTargetTercapai ? '(TERCAPAI)' : '(TIDAK TERCAPAI)'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. DASHBOARD WIDGET / RINGKASAN CAPAIAN MUTU (Sesuai Spesifikasi Poin 2 & 3) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* TOTAL LAPORAN (N) */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">TOTAL LAPORAN (N)</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{totalLaporan}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {selectedRuang !== 'all' && selectedRuangObj
                ? `Aduan kerusakan di ${selectedRuangObj.namaRuang}`
                : 'Total seluruh aduan kerusakan masuk RS'}
            </p>
          </div>
        </div>

        {/* RESPONS <= 15 MENIT (D) */}
        <div className="bg-white rounded-xl border border-emerald-200/80 bg-emerald-50/20 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">RESPONS ≤ 15 MENIT (D)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-700">{responTepatWaktu}</div>
            <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">
              {totalLaporan > 0 ? ((responTepatWaktu / totalLaporan) * 100).toFixed(1) : '0'}% Tepat Waktu (Standard)
            </p>
          </div>
        </div>

        {/* RESPONS > 15 MENIT (TERLAMBAT) */}
        <div className="bg-white rounded-xl border border-rose-200/80 bg-rose-50/20 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">RESPONS &gt; 15 MENIT</span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-rose-700">{responTerlambat}</div>
            <p className="text-[11px] text-rose-600 mt-0.5 font-medium">
              {totalLaporan > 0 ? ((responTerlambat / totalLaporan) * 100).toFixed(1) : '0'}% Melebihi Batas SOP
            </p>
          </div>
        </div>

        {/* PERSENTASE CAPAIAN MUTU & STATUS TARGET */}
        <div className={`rounded-xl border p-4 shadow-xs flex flex-col justify-between ${
          isTargetTercapai ? 'bg-emerald-900 text-white border-emerald-800' : 'bg-rose-900 text-white border-rose-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-emerald-200 uppercase">
              {selectedRuang !== 'all' && selectedRuangObj
                ? `MUTU ${selectedRuangObj.namaRuang.toUpperCase().slice(0, 15)}`
                : 'CAPAIAN MUTU (TARGET ≥ 80%)'}
            </span>
            {isTargetTercapai ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400 text-emerald-950 flex items-center gap-1 shadow-xs">
                <Check className="w-3 h-3" />
                STATUS: TERCAPAI
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-400 text-rose-950 flex items-center gap-1 shadow-xs">
                <AlertTriangle className="w-3 h-3" />
                TIDAK TERCAPAI
              </span>
            )}
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight">{persentaseCapaian.toFixed(2)}%</span>
              <span className="text-xs text-emerald-200/80">/ Target 80%</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-white/20 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isTargetTercapai ? 'bg-emerald-400' : 'bg-rose-400'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, persentaseCapaian))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3.5 GRAFIK VISUALISASI RECHARTS: TREN CAPAIAN WAKTU TANGGAP PER BULAN */}
      <MutuTrendChart
        data={mutuList}
        ruangList={ruangList}
        selectedRuang={selectedRuang}
        selectedTahun={selectedTahun}
        selectedBulan={selectedBulan}
        onSelectMonth={(monthStr) => {
          setSelectedBulan(monthStr);
        }}
      />

      {/* 4. REALTIME PENDING ALERTS (Jika ada laporan belum direspon) */}
      {pendingTickets.length > 0 && (
        <div className="bg-amber-50 border border-amber-300/80 rounded-xl p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
              <Timer className="w-4 h-4 text-amber-600 animate-pulse" />
              <span>PERINGATAN REALTIME: {pendingTickets.length} Tiket Menunggu Respon Petugas IPSRS</span>
            </div>
            <span className="text-[11px] text-amber-800 font-medium">Batas Standar: ≤ 15 Menit</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
            {pendingTickets.map(pt => {
              const r = ruangList.find(ru => ru.id === pt.unitPelapor);
              const elapsedMin = calculateDurationMinutes(pt.tglJamLapor, new Date().toISOString());
              const isDanger = elapsedMin > 15;
              const isWarning = elapsedMin >= 10 && elapsedMin <= 15;

              return (
                <div
                  key={pt.idLaporan}
                  className={`p-2.5 rounded-lg border bg-white flex items-center justify-between gap-2 shadow-2xs ${
                    isDanger ? 'border-rose-300 ring-1 ring-rose-300' : isWarning ? 'border-amber-300 ring-1 ring-amber-300' : 'border-slate-200'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-xs text-blue-700">{pt.idLaporan}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-slate-100 text-slate-700">
                        {r?.namaRuang || pt.unitPelapor}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-900 truncate mt-0.5">{pt.namaBarang}</p>
                    <div className="flex items-center gap-1 text-[11px] mt-0.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span className={`font-semibold ${isDanger ? 'text-rose-600 font-bold' : isWarning ? 'text-amber-600' : 'text-slate-600'}`}>
                        {elapsedMin} Menit Lalu {isDanger ? '(Terlambat)' : isWarning ? '(Mendekati Batas)' : ''}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenQuickRespond(pt)}
                    className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                  >
                    <Zap className="w-3 h-3" />
                    <span>Respon</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. PRINTABLE REKAP CONTAINER (Table + SPM Format) */}
      <div id="print-laporan-mutu-container" className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Printable Header - Kop Resmi RS Terstandarisasi */}
        <div className="hidden print:block p-6 print-avoid-break">
          <DocumentHeader
            settings={settings}
            title="LAPORAN INDIKATOR MUTU PELAYANAN: WAKTU TANGGAP KERUSAKAN ALAT (≤ 15 MENIT)"
            documentNumber={`Nomor: ${new Date().getFullYear()}/MUTU-IPSRS/${settings.systemShortName || 'RSMI'}/${selectedBulan !== 'all' ? selectedBulan : 'ALL'}`}
            unitName="Instalasi Pemeliharaan Sarana & Prasarana Rumah Sakit (IPSRS) & Komite Mutu RS"
            extraMeta={
              <div className="flex justify-between items-center text-[11px] text-slate-600 font-medium px-2 pt-1">
                <span>Periode: <strong>{selectedBulan !== 'all' ? `Bulan ${selectedBulan}` : 'Semua Bulan'} {selectedTahun !== 'all' ? `Tahun ${selectedTahun}` : ''}</strong></span>
                <span>Unit: <strong>{selectedRuang !== 'all' && selectedRuangObj ? selectedRuangObj.namaRuang : 'Seluruh Unit RS'}</strong></span>
                <span>Tgl Cetak: <strong>{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></span>
              </div>
            }
          />
        </div>

        {/* Formal Parameter Indikator Mutu Table (Sesuai Format Poin 4) */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                <span>Rekapitulasi Parameter Mutu Layanan Waktu Tanggap (Response Time)</span>
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">Standar Pelayanan Minimal (SPM) IPSRS & Akreditasi RS</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto print:hidden">
              <button
                type="button"
                onClick={handlePrintLaporan}
                className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                title="Cetak Laporan Mutu Resmi dengan Tata Letak Khusus (CSS Print)"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Laporan</span>
              </button>

              {actionAccess.canExport && (
                <button
                  type="button"
                  onClick={handleExportPdf}
                  className="px-2.5 py-1.5 rounded-md bg-white border border-slate-300 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700 text-slate-700 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  title="Unduh ringkasan parameter indikator mutu ke file PDF"
                >
                  <FileDown className="w-3.5 h-3.5 text-rose-600" />
                  <span>Unduh PDF</span>
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-slate-200 bg-white rounded-lg">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2 px-3 text-left w-1/3">Parameter Indikator</th>
                  <th className="py-2 px-3 text-left w-1/4">Nilai / Angka</th>
                  <th className="py-2 px-3 text-left">Keterangan Sistem & Formulasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                <tr>
                  <td className="py-2 px-3 font-semibold text-slate-700">Area Kerja / Unit Pemantauan</td>
                  <td className="py-2 px-3 font-bold text-blue-900">
                    {selectedRuang !== 'all' && selectedRuangObj
                      ? `[${selectedRuangObj.id}] ${selectedRuangObj.namaRuang}`
                      : 'Seluruh Ruangan / Unit RS (Agregat)'}
                  </td>
                  <td className="py-2 px-3 text-slate-500 text-[11px]">
                    {selectedRuang !== 'all'
                      ? 'Khusus evaluasi mutu respon teknisi untuk permintaan dari ruangan ini'
                      : 'Mencakup seluruh instalasi rawat inap, jalan, penunjang, dan administrasi'}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-slate-700">Judul Indikator</td>
                  <td className="py-2 px-3 font-bold text-blue-900">Waktu Tanggap Kerusakan Alat/Sarana IPSRS</td>
                  <td className="py-2 px-3 text-slate-500 text-[11px]">Indikator Mutu Unit & Manajemen Fasilitas Keselamatan (MFK)</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-slate-700">Standar Waktu Tanggap</td>
                  <td className="py-2 px-3 font-bold text-slate-900">≤ 15 Menit</td>
                  <td className="py-2 px-3 text-slate-500 text-[11px]">Dihitung sejak tiket disubmit ruangan hingga teknisi menerima aksi</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-slate-700">Target Minimal Mutu RS</td>
                  <td className="py-2 px-3 font-bold text-slate-900">≥ 80%</td>
                  <td className="py-2 px-3 text-slate-500 text-[11px]">Target capaian minimal Standar Akreditasi Rumah Sakit</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-slate-700">Total Seluruh Laporan Masuk (N)</td>
                  <td className="py-2 px-3 font-bold text-slate-900">{totalLaporan} Laporan</td>
                  <td className="py-2 px-3 text-slate-500 text-[11px]">Terhitung otomatis dari log aduan & permintaan perbaikan ruangan</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-slate-700">Respons Tepat Waktu ≤ 15 Menit (D)</td>
                  <td className="py-2 px-3 font-bold text-emerald-700">{responTepatWaktu} Laporan</td>
                  <td className="py-2 px-3 text-slate-500 text-[11px]">Jumlah laporan dengan selisih waktu respon ≤ 15 Menit</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-slate-700">Respons Terlambat &gt; 15 Menit</td>
                  <td className="py-2 px-3 font-bold text-rose-700">{responTerlambat} Laporan</td>
                  <td className="py-2 px-3 text-slate-500 text-[11px]">Disertai pencatatan alasan kendala teknis / cito</td>
                </tr>
                <tr className={isTargetTercapai ? 'bg-emerald-50/60 font-bold' : 'bg-rose-50/60 font-bold'}>
                  <td className="py-2 px-3 text-slate-900">Capaian Akhir (%)</td>
                  <td className="py-2 px-3 text-base font-black text-slate-900">
                    {persentaseCapaian.toFixed(2)}%
                  </td>
                  <td className="py-2 px-3 text-[11px]">
                    Rumus: <span className="font-mono">(D / N) × 100% = ({responTepatWaktu} / {totalLaporan || 1}) × 100%</span>
                  </td>
                </tr>
                <tr className={isTargetTercapai ? 'bg-emerald-100/80 font-bold' : 'bg-rose-100/80 font-bold'}>
                  <td className="py-2.5 px-3 text-slate-900">Kesimpulan Status Evaluasi</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      isTargetTercapai ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                    }`}>
                      {isTargetTercapai ? 'TERCAPAI (MEMENUHI STANDAR)' : 'TIDAK TERCAPAI (PERLU RTL / EVALUASI)'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 text-[11px]">
                    {isTargetTercapai
                      ? 'Kinerja respon time IPSRS sangat baik dan memenuhi standar mutu pelayanan RS.'
                      : 'Kinerja di bawah target minimal 80%. Diperlukan Rencana Tindak Lanjut (RTL) dan optimalisasi alokasi teknisi.'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 6. TABEL DETAIL DATA TIKET LAPORAN MUTU */}
        {selectedRuang !== 'all' && selectedRuangObj && (
          <div className="px-4 py-2 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between text-xs flex-wrap gap-2">
            <div className="flex items-center gap-2 text-blue-900 font-medium">
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>
                Fokus Tabel: Menampilkan <strong>{filteredList.length}</strong> tiket laporan mutu khusus area{' '}
                <strong>{selectedRuangObj.namaRuang}</strong> ({selectedRuangObj.id})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedRuang('all')}
              className="text-blue-700 hover:text-blue-900 font-bold text-[11px] underline cursor-pointer"
            >
              Tampilkan Semua Unit RS
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">ID Laporan / Tiket</th>
                <th className="py-2.5 px-3">Unit Pelapor</th>
                <th className="py-2.5 px-3">Nama Alat Medis / Sarana</th>
                <th className="py-2.5 px-3">Waktu Lapor</th>
                <th className="py-2.5 px-3">Waktu Respon</th>
                <th className="py-2.5 px-3">Durasi Respon</th>
                <th className="py-2.5 px-3">Status Mutu</th>
                <th className="py-2.5 px-3">Alasan Keterlambatan</th>
                <th className="py-2.5 px-3">Teknisi</th>
                <th className="py-2.5 px-3 text-center print:hidden">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Tidak ada data laporan mutu yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredList.map(item => {
                  const r = ruangList.find(ru => ru.id === item.unitPelapor);
                  const isTepat = item.statusRespon === 'Tepat Waktu' || (item.durasiRespon !== undefined && item.durasiRespon <= 15 && item.tglJamRespon);
                  const isTerlambat = item.statusRespon === 'Terlambat' || (item.durasiRespon !== undefined && item.durasiRespon > 15);
                  const isPending = !item.tglJamRespon || item.statusRespon === 'Menunggu Respon';

                  return (
                    <tr key={item.idLaporan} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700 bg-blue-50/30">
                        <div>{item.idLaporan}</div>
                        {item.idPermintaan && (
                          <div className="text-[10px] text-slate-400 font-mono">Ref: {item.idPermintaan}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        {r?.namaRuang || item.unitPelapor}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{item.namaBarang}</div>
                        {item.idBarang && (
                          <div className="text-[10px] font-mono text-slate-400">{item.idBarang}</div>
                        )}
                        {item.deskripsiMasalah && (
                          <div className="text-[11px] text-slate-500 truncate max-w-xs">{item.deskripsiMasalah}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                        {formatDateTimeDisplay(item.tglJamLapor)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                        {item.tglJamRespon ? (
                          formatDateTimeDisplay(item.tglJamRespon)
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            Menunggu Respon
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {item.durasiRespon !== undefined ? (
                          <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                            item.durasiRespon <= 15
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {item.durasiRespon} Menit
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {isTepat && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Tepat Waktu</span>
                          </span>
                        )}
                        {isTerlambat && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>Terlambat</span>
                          </span>
                        )}
                        {isPending && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Menunggu</span>
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-xs">
                        {item.alasanKeterlambatan ? (
                          <span className="text-[11px] font-medium text-rose-800 bg-rose-50/80 px-2 py-0.5 rounded border border-rose-100">
                            {item.alasanKeterlambatan}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        {item.teknisiRespon || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center print:hidden whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 justify-center">
                          {isPending && (
                            <button
                              type="button"
                              onClick={() => handleOpenQuickRespond(item)}
                              className="px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium text-[11px] border border-blue-200 cursor-pointer shadow-2xs flex items-center gap-1"
                              title="Terima dan Respon Tiket"
                            >
                              <Zap className="w-3 h-3 text-blue-600" />
                              <span>Respon</span>
                            </button>
                          )}
                          {actionAccess.canEdit && (
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Edit Data Mutu"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {actionAccess.canDelete && (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmItem(item)}
                              className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Hapus Data Mutu"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Printable Signatures with TTE QR Codes */}
        <div className="hidden print:grid grid-cols-2 gap-8 p-6 text-center text-xs border-t-2 border-slate-300 print-avoid-break">
          <QrSignature
            role="Penanggung Jawab Mutu Pelayanan RS"
            name="dr. Hj. Nurhidayah, Sp.PK, MARS"
            nip="19780512 200501 2 003"
            docName="Laporan Mutu Waktu Tanggap IPSRS"
            docNumber={`MUTU-${new Date().getFullYear()}`}
            hospitalName={settings.appName}
            locationDate={new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          />

          <QrSignature
            role="Kepala Instalasi IPSRS"
            name="Ir. H. Rahardian, MT"
            nip="19820315 200804 1 002"
            docName="Laporan Mutu Waktu Tanggap IPSRS"
            docNumber={`MUTU-${new Date().getFullYear()}`}
            hospitalName={settings.appName}
            locationDate={new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          />
        </div>
      </div>

      {/* 7. MODAL CREATE / EDIT LAPORAN MUTU */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-xl w-full p-5 shadow-xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <span>{editingId ? `Edit Laporan Mutu (${editingId})` : 'Catat Data Mutu Waktu Tanggap IPSRS'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="py-3.5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">ID Tiket Aduan / Ref Permintaan</label>
                  <input
                    type="text"
                    value={formIdPermintaan}
                    onChange={e => setFormIdPermintaan(e.target.value)}
                    placeholder="Contoh: PP-001..."
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Unit / Ruangan Pelapor *</label>
                  <select
                    required
                    value={formUnitPelapor}
                    onChange={e => setFormUnitPelapor(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-white font-medium focus:ring-1 focus:ring-blue-500"
                  >
                    {ruangList.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.namaRuang} ({r.id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Pilih Alat / Sarana Medis</label>
                  <select
                    value={formIdBarang}
                    onChange={e => {
                      const selectedId = e.target.value;
                      setFormIdBarang(selectedId);
                      const asset = inventaris.find(i => i.idBarang === selectedId);
                      if (asset) {
                        setFormNamaBarang(asset.namaBarang);
                        setFormUnitPelapor(asset.idRuang);
                      }
                    }}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-white font-medium focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- Input Manual atau Pilih Aset --</option>
                    {inventaris.map(i => (
                      <option key={i.idBarang} value={i.idBarang}>
                        {i.namaBarang} ({i.idBarang})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Nama Sarana / Alat Medis *</label>
                  <input
                    type="text"
                    required
                    value={formNamaBarang}
                    onChange={e => setFormNamaBarang(e.target.value)}
                    placeholder="Nama peralatan..."
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Deskripsi Kerusakan / Keluhan</label>
                <textarea
                  rows={2}
                  value={formDeskripsi}
                  onChange={e => setFormDeskripsi(e.target.value)}
                  placeholder="Keluhan kerusakan sarana/alat..."
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Timestamp Inputs */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-slate-800">Tanggal & Jam Lapor *</label>
                      <button
                        type="button"
                        onClick={() => setFormTglJamLapor(new Date().toISOString().slice(0, 16))}
                        className="text-[10px] text-blue-600 hover:underline font-medium cursor-pointer"
                      >
                        Set Sekarang
                      </button>
                    </div>
                    <input
                      type="datetime-local"
                      required
                      value={formTglJamLapor}
                      onChange={e => setFormTglJamLapor(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-white focus:ring-1 focus:ring-blue-500 font-medium text-slate-900"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-slate-800">Tanggal & Jam Respon</label>
                      <button
                        type="button"
                        onClick={() => setFormTglJamRespon(new Date().toISOString().slice(0, 16))}
                        className="text-[10px] text-blue-600 hover:underline font-medium cursor-pointer"
                      >
                        Set Sekarang
                      </button>
                    </div>
                    <input
                      type="datetime-local"
                      value={formTglJamRespon}
                      onChange={e => setFormTglJamRespon(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-white focus:ring-1 focus:ring-blue-500 font-medium text-slate-900"
                    />
                  </div>
                </div>

                {/* Live Feedback Duration */}
                {formTglJamRespon && (
                  <div className={`p-2 rounded-md flex items-center justify-between text-xs font-semibold ${
                    modalLiveDuration <= 15 ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
                  }`}>
                    <span>Durasi Respon: {modalLiveDuration} Menit</span>
                    <span>Status: {modalLiveStatus === 'Tepat Waktu' ? 'TEPAT WAKTU (≤ 15 Menit)' : 'TERLAMBAT (> 15 Menit)'}</span>
                  </div>
                )}
              </div>

              {/* Alasan Keterlambatan (Required if > 15 Menit) */}
              {modalLiveStatus === 'Terlambat' && (
                <div className="p-3 bg-rose-50/90 border border-rose-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-rose-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Alasan Keterlambatan Respon (&gt; 15 Menit) *</span>
                    </label>
                    <span className="text-[10px] font-semibold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                      Durasi: {modalLiveDuration} Menit
                    </span>
                  </div>

                  {/* Quick Select Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {['Alat digunakan', 'Teknisi Cito lain', 'Akses Terbatas'].map(chip => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setFormAlasanKeterlambatan(chip)}
                        className={`px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                          formAlasanKeterlambatan === chip
                            ? 'bg-rose-700 text-white shadow-xs'
                            : 'bg-white border border-rose-300 text-rose-800 hover:bg-rose-100'
                        }`}
                      >
                        <Zap className="w-3 h-3" />
                        <span>{chip}</span>
                      </button>
                    ))}
                  </div>

                  <select
                    required
                    value={formAlasanKeterlambatan}
                    onChange={e => setFormAlasanKeterlambatan(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-md border border-rose-300 bg-white font-medium text-slate-800 focus:ring-1 focus:ring-rose-500 text-xs"
                  >
                    <option value="">-- Pilih Alasan Keterlambatan Sesuai SOP --</option>
                    {ALASAN_KETERLAMBATAN_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-rose-700">
                    * Wajib diisi karena waktu tanggap teknisi melebihi standar SPM RS (15 menit).
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Petugas / Teknisi Respon *</label>
                  <input
                    type="text"
                    required
                    value={formTeknisiRespon}
                    onChange={e => setFormTeknisiRespon(e.target.value)}
                    placeholder="Nama teknisi IPSRS..."
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Status Tindak Lanjut</label>
                  <select
                    value={formTindakLanjut}
                    onChange={e => setFormTindakLanjut(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-white font-medium focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Sudah Dikerjakan">Sudah Dikerjakan</option>
                    <option value="Belum Dikerjakan">Belum Dikerjakan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Catatan / Evaluasi RTL</label>
                <textarea
                  rows={2}
                  value={formCatatan}
                  onChange={e => setFormCatatan(e.target.value)}
                  placeholder="Catatan kendala, penanganan cito, atau rekomendasi perbaikan..."
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-md border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium cursor-pointer shadow-xs"
                >
                  Simpan Laporan Mutu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. QUICK RESPOND MODAL (1-Click Action for Realtime Ticket Response) */}
      {quickRespondItem && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-600" />
                <span>Respon Cepat Aduan IPSRS ({quickRespondItem.idLaporan})</span>
              </h3>
              <button
                type="button"
                onClick={() => setQuickRespondItem(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900">{quickRespondItem.namaBarang}</div>
                <div className="text-slate-600">
                  Unit: <b>{quickRespondItem.unitPelapor}</b> | Lapor: {formatDateTimeDisplay(quickRespondItem.tglJamLapor)}
                </div>
                <div className="text-slate-500 text-[11px]">{quickRespondItem.deskripsiMasalah || 'Tidak ada deskripsi'}</div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Teknisi Penerima Aksi *</label>
                <input
                  type="text"
                  required
                  value={quickTeknisi}
                  onChange={e => setQuickTeknisi(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500 font-medium"
                />
              </div>

              {calculateDurationMinutes(quickRespondItem.tglJamLapor, new Date().toISOString()) > 15 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-rose-900 text-xs flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Durasi &gt; 15 Menit: Wajib Pilih Alasan Keterlambatan</span>
                    </label>
                    <span className="text-[10px] font-semibold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                      {calculateDurationMinutes(quickRespondItem.tglJamLapor, new Date().toISOString())} Menit
                    </span>
                  </div>

                  {/* Quick Select Chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {['Alat digunakan', 'Teknisi Cito lain', 'Akses Terbatas'].map(chip => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setQuickAlasan(chip)}
                        className={`px-2 py-1 rounded text-[10px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                          quickAlasan === chip
                            ? 'bg-rose-700 text-white shadow-xs'
                            : 'bg-white border border-rose-300 text-rose-800 hover:bg-rose-100'
                        }`}
                      >
                        <Zap className="w-2.5 h-2.5" />
                        <span>{chip}</span>
                      </button>
                    ))}
                  </div>

                  <select
                    required
                    value={quickAlasan}
                    onChange={e => setQuickAlasan(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-md border border-rose-300 bg-white font-medium text-slate-800 text-xs focus:ring-1 focus:ring-rose-500"
                  >
                    <option value="">-- Pilih Alasan Keterlambatan Sesuai SOP --</option>
                    {ALASAN_KETERLAMBATAN_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-medium text-slate-700 mb-1">Catatan Tindakan Awal</label>
                <input
                  type="text"
                  value={quickCatatan}
                  onChange={e => setQuickCatatan(e.target.value)}
                  placeholder="Petugas langsung meluncur ke lokasi..."
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setQuickRespondItem(null)}
                className="px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 font-medium text-xs hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteQuickRespond}
                className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Terima & Catat Waktu Respon</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. DELETE CONFIRMATION MODAL */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl border border-slate-200 text-center space-y-3.5">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-sm">Hapus Data Mutu?</h3>
              <p className="text-xs text-slate-500">
                Yakin ingin menghapus data mutu <b>{deleteConfirmItem.idLaporan}</b> ({deleteConfirmItem.namaBarang})?
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                className="px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 font-medium text-xs hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs cursor-pointer shadow-xs"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
