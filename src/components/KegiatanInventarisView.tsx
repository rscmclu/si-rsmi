import React, { useState, useEffect } from 'react';
import { 
  PermintaanPerbaikan, 
  PerbaikanInventaris, 
  JadwalPemeliharaan, 
  InventarisRuangan, 
  RuangInventaris, 
  ActionPermission,
  AppSettings,
  UserAccount
} from '../types/inventory';
import { LaporanMutuView } from './LaporanMutuView';
import { dataStorage } from '../services/dataStorage';
import { formatRupiah, formatDateIndo, exportToCsv, printDiv, calculateLamaRespon } from '../utils/formatters';
import { DocumentHeader } from './DocumentHeader';
import { QrSignature } from './QrSignature';
import { 
  Activity, 
  AlertTriangle, 
  Wrench, 
  CalendarCheck, 
  Plus, 
  Search, 
  Printer, 
  Download, 
  X, 
  ArrowRight,
  CheckCircle2,
  Clock,
  Timer,
  Edit,
  Trash2,
  AlertCircle
} from 'lucide-react';

export type KegiatanSubTab = 'permintaan' | 'perbaikan' | 'pemeliharaan' | 'laporanMutu';

interface KegiatanInventarisViewProps {
  initialSubTab?: KegiatanSubTab;
  actionAccess: ActionPermission;
  appSettings?: AppSettings;
  currentUser?: UserAccount | null;
}

export const KegiatanInventarisView: React.FC<KegiatanInventarisViewProps> = ({
  initialSubTab = 'permintaan',
  actionAccess,
  appSettings: propAppSettings,
  currentUser,
}) => {
  const settings = propAppSettings || dataStorage.getAppSettings();
  const [subTab, setSubTab] = useState<KegiatanSubTab>(initialSubTab);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setSubTab(initialSubTab);
    setSearchTerm('');
  }, [initialSubTab]);

  const [permintaanList, setPermintaanList] = useState<PermintaanPerbaikan[]>(dataStorage.getPermintaanPerbaikan());
  const [perbaikanList, setPerbaikanList] = useState<PerbaikanInventaris[]>(dataStorage.getPerbaikan());
  const [jadwalPMList, setJadwalPMList] = useState<JadwalPemeliharaan[]>(dataStorage.getJadwalPemeliharaan());
  const [inventaris, setInventaris] = useState<InventarisRuangan[]>(dataStorage.getInventarisRuangan());
  const [ruangList] = useState<RuangInventaris[]>(dataStorage.getRuang());

  // Auto-sync: Pastikan setiap Permintaan Perbaikan otomatis tercatat sebagai entri di Tindakan Perbaikan Barang
  useEffect(() => {
    let hasNewPerbaikan = false;
    const freshPerbaikan = dataStorage.getPerbaikan();
    let currentPerbaikan = [...freshPerbaikan];

    permintaanList.forEach(p => {
      const exists = currentPerbaikan.some(pb => pb.idPermintaan === p.idPermintaan);
      if (!exists) {
        hasNewPerbaikan = true;
        const numbers = currentPerbaikan.map(item => {
          const match = item.idPerbaikan.match(/\d+/);
          return match ? parseInt(match[0], 10) : 0;
        });
        const nextNum = Math.max(...numbers, 0) + 1;
        const nextId = `PBK-${nextNum.toString().padStart(3, '0')}`;

        const autoPb: PerbaikanInventaris = {
          idPerbaikan: nextId,
          idPermintaan: p.idPermintaan,
          idBarang: p.idBarang,
          namaBarang: p.namaBarang,
          idRuang: p.idRuang,
          tanggalMulai: p.tanggal,
          jamMulai: p.jam || (p.createdAt?.includes('T') ? new Date(p.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':') : '08:30'),
          teknisi: 'Tim IPSRS',
          jenisPerbaikan: 'Internal IPSRS',
          tindakan: `Menindaklanjuti keluhan: ${p.deskripsiKerusakan}`,
          sukuCadang: '-',
          biaya: 0,
          statusPerbaikan: p.status === 'Selesai' ? 'Selesai' : 'Dalam Pengerjaan',
          tindakLanjut: p.status === 'Selesai' ? 'Sudah Dikerjakan' : 'Belum Dikerjakan',
          rekomendasi: 'Pemeriksaan teknis & pengujian fungsi unit oleh teknisi IPSRS.',
          tanggalSelesai: p.status === 'Selesai' ? p.tanggal : undefined,
        };
        currentPerbaikan = [autoPb, ...currentPerbaikan];
      }
    });

    if (hasNewPerbaikan) {
      setPerbaikanList(currentPerbaikan);
      dataStorage.savePerbaikan(currentPerbaikan);
    }
  }, [permintaanList]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeBapPrint, setActiveBapPrint] = useState<PerbaikanInventaris | null>(null);
  const [editingPerbaikanId, setEditingPerbaikanId] = useState<string | null>(null);
  const [editingPermintaanId, setEditingPermintaanId] = useState<string | null>(null);
  const [deleteConfirmPermintaan, setDeleteConfirmPermintaan] = useState<PermintaanPerbaikan | null>(null);

  // Form states: Permintaan
  const [formPermintaanIdBarang, setFormPermintaanIdBarang] = useState(inventaris[0]?.idBarang || '');
  const [formPermintaanPelapor, setFormPermintaanPelapor] = useState('');
  const [formPermintaanTanggal, setFormPermintaanTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [formPermintaanJam, setFormPermintaanJam] = useState(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':'));
  const [formPermintaanDeskripsi, setFormPermintaanDeskripsi] = useState('');
  const [formPermintaanPrioritas, setFormPermintaanPrioritas] = useState<PermintaanPerbaikan['prioritas']>('Sedang');

  // Form states: Perbaikan
  const [formPerbaikanIdPermintaan, setFormPerbaikanIdPermintaan] = useState('');
  const [formPerbaikanIdBarang, setFormPerbaikanIdBarang] = useState(inventaris[0]?.idBarang || '');
  const [formPerbaikanTanggalMulai, setFormPerbaikanTanggalMulai] = useState(new Date().toISOString().split('T')[0]);
  const [formPerbaikanJamMulai, setFormPerbaikanJamMulai] = useState(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':'));
  const [formPerbaikanTanggalRespon, setFormPerbaikanTanggalRespon] = useState('');
  const [formPerbaikanJamRespon, setFormPerbaikanJamRespon] = useState('');
  const [formPerbaikanTanggalSelesai, setFormPerbaikanTanggalSelesai] = useState('');
  const [formPerbaikanJamSelesai, setFormPerbaikanJamSelesai] = useState('');
  const [formPerbaikanTeknisi, setFormPerbaikanTeknisi] = useState('');
  const [formPerbaikanJenis, setFormPerbaikanJenis] = useState<'Internal IPSRS' | 'Vendor / Pihak Ketiga'>('Internal IPSRS');
  const [formPerbaikanNamaVendor, setFormPerbaikanNamaVendor] = useState('');
  const [formPerbaikanTindakan, setFormPerbaikanTindakan] = useState('');
  const [formPerbaikanSukuCadang, setFormPerbaikanSukuCadang] = useState('');
  const [formPerbaikanBiaya, setFormPerbaikanBiaya] = useState<number>(0);
  const [formPerbaikanStatus, setFormPerbaikanStatus] = useState<PerbaikanInventaris['statusPerbaikan']>('Selesai');
  const [formPerbaikanTindakLanjut, setFormPerbaikanTindakLanjut] = useState<'Sudah Dikerjakan' | 'Belum Dikerjakan'>('Sudah Dikerjakan');
  const [formPerbaikanRekomendasi, setFormPerbaikanRekomendasi] = useState('Alat laik pakai kembali');

  // Form states: Jadwal Pemeliharaan
  const [formPmIdBarang, setFormPmIdBarang] = useState(inventaris[0]?.idBarang || '');
  const [formPmJenis, setFormPmJenis] = useState('Preventive Maintenance & Kalibrasi Berkala');
  const [formPmFrekuensi, setFormPmFrekuensi] = useState<JadwalPemeliharaan['frekuensi']>('Triwulan');
  const [formPmTanggalTerakhir, setFormPmTanggalTerakhir] = useState(new Date().toISOString().split('T')[0]);
  const [formPmTanggalBerikut, setFormPmTanggalBerikut] = useState(new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]);
  const [formPmPetugas, setFormPmPetugas] = useState('Tim Elektromedik IPSRS');
  const [formPmTindakLanjut, setFormPmTindakLanjut] = useState<'Sudah Dikerjakan' | 'Belum Dikerjakan'>('Belum Dikerjakan');
  const [formPmKeterangan, setFormPmKeterangan] = useState('Pemeriksaan fungsi sensor, kelistrikan, dan uji keselamatan.');

  const openCreateModal = () => {
    setEditingPerbaikanId(null);
    setEditingPermintaanId(null);
    if (subTab === 'permintaan') {
      const first = inventaris[0];
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const timeNow = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
      setFormPermintaanIdBarang(first?.idBarang || '');
      setFormPermintaanPelapor('');
      setFormPermintaanTanggal(today);
      setFormPermintaanJam(timeNow);
      setFormPermintaanDeskripsi('');
      setFormPermintaanPrioritas('Sedang');
    } else if (subTab === 'perbaikan') {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const timeNow = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
      setFormPerbaikanIdPermintaan('');
      setFormPerbaikanIdBarang(inventaris[0]?.idBarang || '');
      setFormPerbaikanTanggalMulai(today);
      setFormPerbaikanJamMulai(timeNow);
      setFormPerbaikanTanggalRespon('');
      setFormPerbaikanJamRespon('');
      setFormPerbaikanTanggalSelesai(today);
      setFormPerbaikanJamSelesai(timeNow);
      setFormPerbaikanTeknisi('Bambang S., Amd.TEM');
      setFormPerbaikanJenis('Internal IPSRS');
      setFormPerbaikanNamaVendor('');
      setFormPerbaikanTindakan('');
      setFormPerbaikanSukuCadang('');
      setFormPerbaikanBiaya(0);
      setFormPerbaikanStatus('Selesai');
      setFormPerbaikanTindakLanjut('Sudah Dikerjakan');
      setFormPerbaikanRekomendasi('Alat telah diuji coba dan berfungsi optimal.');
    } else if (subTab === 'pemeliharaan') {
      setFormPmIdBarang(inventaris[0]?.idBarang || '');
      setFormPmJenis('Inspeksi Fisik & Uji Fungsi Kalibrasi');
      setFormPmFrekuensi('Triwulan');
      setFormPmTanggalTerakhir(new Date().toISOString().split('T')[0]);
      setFormPmTanggalBerikut(new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]);
      setFormPmPetugas('IPSRS Tim Medis');
      setFormPmTindakLanjut('Belum Dikerjakan');
      setFormPmKeterangan('Pemeriksaan berkala standar Kemenkes.');
    }
    setIsModalOpen(true);
  };

  // Open modal directly to edit permintaan
  const handleOpenEditPermintaan = (p: PermintaanPerbaikan) => {
    setEditingPermintaanId(p.idPermintaan);
    setEditingPerbaikanId(null);
    setFormPermintaanIdBarang(p.idBarang);
    setFormPermintaanPelapor(p.pelapor);
    setFormPermintaanTanggal(p.tanggal || new Date().toISOString().split('T')[0]);
    setFormPermintaanJam(p.jam || (p.createdAt?.includes('T') ? new Date(p.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':') : '08:30'));
    setFormPermintaanDeskripsi(p.deskripsiKerusakan);
    setFormPermintaanPrioritas(p.prioritas);
    setSubTab('permintaan');
    setIsModalOpen(true);
  };

  // Delete permintaan & unlink/clean auto-created perbaikan
  const handleConfirmDeletePermintaan = () => {
    if (!deleteConfirmPermintaan) return;
    const targetId = deleteConfirmPermintaan.idPermintaan;

    const updatedPermintaan = permintaanList.filter(p => p.idPermintaan !== targetId);
    setPermintaanList(updatedPermintaan);
    dataStorage.savePermintaanPerbaikan(updatedPermintaan);

    // Hapus juga tindakan perbaikan yang terkait dengan permintaan ini jika ada
    const updatedPerbaikan = perbaikanList.filter(pb => pb.idPermintaan !== targetId);
    setPerbaikanList(updatedPerbaikan);
    dataStorage.savePerbaikan(updatedPerbaikan);

    setDeleteConfirmPermintaan(null);
  };

  // Open modal directly to input or edit repair details from table row
  const handleOpenInputPerbaikan = (pb?: PerbaikanInventaris) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const timeNow = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');

    if (pb) {
      setEditingPerbaikanId(pb.idPerbaikan);
      setFormPerbaikanIdPermintaan(pb.idPermintaan || '');
      setFormPerbaikanIdBarang(pb.idBarang);
      setFormPerbaikanTanggalMulai(pb.tanggalMulai || today);
      setFormPerbaikanJamMulai(pb.jamMulai || (pb.createdAt?.includes('T') ? new Date(pb.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':') : timeNow));
      
      // Respon timestamp
      setFormPerbaikanTanggalRespon(pb.tanggalRespon || (pb.statusPerbaikan === 'Sudah Direspon' ? (pb.tanggalMulai || today) : ''));
      setFormPerbaikanJamRespon(pb.jamRespon || (pb.statusPerbaikan === 'Sudah Direspon' ? (pb.jamMulai || timeNow) : ''));

      setFormPerbaikanTanggalSelesai(pb.tanggalSelesai || today);
      setFormPerbaikanJamSelesai(pb.jamSelesai || timeNow);
      setFormPerbaikanTeknisi(pb.teknisi || 'Bambang S., Amd.TEM');
      setFormPerbaikanJenis(pb.jenisPerbaikan as any || 'Internal IPSRS');
      setFormPerbaikanNamaVendor(pb.namaVendor || '');
      setFormPerbaikanTindakan(pb.tindakan || '');
      setFormPerbaikanSukuCadang(pb.sukuCadang || '');
      setFormPerbaikanBiaya(pb.biaya || 0);
      setFormPerbaikanStatus(pb.statusPerbaikan || 'Selesai');
      setFormPerbaikanTindakLanjut((pb.tindakLanjut as any) || 'Sudah Dikerjakan');
      setFormPerbaikanRekomendasi(pb.rekomendasi || 'Alat telah diuji coba dan siap digunakan.');
    } else {
      setEditingPerbaikanId(null);
      setFormPerbaikanIdPermintaan('');
      setFormPerbaikanIdBarang(inventaris[0]?.idBarang || '');
      setFormPerbaikanTanggalMulai(today);
      setFormPerbaikanJamMulai(timeNow);
      setFormPerbaikanTanggalRespon('');
      setFormPerbaikanJamRespon('');
      setFormPerbaikanTanggalSelesai(today);
      setFormPerbaikanJamSelesai(timeNow);
      setFormPerbaikanTeknisi('Bambang S., Amd.TEM');
      setFormPerbaikanJenis('Internal IPSRS');
      setFormPerbaikanNamaVendor('');
      setFormPerbaikanTindakan('');
      setFormPerbaikanSukuCadang('');
      setFormPerbaikanBiaya(0);
      setFormPerbaikanStatus('Selesai');
      setFormPerbaikanTindakLanjut('Sudah Dikerjakan');
      setFormPerbaikanRekomendasi('Alat telah diuji coba dan berfungsi optimal.');
    }
    setSubTab('perbaikan');
    setIsModalOpen(true);
  };

  // Convert a Permintaan directly into a Perbaikan
  const handleFollowUpPermintaan = (p: PermintaanPerbaikan) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const timeNow = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');

    setSubTab('perbaikan');
    setEditingPerbaikanId(null);
    setFormPerbaikanIdPermintaan(p.idPermintaan);
    setFormPerbaikanIdBarang(p.idBarang);
    setFormPerbaikanTanggalMulai(p.tanggal || today);
    setFormPerbaikanJamMulai(p.jam || timeNow);
    setFormPerbaikanTanggalRespon(today);
    setFormPerbaikanJamRespon(timeNow);
    setFormPerbaikanTanggalSelesai(today);
    setFormPerbaikanJamSelesai(timeNow);
    setFormPerbaikanTeknisi('Bambang S., Amd.TEM');
    setFormPerbaikanJenis('Internal IPSRS');
    setFormPerbaikanNamaVendor('');
    setFormPerbaikanTindakan(`Menindaklanjuti keluhan: ${p.deskripsiKerusakan}. Pemeriksaan unit dan kalibrasi.`);
    setFormPerbaikanSukuCadang('');
    setFormPerbaikanBiaya(150000);
    setFormPerbaikanStatus('Selesai');
    setFormPerbaikanTindakLanjut('Sudah Dikerjakan');
    setFormPerbaikanRekomendasi('Alat siap digunakan kembali di ruangan.');
    setIsModalOpen(true);
  };

  // Quick Toggle Handlers for Tindak Lanjut Column (Perbaikan & PM)
  const handleToggleTindakLanjutPerbaikan = (idPerbaikan: string) => {
    let linkedPermintaanId: string | undefined;
    let nextStatusResult: 'Sudah Dikerjakan' | 'Belum Dikerjakan' = 'Sudah Dikerjakan';

    const updated = perbaikanList.map(pb => {
      if (pb.idPerbaikan === idPerbaikan) {
        linkedPermintaanId = pb.idPermintaan;
        const isDone = (pb.tindakLanjut === 'Sudah Dikerjakan' || pb.statusPerbaikan === 'Selesai');
        const nextStatus = isDone ? 'Belum Dikerjakan' : 'Sudah Dikerjakan';
        nextStatusResult = nextStatus;
        return {
          ...pb,
          tindakLanjut: nextStatus,
          statusPerbaikan: nextStatus === 'Sudah Dikerjakan' ? 'Selesai' : (pb.statusPerbaikan === 'Selesai' ? 'Dalam Pengerjaan' : pb.statusPerbaikan),
        };
      }
      return pb;
    });
    setPerbaikanList(updated);
    dataStorage.savePerbaikan(updated);

    if (linkedPermintaanId) {
      const updatedPermintaan = permintaanList.map(p =>
        p.idPermintaan === linkedPermintaanId
          ? {
              ...p,
              status: nextStatusResult === 'Sudah Dikerjakan' ? 'Selesai' : 'Sedang Dikerjakan',
              tindakLanjut: nextStatusResult,
            }
          : p
      );
      setPermintaanList(updatedPermintaan);
      dataStorage.savePermintaanPerbaikan(updatedPermintaan);
    }
  };

  const handleToggleTindakLanjutJadwal = (idJadwal: string) => {
    const updated = jadwalPMList.map(j => {
      if (j.idJadwal === idJadwal) {
        const isDone = (j.tindakLanjut === 'Sudah Dikerjakan' || j.status === 'Selesai Dilakukan');
        const nextStatus = isDone ? 'Belum Dikerjakan' : 'Sudah Dikerjakan';
        return {
          ...j,
          tindakLanjut: nextStatus,
          status: nextStatus === 'Sudah Dikerjakan' ? 'Selesai Dilakukan' : 'Terjadwal',
        };
      }
      return j;
    });
    setJadwalPMList(updated);
    dataStorage.saveJadwalPemeliharaan(updated);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (subTab === 'permintaan') {
      const targetAsset = inventaris.find(i => i.idBarang === formPermintaanIdBarang);

      if (editingPermintaanId) {
        // Update existing Permintaan
        const updatedPermintaan = permintaanList.map(item => {
          if (item.idPermintaan === editingPermintaanId) {
            return {
              ...item,
              idBarang: formPermintaanIdBarang,
              namaBarang: targetAsset?.namaBarang || item.namaBarang,
              idRuang: targetAsset?.idRuang || item.idRuang,
              pelapor: formPermintaanPelapor.trim(),
              tanggal: formPermintaanTanggal || item.tanggal,
              jam: formPermintaanJam || item.jam,
              deskripsiKerusakan: formPermintaanDeskripsi.trim(),
              prioritas: formPermintaanPrioritas,
            };
          }
          return item;
        });
        setPermintaanList(updatedPermintaan);
        dataStorage.savePermintaanPerbaikan(updatedPermintaan);

        // Update corresponding Perbaikan jika ada
        const updatedPerbaikan = perbaikanList.map(pb => {
          if (pb.idPermintaan === editingPermintaanId) {
            return {
              ...pb,
              idBarang: formPermintaanIdBarang,
              namaBarang: targetAsset?.namaBarang || pb.namaBarang,
              idRuang: targetAsset?.idRuang || pb.idRuang,
              tanggalMulai: formPermintaanTanggal || pb.tanggalMulai,
              tindakan: pb.tindakan.startsWith('Menindaklanjuti keluhan:') 
                ? `Menindaklanjuti keluhan: ${formPermintaanDeskripsi.trim()}`
                : pb.tindakan,
            };
          }
          return pb;
        });
        setPerbaikanList(updatedPerbaikan);
        dataStorage.savePerbaikan(updatedPerbaikan);
      } else {
        const nextId = dataStorage.getNextPermintaanId();
        const now = new Date();
        const autoTgl = formPermintaanTanggal || now.toISOString().split('T')[0];
        const autoJam = formPermintaanJam || now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
        const newPermintaan: PermintaanPerbaikan = {
          idPermintaan: nextId,
          idBarang: formPermintaanIdBarang,
          namaBarang: targetAsset?.namaBarang || 'Aset Medis',
          idRuang: targetAsset?.idRuang || 'R01',
          tanggal: autoTgl,
          jam: autoJam,
          pelapor: formPermintaanPelapor.trim(),
          deskripsiKerusakan: formPermintaanDeskripsi.trim(),
          prioritas: formPermintaanPrioritas,
          status: 'Sedang Dikerjakan',
          tindakLanjut: 'Belum Dikerjakan',
          createdAt: now.toISOString(),
        };
        const updatedPermintaan = [newPermintaan, ...permintaanList];
        setPermintaanList(updatedPermintaan);
        dataStorage.savePermintaanPerbaikan(updatedPermintaan);

        // Otomatis masukkan ke dalam Data Tindakan Perbaikan Barang
        const nextPerbaikanId = dataStorage.getNextPerbaikanId();
        const autoPerbaikan: PerbaikanInventaris = {
          idPerbaikan: nextPerbaikanId,
          idPermintaan: nextId,
          idBarang: formPermintaanIdBarang,
          namaBarang: targetAsset?.namaBarang || 'Aset Medis',
          idRuang: targetAsset?.idRuang || 'R01',
          tanggalMulai: autoTgl,
          jamMulai: autoJam,
          teknisi: 'Tim IPSRS',
          jenisPerbaikan: 'Internal IPSRS',
          tindakan: `Menindaklanjuti keluhan: ${formPermintaanDeskripsi.trim()}`,
          sukuCadang: '-',
          biaya: 0,
          statusPerbaikan: 'Dalam Pengerjaan',
          tindakLanjut: 'Belum Dikerjakan',
          rekomendasi: 'Menunggu penanganan & uji fungsi oleh teknisi IPSRS.',
          createdAt: now.toISOString(),
        };
        const updatedPerbaikan = [autoPerbaikan, ...perbaikanList];
        setPerbaikanList(updatedPerbaikan);
        dataStorage.savePerbaikan(updatedPerbaikan);
      }
    } else if (subTab === 'perbaikan') {
      const targetAsset = inventaris.find(i => i.idBarang === formPerbaikanIdBarang);
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const timeNow = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');

      const isDoneOrAfkir = formPerbaikanStatus === 'Selesai' || 
                            formPerbaikanStatus === 'Selesai Baik' || 
                            formPerbaikanStatus === 'Tidak Bisa Diperbaiki' || 
                            formPerbaikanStatus === 'Afkir' ||
                            formPerbaikanStatus === 'Rekomendasi Pemusnahan';

      const tglMulaiVal = formPerbaikanTanggalMulai || today;
      const jmMulaiVal = formPerbaikanJamMulai || timeNow;

      // Tanggal & Jam Respon terisi otomatis ketika Input Tindakan status (Sudah Direspon)
      let tglResponVal: string | undefined = formPerbaikanTanggalRespon ? formPerbaikanTanggalRespon : undefined;
      let jmResponVal: string | undefined = formPerbaikanJamRespon ? formPerbaikanJamRespon : undefined;

      if (formPerbaikanStatus === 'Sudah Direspon') {
        if (!tglResponVal) tglResponVal = today;
        if (!jmResponVal) jmResponVal = timeNow;
      }

      let lamaResponVal: string | undefined = undefined;
      if (tglResponVal) {
        const calcRespon = calculateLamaRespon(tglMulaiVal, jmMulaiVal, tglResponVal, jmResponVal || timeNow);
        lamaResponVal = calcRespon.formatted;
      }

      const tglSelesai = isDoneOrAfkir ? (formPerbaikanTanggalSelesai || today) : undefined;
      const jmSelesai = isDoneOrAfkir ? (formPerbaikanJamSelesai || timeNow) : undefined;

      if (editingPerbaikanId) {
        // Update existing Perbaikan
        let linkedPermintaanId: string | undefined;
        const updated = perbaikanList.map(item => {
          if (item.idPerbaikan === editingPerbaikanId) {
            linkedPermintaanId = item.idPermintaan;
            return {
              ...item,
              idBarang: formPerbaikanIdBarang,
              namaBarang: targetAsset?.namaBarang || item.namaBarang,
              idRuang: targetAsset?.idRuang || item.idRuang,
              tanggalMulai: tglMulaiVal || item.tanggalMulai,
              jamMulai: jmMulaiVal || item.jamMulai,
              tanggalRespon: tglResponVal || item.tanggalRespon,
              jamRespon: jmResponVal || item.jamRespon,
              lamaRespon: lamaResponVal || item.lamaRespon,
              tanggalSelesai: tglSelesai,
              jamSelesai: jmSelesai,
              teknisi: formPerbaikanTeknisi.trim(),
              jenisPerbaikan: formPerbaikanJenis,
              namaVendor: formPerbaikanNamaVendor.trim() || undefined,
              tindakan: formPerbaikanTindakan.trim(),
              sukuCadang: formPerbaikanSukuCadang.trim() || undefined,
              biaya: Number(formPerbaikanBiaya) || 0,
              statusPerbaikan: formPerbaikanStatus,
              tindakLanjut: formPerbaikanTindakLanjut,
              rekomendasi: formPerbaikanRekomendasi.trim(),
            };
          }
          return item;
        });
        setPerbaikanList(updated);
        dataStorage.savePerbaikan(updated);

        // 1. Update status kondisi aset di Inventaris Ruangan jika perbaikan selesai atau dinyatakan rusak berat/afkir
        if (formPerbaikanStatus === 'Selesai' || formPerbaikanStatus === 'Selesai Baik') {
          const updatedInventaris = inventaris.map(inv => 
            inv.idBarang === formPerbaikanIdBarang 
              ? { ...inv, kondisi: 'Baik' as const, statusBarang: 'Tersedia / Digunakan' as const }
              : inv
          );
          setInventaris(updatedInventaris);
          dataStorage.saveInventarisRuangan(updatedInventaris);
        } else if (formPerbaikanStatus === 'Tidak Bisa Diperbaiki' || formPerbaikanStatus === 'Afkir' || formPerbaikanStatus === 'Rekomendasi Pemusnahan') {
          const updatedInventaris = inventaris.map(inv => 
            inv.idBarang === formPerbaikanIdBarang 
              ? { ...inv, kondisi: 'Rusak Berat' as const, statusBarang: 'Afkir / Diusulkan Hapus' as const }
              : inv
          );
          setInventaris(updatedInventaris);
          dataStorage.saveInventarisRuangan(updatedInventaris);
        }

        // 2. Sinkronisasi status permintaan terkait jika ada
        if (linkedPermintaanId) {
          const nextStatus = (formPerbaikanStatus === 'Selesai' || formPerbaikanStatus === 'Selesai Baik') 
            ? 'Selesai' 
            : (formPerbaikanStatus === 'Tidak Bisa Diperbaiki' || formPerbaikanStatus === 'Afkir' || formPerbaikanStatus === 'Rekomendasi Pemusnahan' 
                ? 'Ditolak / Afkir' 
                : 'Sedang Dikerjakan');
          const updatedPermintaan = permintaanList.map(p =>
            p.idPermintaan === linkedPermintaanId
              ? { ...p, status: nextStatus, tindakLanjut: formPerbaikanTindakLanjut }
              : p
          );
          setPermintaanList(updatedPermintaan);
          dataStorage.savePermintaanPerbaikan(updatedPermintaan);

          // 3. Sinkronisasi Laporan Mutu IPSRS
          if (tglResponVal) {
            const currentMutu = dataStorage.getLaporanMutu();
            const calc = calculateLamaRespon(tglMulaiVal, jmMulaiVal, tglResponVal, jmResponVal);
            const updatedMutu = currentMutu.map(m => {
              if (m.idPermintaan === linkedPermintaanId || m.idLaporan === linkedPermintaanId) {
                return {
                  ...m,
                  tglJamRespon: `${tglResponVal} ${jmResponVal ? (jmResponVal.length === 5 ? jmResponVal + ':00' : jmResponVal) : '08:15:00'}`,
                  durasiRespon: calc.totalMinutes,
                  statusRespon: calc.isFast ? 'Tepat Waktu' as const : 'Terlambat' as const,
                  teknisiRespon: formPerbaikanTeknisi.trim() || 'Tim IPSRS',
                  tindakLanjut: formPerbaikanTindakLanjut,
                };
              }
              return m;
            });
            dataStorage.saveLaporanMutu(updatedMutu);
          }
        }
      } else {
        // Create new Perbaikan
        const nextId = dataStorage.getNextPerbaikanId();
        const newPerbaikan: PerbaikanInventaris = {
          idPerbaikan: nextId,
          idPermintaan: formPerbaikanIdPermintaan || undefined,
          idBarang: formPerbaikanIdBarang,
          namaBarang: targetAsset?.namaBarang || 'Aset Medis',
          idRuang: targetAsset?.idRuang || 'R01',
          tanggalMulai: tglMulaiVal,
          jamMulai: jmMulaiVal,
          tanggalRespon: tglResponVal,
          jamRespon: jmResponVal,
          lamaRespon: lamaResponVal,
          tanggalSelesai: tglSelesai,
          jamSelesai: jmSelesai,
          teknisi: formPerbaikanTeknisi.trim(),
          jenisPerbaikan: formPerbaikanJenis,
          namaVendor: formPerbaikanNamaVendor.trim() || undefined,
          tindakan: formPerbaikanTindakan.trim(),
          sukuCadang: formPerbaikanSukuCadang.trim() || undefined,
          biaya: Number(formPerbaikanBiaya) || 0,
          statusPerbaikan: formPerbaikanStatus,
          tindakLanjut: formPerbaikanTindakLanjut,
          rekomendasi: formPerbaikanRekomendasi.trim(),
          createdAt: now.toISOString(),
        };
        const updated = [newPerbaikan, ...perbaikanList];
        setPerbaikanList(updated);
        dataStorage.savePerbaikan(updated);

        // 1. Update status kondisi aset di Inventaris Ruangan jika perbaikan selesai atau dinyatakan rusak berat/afkir
        if (formPerbaikanStatus === 'Selesai' || formPerbaikanStatus === 'Selesai Baik') {
          const updatedInventaris = inventaris.map(inv => 
            inv.idBarang === formPerbaikanIdBarang 
              ? { ...inv, kondisi: 'Baik' as const, statusBarang: 'Tersedia / Digunakan' as const }
              : inv
          );
          setInventaris(updatedInventaris);
          dataStorage.saveInventarisRuangan(updatedInventaris);
        } else if (formPerbaikanStatus === 'Tidak Bisa Diperbaiki' || formPerbaikanStatus === 'Afkir' || formPerbaikanStatus === 'Rekomendasi Pemusnahan') {
          const updatedInventaris = inventaris.map(inv => 
            inv.idBarang === formPerbaikanIdBarang 
              ? { ...inv, kondisi: 'Rusak Berat' as const, statusBarang: 'Afkir / Diusulkan Hapus' as const }
              : inv
          );
          setInventaris(updatedInventaris);
          dataStorage.saveInventarisRuangan(updatedInventaris);
        }

        // 2. If tied to permintaan, update permintaan status & tindakLanjut
        if (formPerbaikanIdPermintaan) {
          const nextStatus = (formPerbaikanStatus === 'Selesai' || formPerbaikanStatus === 'Selesai Baik') 
            ? 'Selesai' 
            : (formPerbaikanStatus === 'Tidak Bisa Diperbaiki' || formPerbaikanStatus === 'Afkir' || formPerbaikanStatus === 'Rekomendasi Pemusnahan' 
                ? 'Ditolak / Afkir' 
                : 'Sedang Dikerjakan');
          const updatedPermintaan = permintaanList.map(p =>
            p.idPermintaan === formPerbaikanIdPermintaan ? { ...p, status: nextStatus, tindakLanjut: formPerbaikanTindakLanjut } : p
          );
          setPermintaanList(updatedPermintaan);
          dataStorage.savePermintaanPerbaikan(updatedPermintaan);

          // 3. Sinkronisasi Laporan Mutu IPSRS
          if (tglResponVal) {
            const currentMutu = dataStorage.getLaporanMutu();
            const calc = calculateLamaRespon(tglMulaiVal, jmMulaiVal, tglResponVal, jmResponVal);
            const updatedMutu = currentMutu.map(m => {
              if (m.idPermintaan === formPerbaikanIdPermintaan || m.idLaporan === formPerbaikanIdPermintaan) {
                return {
                  ...m,
                  tglJamRespon: `${tglResponVal} ${jmResponVal ? (jmResponVal.length === 5 ? jmResponVal + ':00' : jmResponVal) : '08:15:00'}`,
                  durasiRespon: calc.totalMinutes,
                  statusRespon: calc.isFast ? 'Tepat Waktu' as const : 'Terlambat' as const,
                  teknisiRespon: formPerbaikanTeknisi.trim() || 'Tim IPSRS',
                  tindakLanjut: formPerbaikanTindakLanjut,
                };
              }
              return m;
            });
            dataStorage.saveLaporanMutu(updatedMutu);
          }
        }
      }
    } else if (subTab === 'pemeliharaan') {
      const targetAsset = inventaris.find(i => i.idBarang === formPmIdBarang);
      const nextId = dataStorage.getNextJadwalPmId();
      const newJadwal: JadwalPemeliharaan = {
        idJadwal: nextId,
        idBarang: formPmIdBarang,
        namaBarang: targetAsset?.namaBarang || 'Aset Medis',
        idRuang: targetAsset?.idRuang || 'R01',
        jenisPemeliharaan: formPmJenis.trim(),
        frekuensi: formPmFrekuensi,
        tanggalTerakhir: formPmTanggalTerakhir,
        tanggalBerikutnya: formPmTanggalBerikut,
        petugas: formPmPetugas.trim(),
        status: formPmTindakLanjut === 'Sudah Dikerjakan' ? 'Selesai Dilakukan' : 'Terjadwal',
        tindakLanjut: formPmTindakLanjut,
        keterangan: formPmKeterangan.trim(),
      };
      const updated = [newJadwal, ...jadwalPMList];
      setJadwalPMList(updated);
      dataStorage.saveJadwalPemeliharaan(updated);
    }

    setIsModalOpen(false);
  };

  const handleExportCsv = () => {
    if (subTab === 'permintaan') {
      const headers = ['ID Permintaan', 'ID Barang', 'Nama Barang', 'Ruang', 'Pelapor', 'Tanggal', 'Jam', 'Prioritas', 'Status', 'Deskripsi Kerusakan'];
      const rows = permintaanList.map(p => {
        const jamFormatted = p.jam || (p.createdAt?.includes('T') ? new Date(p.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':') : '08:00');
        return [
          p.idPermintaan, 
          p.idBarang, 
          p.namaBarang, 
          p.idRuang, 
          p.pelapor, 
          p.tanggal,
          jamFormatted,
          p.prioritas, 
          p.status, 
          p.deskripsiKerusakan
        ];
      });
      exportToCsv('Laporan_Permintaan_Perbaikan_RSMI', headers, rows);
    } else if (subTab === 'perbaikan') {
      const headers = ['ID Perbaikan', 'ID Barang', 'Nama Barang', 'Teknisi', 'Jenis', 'Tindakan', 'Suku Cadang', 'Biaya (Rp)', 'Tanggal & Jam Permintaan', 'Tanggal & Jam Respon', 'Lama Respon', 'Status', 'Tanggal & Jam Selesai/Afkir', 'Rekomendasi'];
      const rows = perbaikanList.map(p => {
        const linkedP = p.idPermintaan ? permintaanList.find(req => req.idPermintaan === p.idPermintaan) : undefined;
        const tglPermintaan = linkedP?.tanggal || p.tanggalMulai;
        const jamPermintaan = linkedP?.jam || p.jamMulai || (p.createdAt?.includes('T') ? new Date(p.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':') : '08:30');
        const tglJamPermintaan = `${tglPermintaan} ${jamPermintaan} WIB`;

        const tglRespon = p.tanggalRespon || (p.statusPerbaikan === 'Sudah Direspon' ? p.tanggalMulai : undefined);
        const jamRespon = p.jamRespon || (p.statusPerbaikan === 'Sudah Direspon' ? p.jamMulai : undefined);
        const tglJamRespon = tglRespon ? `${tglRespon} ${jamRespon ? jamRespon + ' WIB' : ''}`.trim() : '-';

        const calc = calculateLamaRespon(tglPermintaan, jamPermintaan, tglRespon, jamRespon);
        const lamaResponText = tglRespon ? (p.lamaRespon || calc.formatted) : '-';

        const tglJamSelesai = p.tanggalSelesai ? `${p.tanggalSelesai} ${p.jamSelesai ? p.jamSelesai + ' WIB' : ''}`.trim() : '-';
        return [
          p.idPerbaikan, 
          p.idBarang, 
          p.namaBarang, 
          p.teknisi, 
          p.jenisPerbaikan, 
          p.tindakan, 
          p.sukuCadang || '-', 
          p.biaya || 0, 
          tglJamPermintaan,
          tglJamRespon,
          lamaResponText,
          p.statusPerbaikan || 'Dalam Pengerjaan', 
          tglJamSelesai,
          p.rekomendasi || '-'
        ];
      });
      exportToCsv('Laporan_Tindakan_Perbaikan_IPSRS_RSMI', headers, rows);
    } else if (subTab === 'pemeliharaan') {
      const headers = ['ID Jadwal', 'ID Barang', 'Nama Barang', 'Ruang', 'Frekuensi', 'Tgl Terakhir', 'Tgl Berikutnya', 'Petugas', 'Status', 'Tindak Lanjut', 'Keterangan'];
      const rows = jadwalPMList.map(j => [
        j.idJadwal, 
        j.idBarang, 
        j.namaBarang, 
        j.idRuang, 
        j.frekuensi, 
        j.tanggalTerakhir, 
        j.tanggalBerikutnya, 
        j.petugas, 
        j.status, 
        j.tindakLanjut || (j.status === 'Selesai Dilakukan' ? 'Sudah Dikerjakan' : 'Belum Dikerjakan'),
        j.keterangan
      ]);
      exportToCsv('Jadwal_Pemeliharaan_Preventif_RSMI', headers, rows);
    }
  };

  const getSubTabInfo = () => {
    switch (subTab) {
      case 'permintaan':
        return {
          title: 'Permintaan Perbaikan Aset',
          subtitle: 'Formulir permohonan servis dan laporan kerusakan aset inventaris dari instalasi / unit ruangan.',
          addLabel: 'Input Permintaan',
          icon: <AlertTriangle className="w-5 h-5 text-blue-600" />
        };
      case 'perbaikan':
        return {
          title: 'Tindakan Perbaikan Barang (IPSRS / Rekanan)',
          subtitle: 'Pencatatan tindakan teknis perbaikan, log pengerjaan, pergantian suku cadang, dan BAP perbaikan.',
          addLabel: 'Input Perbaikan',
          icon: <Wrench className="w-5 h-5 text-blue-600" />
        };
      case 'pemeliharaan':
        return {
          title: 'Jadwal & Pemeliharaan Preventif (PM)',
          subtitle: 'Jadwal berkala kalibrasi, inspeksi rutin, dan preventive maintenance sarana prasarana RS.',
          addLabel: 'Input Jadwal PM',
          icon: <CalendarCheck className="w-5 h-5 text-blue-600" />
        };
      case 'laporanMutu':
      default:
        return {
          title: 'Laporan Mutu Pelayanan IPSRS',
          subtitle: 'Monitoring & evaluasi waktu tanggap kerusakan alat/sarana (Response Time ≤ 15 Menit).',
          addLabel: 'Catat Data Mutu',
          icon: <Activity className="w-5 h-5 text-blue-600" />
        };
    }
  };

  if (subTab === 'laporanMutu') {
    return <LaporanMutuView actionAccess={actionAccess} appSettings={settings} currentUser={currentUser} />;
  }

  const currentInfo = getSubTabInfo();

  return (
    <div className="space-y-6">
      
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
                onClick={() => printDiv('print-kegiatan-table', `Laporan ${subTab.toUpperCase()} RS Medika Insani`)}
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
            placeholder="Cari ID, nama alat medis, teknisi, ruangan..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Table Container */}
      <div id="print-kegiatan-table" className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        
        {/* Printable Header */}
        <div className="hidden print:block p-6 border-b border-slate-300 text-center space-y-1">
          <h2 className="text-xl font-bold text-slate-900">{settings.appName || 'RUMAH SAKIT MEDIKA INSANI'}</h2>
          <p className="text-xs text-slate-600">{settings.appSubtitle || 'Instalasi Pemeliharaan Sarana Rumah Sakit (IPSRS)'}</p>
          {settings.hospitalAddress && (
            <p className="text-[11px] text-slate-500">{settings.hospitalAddress} {settings.hospitalPhone ? `| Telp: ${settings.hospitalPhone}` : ''}</p>
          )}
          <p className="text-sm font-semibold uppercase text-blue-700 pt-2">Laporan Kegiatan {subTab}</p>
        </div>

        {/* DESKTOP TABLE VIEW (Visible on screens >= 768px) */}
        <div className="hidden md:block overflow-x-auto">
          {/* 1. PERMINTAAN PERBAIKAN TABLE */}
          {subTab === 'permintaan' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">ID Permintaan</th>
                  <th className="py-2.5 px-3">ID & Nama Barang</th>
                  <th className="py-2.5 px-3">Ruang Pemohon</th>
                  <th className="py-2.5 px-3">Pelapor</th>
                  <th className="py-2.5 px-3">Tanggal & Jam</th>
                  <th className="py-2.5 px-3">Keluhan Kerusakan</th>
                  <th className="py-2.5 px-3">Prioritas</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-center print:hidden">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {permintaanList
                  .filter(p => {
                    const q = (searchTerm || '').trim().toLowerCase();
                    return q === '' ||
                      (p.idPermintaan || '').toLowerCase().includes(q) ||
                      (p.namaBarang || '').toLowerCase().includes(q) ||
                      (p.pelapor || '').toLowerCase().includes(q);
                  })
                  .map(p => {
                    const r = ruangList.find(ru => ru.id === p.idRuang);
                    const jamText = p.jam || (p.createdAt?.includes('T') ? new Date(p.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':') : '08:00');
                    return (
                      <tr key={p.idPermintaan} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-semibold text-rose-700 bg-rose-50/40">
                          {p.idPermintaan}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">{p.namaBarang}</div>
                          <div className="font-mono text-[11px] text-slate-400">{p.idBarang}</div>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-700">
                          {r?.namaRuang || p.idRuang}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">
                          {p.pelapor}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="font-medium text-slate-800">{formatDateIndo(p.tanggal)}</div>
                          <div className="text-[11px] text-blue-600 font-semibold flex items-center gap-1">
                            <Clock className="w-3 h-3 text-blue-500 inline" />
                            <span>{jamText} WIB</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                          {p.deskripsiKerusakan}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                            p.prioritas === 'Darurat' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            p.prioritas === 'Tinggi' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                            'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {p.prioritas}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                            p.status === 'Selesai' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            p.status === 'Sedang Dikerjakan' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center print:hidden whitespace-nowrap">
                          <div className="inline-flex items-center gap-1 justify-center">
                            {actionAccess.canEdit && (
                              <button
                                type="button"
                                onClick={() => handleOpenEditPermintaan(p)}
                                className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                title="Edit Permintaan Perbaikan"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {actionAccess.canDelete && (
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmPermintaan(p)}
                                className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Hapus Permintaan Perbaikan"
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

          {/* 2. PERBAIKAN TABLE */}
          {subTab === 'perbaikan' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">ID Perbaikan</th>
                  <th className="py-2.5 px-3">ID & Nama Barang</th>
                  <th className="py-2.5 px-3">Teknisi / Pelaksana</th>
                  <th className="py-2.5 px-3">Tindakan & Suku Cadang</th>
                  <th className="py-2.5 px-3">Biaya (Rp)</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Tanggal & Jam Permintaan</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Tanggal & Jam Respon</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-center print:hidden">Tindak Lanjut / Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {perbaikanList
                  .filter(pb => {
                    const q = (searchTerm || '').trim().toLowerCase();
                    return q === '' ||
                      (pb.idPerbaikan || '').toLowerCase().includes(q) ||
                      (pb.namaBarang || '').toLowerCase().includes(q) ||
                      (pb.teknisi || '').toLowerCase().includes(q);
                  })
                  .map(pb => {
                    const linkedPermintaan = pb.idPermintaan 
                      ? permintaanList.find(p => p.idPermintaan === pb.idPermintaan) 
                      : undefined;

                    const tglPermintaan = linkedPermintaan?.tanggal || pb.tanggalMulai;
                    const jamPermintaanText = linkedPermintaan?.jam || pb.jamMulai || (pb.createdAt?.includes('T') ? new Date(pb.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':') : '08:30');

                    // Tanggal & Jam Respon (Otomatis saat status Sudah Direspon)
                    const tglRespon = pb.tanggalRespon || (pb.statusPerbaikan === 'Sudah Direspon' ? pb.tanggalMulai : undefined);
                    const jamResponText = pb.jamRespon || (pb.statusPerbaikan === 'Sudah Direspon' ? (pb.jamMulai || jamPermintaanText) : undefined);
                    const lamaResponCalc = calculateLamaRespon(tglPermintaan, jamPermintaanText, tglRespon, jamResponText);
                    const lamaResponDisplay = pb.lamaRespon || lamaResponCalc.formatted;

                    const isDoneOrAfkir = pb.statusPerbaikan === 'Selesai' || 
                                          pb.statusPerbaikan === 'Selesai Baik' || 
                                          pb.statusPerbaikan === 'Tidak Bisa Diperbaiki' || 
                                          pb.statusPerbaikan === 'Afkir' ||
                                          pb.statusPerbaikan === 'Rekomendasi Pemusnahan' ||
                                          (pb.statusPerbaikan || '').toLowerCase().includes('selesai') ||
                                          (pb.statusPerbaikan || '').toLowerCase().includes('afkir') ||
                                          (pb.statusPerbaikan || '').toLowerCase().includes('tidak bisa');
                    const jamSelesaiText = pb.jamSelesai || (pb.tanggalSelesai ? (pb.createdAt?.includes('T') ? new Date(pb.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':') : '14:20') : '14:20');

                    return (
                      <tr key={pb.idPerbaikan} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-semibold text-blue-700 bg-blue-50/40 align-middle">
                          {pb.idPerbaikan}
                          {pb.idPermintaan && (
                            <div className="text-[10px] text-slate-400 font-sans">Ref: {pb.idPermintaan}</div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 align-middle">
                          <div className="font-semibold text-slate-900">{pb.namaBarang}</div>
                          <div className="font-mono text-[11px] text-slate-400">{pb.idBarang}</div>
                        </td>
                        <td className="py-2.5 px-3 align-middle">
                          <div className="font-medium text-slate-800">{pb.teknisi}</div>
                          <div className="text-[10px] text-slate-400">{pb.jenisPerbaikan} {pb.namaVendor ? `(${pb.namaVendor})` : ''}</div>
                        </td>
                        <td className="py-2.5 px-3 max-w-xs align-middle">
                          <div className="text-slate-800 line-clamp-1">{pb.tindakan}</div>
                          {pb.sukuCadang && (
                            <div className="text-[10px] text-amber-700 font-medium">Part: {pb.sukuCadang}</div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 align-middle whitespace-nowrap">
                          {formatRupiah(pb.biaya)}
                        </td>
                        
                        {/* Kolom Tanggal & Jam Permintaan */}
                        <td className="py-2.5 px-3 whitespace-nowrap align-middle">
                          <div className="font-medium text-slate-800">{formatDateIndo(tglPermintaan)}</div>
                          <div className="text-[11px] text-slate-600 font-semibold flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-400 inline shrink-0" />
                            <span>{jamPermintaanText} WIB</span>
                          </div>
                        </td>

                        {/* Kolom Tanggal & Jam Respon (terisi otomatis) */}
                        <td className="py-2.5 px-3 whitespace-nowrap align-middle">
                          {tglRespon ? (
                            <div>
                              <div className="font-medium text-blue-900">{formatDateIndo(tglRespon)}</div>
                              <div className="text-[11px] text-blue-600 font-semibold flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3 text-blue-500 inline shrink-0" />
                                <span>{jamResponText} WIB</span>
                              </div>
                              {lamaResponDisplay && lamaResponDisplay !== '-' && (
                                <div className="mt-1 flex items-center gap-1">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border inline-flex items-center gap-1 ${
                                    lamaResponCalc.isFast 
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                      : 'bg-amber-50 text-amber-700 border-amber-200'
                                  }`} title={`Lama Respon: ${lamaResponDisplay}`}>
                                    <Timer className="w-2.5 h-2.5 inline shrink-0" />
                                    <span>Respon: {lamaResponDisplay}</span>
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Belum Direspon</span>
                          )}
                        </td>

                        {/* Kolom Status */}
                        <td className="py-2.5 px-3 whitespace-nowrap align-middle">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold inline-block ${
                            pb.statusPerbaikan === 'Selesai' || pb.statusPerbaikan === 'Selesai Baik' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            pb.statusPerbaikan === 'Sudah Direspon'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            pb.statusPerbaikan === 'Dalam Pengerjaan' 
                              ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                              'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {pb.statusPerbaikan || 'Dalam Pengerjaan'}
                          </span>
                          {isDoneOrAfkir && (
                            <div className="mt-1">
                              <div className="text-[10px] text-slate-500 font-medium">{formatDateIndo(pb.tanggalSelesai || pb.tanggalMulai)}</div>
                              <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-0.5 mt-0.5">
                                <Clock className="w-2.5 h-2.5 inline shrink-0 text-emerald-600" />
                                <span>{jamSelesaiText} WIB</span>
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Kolom Tindak Lanjut / Aksi */}
                        <td className="py-2.5 px-3 text-center print:hidden whitespace-nowrap align-middle">
                          <div className="flex flex-col items-center gap-1.5 justify-center">
                            <button
                              type="button"
                              onClick={() => handleOpenInputPerbaikan(pb)}
                              className="w-full max-w-[125px] px-2.5 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-semibold text-[11px] inline-flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs"
                              title="Input / Perbarui Rincian Tindakan Perbaikan"
                            >
                              <Wrench className="w-3 h-3 text-blue-600 shrink-0" />
                              <span>Input Perbaikan</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveBapPrint(pb)}
                              className="w-full max-w-[125px] px-2.5 py-1 rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-[11px] inline-flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs"
                              title="Cetak Berita Acara Perbaikan (BAP)"
                            >
                              <Printer className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                              <span>Cetak BAP</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          )}

          {/* 3. PEMELIHARAAN TABLE */}
          {subTab === 'pemeliharaan' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">ID Jadwal</th>
                  <th className="py-2.5 px-3">ID & Nama Barang</th>
                  <th className="py-2.5 px-3">Ruangan</th>
                  <th className="py-2.5 px-3">Frekuensi & Kegiatan</th>
                  <th className="py-2.5 px-3">Tgl Terakhir</th>
                  <th className="py-2.5 px-3">Tgl Berikutnya</th>
                  <th className="py-2.5 px-3">Petugas IPSRS</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Tindak Lanjut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {jadwalPMList
                  .filter(j => {
                    const q = (searchTerm || '').trim().toLowerCase();
                    return q === '' ||
                      (j.idJadwal || '').toLowerCase().includes(q) ||
                      (j.namaBarang || '').toLowerCase().includes(q) ||
                      (j.petugas || '').toLowerCase().includes(q);
                  })
                  .map(j => {
                    const r = ruangList.find(ru => ru.id === j.idRuang);
                    const isDone = j.tindakLanjut === 'Sudah Dikerjakan' || j.status === 'Selesai Dilakukan';
                    return (
                      <tr key={j.idJadwal} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-semibold text-blue-700 bg-blue-50/40">
                          {j.idJadwal}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">{j.namaBarang}</div>
                          <div className="font-mono text-[11px] text-slate-400">{j.idBarang}</div>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-700">
                          {r?.namaRuang || j.idRuang}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-700 mr-1 border border-slate-200">
                            {j.frekuensi}
                          </span>
                          <span className="text-slate-600">{j.jenisPemeliharaan}</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {formatDateIndo(j.tanggalTerakhir)}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-emerald-700">
                          {formatDateIndo(j.tanggalBerikutnya)}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          {j.petugas}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {j.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <button
                            type="button"
                            onClick={() => handleToggleTindakLanjutJadwal(j.idJadwal)}
                            title="Klik untuk mengubah status tindak lanjut"
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                              isDone
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                            }`}
                          >
                            {isDone ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Sudah Dikerjakan</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                <span>Belum Dikerjakan</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          )}
        </div>

        {/* MOBILE CARD VIEW (Optimized for screens < 768px) */}
        <div className="block md:hidden p-3 bg-slate-50/50 print:hidden">
          {/* 1. PERMINTAAN MOBILE CARDS */}
          {subTab === 'permintaan' && (
            <div className="space-y-3">
              {permintaanList
                .filter(p => {
                  const q = (searchTerm || '').trim().toLowerCase();
                  return q === '' ||
                    (p.idPermintaan || '').toLowerCase().includes(q) ||
                    (p.namaBarang || '').toLowerCase().includes(q) ||
                    (p.pelapor || '').toLowerCase().includes(q);
                })
                .map(p => {
                  const r = ruangList.find(ru => ru.id === p.idRuang);
                  return (
                    <div key={p.idPermintaan} className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          {p.idPermintaan}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.prioritas === 'Darurat' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            p.prioritas === 'Tinggi' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                            'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {p.prioritas}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                            p.status === 'Selesai' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            p.status === 'Sedang Dikerjakan' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {p.status}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{p.namaBarang}</h4>
                        <span className="font-mono text-[10px] text-slate-400">ID: {p.idBarang}</span>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-[11px]">Ruang:</span>
                          <span className="font-medium text-slate-700">{r?.namaRuang || p.idRuang}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-[11px]">Pelapor:</span>
                          <span className="font-medium text-slate-700">{p.pelapor}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-[11px]">Tanggal & Jam:</span>
                          <span className="font-medium text-slate-700">
                            {formatDateIndo(p.tanggal)} ({p.jam || (p.createdAt?.includes('T') ? new Date(p.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':') : '08:00')} WIB)
                          </span>
                        </div>
                        <div className="pt-1 border-t border-slate-200/60">
                          <span className="text-slate-400 text-[10px] block font-medium">Keluhan:</span>
                          <p className="text-slate-600 text-xs">{p.deskripsiKerusakan}</p>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                        {actionAccess.canEdit && (
                          <button
                            type="button"
                            onClick={() => handleOpenEditPermintaan(p)}
                            className="flex-1 py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1 min-h-[38px]"
                          >
                            <Edit className="w-3.5 h-3.5 text-blue-600" />
                            <span>Edit Permintaan</span>
                          </button>
                        )}
                        {actionAccess.canDelete && (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmPermintaan(p)}
                            className="p-1.5 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center justify-center gap-1 min-h-[38px]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* 2. PERBAIKAN MOBILE CARDS */}
          {subTab === 'perbaikan' && (
            <div className="space-y-3">
              {perbaikanList
                .filter(pb => {
                  const q = (searchTerm || '').trim().toLowerCase();
                  return q === '' ||
                    (pb.idPerbaikan || '').toLowerCase().includes(q) ||
                    (pb.namaBarang || '').toLowerCase().includes(q) ||
                    (pb.teknisi || '').toLowerCase().includes(q);
                })
                .map(pb => {
                  const linkedPermintaan = pb.idPermintaan 
                    ? permintaanList.find(p => p.idPermintaan === pb.idPermintaan) 
                    : undefined;

                  const tglPermintaan = linkedPermintaan?.tanggal || pb.tanggalMulai;
                  const jamPermintaanText = linkedPermintaan?.jam || pb.jamMulai || (pb.createdAt?.includes('T') ? new Date(pb.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':') : '08:30');

                  const tglRespon = pb.tanggalRespon || (pb.statusPerbaikan === 'Sudah Direspon' ? pb.tanggalMulai : undefined);
                  const jamResponText = pb.jamRespon || (pb.statusPerbaikan === 'Sudah Direspon' ? (pb.jamMulai || jamPermintaanText) : undefined);
                  const lamaResponCalc = calculateLamaRespon(tglPermintaan, jamPermintaanText, tglRespon, jamResponText);
                  const lamaResponDisplay = pb.lamaRespon || lamaResponCalc.formatted;

                  const isDoneOrAfkir = pb.statusPerbaikan === 'Selesai' || 
                                        pb.statusPerbaikan === 'Selesai Baik' || 
                                        pb.statusPerbaikan === 'Tidak Bisa Diperbaiki' || 
                                        pb.statusPerbaikan === 'Afkir' ||
                                        pb.statusPerbaikan === 'Rekomendasi Pemusnahan' ||
                                        (pb.statusPerbaikan || '').toLowerCase().includes('selesai') ||
                                        (pb.statusPerbaikan || '').toLowerCase().includes('afkir') ||
                                        (pb.statusPerbaikan || '').toLowerCase().includes('tidak bisa');
                  const jamSelesaiText = pb.jamSelesai || (pb.tanggalSelesai ? (pb.createdAt?.includes('T') ? new Date(pb.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':') : '14:20') : '14:20');

                  return (
                    <div key={pb.idPerbaikan} className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {pb.idPerbaikan}
                          </span>
                          {pb.idPermintaan && (
                            <span className="ml-1.5 font-mono text-[10px] text-slate-400">Ref: {pb.idPermintaan}</span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block ${
                            pb.statusPerbaikan === 'Selesai' || pb.statusPerbaikan === 'Selesai Baik'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            pb.statusPerbaikan === 'Sudah Direspon'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            pb.statusPerbaikan === 'Dalam Pengerjaan' 
                              ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                              'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {pb.statusPerbaikan || 'Dalam Pengerjaan'}
                          </span>
                          {isDoneOrAfkir && (
                            <div className="text-[10px] text-slate-500 font-medium mt-0.5 flex items-center justify-end gap-1">
                              <Clock className="w-2.5 h-2.5 inline shrink-0 text-emerald-600" />
                              <span>{formatDateIndo(pb.tanggalSelesai || pb.tanggalMulai)} ({jamSelesaiText} WIB)</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{pb.namaBarang}</h4>
                        <span className="font-mono text-[10px] text-slate-400">ID: {pb.idBarang}</span>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 text-[11px]">Tgl Permintaan:</span>
                          <span className="font-medium text-slate-800">{formatDateIndo(tglPermintaan)} ({jamPermintaanText} WIB)</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 text-[11px]">Tgl Respon:</span>
                          {tglRespon ? (
                            <div className="text-right">
                              <span className="font-semibold text-blue-700">{formatDateIndo(tglRespon)} ({jamResponText} WIB)</span>
                              {lamaResponDisplay && lamaResponDisplay !== '-' && (
                                <div className="mt-0.5">
                                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border inline-flex items-center gap-1 ${
                                    lamaResponCalc.isFast 
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                      : 'bg-amber-50 text-amber-700 border-amber-200'
                                  }`}>
                                    <Timer className="w-2.5 h-2.5 inline shrink-0" />
                                    <span>Lama: {lamaResponDisplay}</span>
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Belum Direspon</span>
                          )}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 text-[11px]">Teknisi:</span>
                          <span className="font-medium text-slate-700">{pb.teknisi} ({pb.jenisPerbaikan})</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 text-[11px]">Biaya:</span>
                          <span className="font-bold text-slate-900">{formatRupiah(pb.biaya)}</span>
                        </div>
                        <div className="pt-1 border-t border-slate-200/60">
                          <span className="text-slate-400 text-[10px] block font-medium">Tindakan:</span>
                          <p className="text-slate-600 text-xs">{pb.tindakan || '-'}</p>
                          {pb.sukuCadang && (
                            <span className="text-amber-700 font-medium text-[11px] block mt-0.5">Part: {pb.sukuCadang}</span>
                          )}
                        </div>
                      </div>

                      {/* Tombol Tindak Lanjut: Input Perbaikan diatas Cetak BAP */}
                      <div className="pt-2 flex flex-col gap-1.5 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleOpenInputPerbaikan(pb)}
                          className="w-full py-2 px-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-semibold text-xs flex items-center justify-center gap-1.5 min-h-[38px] cursor-pointer shadow-2xs transition-colors"
                        >
                          <Wrench className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>Input Perbaikan</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveBapPrint(pb)}
                          className="w-full py-2 px-3 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 min-h-[38px] cursor-pointer shadow-2xs transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                          <span>Cetak BAP</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* 3. PEMELIHARAAN MOBILE CARDS */}
          {subTab === 'pemeliharaan' && (
            <div className="space-y-3">
              {jadwalPMList
                .filter(j => {
                  const q = (searchTerm || '').trim().toLowerCase();
                  return q === '' ||
                    (j.idJadwal || '').toLowerCase().includes(q) ||
                    (j.namaBarang || '').toLowerCase().includes(q) ||
                    (j.petugas || '').toLowerCase().includes(q);
                })
                .map(j => {
                  const r = ruangList.find(ru => ru.id === j.idRuang);
                  const isDone = j.tindakLanjut === 'Sudah Dikerjakan' || j.status === 'Selesai Dilakukan';
                  return (
                    <div key={j.idJadwal} className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {j.idJadwal}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {j.frekuensi}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{j.namaBarang}</h4>
                        <span className="text-xs text-slate-500">{j.jenisPemeliharaan} • Ruang {r?.namaRuang || j.idRuang}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                        <div>
                          <span className="text-slate-400 text-[10px] block">Tgl Terakhir</span>
                          <span className="font-medium text-slate-700 text-[11px]">{formatDateIndo(j.tanggalTerakhir)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Tgl Berikutnya</span>
                          <span className="font-bold text-emerald-700 text-[11px]">{formatDateIndo(j.tanggalBerikutnya)}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleToggleTindakLanjutJadwal(j.idJadwal)}
                          className={`w-full py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all min-h-[38px] ${
                            isDone
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          {isDone ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>Sudah Dikerjakan (Klik Ubah)</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-4 h-4 text-amber-600" />
                              <span>Belum Dikerjakan (Klik Tandai Selesai)</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-xl w-full p-5 shadow-xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <span>
                  {subTab === 'permintaan' && (editingPermintaanId ? `Edit Permintaan Perbaikan (${editingPermintaanId})` : 'Form Permintaan Perbaikan Inventaris')}
                  {subTab === 'perbaikan' && (editingPerbaikanId ? `Input / Edit Tindakan Perbaikan (${editingPerbaikanId})` : 'Form Input Tindakan Perbaikan Barang IPSRS')}
                  {subTab === 'pemeliharaan' && 'Form Jadwal Pemeliharaan Preventif'}
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
              
              {/* Permintaan Form */}
              {subTab === 'permintaan' && (
                <>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Pilih Peralatan / Aset Rusak *</label>
                    <select
                      value={formPermintaanIdBarang}
                      onChange={e => setFormPermintaanIdBarang(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-white font-medium text-slate-800 focus:ring-1 focus:ring-blue-500"
                    >
                      {inventaris.map(i => {
                        const r = ruangList.find(ru => ru.id === i.idRuang);
                        return (
                          <option key={i.idBarang} value={i.idBarang}>
                            [{i.idBarang}] {i.namaBarang} - {r?.namaRuang}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Nama Petugas Pelapor *</label>
                      <input
                        type="text"
                        required
                        value={formPermintaanPelapor}
                        onChange={e => setFormPermintaanPelapor(e.target.value)}
                        placeholder="Nama perawat / dokter..."
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Tingkat Prioritas</label>
                      <select
                        value={formPermintaanPrioritas}
                        onChange={e => setFormPermintaanPrioritas(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-white font-medium focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="Rendah">Rendah (Peralatan Cadangan)</option>
                        <option value="Sedang">Sedang (Peralatan Rutin)</option>
                        <option value="Tinggi">Tinggi (Ruang Rawat Inap/Poli)</option>
                        <option value="Darurat">Darurat (ICU / Kamar Operasi / IGD)</option>
                      </select>
                    </div>
                  </div>

                  {/* Tanggal & Jam Permintaan (Otomatis) */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1 flex items-center justify-between">
                        <span>Tanggal Permintaan *</span>
                        <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded">Otomatis</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={formPermintaanTanggal}
                        onChange={e => setFormPermintaanTanggal(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 mb-1 flex items-center justify-between">
                        <span>Jam Permintaan *</span>
                        <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded">Otomatis</span>
                      </label>
                      <input
                        type="time"
                        required
                        value={formPermintaanJam}
                        onChange={e => setFormPermintaanJam(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Gejala Kerusakan / Keluhan Alat *</label>
                    <textarea
                      rows={3}
                      required
                      value={formPermintaanDeskripsi}
                      onChange={e => setFormPermintaanDeskripsi(e.target.value)}
                      placeholder="Jelaskan detail kendala (misal: layar bergaris, mati total, alarm terus bunyi)..."
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {/* Perbaikan Form */}
              {subTab === 'perbaikan' && (
                <>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Barang yang Diperbaiki *</label>
                    <select
                      value={formPerbaikanIdBarang}
                      onChange={e => setFormPerbaikanIdBarang(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-white font-medium text-slate-800 focus:ring-1 focus:ring-blue-500"
                    >
                      {inventaris.map(i => (
                        <option key={i.idBarang} value={i.idBarang}>
                          [{i.idBarang}] {i.namaBarang}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tanggal & Jam Permintaan (Otomatis) */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1 flex items-center justify-between">
                        <span>Tanggal Permintaan *</span>
                        <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded">Otomatis</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={formPerbaikanTanggalMulai}
                        onChange={e => setFormPerbaikanTanggalMulai(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 mb-1 flex items-center justify-between">
                        <span>Jam Permintaan *</span>
                        <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded">Otomatis</span>
                      </label>
                      <input
                        type="time"
                        required
                        value={formPerbaikanJamMulai}
                        onChange={e => setFormPerbaikanJamMulai(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Teknisi Penanggung Jawab *</label>
                      <input
                        type="text"
                        required
                        value={formPerbaikanTeknisi}
                        onChange={e => setFormPerbaikanTeknisi(e.target.value)}
                        placeholder="Nama teknisi IPSRS..."
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Kategori Pelaksana</label>
                      <select
                        value={formPerbaikanJenis}
                        onChange={e => setFormPerbaikanJenis(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-white focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="Internal IPSRS">Internal Teknisi IPSRS</option>
                        <option value="Vendor / Pihak Ketiga">Vendor Resmi / Pihak Ketiga</option>
                      </select>
                    </div>
                  </div>

                  {formPerbaikanJenis === 'Vendor / Pihak Ketiga' && (
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Nama Perusahaan Vendor</label>
                      <input
                        type="text"
                        value={formPerbaikanNamaVendor}
                        onChange={e => setFormPerbaikanNamaVendor(e.target.value)}
                        placeholder="PT Service Medika..."
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Tindakan Teknis yang Dilakukan *</label>
                    <textarea
                      rows={2}
                      required
                      value={formPerbaikanTindakan}
                      onChange={e => setFormPerbaikanTindakan(e.target.value)}
                      placeholder="e.g. Pembongkaran casing, pembersihan modul power supply, penggantian kapasitor..."
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Suku Cadang Diganti</label>
                      <input
                        type="text"
                        value={formPerbaikanSukuCadang}
                        onChange={e => setFormPerbaikanSukuCadang(e.target.value)}
                        placeholder="Nama sparepart..."
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Total Biaya Perbaikan (Rp)</label>
                      <input
                        type="number"
                        min={0}
                        value={formPerbaikanBiaya}
                        onChange={e => setFormPerbaikanBiaya(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Status Hasil Akhir</label>
                      <select
                        value={formPerbaikanStatus}
                        onChange={e => {
                          const val = e.target.value as any;
                          setFormPerbaikanStatus(val);
                          const now = new Date();
                          const today = now.toISOString().split('T')[0];
                          const timeNow = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');

                          if (val === 'Sudah Direspon') {
                            if (!formPerbaikanTanggalRespon) {
                              setFormPerbaikanTanggalRespon(today);
                            }
                            if (!formPerbaikanJamRespon) {
                              setFormPerbaikanJamRespon(timeNow);
                            }
                          }

                          if (val === 'Selesai' || val === 'Tidak Bisa Diperbaiki' || val === 'Afkir') {
                            if (!formPerbaikanTanggalSelesai) {
                              setFormPerbaikanTanggalSelesai(today);
                            }
                            if (!formPerbaikanJamSelesai) {
                              setFormPerbaikanJamSelesai(timeNow);
                            }
                          }
                        }}
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-white font-medium focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="Selesai">Selesai (Berfungsi Normal)</option>
                        <option value="Sudah Direspon">Sudah Direspon</option>
                        <option value="Dalam Pengerjaan">Dalam Pengerjaan / Menunggu Part</option>
                        <option value="Tidak Bisa Diperbaiki">Afkir / Rusak Permanen</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Rekomendasi Teknisi</label>
                      <input
                        type="text"
                        value={formPerbaikanRekomendasi}
                        onChange={e => setFormPerbaikanRekomendasi(e.target.value)}
                        placeholder="Rekomendasi pemakaian..."
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Tanggal & Jam Respon (Otomatis saat status Sudah Direspon) */}
                  {(formPerbaikanStatus === 'Sudah Direspon' || formPerbaikanTanggalRespon) && (
                    <div className="p-2.5 bg-blue-50/60 rounded-lg border border-blue-200/80 space-y-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-medium text-blue-900 mb-1 flex items-center justify-between text-xs">
                            <span>Tanggal Respon *</span>
                            <span className="text-[10px] text-blue-700 font-semibold bg-blue-100 px-1.5 py-0.5 rounded">Otomatis</span>
                          </label>
                          <input
                            type="date"
                            required
                            value={formPerbaikanTanggalRespon}
                            onChange={e => setFormPerbaikanTanggalRespon(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-md border border-blue-200 bg-white focus:ring-1 focus:ring-blue-500 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block font-medium text-blue-900 mb-1 flex items-center justify-between text-xs">
                            <span>Jam Respon *</span>
                            <span className="text-[10px] text-blue-700 font-semibold bg-blue-100 px-1.5 py-0.5 rounded">Otomatis</span>
                          </label>
                          <input
                            type="time"
                            required
                            value={formPerbaikanJamRespon}
                            onChange={e => setFormPerbaikanJamRespon(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-md border border-blue-200 bg-white focus:ring-1 focus:ring-blue-500 text-xs"
                          />
                        </div>
                      </div>
                      {formPerbaikanTanggalRespon && (
                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-blue-200/50">
                          <span className="text-blue-800 font-medium flex items-center gap-1">
                            <Timer className="w-3.5 h-3.5 text-blue-600 inline" />
                            Perhitungan Lama Respon:
                          </span>
                          <span className="font-bold text-blue-900 bg-blue-100/80 px-2 py-0.5 rounded border border-blue-300">
                            {calculateLamaRespon(
                              formPerbaikanTanggalMulai || new Date().toISOString().split('T')[0],
                              formPerbaikanJamMulai || '08:00',
                              formPerbaikanTanggalRespon,
                              formPerbaikanJamRespon || '08:15'
                            ).formatted}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tanggal & Jam Selesai / Afkir (Otomatis saat status Selesai atau Afkir) */}
                  {(formPerbaikanStatus === 'Selesai' || formPerbaikanStatus === 'Tidak Bisa Diperbaiki' || formPerbaikanStatus === 'Afkir') && (
                    <div className="grid grid-cols-2 gap-3 p-2.5 bg-emerald-50/50 rounded-lg border border-emerald-200/70">
                      <div>
                        <label className="block font-medium text-emerald-900 mb-1 flex items-center justify-between">
                          <span>Tanggal Selesai / Afkir *</span>
                          <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100 px-1.5 py-0.5 rounded">Otomatis</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={formPerbaikanTanggalSelesai}
                          onChange={e => setFormPerbaikanTanggalSelesai(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-md border border-emerald-200 bg-white focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block font-medium text-emerald-900 mb-1 flex items-center justify-between">
                          <span>Jam Selesai / Afkir *</span>
                          <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100 px-1.5 py-0.5 rounded">Otomatis</span>
                        </label>
                        <input
                          type="time"
                          required
                          value={formPerbaikanJamSelesai}
                          onChange={e => setFormPerbaikanJamSelesai(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-md border border-emerald-200 bg-white focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Pemeliharaan Form */}
              {subTab === 'pemeliharaan' && (
                <>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Pilih Peralatan Medis *</label>
                    <select
                      value={formPmIdBarang}
                      onChange={e => setFormPmIdBarang(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-white font-medium text-slate-800 focus:ring-1 focus:ring-blue-500"
                    >
                      {inventaris.map(i => (
                        <option key={i.idBarang} value={i.idBarang}>
                          [{i.idBarang}] {i.namaBarang}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Jenis Pemeliharaan</label>
                      <input
                        type="text"
                        required
                        value={formPmJenis}
                        onChange={e => setFormPmJenis(e.target.value)}
                        placeholder="Inspeksi & Kalibrasi Berkala"
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Frekuensi Rutin</label>
                      <select
                        value={formPmFrekuensi}
                        onChange={e => setFormPmFrekuensi(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-white focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="Bulanan">Bulanan (1 Bulan Sekali)</option>
                        <option value="Triwulan">Triwulan (3 Bulan Sekali)</option>
                        <option value="Semester">Semester (6 Bulan Sekali)</option>
                        <option value="Tahunan">Tahunan (Kalibrasi Resmi BPFK)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Tanggal Terakhir Dilakukan</label>
                      <input
                        type="date"
                        required
                        value={formPmTanggalTerakhir}
                        onChange={e => setFormPmTanggalTerakhir(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Jadwal Berikutnya (Due Date)</label>
                      <input
                        type="date"
                        required
                        value={formPmTanggalBerikut}
                        onChange={e => setFormPmTanggalBerikut(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Petugas / Tim Penanggung Jawab</label>
                      <input
                        type="text"
                        required
                        value={formPmPetugas}
                        onChange={e => setFormPmPetugas(e.target.value)}
                        placeholder="Tim Elektromedik IPSRS..."
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Status Tindak Lanjut</label>
                      <select
                        value={formPmTindakLanjut}
                        onChange={e => setFormPmTindakLanjut(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-white font-medium focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="Belum Dikerjakan">Belum Dikerjakan</option>
                        <option value="Sudah Dikerjakan">Sudah Dikerjakan</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Keterangan / Parameter Uji</label>
                    <textarea
                      rows={2}
                      value={formPmKeterangan}
                      onChange={e => setFormPmKeterangan(e.target.value)}
                      placeholder="Daftar checklist atau catatan khusus..."
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

      {/* PRINT BAP (BERITA ACARA PERBAIKAN) MODAL */}
      {activeBapPrint && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-5 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Berita Acara Perbaikan (BAP) Resmi</h3>
              <button
                type="button"
                onClick={() => setActiveBapPrint(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div id="printable-bap" className="p-6 border border-slate-300 rounded-lg bg-white text-slate-900 space-y-4">
              
              {/* Kop Surat & Judul Dokumen Terstandarisasi */}
              <DocumentHeader
                settings={settings}
                title="BERITA ACARA TINDAKAN PERBAIKAN SARANA PRASARANA"
                documentNumber={`Nomor: ${activeBapPrint.idPerbaikan}/BAP-IPSRS/${settings.systemShortName || 'RSMI'}/${new Date().getFullYear()}`}
                unitName="Instalasi Pemeliharaan Sarana & Prasarana Rumah Sakit (IPSRS)"
              />

              <p className="text-xs text-slate-700 leading-relaxed">
                Telah dilaksanakan tindakan perbaikan peralatan medis/inventaris rumah sakit pada tanggal <b>{formatDateIndo(activeBapPrint.tanggalMulai)}</b> pukul <b>{activeBapPrint.jamMulai || '08:30'} WIB</b> dengan rincian teknis sebagai berikut:
              </p>

              <table className="w-full text-xs border border-slate-300 text-left">
                <tbody>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-slate-800 w-1/3">Nama Barang / Aset</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">{activeBapPrint.namaBarang}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-2 px-3 font-semibold text-slate-800">ID Inventaris</td>
                    <td className="py-2 px-3 font-mono font-semibold text-blue-700">{activeBapPrint.idBarang}</td>
                  </tr>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-slate-800">Teknisi / Pelaksana</td>
                    <td className="py-2 px-3 text-slate-800">{activeBapPrint.teknisi} ({activeBapPrint.jenisPerbaikan})</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-2 px-3 font-semibold text-slate-800">Tindakan Teknis</td>
                    <td className="py-2 px-3 text-slate-800">{activeBapPrint.tindakan}</td>
                  </tr>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-slate-800">Suku Cadang Diganti</td>
                    <td className="py-2 px-3 text-slate-800">{activeBapPrint.sukuCadang || 'Tidak ada (Perbaikan sirkuit/setting)'}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-2 px-3 font-semibold text-slate-800">Total Biaya Perbaikan</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">{formatRupiah(activeBapPrint.biaya)}</td>
                  </tr>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-slate-800">Status Perbaikan</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">
                      {activeBapPrint.statusPerbaikan || 'Selesai'}
                      {activeBapPrint.tanggalSelesai && (
                        <span className="font-normal text-slate-600 ml-1.5">
                          (Selesai: {formatDateIndo(activeBapPrint.tanggalSelesai)} {activeBapPrint.jamSelesai ? activeBapPrint.jamSelesai + ' WIB' : ''})
                        </span>
                      )}
                    </td>
                  </tr>
                  <tr className="bg-emerald-50">
                    <td className="py-2 px-3 font-semibold text-emerald-900">Rekomendasi & Hasil</td>
                    <td className="py-2 px-3 font-semibold text-emerald-900">{activeBapPrint.rekomendasi}</td>
                  </tr>
                </tbody>
              </table>

              {/* Tanda Tangan QR TTE */}
              <div className="pt-4 border-t border-slate-200">
                <div className="grid grid-cols-2 gap-6 text-center">
                  <QrSignature
                    role="Teknisi Pelaksana IPSRS"
                    name={activeBapPrint.teknisi || 'Teknisi Elektromedik'}
                    docName="Berita Acara Tindakan Perbaikan (BAP)"
                    docNumber={`${activeBapPrint.idPerbaikan}/BAP-IPSRS`}
                    hospitalName={settings.appName}
                    date={formatDateIndo(activeBapPrint.tanggalSelesai || activeBapPrint.tanggalMulai)}
                  />

                  <QrSignature
                    role="Kepala Instalasi IPSRS"
                    name="Ir. H. Rahardian, MT"
                    nip="19820315 200804 1 002"
                    docName="Berita Acara Tindakan Perbaikan (BAP)"
                    docNumber={`${activeBapPrint.idPerbaikan}/BAP-IPSRS`}
                    hospitalName={settings.appName}
                    date={formatDateIndo(activeBapPrint.tanggalSelesai || activeBapPrint.tanggalMulai)}
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
                onClick={() => setActiveBapPrint(null)}
                className="px-3.5 py-1.5 rounded-md border border-slate-200 text-slate-600 font-medium text-xs hover:bg-slate-50 cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => printDiv('printable-bap', `BAP-${activeBapPrint.idPerbaikan}`)}
                className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak BAP</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL - PERMINTAAN PERBAIKAN */}
      {deleteConfirmPermintaan && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl border border-slate-200 text-center space-y-3.5">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-sm">Hapus Permintaan Perbaikan?</h3>
              <p className="text-xs text-slate-500">
                Apakah Anda yakin ingin menghapus data pengajuan <b>{deleteConfirmPermintaan.idPermintaan}</b> ({deleteConfirmPermintaan.namaBarang})?
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmPermintaan(null)}
                className="px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 font-medium text-xs hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeletePermintaan}
                className="px-3.5 py-1.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs cursor-pointer shadow-xs"
              >
                Ya, Hapus Permintaan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
