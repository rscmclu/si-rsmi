import React, { useState, useEffect } from 'react';
import { 
  PermintaanPemusnahan, 
  PelaksanaanPemusnahan, 
  InventarisRuangan, 
  RuangInventaris, 
  JenisInventaris, 
  KategoriInventaris, 
  ActionPermission,
  UserAccount,
  AppSettings
} from '../types/inventory';
import { dataStorage } from '../services/dataStorage';
import { formatDateIndo, exportToCsv, printDiv } from '../utils/formatters';
import { DocumentHeader } from './DocumentHeader';
import { QrSignature } from './QrSignature';
import { 
  Flame, 
  FileWarning, 
  Trash2, 
  FileCheck, 
  Plus, 
  Search, 
  Printer, 
  Download, 
  X, 
  CheckCircle2, 
  AlertOctagon, 
  ArrowRight
} from 'lucide-react';

export type PemusnahanSubTab = 'permintaan' | 'pelaksanaan' | 'laporan';

interface PemusnahanAsetViewProps {
  initialSubTab?: PemusnahanSubTab;
  actionAccess: ActionPermission;
  currentUser?: UserAccount | null;
  appSettings?: AppSettings;
}

export const PemusnahanAsetView: React.FC<PemusnahanAsetViewProps> = ({
  initialSubTab = 'permintaan',
  actionAccess,
  currentUser: propCurrentUser,
  appSettings: propAppSettings,
}) => {
  const settings = propAppSettings || dataStorage.getAppSettings();
  const activeUser = propCurrentUser || dataStorage.getCurrentUser();
  const isAdmin = true; // All authenticated users are authorized to edit, execute and manage pemusnahan aset

  const [subTab, setSubTab] = useState<PemusnahanSubTab>(initialSubTab);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setSubTab(initialSubTab);
    setSearchTerm('');
  }, [initialSubTab]);

  const [permintaanList, setPermintaanList] = useState<PermintaanPemusnahan[]>(dataStorage.getPermintaanPemusnahan());
  const [pelaksanaanList, setPelaksanaanList] = useState<PelaksanaanPemusnahan[]>(dataStorage.getPelaksanaanPemusnahan());
  const [inventaris, setInventaris] = useState<InventarisRuangan[]>(dataStorage.getInventarisRuangan());
  const [ruangList] = useState<RuangInventaris[]>(dataStorage.getRuang());
  const [jenisList] = useState<JenisInventaris[]>(dataStorage.getJenis());
  const [kategoriList] = useState<KategoriInventaris[]>(dataStorage.getKategori());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeBaPrint, setActiveBaPrint] = useState<PelaksanaanPemusnahan | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Form states: Permintaan
  const [formPermintaanIdBarang, setFormPermintaanIdBarang] = useState(inventaris[0]?.idBarang || '');
  const [formPermintaanAlasan, setFormPermintaanAlasan] = useState('Rusak Berat & Teknologi Usang (Tidak Ekonomis Diperbaiki)');
  const [formPermintaanPemohon, setFormPermintaanPemohon] = useState('');

  // Form states: Pelaksanaan
  const [formPelaksanaanIdPermintaan, setFormPelaksanaanIdPermintaan] = useState('');
  const [formPelaksanaanIdBarang, setFormPelaksanaanIdBarang] = useState(inventaris[0]?.idBarang || '');
  const [formPelaksanaanMetode, setFormPelaksanaanMetode] = useState<'Dihancurkan' | 'Dibakar' | 'Dilelang' | 'Dihibahkan' | 'Diserahkan ke Pihak Ketiga'>('Dihancurkan');
  const [formPelaksanaanPetugas, setFormPelaksanaanPetugas] = useState('Tim Penghapusan Aset RSMI');
  const [formPelaksanaanSaksi, setFormPelaksanaanSaksi] = useState('Satuan Pengawas Internal (SPI) & IPSRS');
  const [formPelaksanaanLokasi, setFormPelaksanaanLokasi] = useState('Area TPS B3 & Penghapusan Aset RS Medika Insani');
  const [formPelaksanaanKeterangan, setFormPelaksanaanKeterangan] = useState('Pemusnahan fisik disaksikan tim verifikator.');

  const openCreateModal = () => {
    if (subTab === 'permintaan') {
      setFormPermintaanIdBarang(inventaris[0]?.idBarang || '');
      setFormPermintaanAlasan('Rusak Berat & Komponen Tidak Tersedia di Pasaran (Afkir)');
      setFormPermintaanPemohon(activeUser?.namaLengkap || 'Kepala Ruangan IPSRS');
    } else if (subTab === 'pelaksanaan') {
      setFormPelaksanaanIdPermintaan('');
      setFormPelaksanaanIdBarang(inventaris[0]?.idBarang || '');
      setFormPelaksanaanMetode('Dihancurkan');
      setFormPelaksanaanPetugas('Panitia Penghapusan Aset RSMI');
      setFormPelaksanaanSaksi('Satuan Pengawas Internal (SPI) & Bagian Keuangan');
      setFormPelaksanaanLokasi('Gudang TPS Limbah & Aset Afkir RS');
      setFormPelaksanaanKeterangan('Dihancurkan secara fisik dan dicatat dalam register penghapusan BMN.');
    }
    setIsModalOpen(true);
  };

  // Convert Permintaan into Pelaksanaan
  const handleFollowUpPermintaan = (p: PermintaanPemusnahan) => {
    setSubTab('pelaksanaan');
    setFormPelaksanaanIdPermintaan(p.idPermintaan);
    setFormPelaksanaanIdBarang(p.idBarang);
    setFormPelaksanaanMetode('Dihancurkan');
    setFormPelaksanaanPetugas('Tim Penghapusan Aset RSMI');
    setFormPelaksanaanSaksi('Satuan Pengawas Internal (SPI) & IPSRS');
    setFormPelaksanaanLokasi('Area TPS Aset RS Medika Insani');
    setFormPelaksanaanKeterangan(`Tindak lanjut persetujuan pemusnahan ${p.idPermintaan}`);
    setIsModalOpen(true);
  };

  // MAGICAL BUTTON: Ubah Status di Inventaris Ruangan Menjadi "Dimusnahkan"
  const handleUpdateStatusDimusnahkan = (item: PelaksanaanPemusnahan) => {
    const updatedInventaris = inventaris.map(i => {
      if (i.idBarang === item.idBarang) {
        return {
          ...i,
          status: 'Dimusnahkan' as const,
          kondisi: 'Rusak Berat' as const,
          catatan: `Telah dimusnahkan secara resmi via ${item.idPelaksanaan} pada ${item.tanggalPelaksanaan}`,
        };
      }
      return i;
    });

    setInventaris(updatedInventaris);
    dataStorage.saveInventarisRuangan(updatedInventaris);

    const updatedPelaksanaan = pelaksanaanList.map(pel =>
      pel.idPelaksanaan === item.idPelaksanaan ? { ...pel, statusInventarisUpdated: true } : pel
    );
    setPelaksanaanList(updatedPelaksanaan);
    dataStorage.savePelaksanaanPemusnahan(updatedPelaksanaan);

    setSuccessToast(`Aset [${item.idBarang}] ${item.namaBarang} berhasil diubah statusnya menjadi "Dimusnahkan" pada master Data Inventaris Ruangan.`);
    setTimeout(() => setSuccessToast(null), 5000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (subTab === 'permintaan') {
      const target = inventaris.find(i => i.idBarang === formPermintaanIdBarang);
      const nextId = dataStorage.getNextPemusnahanPermintaanId();
      const newPermintaan: PermintaanPemusnahan = {
        idPermintaan: nextId,
        idBarang: formPermintaanIdBarang,
        namaBarang: target?.namaBarang || 'Aset Medis',
        idRuang: target?.idRuang || 'R01',
        tanggalPermintaan: new Date().toISOString().split('T')[0],
        alasan: formPermintaanAlasan.trim(),
        pemohon: formPermintaanPemohon.trim(),
        statusPersetujuan: isAdmin ? 'Disetujui' : 'Menunggu Persetujuan',
      };
      const updated = [newPermintaan, ...permintaanList];
      setPermintaanList(updated);
      dataStorage.savePermintaanPemusnahan(updated);
    } else if (subTab === 'pelaksanaan') {
      const target = inventaris.find(i => i.idBarang === formPelaksanaanIdBarang);
      const nextId = dataStorage.getNextPemusnahanPelaksanaanId();
      const newPelaksanaan: PelaksanaanPemusnahan = {
        idPelaksanaan: nextId,
        idPermintaan: formPelaksanaanIdPermintaan || undefined,
        idBarang: formPelaksanaanIdBarang,
        namaBarang: target?.namaBarang || 'Aset Medis',
        idRuang: target?.idRuang || 'R01',
        tanggalPelaksanaan: new Date().toISOString().split('T')[0],
        metodePemusnahan: formPelaksanaanMetode,
        petugasPelaksana: formPelaksanaanPetugas.trim(),
        saksi: formPelaksanaanSaksi.trim(),
        lokasiPemusnahan: formPelaksanaanLokasi.trim(),
        statusInventarisUpdated: false,
        keterangan: formPelaksanaanKeterangan.trim(),
      };
      const updated = [newPelaksanaan, ...pelaksanaanList];
      setPelaksanaanList(updated);
      dataStorage.savePelaksanaanPemusnahan(updated);

      if (formPelaksanaanIdPermintaan) {
        const updatedPermintaan = permintaanList.map(p =>
          p.idPermintaan === formPelaksanaanIdPermintaan ? { ...p, statusPersetujuan: 'Selesai Dimusnahkan' as const } : p
        );
        setPermintaanList(updatedPermintaan);
        dataStorage.savePermintaanPemusnahan(updatedPermintaan);
      }
    }

    setIsModalOpen(false);
  };

  const handleExportCsv = () => {
    if (subTab === 'permintaan') {
      const headers = ['ID Permintaan', 'ID Barang', 'Nama Barang', 'Ruang', 'Tgl Pengajuan', 'Pemohon', 'Alasan', 'Status'];
      const rows = permintaanList.map(p => [p.idPermintaan, p.idBarang, p.namaBarang, p.idRuang, p.tanggalPermintaan, p.pemohon, p.alasan, p.statusPersetujuan]);
      exportToCsv('Permintaan_Pemusnahan_Aset_RSMI', headers, rows);
    } else {
      const headers = ['ID Pelaksanaan', 'ID Barang', 'Nama Barang', 'Ruang', 'Tgl Eksekusi', 'Metode', 'Petugas', 'Saksi', 'Status Register DIR'];
      const rows = pelaksanaanList.map(pel => [pel.idPelaksanaan, pel.idBarang, pel.namaBarang, pel.idRuang, pel.tanggalPelaksanaan, pel.metodePemusnahan, pel.petugasPelaksana, pel.saksi, pel.statusInventarisUpdated ? 'Dimusnahkan' : 'Belum']);
      exportToCsv('Laporan_Pemusnahan_Aset_RSMI', headers, rows);
    }
  };

  const getSubTabInfo = () => {
    switch (subTab) {
      case 'permintaan':
        return {
          title: 'Usulan Permintaan Pemusnahan Aset',
          subtitle: 'Pengajuan afkir aset inventaris rusak berat/tidak ekonomis diperbaiki dari unit/ruangan RS.',
          addLabel: 'Input Usulan Pemusnahan',
          icon: <FileWarning className="w-5 h-5 text-blue-600" />
        };
      case 'pelaksanaan':
        return {
          title: 'Pelaksanaan & Eksekusi Pemusnahan Aset',
          subtitle: 'Pencatatan eksekusi pemusnahan fisik aset, berita acara saksi, dan update register DIR otomatis.',
          addLabel: 'Input Pelaksanaan',
          icon: <Trash2 className="w-5 h-5 text-blue-600" />
        };
      case 'laporan':
        return {
          title: 'Laporan & Berita Acara Penghapusan Aset (BAP)',
          subtitle: 'Rekapitulasi resmi penghapusan buku aset inventaris RS Medika Insani untuk audit dan neraca.',
          addLabel: 'Input Pemusnahan',
          icon: <FileCheck className="w-5 h-5 text-blue-600" />
        };
    }
  };

  const currentInfo = getSubTabInfo();

  return (
    <div className="space-y-6">
      
      {/* Toast Alert */}
      {successToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs font-medium flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button type="button" onClick={() => setSuccessToast(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
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
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
            )}

            {actionAccess.canPrint && (
              <button
                type="button"
                onClick={() => printDiv('print-pemusnahan-table', `Laporan Pemusnahan Aset RS Medika Insani`)}
                className="px-3 py-1.5 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cetak</span>
              </button>
            )}

            {actionAccess.canCreate && subTab !== 'laporan' && (
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
            placeholder="Cari ID barang, nama alat, petugas eksekutor..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Table Container */}
      <div id="print-pemusnahan-table" className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        
        <div className="hidden print:block p-6 border-b border-slate-300 text-center space-y-1">
          <h2 className="text-xl font-bold text-slate-900">{settings.appName || 'RUMAH SAKIT MEDIKA INSANI'}</h2>
          <p className="text-xs text-slate-600">{settings.appSubtitle || 'Panitia Penghapusan & Pemusnahan Aset Rumah Sakit'}</p>
          {settings.hospitalAddress && (
            <p className="text-[11px] text-slate-500">{settings.hospitalAddress} {settings.hospitalPhone ? `| Telp: ${settings.hospitalPhone}` : ''}</p>
          )}
          <p className="text-sm font-semibold uppercase text-blue-700 pt-2">Laporan Pemusnahan Aset {subTab}</p>
        </div>

        <div className="overflow-x-auto">
          {/* 1. PERMINTAAN PEMUSNAHAN */}
          {subTab === 'permintaan' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">ID Permintaan</th>
                  <th className="py-2.5 px-3">ID & Nama Barang</th>
                  <th className="py-2.5 px-3">Ruangan</th>
                  <th className="py-2.5 px-3">Pemohon & Tanggal</th>
                  <th className="py-2.5 px-3">Alasan Pemusnahan</th>
                  <th className="py-2.5 px-3">Status</th>
                  {isAdmin && <th className="py-2.5 px-3 text-right print:hidden">Tindak Lanjut</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {permintaanList
                  .filter(p => {
                    const q = (searchTerm || '').trim().toLowerCase();
                    const reqId = p.idPermintaan || p.idPemusnahan || p.noUsulan || '';
                    return q === '' || reqId.toLowerCase().includes(q) || (p.namaBarang || '').toLowerCase().includes(q);
                  })
                  .map((p, idx) => {
                    const reqId = p.idPermintaan || p.idPemusnahan || p.noUsulan || `req-${idx}`;
                    const r = ruangList.find(ru => ru.id === p.idRuang);
                    return (
                      <tr key={reqId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-semibold text-blue-700 bg-blue-50/40">
                          {p.idPermintaan || p.idPemusnahan || p.noUsulan}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">{p.namaBarang}</div>
                          <div className="font-mono text-[11px] text-slate-400">{p.idBarang}</div>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">
                          {r?.namaRuang || p.idRuang}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-slate-800">{p.pemohon || p.pengusul}</div>
                          <div className="text-[10px] text-slate-400">{formatDateIndo(p.tanggalPermintaan || p.tanggalPengajuan)}</div>
                        </td>
                        <td className="py-2.5 px-3 max-w-xs text-slate-600">
                          {p.alasan || p.alasanPemusnahan}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            {p.statusPersetujuan}
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="py-2.5 px-3 text-right print:hidden">
                            {p.statusPersetujuan !== 'Selesai Dimusnahkan' && (
                              <button
                                type="button"
                                onClick={() => handleFollowUpPermintaan(p)}
                                className="px-2 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-medium text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <span>Eksekusi</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          )}

          {/* 2. PELAKSANAAN PEMUSNAHAN + TOMBOL UBAH STATUS INVENTARIS */}
          {subTab === 'pelaksanaan' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">ID Pelaksanaan</th>
                  <th className="py-2.5 px-3">ID & Nama Barang</th>
                  <th className="py-2.5 px-3">Metode Pemusnahan</th>
                  <th className="py-2.5 px-3">Petugas & Saksi SPI</th>
                  <th className="py-2.5 px-3">Tanggal & Lokasi</th>
                  <th className="py-2.5 px-3">Status di DIR</th>
                  <th className="py-2.5 px-3 text-right print:hidden">Aksi & Berita Acara</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {pelaksanaanList
                  .filter(pel => {
                    const q = (searchTerm || '').trim().toLowerCase();
                    const pelId = pel.idPelaksanaan || pel.idPemusnahan || '';
                    return q === '' || pelId.toLowerCase().includes(q) || (pel.namaBarang || '').toLowerCase().includes(q);
                  })
                  .map((pel, idx) => {
                    const pelKey = pel.idPelaksanaan || pel.idPemusnahan || `pel-${idx}`;
                    return (
                      <tr key={pelKey} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-semibold text-blue-700 bg-blue-50/40">
                          {pel.idPelaksanaan}
                          {pel.idPermintaan && (
                            <div className="text-[10px] text-slate-400 font-sans">Ref: {pel.idPermintaan}</div>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">{pel.namaBarang}</div>
                          <div className="font-mono text-[11px] text-slate-400">{pel.idBarang}</div>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            {pel.metodePemusnahan}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-slate-800">{pel.petugasPelaksana}</div>
                          <div className="text-[10px] text-slate-400">Saksi: {pel.saksi}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-slate-800">{formatDateIndo(pel.tanggalPelaksanaan)}</div>
                          <div className="text-[10px] text-slate-400">{pel.lokasiPemusnahan}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          {pel.statusInventarisUpdated ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Dimusnahkan di DIR</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                              <AlertOctagon className="w-3 h-3 text-amber-600" />
                              <span>Belum Diupdate</span>
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right print:hidden">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setActiveBaPrint(pel)}
                              className="px-2 py-1 rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                              title="Cetak Berita Acara Pemusnahan"
                            >
                              <Printer className="w-3 h-3 text-blue-600" />
                              <span>Cetak BA</span>
                            </button>

                            {/* MAGICAL BUTTON TO UPDATE STATUS IN INVENTARIS RUANGAN */}
                            {!pel.statusInventarisUpdated && (
                              <button
                                type="button"
                                onClick={() => handleUpdateStatusDimusnahkan(pel)}
                                className="px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-medium text-[11px] inline-flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
                                title="Ubah status inventaris di ruangan menjadi Dimusnahkan"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Update Status DIR</span>
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

          {/* 3. LAPORAN PEMUSNAHAN SUMMARY */}
          {subTab === 'laporan' && (
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Aset Dimusnahkan</span>
                  <div className="text-xl font-bold text-slate-900 mt-1">{pelaksanaanList.length} Unit</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Telah memiliki Berita Acara Resmi</div>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Status Register Terupdate</span>
                  <div className="text-xl font-bold text-emerald-600 mt-1">
                    {pelaksanaanList.filter(p => p.statusInventarisUpdated).length} Unit
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Tercatat afkir di Data Inventaris Ruangan</div>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Metode Dominan</span>
                  <div className="text-lg font-bold text-slate-800 mt-1">Dihancurkan Fisik</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Sesuai SOP Penghapusan BMN Kemenkes</div>
                </div>
              </div>

              {/* Aggregated List by Room and Category */}
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold">
                    <th className="py-2.5 px-3">ID Barang Aset (Otomatis)</th>
                    <th className="py-2.5 px-3">Nama Barang</th>
                    <th className="py-2.5 px-3">Kategori & Jenis</th>
                    <th className="py-2.5 px-3">Ruang Asal</th>
                    <th className="py-2.5 px-3">Tanggal Dimusnahkan</th>
                    <th className="py-2.5 px-3">Metode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {pelaksanaanList.map((pel, idx) => {
                    const pelKey = pel.idPelaksanaan || pel.idPemusnahan || `lap-${idx}`;
                    const r = ruangList.find(ru => ru.id === pel.idRuang);
                    return (
                      <tr key={pelKey} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-mono font-semibold text-blue-700">{pel.idBarang}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{pel.namaBarang}</td>
                        <td className="py-2.5 px-3 text-slate-600">Alat Kesehatan / Diagnostik</td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{r?.namaRuang || pel.idRuang}</td>
                        <td className="py-2.5 px-3">{formatDateIndo(pel.tanggalPelaksanaan)}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            {pel.metodePemusnahan}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-xl w-full p-5 shadow-xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Flame className="w-4 h-4 text-blue-600" />
                <span>
                  {subTab === 'permintaan' ? 'Form Permintaan Pemusnahan Aset' : 'Form Berita Acara Eksekusi Pemusnahan'}
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
              
              {subTab === 'permintaan' && (
                <>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Pilih Peralatan Rusak Berat / Afkir *</label>
                    <select
                      value={formPermintaanIdBarang}
                      onChange={e => setFormPermintaanIdBarang(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-white font-medium text-slate-800 focus:ring-1 focus:ring-blue-500"
                    >
                      {inventaris.map((i, idx) => (
                        <option key={i.idBarang || `inv-req-opt-${idx}`} value={i.idBarang}>
                          [{i.idBarang}] {i.namaBarang} (Kondisi: {i.kondisi})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Nama Pejabat / Petugas Pemohon</label>
                    <input
                      type="text"
                      required
                      value={formPermintaanPemohon}
                      onChange={e => setFormPermintaanPemohon(e.target.value)}
                      placeholder="Kepala Instalasi IPSRS..."
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Alasan Teknis & Pertimbangan Pemusnahan</label>
                    <textarea
                      rows={3}
                      required
                      value={formPermintaanAlasan}
                      onChange={e => setFormPermintaanAlasan(e.target.value)}
                      placeholder="e.g. Kerusakan sirkuit modul utama, biaya reparasi >70% harga baru, suku cadang sudah obsolete..."
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {subTab === 'pelaksanaan' && (
                <>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Aset yang Dimusnahkan *</label>
                    <select
                      value={formPelaksanaanIdBarang}
                      onChange={e => setFormPelaksanaanIdBarang(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-white font-medium text-slate-800 focus:ring-1 focus:ring-blue-500"
                    >
                      {inventaris.map((i, idx) => (
                        <option key={i.idBarang || `inv-pel-opt-${idx}`} value={i.idBarang}>
                          [{i.idBarang}] {i.namaBarang}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Metode Pemusnahan</label>
                      <select
                        value={formPelaksanaanMetode}
                        onChange={e => setFormPelaksanaanMetode(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-white font-medium focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="Dihancurkan">Dihancurkan Fisik</option>
                        <option value="Dibakar">Dibakar di Insenerator</option>
                        <option value="Dilelang">Dilelang Aset</option>
                        <option value="Dihibahkan">Dihibahkan</option>
                        <option value="Diserahkan ke Pihak Ketiga">Diserahkan ke Pengolah B3</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Lokasi Eksekusi</label>
                      <input
                        type="text"
                        required
                        value={formPelaksanaanLokasi}
                        onChange={e => setFormPelaksanaanLokasi(e.target.value)}
                        placeholder="TPS Aset Afkir RS..."
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Petugas Pelaksana</label>
                      <input
                        type="text"
                        required
                        value={formPelaksanaanPetugas}
                        onChange={e => setFormPelaksanaanPetugas(e.target.value)}
                        placeholder="Panitia Pemusnahan Aset..."
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Saksi-saksi Resmi</label>
                      <input
                        type="text"
                        required
                        value={formPelaksanaanSaksi}
                        onChange={e => setFormPelaksanaanSaksi(e.target.value)}
                        placeholder="SPI, Bagian Umum & IPSRS..."
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Keterangan / Berita Acara</label>
                    <textarea
                      rows={2}
                      value={formPelaksanaanKeterangan}
                      onChange={e => setFormPelaksanaanKeterangan(e.target.value)}
                      placeholder="Catatan proses penghancuran..."
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

      {/* PRINT BERITA ACARA PEMUSNAHAN MODAL */}
      {activeBaPrint && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-5 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Berita Acara Pemusnahan Aset Resmi</h3>
              <button
                type="button"
                onClick={() => setActiveBaPrint(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div id="printable-ba-pemusnahan" className="p-6 border border-slate-300 rounded-lg bg-white text-slate-900 space-y-4">
              
              {/* Kop Surat & Judul Dokumen BA Pemusnahan */}
              <DocumentHeader
                settings={settings}
                title="BERITA ACARA PEMUSNAHAN BARANG INVENTARIS"
                documentNumber={`Nomor: ${activeBaPrint.idPelaksanaan}/BA-MUSNAH/${settings.systemShortName || 'RSMI'}/${new Date().getFullYear()}`}
                unitName="Panitia Penghapusan & Pemusnahan Barang Milik Rumah Sakit"
              />

              <p className="text-xs text-slate-700 leading-relaxed">
                Pada hari ini <b>{formatDateIndo(activeBaPrint.tanggalPelaksanaan)}</b> bertempat di <b>{activeBaPrint.lokasiPemusnahan}</b>, telah dilaksanakan tindakan pemusnahan / penghapusan fisik barang inventaris dengan rincian sebagai berikut:
              </p>

              <table className="w-full text-xs border border-slate-300 text-left">
                <tbody>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-slate-800 w-1/3">Nama Barang / Aset</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">{activeBaPrint.namaBarang}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-2 px-3 font-semibold text-slate-800">ID Inventaris (QR)</td>
                    <td className="py-2 px-3 font-mono font-semibold text-blue-700">{activeBaPrint.idBarang}</td>
                  </tr>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-slate-800">Ruangan Asal</td>
                    <td className="py-2 px-3 text-slate-800">{ruangList.find(r => r.id === activeBaPrint.idRuang)?.namaRuang || activeBaPrint.idRuang}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-2 px-3 font-semibold text-slate-800">Metode Pemusnahan</td>
                    <td className="py-2 px-3 font-medium text-slate-800">{activeBaPrint.metodePemusnahan}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold text-slate-800">Keterangan Pelaksanaan</td>
                    <td className="py-2 px-3 text-slate-700">{activeBaPrint.keterangan}</td>
                  </tr>
                </tbody>
              </table>

              {/* Tanda Tangan QR TTE Pemusnahan */}
              <div className="pt-4 border-t border-slate-200">
                <div className="grid grid-cols-2 gap-6 text-center">
                  <QrSignature
                    role="Panitia Pelaksana Pemusnahan"
                    name={activeBaPrint.petugasPelaksana || 'Petugas IPSRS/Logistik'}
                    docName="Berita Acara Pemusnahan Aset"
                    docNumber={`${activeBaPrint.idPelaksanaan}/BA-MUSNAH`}
                    hospitalName={settings.appName}
                    date={formatDateIndo(activeBaPrint.tanggalPelaksanaan)}
                  />

                  <QrSignature
                    role="Saksi Satuan Pengawas Internal (SPI)"
                    name={activeBaPrint.saksi || 'Auditor SPI Rumah Sakit'}
                    docName="Berita Acara Pemusnahan Aset"
                    docNumber={`${activeBaPrint.idPelaksanaan}/BA-MUSNAH`}
                    hospitalName={settings.appName}
                    date={formatDateIndo(activeBaPrint.tanggalPelaksanaan)}
                  />
                </div>
              </div>

              <div className="pt-2 text-center text-[10px] text-slate-400 border-t border-slate-100">
                Dokumen Berita Acara Pemusnahan ini sah dan diarsipkan dalam Sistem Informasi ({settings.systemShortName || 'SIMBARS'}) {settings.appName || 'RS Medika Insani'}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveBaPrint(null)}
                className="px-3.5 py-1.5 rounded-md border border-slate-200 text-slate-600 font-medium text-xs hover:bg-slate-50 cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => printDiv('printable-ba-pemusnahan', `BA-Pemusnahan-${activeBaPrint.idPelaksanaan}`)}
                className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Berita Acara</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
