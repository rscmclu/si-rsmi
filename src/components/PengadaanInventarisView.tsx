import React, { useState, useEffect } from 'react';
import { 
  PengajuanInventaris, 
  PengadaanInventaris, 
  PenerimaanInventaris, 
  InventarisRuangan, 
  RuangInventaris, 
  JenisInventaris, 
  KategoriInventaris, 
  MerkInventaris, 
  SupplierInventaris,
  ActionPermission,
  UserAccount,
  AppSettings
} from '../types/inventory';
import { dataStorage } from '../services/dataStorage';
import { formatRupiah, formatDateIndo, exportToCsv, printDiv } from '../utils/formatters';
import { DocumentHeader } from './DocumentHeader';
import { QrSignature } from './QrSignature';
import { 
  ShoppingBag, 
  FilePlus, 
  ShoppingCart, 
  PackageCheck, 
  Plus, 
  Search, 
  Printer, 
  Download, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  X, 
  Sparkles,
  Edit,
  Trash2,
  AlertCircle,
  ChevronDown,
  Check,
  XCircle,
  ShieldAlert
} from 'lucide-react';

export type PengadaanSubTab = 'pengajuan' | 'pengadaan' | 'penerimaan';

interface PengadaanInventarisViewProps {
  initialSubTab?: PengadaanSubTab;
  actionAccess: ActionPermission;
  currentUser?: UserAccount | null;
  appSettings?: AppSettings;
}

export const PengadaanInventarisView: React.FC<PengadaanInventarisViewProps> = ({
  initialSubTab = 'pengajuan',
  actionAccess,
  currentUser: propCurrentUser,
  appSettings: propAppSettings,
}) => {
  const settings = propAppSettings || dataStorage.getAppSettings();
  const activeUser = propCurrentUser || dataStorage.getCurrentUser();
  const isAdmin = true; // All authenticated users are authorized to edit and manage procurement status

  const [subTab, setSubTab] = useState<PengadaanSubTab>(initialSubTab);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setSubTab(initialSubTab);
    setSearchTerm('');
  }, [initialSubTab]);

  const [pengajuanList, setPengajuanList] = useState<PengajuanInventaris[]>(dataStorage.getPengajuan());
  const [pengadaanList, setPengadaanList] = useState<PengadaanInventaris[]>(dataStorage.getPengadaan());
  const [penerimaanList, setPenerimaanList] = useState<PenerimaanInventaris[]>(dataStorage.getPenerimaan());

  const [inventaris, setInventaris] = useState<InventarisRuangan[]>(dataStorage.getInventarisRuangan());
  const [ruangList] = useState<RuangInventaris[]>(dataStorage.getRuang());
  const [jenisList] = useState<JenisInventaris[]>(dataStorage.getJenis());
  const [kategoriList] = useState<KategoriInventaris[]>(dataStorage.getKategori());
  const [merkList] = useState<MerkInventaris[]>(dataStorage.getMerk());
  const [supplierList] = useState<SupplierInventaris[]>(dataStorage.getSupplier());

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeBastPrint, setActiveBastPrint] = useState<PenerimaanInventaris | null>(null);
  const [activePoPrint, setActivePoPrint] = useState<PengadaanInventaris | null>(null);

  // Success toast for Auto Insertion into room inventory
  const [autoInsertSuccess, setAutoInsertSuccess] = useState<string | null>(null);

  // Edit / Delete states for Pengajuan
  const [editingPengajuanId, setEditingPengajuanId] = useState<string | null>(null);
  const [deleteConfirmPengajuan, setDeleteConfirmPengajuan] = useState<PengajuanInventaris | null>(null);

  // Form states: Pengajuan
  const [formPengajuanIdRuang, setFormPengajuanIdRuang] = useState(ruangList[0]?.id || 'R01');
  const [formPengajuanNama, setFormPengajuanNama] = useState('');
  const [formPengajuanSpesifikasi, setFormPengajuanSpesifikasi] = useState('');
  const [formPengajuanJumlah, setFormPengajuanJumlah] = useState(1);
  const [formPengajuanEstimasi, setFormPengajuanEstimasi] = useState(0);
  const [formPengajuanAlasan, setFormPengajuanAlasan] = useState('');
  const [formPengajuanPemohon, setFormPengajuanPemohon] = useState('');
  const [formPengajuanStatus, setFormPengajuanStatus] = useState(isAdmin ? 'Disetujui' : 'Menunggu Persetujuan');

  // Direct status update handler from table row (Admin only)
  const handleUpdateStatusPengajuan = (idPengajuan: string, newStatus: string) => {
    if (!isAdmin) return;
    const updated = pengajuanList.map(item => {
      if (item.idPengajuan === idPengajuan) {
        return {
          ...item,
          statusPersetujuan: newStatus,
          statusApproval: newStatus,
          tindakLanjut: (newStatus === 'Disetujui' || newStatus === 'Selesai Pengadaan') ? 'Sudah Dikerjakan' : 'Belum Dikerjakan',
        };
      }
      return item;
    });
    setPengajuanList(updated);
    dataStorage.savePengajuan(updated);
  };

  // Open Edit Modal for Pengajuan
  const handleOpenEditPengajuan = (p: PengajuanInventaris) => {
    setEditingPengajuanId(p.idPengajuan);
    setFormPengajuanIdRuang(p.idRuang || 'R01');
    setFormPengajuanNama(p.namaBarang);
    setFormPengajuanSpesifikasi(p.spesifikasi || '');
    setFormPengajuanJumlah(p.jumlah);
    setFormPengajuanEstimasi(p.estimasiHarga || 0);
    setFormPengajuanAlasan(p.alasanPengajuan || p.alasanKebutuhan || '');
    setFormPengajuanPemohon(p.pemohon);
    setFormPengajuanStatus(isAdmin ? (p.statusPersetujuan || 'Disetujui') : (p.statusPersetujuan || 'Menunggu Persetujuan'));
    setSubTab('pengajuan');
    setIsModalOpen(true);
  };

  // Confirm delete Pengajuan
  const handleConfirmDeletePengajuan = () => {
    if (!deleteConfirmPengajuan) return;
    const updated = pengajuanList.filter(p => p.idPengajuan !== deleteConfirmPengajuan.idPengajuan);
    setPengajuanList(updated);
    dataStorage.savePengajuan(updated);
    setDeleteConfirmPengajuan(null);
  };

  // Form states: Pengadaan (PO)
  const [formPengadaanIdPengajuan, setFormPengadaanIdPengajuan] = useState('');
  const [formPengadaanNoPO, setFormPengadaanNoPO] = useState(`PO-RSMI-${new Date().getFullYear()}-001`);
  const [formPengadaanIdSupplier, setFormPengadaanIdSupplier] = useState(supplierList[0]?.id || 'SUP-001');
  const [formPengadaanNamaBarang, setFormPengadaanNamaBarang] = useState('');
  const [formPengadaanJumlah, setFormPengadaanJumlah] = useState(1);
  const [formPengadaanHargaSatuan, setFormPengadaanHargaSatuan] = useState(0);
  const [formPengadaanSumberDana, setFormPengadaanSumberDana] = useState<'Dana Internal RS' | 'Dana PT. / Yayasan' | 'Hibah' | string>('Dana Internal RS');
  const [formPengadaanCatatan, setFormPengadaanCatatan] = useState('');

  // Form states: Penerimaan (BAST)
  const [formPenerimaanIdPengadaan, setFormPenerimaanIdPengadaan] = useState('');
  const [formPenerimaanNoBAST, setFormPenerimaanNoBAST] = useState(`BAST-RSMI-${new Date().getFullYear()}-001`);
  const [formPenerimaanNamaBarang, setFormPenerimaanNamaBarang] = useState('');
  const [formPenerimaanJumlah, setFormPenerimaanJumlah] = useState(1);
  const [formPenerimaanKondisi, setFormPenerimaanKondisi] = useState<'Baik' | 'Cacat/Kurang'>('Baik');
  const [formPenerimaanPenerima, setFormPenerimaanPenerima] = useState('Dra. Hj. Nurul Hidayah, Apt');
  const [formPenerimaanIdRuang, setFormPenerimaanIdRuang] = useState(ruangList[0]?.id || 'R01');
  const [formPenerimaanCatatan, setFormPenerimaanCatatan] = useState('Pemeriksaan fisik sesuai spesifikasi PO.');

  const openCreateModal = () => {
    setEditingPengajuanId(null);
    if (subTab === 'pengajuan') {
      setFormPengajuanIdRuang(activeUser?.ruangId || ruangList[0]?.id || 'R01');
      setFormPengajuanNama('');
      setFormPengajuanSpesifikasi('');
      setFormPengajuanJumlah(1);
      setFormPengajuanEstimasi(15000000);
      setFormPengajuanAlasan('Penggantian unit lama yang sudah afkir & peningkatan kapasitas pelayanan.');
      setFormPengajuanPemohon(activeUser?.namaLengkap || 'dr. Hendra Pratama, Sp.An');
      // Selain user admin, kolom status persetujuan otomatis terisi 'Menunggu Persetujuan'
      setFormPengajuanStatus(isAdmin ? 'Disetujui' : 'Menunggu Persetujuan');
    } else if (subTab === 'pengadaan') {
      setFormPengadaanIdPengajuan('');
      setFormPengadaanNoPO(`PO-RSMI-${new Date().getFullYear()}-${String(pengadaanList.length + 1).padStart(3, '0')}`);
      setFormPengadaanIdSupplier(supplierList[0]?.id || 'SUP-001');
      setFormPengadaanNamaBarang('');
      setFormPengadaanJumlah(1);
      setFormPengadaanHargaSatuan(25000000);
      setFormPengadaanSumberDana('Dana Internal RS');
      setFormPengadaanCatatan('Pengadaan logistik alkes anggaran tahun berjalan.');
    } else if (subTab === 'penerimaan') {
      setFormPenerimaanIdPengadaan('');
      setFormPenerimaanNoBAST(`BAST-RSMI-${new Date().getFullYear()}-${String(penerimaanList.length + 1).padStart(3, '0')}`);
      setFormPenerimaanNamaBarang('');
      setFormPenerimaanJumlah(1);
      setFormPenerimaanKondisi('Baik');
      setFormPenerimaanPenerima('Dra. Hj. Nurul Hidayah, Apt');
      setFormPenerimaanIdRuang(ruangList[0]?.id || 'R01');
      setFormPenerimaanCatatan('Barang diterima lengkap dengan garansi resmi 1 tahun.');
    }
    setIsModalOpen(true);
  };

  // Convert Pengajuan to Pengadaan
  const handleFollowUpPengajuan = (item: PengajuanInventaris) => {
    setSubTab('pengadaan');
    setFormPengadaanIdPengajuan(item.idPengajuan);
    setFormPengadaanNoPO(`PO-RSMI-${new Date().getFullYear()}-${String(pengadaanList.length + 1).padStart(3, '0')}`);
    setFormPengadaanNamaBarang(item.namaBarang);
    setFormPengadaanJumlah(item.jumlah);
    setFormPengadaanHargaSatuan(item.estimasiHarga / item.jumlah);
    setFormPengadaanSumberDana('Dana Internal RS');
    setFormPengadaanCatatan(`Diteruskan dari ${item.idPengajuan} untuk unit ${item.idRuang}`);
    setIsModalOpen(true);
  };

  // Convert Pengadaan to Penerimaan
  const handleFollowUpPengadaan = (item: PengadaanInventaris) => {
    setSubTab('penerimaan');
    setFormPenerimaanIdPengadaan(item.idPengadaan);
    setFormPenerimaanNoBAST(`BAST-RSMI-${new Date().getFullYear()}-${String(penerimaanList.length + 1).padStart(3, '0')}`);
    setFormPenerimaanNamaBarang(item.namaBarang);
    setFormPenerimaanJumlah(item.jumlah);
    setFormPenerimaanKondisi('Baik');
    setFormPenerimaanPenerima('Panitia Penerima Hasil Pekerjaan (PPHP)');
    setFormPenerimaanIdRuang(ruangList[0]?.id || 'R01');
    setFormPenerimaanCatatan(`Penerimaan realisasi dari ${item.noPO}`);
    setIsModalOpen(true);
  };

  // MAGICAL BUTTON: Insert Penerimaan into Room Inventory
  const handleInsertIntoInventarisRuangan = (item: PenerimaanInventaris) => {
    const targetJenis = jenisList[0]?.id || 'J01';
    const targetKat = kategoriList[0]?.id || 'K01';
    const targetRuang = item.idRuangTujuan || 'R01';
    const targetMerk = merkList[0]?.id || 'MRK-001';
    const targetSupplier = supplierList[0]?.id || 'SUP-001';

    const newAssets: InventarisRuangan[] = [];

    for (let i = 0; i < item.jumlahDiterima; i++) {
      const generated = dataStorage.generateIdBarang(targetJenis, targetKat, targetRuang);
      const newAsset: InventarisRuangan = {
        idBarang: generated.idBarang,
        noUrut: generated.noUrut,
        namaBarang: item.namaBarang,
        idJenis: targetJenis,
        idKategori: targetKat,
        idMerk: targetMerk,
        idRuang: targetRuang,
        idSupplier: targetSupplier,
        spesifikasi: `Diterima melalui BAST ${item.noBAST}`,
        nomorSeri: `SN-PO-${Math.floor(100000 + Math.random() * 900000)}`,
        tahunPerolehan: new Date().getFullYear(),
        hargaPerolehan: 15000000,
        kondisi: 'Baik',
        status: 'Tersedia',
        sumberDana: 'Dana Internal RS',
        tanggalInput: new Date().toISOString().split('T')[0],
        catatan: `Hasil Penerimaan Pengadaan No ${item.noBAST}`,
      };
      newAssets.push(newAsset);
    }

    const updatedInventaris = [...newAssets, ...inventaris];
    setInventaris(updatedInventaris);
    dataStorage.saveInventarisRuangan(updatedInventaris);

    // Update status in penerimaan list
    const updatedPenerimaan = penerimaanList.map(p =>
      p.idPenerimaan === item.idPenerimaan ? { ...p, statusMasukInventaris: true } : p
    );
    setPenerimaanList(updatedPenerimaan);
    dataStorage.savePenerimaan(updatedPenerimaan);

    setAutoInsertSuccess(`Berhasil memasukkan ${item.jumlahDiterima} unit "${item.namaBarang}" ke Inventaris Ruangan ${targetRuang}! ID Barang & QR Code telah terbuat otomatis.`);
    setTimeout(() => setAutoInsertSuccess(null), 5000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (subTab === 'pengajuan') {
      const statusToSave = isAdmin 
        ? (formPengajuanStatus || 'Disetujui') 
        : (editingPengajuanId ? (formPengajuanStatus || 'Menunggu Persetujuan') : 'Menunggu Persetujuan');

      if (editingPengajuanId) {
        const updated = pengajuanList.map(item => {
          if (item.idPengajuan === editingPengajuanId) {
            return {
              ...item,
              idRuang: formPengajuanIdRuang,
              namaBarang: formPengajuanNama.trim(),
              spesifikasi: formPengajuanSpesifikasi.trim(),
              jumlah: Number(formPengajuanJumlah) || 1,
              estimasiHarga: Number(formPengajuanEstimasi) || 0,
              alasanPengajuan: formPengajuanAlasan.trim(),
              pemohon: formPengajuanPemohon.trim(),
              statusPersetujuan: statusToSave,
              statusApproval: statusToSave,
              tindakLanjut: (statusToSave === 'Disetujui' || statusToSave === 'Selesai Pengadaan') ? 'Sudah Dikerjakan' : 'Belum Dikerjakan',
            };
          }
          return item;
        });
        setPengajuanList(updated);
        dataStorage.savePengajuan(updated);
      } else {
        const nextId = dataStorage.getNextPengajuanId();
        const newPengajuan: PengajuanInventaris = {
          idPengajuan: nextId,
          idRuang: formPengajuanIdRuang,
          tanggalPengajuan: new Date().toISOString().split('T')[0],
          namaBarang: formPengajuanNama.trim(),
          spesifikasi: formPengajuanSpesifikasi.trim(),
          jumlah: Number(formPengajuanJumlah) || 1,
          estimasiHarga: Number(formPengajuanEstimasi) || 0,
          alasanPengajuan: formPengajuanAlasan.trim(),
          pemohon: formPengajuanPemohon.trim(),
          statusPersetujuan: statusToSave,
          statusApproval: statusToSave,
          tindakLanjut: (statusToSave === 'Disetujui' || statusToSave === 'Selesai Pengadaan') ? 'Sudah Dikerjakan' : 'Belum Dikerjakan',
        };
        const updated = [newPengajuan, ...pengajuanList];
        setPengajuanList(updated);
        dataStorage.savePengajuan(updated);
      }
    } else if (subTab === 'pengadaan') {
      const nextId = dataStorage.getNextPengadaanId();
      const total = (Number(formPengadaanJumlah) || 1) * (Number(formPengadaanHargaSatuan) || 0);
      const newPengadaan: PengadaanInventaris = {
        idPengadaan: nextId,
        idPengajuan: formPengadaanIdPengajuan || undefined,
        noPO: formPengadaanNoPO.trim(),
        tanggalPengadaan: new Date().toISOString().split('T')[0],
        idSupplier: formPengadaanIdSupplier,
        namaBarang: formPengadaanNamaBarang.trim(),
        jumlah: Number(formPengadaanJumlah) || 1,
        hargaSatuan: Number(formPengadaanHargaSatuan) || 0,
        totalHarga: total,
        sumberDana: formPengadaanSumberDana,
        statusPengadaan: 'Dalam Proses PO',
        catatan: formPengadaanCatatan.trim(),
      };
      const updated = [newPengadaan, ...pengadaanList];
      setPengadaanList(updated);
      dataStorage.savePengadaan(updated);

      if (formPengadaanIdPengajuan) {
        const updatedPengajuan = pengajuanList.map(p =>
          p.idPengajuan === formPengadaanIdPengajuan ? { ...p, statusPersetujuan: 'Selesai Pengadaan' as const } : p
        );
        setPengajuanList(updatedPengajuan);
        dataStorage.savePengajuan(updatedPengajuan);
      }
    } else if (subTab === 'penerimaan') {
      const nextId = dataStorage.getNextPenerimaanId();
      const newPenerimaan: PenerimaanInventaris = {
        idPenerimaan: nextId,
        idPengadaan: formPenerimaanIdPengadaan || undefined,
        noBAST: formPenerimaanNoBAST.trim(),
        tanggalPenerimaan: new Date().toISOString().split('T')[0],
        namaBarang: formPenerimaanNamaBarang.trim(),
        jumlahDiterima: Number(formPenerimaanJumlah) || 1,
        kondisiSaatDiterima: formPenerimaanKondisi,
        petugasPenerima: formPenerimaanPenerima.trim(),
        idRuangTujuan: formPenerimaanIdRuang,
        statusMasukInventaris: false,
        catatan: formPenerimaanCatatan.trim(),
      };
      const updated = [newPenerimaan, ...penerimaanList];
      setPenerimaanList(updated);
      dataStorage.savePenerimaan(updated);

      if (formPenerimaanIdPengadaan) {
        const updatedPengadaan = pengadaanList.map(p =>
          p.idPengadaan === formPenerimaanIdPengadaan ? { ...p, statusPengadaan: 'Selesai' as const } : p
        );
        setPengadaanList(updatedPengadaan);
        dataStorage.savePengadaan(updatedPengadaan);
      }
    }

    setIsModalOpen(false);
  };

  const handleExportCsv = () => {
    if (subTab === 'pengajuan') {
      const headers = ['ID Pengajuan', 'Ruang Pemohon', 'Nama Barang', 'Jumlah', 'Estimasi (Rp)', 'Pemohon', 'Status'];
      const rows = pengajuanList.map(p => [p.idPengajuan, p.idRuang, p.namaBarang, p.jumlah, p.estimasiHarga, p.pemohon, p.statusPersetujuan]);
      exportToCsv('Pengajuan_Barang_RSMI', headers, rows);
    } else if (subTab === 'pengadaan') {
      const headers = ['ID Pengadaan', 'No PO', 'Supplier', 'Nama Barang', 'Jumlah', 'Harga Satuan', 'Total (Rp)', 'Sumber Dana', 'Status'];
      const rows = pengadaanList.map(p => [p.idPengadaan, p.noPO, p.idSupplier, p.namaBarang, p.jumlah, p.hargaSatuan, p.totalHarga, p.sumberDana, p.statusPengadaan]);
      exportToCsv('Pengadaan_PO_RSMI', headers, rows);
    } else if (subTab === 'penerimaan') {
      const headers = ['ID Penerimaan', 'No BAST', 'Nama Barang', 'Jumlah Diterima', 'Kondisi', 'Ruang Tujuan', 'Penerima', 'Status Terdaftar'];
      const rows = penerimaanList.map(p => [p.idPenerimaan, p.noBAST, p.namaBarang, p.jumlahDiterima, p.kondisiSaatDiterima, p.idRuangTujuan, p.petugasPenerima, p.statusMasukInventaris ? 'Sudah Terdaftar' : 'Belum']);
      exportToCsv('Penerimaan_BAST_RSMI', headers, rows);
    }
  };

  const getSubTabInfo = () => {
    switch (subTab) {
      case 'pengajuan':
        return {
          title: 'Pengajuan Barang Ruang',
          subtitle: 'Pengajuan kebutuhan sarana prasarana baru dan penggantian alat dari masing-masing unit/ruangan.',
          addLabel: 'Input Pengajuan',
          icon: <FilePlus className="w-5 h-5 text-blue-600" />
        };
      case 'pengadaan':
        return {
          title: 'Pengadaan Barang / Purchase Order (PO)',
          subtitle: 'Penerbitan surat pesanan (PO) ke rekanan/vendor supplier resmi beserta rincian harga & kuantitas.',
          addLabel: 'Input PO Pengadaan',
          icon: <ShoppingCart className="w-5 h-5 text-blue-600" />
        };
      case 'penerimaan':
        return {
          title: 'Penerimaan Barang & Integrasi DIR (BAST)',
          subtitle: 'Pencatatan berita acara serah terima (BAST) fisik barang masuk serta integrasi otomatis ke Data Inventaris Ruangan.',
          addLabel: 'Input BAST Penerimaan',
          icon: <PackageCheck className="w-5 h-5 text-blue-600" />
        };
    }
  };

  const currentInfo = getSubTabInfo();

  return (
    <div className="space-y-6">
      
      {/* Toast Alert */}
      {autoInsertSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs font-medium flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{autoInsertSuccess}</span>
          </div>
          <button type="button" onClick={() => setAutoInsertSuccess(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
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

          <div className="flex items-center gap-2 flex-wrap">
            {actionAccess.canExport && (
              <button
                type="button"
                onClick={handleExportCsv}
                className="px-3 py-1.5 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                title="Download CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
            )}

            {actionAccess.canPrint && (
              <button
                type="button"
                onClick={() => printDiv('print-pengadaan-table', `Laporan ${subTab.toUpperCase()} RS Medika Insani`)}
                className="px-3 py-1.5 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cetak</span>
              </button>
            )}

            {actionAccess.canCreate && (
              <button
                type="button"
                onClick={openCreateModal}
                className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{currentInfo.addLabel}</span>
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md pt-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-[calc(50%+2px)] -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Cari ID, No PO, No BAST, nama barang..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Table Container */}
      <div id="print-pengadaan-table" className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        
        {/* Printable Header */}
        <div className="hidden print:block p-6 border-b border-slate-300 text-center space-y-1">
          <h2 className="text-xl font-bold text-slate-900">RUMAH SAKIT MEDIKA INSANI</h2>
          <p className="text-xs text-slate-600">Bagian Logistik & Pengadaan Sarana Prasarana Rumah Sakit</p>
          <p className="text-sm font-semibold uppercase text-blue-700 pt-2">Laporan Logistik {subTab}</p>
        </div>

        <div className="overflow-x-auto">
          {/* 1. PENGAJUAN TABLE */}
          {subTab === 'pengajuan' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">ID Pengajuan</th>
                  <th className="py-2.5 px-3">Unit / Ruang Pemohon</th>
                  <th className="py-2.5 px-3">Nama Barang & Spek</th>
                  <th className="py-2.5 px-3 text-center">Jumlah</th>
                  <th className="py-2.5 px-3">Estimasi Biaya</th>
                  <th className="py-2.5 px-3">Pemohon</th>
                  <th className="py-2.5 px-3">Status Persetujuan</th>
                  <th className="py-2.5 px-3 text-right print:hidden">Tindak Lanjut & Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {pengajuanList
                  .filter(p => {
                    const q = (searchTerm || '').trim().toLowerCase();
                    return q === '' ||
                      (p.idPengajuan || '').toLowerCase().includes(q) ||
                      (p.namaBarang || '').toLowerCase().includes(q) ||
                      (p.pemohon || '').toLowerCase().includes(q);
                  })
                  .map(p => {
                    const r = ruangList.find(ru => ru.id === p.idRuang);
                    const currentStatus = p.statusPersetujuan || 'Disetujui';
                    const isApproved = currentStatus === 'Disetujui' || currentStatus === 'Disetujui Direksi';
                    const isRejected = currentStatus === 'Ditolak';
                    const isCompleted = currentStatus === 'Selesai Pengadaan';

                    return (
                      <tr key={p.idPengajuan} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-semibold text-blue-700 bg-blue-50/40">
                          {p.idPengajuan}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">
                          {r?.namaRuang || p.idRuang}
                        </td>
                        <td className="py-2.5 px-3 max-w-xs">
                          <div className="font-semibold text-slate-900">{p.namaBarang}</div>
                          <div className="text-[11px] text-slate-400 line-clamp-1">{p.spesifikasi || '-'}</div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-semibold text-slate-800">
                          {p.jumlah} Unit
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {formatRupiah(p.estimasiHarga)}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-slate-800">{p.pemohon}</div>
                          <div className="text-[10px] text-slate-400">{formatDateIndo(p.tanggalPengajuan)}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          {isAdmin ? (
                            /* Interactive Status Selector for Admin */
                            <div className="relative inline-block">
                              <select
                                value={currentStatus}
                                onChange={(e) => handleUpdateStatusPengajuan(p.idPengajuan, e.target.value)}
                                className={`text-[11px] font-semibold rounded-md pl-2.5 pr-7 py-1 appearance-none border cursor-pointer transition-colors shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                  isApproved
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                    : isRejected
                                    ? 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                                    : isCompleted
                                    ? 'bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100'
                                    : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                                }`}
                                title="Klik untuk mengubah status: Disetujui / Ditolak / Menunggu / Selesai"
                              >
                                <option value="Disetujui">✓ Disetujui</option>
                                <option value="Ditolak">✗ Ditolak</option>
                                <option value="Menunggu Persetujuan">⏳ Menunggu Persetujuan</option>
                                <option value="Selesai Pengadaan">📦 Selesai Pengadaan</option>
                              </select>
                              <ChevronDown className="w-3 h-3 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                          ) : (
                            /* Automatic / Read-Only Status Display for Non-Admin */
                            <div>
                              {isApproved && (
                                <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1.5 shadow-2xs">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Disetujui</span>
                                </span>
                              )}
                              {isRejected && (
                                <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200 inline-flex items-center gap-1.5 shadow-2xs">
                                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                  <span>Ditolak</span>
                                </span>
                              )}
                              {isCompleted && (
                                <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200 inline-flex items-center gap-1.5 shadow-2xs">
                                  <Check className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Selesai Pengadaan</span>
                                </span>
                              )}
                              {!isApproved && !isRejected && !isCompleted && (
                                <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1.5 shadow-2xs">
                                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Menunggu Persetujuan</span>
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right print:hidden whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {isApproved && (
                              <button
                                type="button"
                                onClick={() => handleFollowUpPengajuan(p)}
                                className="px-2 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-medium text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors"
                                title="Teruskan ke Purchase Order (PO)"
                              >
                                <span>Buat PO</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                            {isRejected && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium text-rose-600 bg-rose-50 border border-rose-200 inline-flex items-center gap-1">
                                <XCircle className="w-3 h-3 text-rose-500" />
                                <span>Ditolak</span>
                              </span>
                            )}
                            {isCompleted && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>PO Terbit</span>
                              </span>
                            )}
                            {!isApproved && !isRejected && !isCompleted && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 inline-flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Menunggu</span>
                              </span>
                            )}

                            {actionAccess.canEdit && (
                              <button
                                type="button"
                                onClick={() => handleOpenEditPengajuan(p)}
                                className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                title="Edit Pengajuan Barang"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {actionAccess.canDelete && (
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmPengajuan(p)}
                                className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Hapus Pengajuan Barang"
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
          )}

          {/* 2. PENGADAAN PO TABLE */}
          {subTab === 'pengadaan' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">No PO / ID</th>
                  <th className="py-2.5 px-3">Supplier Rekanan</th>
                  <th className="py-2.5 px-3">Nama Barang</th>
                  <th className="py-2.5 px-3">Jumlah</th>
                  <th className="py-2.5 px-3">Harga Satuan</th>
                  <th className="py-2.5 px-3">Total Kontrak (Rp)</th>
                  <th className="py-2.5 px-3">Sumber Dana & Status</th>
                  <th className="py-2.5 px-3 text-right print:hidden">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {pengadaanList
                  .filter(po => {
                    const q = (searchTerm || '').trim().toLowerCase();
                    return q === '' ||
                      (po.noPO || '').toLowerCase().includes(q) ||
                      (po.namaBarang || '').toLowerCase().includes(q);
                  })
                  .map(po => {
                    const sup = supplierList.find(s => s.id === po.idSupplier);
                    return (
                      <tr key={po.idPengadaan} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-semibold text-blue-700 bg-blue-50/40">
                          {po.noPO}
                          <div className="text-[10px] text-slate-400 font-sans">{po.idPengadaan}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-800">{sup?.nama || po.idSupplier}</div>
                          <div className="text-[10px] text-slate-400">📞 {sup?.telepon}</div>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {po.namaBarang}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {po.jumlah} Unit
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-700">
                          {formatRupiah(po.hargaSatuan)}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {formatRupiah(po.totalHarga)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 mr-1 border border-slate-200">
                            {po.sumberDana}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                            po.statusPengadaan === 'Selesai' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {po.statusPengadaan}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right print:hidden">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setActivePoPrint(po)}
                              className="px-2 py-1 rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                              title="Cetak PO"
                            >
                              <Printer className="w-3 h-3 text-blue-600" />
                              <span>PO</span>
                            </button>
                            {po.statusPengadaan !== 'Selesai' && (
                              <button
                                type="button"
                                onClick={() => handleFollowUpPengadaan(po)}
                                className="px-2 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-medium text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <span>Terima</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          )}

          {/* 3. PENERIMAAN TABLE + TOMBOL AJAIB "MASUKKAN KE INVENTARIS RUANGAN" */}
          {subTab === 'penerimaan' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">No BAST / Tanggal</th>
                  <th className="py-2.5 px-3">Nama Barang Diterima</th>
                  <th className="py-2.5 px-3">Jumlah & Kondisi</th>
                  <th className="py-2.5 px-3">Ruang Tujuan Penempatan</th>
                  <th className="py-2.5 px-3">Petugas Penerima</th>
                  <th className="py-2.5 px-3">Status di Inventaris</th>
                  <th className="py-2.5 px-3 text-right print:hidden">Integrasi Inventaris Ruangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {penerimaanList
                  .filter(rec => {
                    const q = (searchTerm || '').trim().toLowerCase();
                    return q === '' ||
                      (rec.noBAST || '').toLowerCase().includes(q) ||
                      (rec.namaBarang || '').toLowerCase().includes(q);
                  })
                  .map(rec => {
                    const r = ruangList.find(ru => ru.id === rec.idRuangTujuan);
                    return (
                      <tr key={rec.idPenerimaan} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-semibold text-blue-700 bg-blue-50/40">
                          {rec.noBAST}
                          <div className="text-[10px] text-slate-400 font-sans">{formatDateIndo(rec.tanggalPenerimaan)}</div>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {rec.namaBarang}
                          <div className="text-[10px] text-slate-400 font-normal">{rec.catatan}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-900">{rec.jumlahDiterima} Unit</span>
                          <span className="block text-[10px] font-medium text-emerald-700">Kondisi: {rec.kondisiSaatDiterima}</span>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">
                          {r?.namaRuang || rec.idRuangTujuan}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          {rec.petugasPenerima}
                        </td>
                        <td className="py-2.5 px-3">
                          {rec.statusMasukInventaris ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Sudah Terekam di DIR</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Belum Dimasukkan</span>
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right print:hidden">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setActiveBastPrint(rec)}
                              className="px-2 py-1 rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                              title="Cetak BAST"
                            >
                              <Printer className="w-3 h-3 text-blue-600" />
                              <span>BAST</span>
                            </button>

                            {/* MAGICAL BUTTON TO POPULATE INVENTARIS RUANGAN */}
                            {!rec.statusMasukInventaris && (
                              <button
                                type="button"
                                onClick={() => handleInsertIntoInventarisRuangan(rec)}
                                className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[11px] inline-flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                                title="Otomatis masukkan ke data inventaris ruangan dan generate QR Code"
                              >
                                <Sparkles className="w-3 h-3" />
                                <span>+ Masukkan ke Inventaris Ruangan</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          )}

        </div>
      </div>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-xl w-full p-5 shadow-xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-blue-600" />
                <span>
                  {subTab === 'pengajuan' && (editingPengajuanId ? `Edit Data Pengajuan (${editingPengajuanId})` : 'Form Pengajuan Barang Unit / Ruangan')}
                  {subTab === 'pengadaan' && 'Form Penerbitan PO Pengadaan Barang'}
                  {subTab === 'penerimaan' && 'Form Berita Acara Penerimaan Barang (BAST)'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="py-3.5 space-y-3 text-xs">
              
              {/* Form Pengajuan */}
              {subTab === 'pengajuan' && (
                <>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Unit / Ruangan Pemohon *</label>
                    <select
                      value={formPengajuanIdRuang}
                      onChange={e => setFormPengajuanIdRuang(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-white font-medium text-slate-800 focus:ring-1 focus:ring-blue-500"
                    >
                      {ruangList.map(r => (
                        <option key={r.id} value={r.id}>[{r.id}] {r.namaRuang}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Nama Barang / Peralatan Diajukan *</label>
                    <input
                      type="text"
                      required
                      value={formPengajuanNama}
                      onChange={e => setFormPengajuanNama(e.target.value)}
                      placeholder="e.g. Syringe Pump Infusion Terumo"
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Spesifikasi Detail</label>
                    <textarea
                      rows={2}
                      value={formPengajuanSpesifikasi}
                      onChange={e => setFormPengajuanSpesifikasi(e.target.value)}
                      placeholder="Tipe, kapasitas baterai, fitur alarm..."
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Jumlah Unit</label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={formPengajuanJumlah}
                        onChange={e => setFormPengajuanJumlah(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Estimasi Total Biaya (Rp)</label>
                      <input
                        type="number"
                        min={0}
                        required
                        value={formPengajuanEstimasi}
                        onChange={e => setFormPengajuanEstimasi(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Nama Penanggung Jawab Pemohon</label>
                    <input
                      type="text"
                      required
                      value={formPengajuanPemohon}
                      onChange={e => setFormPengajuanPemohon(e.target.value)}
                      placeholder="Nama kepala ruangan / dokter..."
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Alasan Kebutuhan Pengadaan</label>
                    <textarea
                      rows={2}
                      value={formPengajuanAlasan}
                      onChange={e => setFormPengajuanAlasan(e.target.value)}
                      placeholder="Peningkatan jumlah pasien / penggantian unit rusak..."
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Status Persetujuan Pengadaan {isAdmin ? '*' : ''}
                    </label>
                    {isAdmin ? (
                      <select
                        value={formPengajuanStatus}
                        onChange={e => setFormPengajuanStatus(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-white font-medium text-slate-800 focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="Disetujui">✓ Disetujui (Dapat diproses ke Penerbitan PO)</option>
                        <option value="Menunggu Persetujuan">⏳ Menunggu Persetujuan</option>
                        <option value="Ditolak">✗ Ditolak</option>
                        <option value="Selesai Pengadaan">📦 Selesai Pengadaan</option>
                      </select>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md text-amber-900 text-xs font-semibold">
                          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Menunggu Persetujuan (Otomatis)</span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Pengajuan dari unit ruangan akan berstatus otomatis <strong>Menunggu Persetujuan</strong> untuk diverifikasi dan disetujui oleh Direksi / Tim Pengadaan.
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Form Pengadaan PO */}
              {subTab === 'pengadaan' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Nomor Purchase Order (PO)</label>
                      <input
                        type="text"
                        required
                        value={formPengadaanNoPO}
                        onChange={e => setFormPengadaanNoPO(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 font-mono font-medium focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Supplier Rekanan *</label>
                      <select
                        value={formPengadaanIdSupplier}
                        onChange={e => setFormPengadaanIdSupplier(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-white focus:ring-1 focus:ring-blue-500"
                      >
                        {supplierList.map(s => (
                          <option key={s.id} value={s.id}>{s.nama}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Nama Barang / Paket Pengadaan *</label>
                    <input
                      type="text"
                      required
                      value={formPengadaanNamaBarang}
                      onChange={e => setFormPengadaanNamaBarang(e.target.value)}
                      placeholder="Nama barang..."
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Jumlah</label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={formPengadaanJumlah}
                        onChange={e => setFormPengadaanJumlah(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Harga Satuan (Rp)</label>
                      <input
                        type="number"
                        min={0}
                        required
                        value={formPengadaanHargaSatuan}
                        onChange={e => setFormPengadaanHargaSatuan(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Sumber Dana</label>
                      <select
                        value={formPengadaanSumberDana}
                        onChange={e => setFormPengadaanSumberDana(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-white focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="Dana Internal RS">Dana Internal RS</option>
                        <option value="Dana PT. / Yayasan">Dana PT. / Yayasan</option>
                        <option value="Hibah">Hibah</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 flex items-center justify-between">
                    <span className="font-medium text-blue-900">Total Nilai Kontrak PO:</span>
                    <span className="font-bold text-sm text-blue-950">
                      {formatRupiah(formPengadaanJumlah * formPengadaanHargaSatuan)}
                    </span>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Catatan Tambahan</label>
                    <input
                      type="text"
                      value={formPengadaanCatatan}
                      onChange={e => setFormPengadaanCatatan(e.target.value)}
                      placeholder="Jadwal pengiriman, garansi..."
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {/* Form Penerimaan BAST */}
              {subTab === 'penerimaan' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Nomor BAST Resmi</label>
                      <input
                        type="text"
                        required
                        value={formPenerimaanNoBAST}
                        onChange={e => setFormPenerimaanNoBAST(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 font-mono font-medium focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Ruangan Tujuan Penempatan *</label>
                      <select
                        value={formPenerimaanIdRuang}
                        onChange={e => setFormPenerimaanIdRuang(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-white font-medium text-slate-800 focus:ring-1 focus:ring-blue-500"
                      >
                        {ruangList.map(r => (
                          <option key={r.id} value={r.id}>[{r.id}] {r.namaRuang}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Nama Barang yang Diterima *</label>
                    <input
                      type="text"
                      required
                      value={formPenerimaanNamaBarang}
                      onChange={e => setFormPenerimaanNamaBarang(e.target.value)}
                      placeholder="Nama barang..."
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Jumlah Fisik Diterima</label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={formPenerimaanJumlah}
                        onChange={e => setFormPenerimaanJumlah(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Kondisi Hasil Uji Fungsi</label>
                      <select
                        value={formPenerimaanKondisi}
                        onChange={e => setFormPenerimaanKondisi(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-white font-medium focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="Baik">Baik & Lengkap (Lolos Uji)</option>
                        <option value="Cacat/Kurang">Cacat / Ada Bagian Kurang</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Petugas / Panitia Penerima (PPHP)</label>
                    <input
                      type="text"
                      required
                      value={formPenerimaanPenerima}
                      onChange={e => setFormPenerimaanPenerima(e.target.value)}
                      placeholder="Nama petugas logistik / PPHP..."
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Catatan Tambahan Pemeriksaan</label>
                    <textarea
                      rows={2}
                      value={formPenerimaanCatatan}
                      onChange={e => setFormPenerimaanCatatan(e.target.value)}
                      placeholder="Kelengkapan dokumen manual, garansi..."
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

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
                  Simpan Data
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* PRINT BAST MODAL */}
      {activeBastPrint && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-5 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Berita Acara Serah Terima (BAST) Penerimaan</h3>
              <button
                type="button"
                onClick={() => setActiveBastPrint(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div id="printable-bast" className="p-6 border border-slate-300 rounded-lg bg-white text-slate-900 space-y-4">
              
              {/* Kop Surat & Judul Dokumen BAST */}
              <DocumentHeader
                settings={settings}
                title="BERITA ACARA SERAH TERIMA (BAST) PENERIMAAN BARANG"
                documentNumber={`Nomor: ${activeBastPrint.noBAST}`}
                unitName="Bagian Pengadaan & Penerimaan Logistik Rumah Sakit"
              />

              <p className="text-xs text-slate-700 leading-relaxed">
                Pada hari ini <b>{formatDateIndo(activeBastPrint.tanggalPenerimaan)}</b>, telah dilakukan pemeriksaan fisik, administrasi, dan uji fungsi penerimaan barang inventaris sebagai berikut:
              </p>

              <table className="w-full text-xs border border-slate-300 text-left">
                <tbody>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-slate-800 w-1/3">Nama Barang</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">{activeBastPrint.namaBarang}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-2 px-3 font-semibold text-slate-800">Jumlah Diterima</td>
                    <td className="py-2 px-3 font-bold text-blue-700">{activeBastPrint.jumlahDiterima} Unit</td>
                  </tr>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-slate-800">Kondisi Hasil Uji</td>
                    <td className="py-2 px-3 text-slate-800">{activeBastPrint.kondisiSaatDiterima}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-2 px-3 font-semibold text-slate-800">Ruangan Penempatan</td>
                    <td className="py-2 px-3 font-semibold text-emerald-800">{ruangList.find(r => r.id === activeBastPrint.idRuangTujuan)?.namaRuang || activeBastPrint.idRuangTujuan}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold text-slate-800">Catatan Pemeriksaan</td>
                    <td className="py-2 px-3 text-slate-700">{activeBastPrint.catatan}</td>
                  </tr>
                </tbody>
              </table>

              {/* Tanda Tangan QR TTE BAST */}
              <div className="pt-4 border-t border-slate-200">
                <div className="grid grid-cols-2 gap-6 text-center">
                  <QrSignature
                    role="Rekanan / Supplier Penyedia"
                    name="Perwakilan Rekanan Penyedia"
                    docName="Berita Acara Serah Terima (BAST)"
                    docNumber={activeBastPrint.noBAST}
                    hospitalName={settings.appName}
                    date={formatDateIndo(activeBastPrint.tanggalPenerimaan)}
                  />

                  <QrSignature
                    role="Panitia Pemeriksa & Penerima Hasil Pekerjaan"
                    name={activeBastPrint.petugasPenerima || 'Petugas PPHP'}
                    docName="Berita Acara Serah Terima (BAST)"
                    docNumber={activeBastPrint.noBAST}
                    hospitalName={settings.appName}
                    date={formatDateIndo(activeBastPrint.tanggalPenerimaan)}
                  />
                </div>
              </div>

              <div className="pt-2 text-center text-[10px] text-slate-400 border-t border-slate-100">
                Dokumen ini sah dan diterbitkan secara digital oleh Sistem Informasi Inventaris ({settings.systemShortName || 'SIMBARS'}) {settings.appName || 'RS Medika Insani'}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveBastPrint(null)}
                className="px-3.5 py-1.5 rounded-md border border-slate-200 text-slate-600 font-medium text-xs hover:bg-slate-50 cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => printDiv('printable-bast', `BAST-${activeBastPrint.noBAST}`)}
                className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak BAST</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT PO MODAL */}
      {activePoPrint && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-5 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Purchase Order (PO) Pengadaan Resmi</h3>
              <button
                type="button"
                onClick={() => setActivePoPrint(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div id="printable-po" className="p-6 border border-slate-300 rounded-lg bg-white text-slate-900 space-y-4">
              
              {/* Kop Surat & Judul Dokumen PO */}
              <DocumentHeader
                settings={settings}
                title="SURAT PESANAN PENGADAAN BARANG (PURCHASE ORDER)"
                documentNumber={`Nomor: ${activePoPrint.noPO}`}
                unitName="Unit Layanan Pengadaan (ULP) & PPK Rumah Sakit"
              />

              <div className="text-xs space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p className="text-slate-500 font-semibold">Kepada Yth. Penyedia:</p>
                <p className="font-bold text-slate-900 text-sm">{supplierList.find(s => s.id === activePoPrint.idSupplier)?.nama || activePoPrint.idSupplier}</p>
                <p className="text-slate-600">{supplierList.find(s => s.id === activePoPrint.idSupplier)?.alamat || 'Alamat Rekanan Penyedia'}</p>
              </div>

              <table className="w-full text-xs border border-slate-300 text-left">
                <thead className="bg-slate-50 border-b border-slate-300">
                  <tr className="text-slate-700 font-semibold">
                    <th className="py-2 px-3">Nama Barang</th>
                    <th className="py-2 px-3 text-center">Jumlah</th>
                    <th className="py-2 px-3 text-right">Harga Satuan</th>
                    <th className="py-2 px-3 text-right">Total Harga</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="py-2 px-3 font-semibold text-slate-900">{activePoPrint.namaBarang}</td>
                    <td className="py-2 px-3 text-center text-slate-800">{activePoPrint.jumlah} Unit</td>
                    <td className="py-2 px-3 text-right text-slate-800">{formatRupiah(activePoPrint.hargaSatuan)}</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">{formatRupiah(activePoPrint.totalHarga)}</td>
                  </tr>
                  <tr className="bg-slate-50 font-bold">
                    <td colSpan={3} className="py-2 px-3 text-right text-slate-800">TOTAL NILAI KONTRAK:</td>
                    <td className="py-2 px-3 text-right text-emerald-800 font-bold">{formatRupiah(activePoPrint.totalHarga)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Tanda Tangan QR TTE PO */}
              <div className="pt-4 border-t border-slate-200">
                <div className="grid grid-cols-2 gap-6 text-center">
                  <QrSignature
                    role="Penyedia / Rekanan Pengadaan"
                    name={supplierList.find(s => s.id === activePoPrint.idSupplier)?.nama || 'Sales Representative'}
                    docName="Purchase Order Pengadaan"
                    docNumber={activePoPrint.noPO}
                    hospitalName={settings.appName}
                    date={formatDateIndo(new Date().toISOString())}
                  />

                  <QrSignature
                    role="Pejabat Pembuat Komitmen (PPK)"
                    name="dr. H. Fachrul Rozi, MARS"
                    nip="19750821 200212 1 004"
                    docName="Purchase Order Pengadaan"
                    docNumber={activePoPrint.noPO}
                    hospitalName={settings.appName}
                    date={formatDateIndo(new Date().toISOString())}
                  />
                </div>
              </div>

              <div className="pt-2 text-center text-[10px] text-slate-400 border-t border-slate-100">
                Dokumen Purchase Order ini sah dan berkekuatan hukum diterbitkan oleh {settings.appName || 'RS Medika Insani'}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActivePoPrint(null)}
                className="px-3.5 py-1.5 rounded-md border border-slate-200 text-slate-600 font-medium text-xs hover:bg-slate-50 cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => printDiv('printable-po', `PO-${activePoPrint.noPO}`)}
                className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak PO</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL FOR PENGAJUAN */}
      {deleteConfirmPengajuan && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Hapus Pengajuan Barang?</h3>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">ID Pengajuan:</span>
                <span className="font-mono font-semibold text-slate-800">{deleteConfirmPengajuan.idPengajuan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Barang:</span>
                <span className="font-semibold text-slate-900">{deleteConfirmPengajuan.namaBarang}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pemohon:</span>
                <span className="text-slate-700">{deleteConfirmPengajuan.pemohon}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmPengajuan(null)}
                className="px-3.5 py-1.5 rounded-md border border-slate-200 text-slate-600 font-medium text-xs hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeletePengajuan}
                className="px-3.5 py-1.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs shadow-xs cursor-pointer"
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
