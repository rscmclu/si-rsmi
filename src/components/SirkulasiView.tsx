import React, { useState } from 'react';
import { 
  SirkulasiInventaris, 
  InventarisRuangan, 
  RuangInventaris, 
  ActionPermission,
  AppSettings,
  UserAccount
} from '../types/inventory';
import { dataStorage } from '../services/dataStorage';
import { formatDateIndo, exportToCsv, printDiv } from '../utils/formatters';
import { DocumentHeader } from './DocumentHeader';
import { QrSignature } from './QrSignature';
import { 
  ArrowLeftRight, 
  Plus, 
  Search, 
  Printer, 
  Download, 
  X, 
  CheckCircle2, 
  FileText, 
  DoorOpen, 
  User, 
  Calendar,
  AlertCircle
} from 'lucide-react';

interface SirkulasiViewProps {
  actionAccess: ActionPermission;
  appSettings?: AppSettings;
  currentUser?: UserAccount | null;
}

export const SirkulasiView: React.FC<SirkulasiViewProps> = ({ 
  actionAccess,
  appSettings: propAppSettings,
  currentUser: propCurrentUser,
}) => {
  const settings = propAppSettings || dataStorage.getAppSettings();
  const currentUser = propCurrentUser || dataStorage.getCurrentUser();
  const isAdmin = currentUser?.role === 'Super Admin' || 
    currentUser?.role?.toLowerCase().includes('admin') || 
    currentUser?.username?.toLowerCase() === 'admin';

  const [sirkulasiList, setSirkulasiList] = useState<SirkulasiInventaris[]>(dataStorage.getSirkulasi());
  const [inventaris, setInventaris] = useState<InventarisRuangan[]>(dataStorage.getInventarisRuangan());
  const [ruangList] = useState<RuangInventaris[]>(dataStorage.getRuang());

  const [searchTerm, setSearchTerm] = useState('');
  const [filterTindakLanjut, setFilterTindakLanjut] = useState<'Semua' | 'Diajukan' | 'Disetujui' | 'Tidak Disetujui' | 'Dimutasikan'>('Semua');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activePrintItem, setActivePrintItem] = useState<SirkulasiInventaris | null>(null);

  // Form states
  const [formIdBarang, setFormIdBarang] = useState(inventaris[0]?.idBarang || '');
  const [formIdRuangTujuan, setFormIdRuangTujuan] = useState(ruangList[1]?.id || 'R02');
  const [formTanggal, setFormTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [formPenyerah, setFormPenyerah] = useState('');
  const [formPenerima, setFormPenerima] = useState('');
  const [formAlasan, setFormAlasan] = useState('');
  const [formKondisi, setFormKondisi] = useState<'Baik' | 'Rusak Ringan'>('Baik');
  const [formTindakLanjut, setFormTindakLanjut] = useState<'Diajukan' | 'Disetujui' | 'Tidak Disetujui' | 'Dimutasikan'>(isAdmin ? 'Dimutasikan' : 'Diajukan');

  const [formError, setFormError] = useState<string | null>(null);

  // Selected asset metadata
  const selectedAsset = inventaris.find(i => i.idBarang === formIdBarang);
  const formIdRuangAsal = selectedAsset?.idRuang || '';

  const openCreateModal = () => {
    setFormError(null);
    const firstAsset = inventaris[0];
    if (firstAsset) {
      setFormIdBarang(firstAsset.idBarang);
      const otherRoom = ruangList.find(r => r.id !== firstAsset.idRuang)?.id || 'R02';
      setFormIdRuangTujuan(otherRoom);
    }
    setFormTanggal(new Date().toISOString().split('T')[0]);
    setFormPenyerah(currentUser?.namaLengkap || '');
    setFormPenerima('');
    setFormAlasan('Kebutuhan operasional / rotasi unit alat medis');
    setFormKondisi('Baik');
    // Selain user admin maka otomatis terisi Diajukan
    setFormTindakLanjut(isAdmin ? 'Dimutasikan' : 'Diajukan');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;

    if (formIdRuangAsal === formIdRuangTujuan) {
      setFormError('Ruangan tujuan harus berbeda dari ruangan asal saat ini!');
      return;
    }
    setFormError(null);

    // Selain user admin maka otomatis terisi Diajukan
    const finalTindakLanjut = isAdmin ? formTindakLanjut : 'Diajukan';

    const nextId = dataStorage.getNextSirkulasiId();
    const newEntry: SirkulasiInventaris = {
      idSirkulasi: nextId,
      idBarang: formIdBarang,
      namaBarang: selectedAsset.namaBarang,
      idRuangAsal: formIdRuangAsal,
      idRuangTujuan: formIdRuangTujuan,
      tanggal: formTanggal,
      penanggungJawab: formPenyerah.trim() || currentUser?.namaLengkap || 'Petugas Ruangan Asal',
      penerima: formPenerima.trim() || 'Petugas Ruangan Tujuan',
      alasan: formAlasan.trim(),
      tindakLanjut: finalTindakLanjut,
      kondisiSaatMutasi: formKondisi,
      status: finalTindakLanjut === 'Tidak Disetujui' ? 'Dibatalkan' : finalTindakLanjut === 'Dimutasikan' ? 'Selesai' : 'Dalam Pengiriman',
      keterangan: `Mutasi aset dari ${formIdRuangAsal} ke ${formIdRuangTujuan}`,
    };

    // Update sirkulasi storage
    const updatedSirkulasi = [newEntry, ...sirkulasiList];
    setSirkulasiList(updatedSirkulasi);
    dataStorage.saveSirkulasi(updatedSirkulasi);

    // Automatically update the asset's current room in inventaris ruangan ONLY if status is Dimutasikan
    if (finalTindakLanjut === 'Dimutasikan') {
      const updatedInventaris = inventaris.map(item => {
        if (item.idBarang === formIdBarang) {
          return {
            ...item,
            idRuang: formIdRuangTujuan,
            catatan: `Dimutasi dari ${formIdRuangAsal} pada ${formTanggal}`,
          };
        }
        return item;
      });
      setInventaris(updatedInventaris);
      dataStorage.saveInventarisRuangan(updatedInventaris);
    }

    setIsModalOpen(false);
  };

  const handleUpdateTindakLanjut = (idSirkulasi: string, newStatus: 'Diajukan' | 'Disetujui' | 'Tidak Disetujui' | 'Dimutasikan') => {
    const targetItem = sirkulasiList.find(s => s.idSirkulasi === idSirkulasi);
    if (!targetItem) return;

    const updatedSirkulasi = sirkulasiList.map(s => {
      if (s.idSirkulasi === idSirkulasi) {
        return {
          ...s,
          tindakLanjut: newStatus,
          status: newStatus === 'Tidak Disetujui' ? 'Dibatalkan' : newStatus === 'Dimutasikan' ? 'Selesai' : 'Dalam Pengiriman',
        };
      }
      return s;
    });
    setSirkulasiList(updatedSirkulasi);
    dataStorage.saveSirkulasi(updatedSirkulasi);

    // If marked as Dimutasikan, automatically move the asset room
    if (newStatus === 'Dimutasikan' && targetItem.idRuangTujuan) {
      const updatedInventaris = inventaris.map(item => {
        if (item.idBarang === targetItem.idBarang) {
          return {
            ...item,
            idRuang: targetItem.idRuangTujuan || item.idRuang,
            catatan: `Dimutasi dari ${targetItem.idRuangAsal || item.idRuang} pada ${targetItem.tanggal}`,
          };
        }
        return item;
      });
      setInventaris(updatedInventaris);
      dataStorage.saveInventarisRuangan(updatedInventaris);
    }
  };

  const query = (searchTerm || '').trim().toLowerCase();
  const filteredList = sirkulasiList.filter(item => {
    const matchesSearch = query === '' ||
      (item.idSirkulasi || '').toLowerCase().includes(query) ||
      (item.idBarang || '').toLowerCase().includes(query) ||
      (item.namaBarang || '').toLowerCase().includes(query) ||
      (item.penanggungJawab || '').toLowerCase().includes(query) ||
      (item.penerima || '').toLowerCase().includes(query) ||
      (item.alasan || '').toLowerCase().includes(query) ||
      (item.tindakLanjut || '').toLowerCase().includes(query);

    const matchesFilter = filterTindakLanjut === 'Semua' || (item.tindakLanjut || 'Dimutasikan') === filterTindakLanjut;

    return matchesSearch && matchesFilter;
  });

  const handleExportCsv = () => {
    const headers = [
      'No Surat Mutasi', 'ID Barang', 'Nama Barang', 'Ruang Asal', 'Ruang Tujuan', 'Tanggal Mutasi',
      'Penyerah', 'Penerima', 'Alasan Mutasi', 'Tindak Lanjut', 'Kondisi', 'Status'
    ];
    const rows = filteredList.map(s => [
      s.idSirkulasi, s.idBarang, s.namaBarang, s.idRuangAsal, s.idRuangTujuan, s.tanggal,
      s.penanggungJawab, s.penerima, s.alasan, s.tindakLanjut || 'Dimutasikan', s.kondisiSaatMutasi, s.status
    ]);
    exportToCsv('Laporan_Sirkulasi_Mutasi_Aset_RSMI', headers, rows);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-blue-600" />
              <span>2.c. Sirkulasi & Distribusi Inventaris Antar Ruangan</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola pencatatan perpindahan/mutasi alat medis dan barang inventaris antar instalasi/ruangan. Sistem secara otomatis memperbarui lokasi aset dan mencetak Surat Jalan Mutasi Resmi.
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

            {actionAccess.canCreate && (
              <button
                type="button"
                onClick={openCreateModal}
                className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Input Mutasi Barang Baru</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Cari No Mutasi, ID Barang, Nama, Petugas..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium whitespace-nowrap">Filter Tindak Lanjut:</span>
            <select
              value={filterTindakLanjut}
              onChange={e => setFilterTindakLanjut(e.target.value as any)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="Semua">Semua Status</option>
              <option value="Diajukan">Diajukan</option>
              <option value="Disetujui">Disetujui</option>
              <option value="Tidak Disetujui">Tidak Disetujui</option>
              <option value="Dimutasikan">Dimutasikan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table List */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">No Surat Mutasi</th>
                <th className="py-2.5 px-3">ID & Nama Barang</th>
                <th className="py-2.5 px-3">Ruang Asal</th>
                <th className="py-2.5 px-3">Ruang Tujuan</th>
                <th className="py-2.5 px-3">Tanggal & Penanggung Jawab</th>
                <th className="py-2.5 px-3">Penerima</th>
                <th className="py-2.5 px-3">Alasan Mutasi</th>
                <th className="py-2.5 px-3">Tindak Lanjut</th>
                <th className="py-2.5 px-3 text-right">Surat Jalan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                    Belum ada riwayat mutasi / sirkulasi barang.
                  </td>
                </tr>
              ) : (
                filteredList.map(s => {
                  const asal = ruangList.find(r => r.id === s.idRuangAsal);
                  const tujuan = ruangList.find(r => r.id === s.idRuangTujuan);
                  const tindakLanjutVal = s.tindakLanjut || 'Dimutasikan';

                  return (
                    <tr key={s.idSirkulasi} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-semibold text-blue-700 bg-blue-50/40">
                        {s.idSirkulasi}
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{s.namaBarang}</div>
                        <div className="font-mono text-[11px] text-slate-400">{s.idBarang}</div>
                      </td>

                      <td className="py-2.5 px-3">
                        <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px] border border-slate-200">
                          {asal?.namaRuang || s.idRuangAsal}
                        </span>
                      </td>

                      <td className="py-2.5 px-3">
                        <span className="font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px] border border-blue-200">
                          {tujuan?.namaRuang || s.idRuangTujuan}
                        </span>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-900">{formatDateIndo(s.tanggal)}</div>
                        <div className="text-[10px] text-slate-400">Oleh: {s.penanggungJawab}</div>
                      </td>

                      <td className="py-2.5 px-3 font-medium text-slate-700">
                        {s.penerima}
                      </td>

                      <td className="py-2.5 px-3 text-slate-600 max-w-xs">
                        {s.alasan}
                      </td>

                      <td className="py-2.5 px-3">
                        {isAdmin && actionAccess.canEdit ? (
                          <select
                            value={tindakLanjutVal}
                            onChange={(e) => handleUpdateTindakLanjut(s.idSirkulasi, e.target.value as any)}
                            className={`px-2 py-1 rounded text-xs font-semibold border cursor-pointer focus:outline-none focus:ring-1 transition-all ${
                              tindakLanjutVal === 'Diajukan'
                                ? 'bg-amber-50 text-amber-700 border-amber-300 focus:ring-amber-400'
                                : tindakLanjutVal === 'Disetujui'
                                ? 'bg-blue-50 text-blue-700 border-blue-300 focus:ring-blue-400'
                                : tindakLanjutVal === 'Tidak Disetujui'
                                ? 'bg-rose-50 text-rose-700 border-rose-300 focus:ring-rose-400'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-300 focus:ring-emerald-400'
                            }`}
                          >
                            <option value="Diajukan" className="bg-white text-slate-800 font-medium">Diajukan</option>
                            <option value="Disetujui" className="bg-white text-slate-800 font-medium">Disetujui</option>
                            <option value="Tidak Disetujui" className="bg-white text-slate-800 font-medium">Tidak Disetujui</option>
                            <option value="Dimutasikan" className="bg-white text-slate-800 font-medium">Dimutasikan</option>
                          </select>
                        ) : (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${
                              tindakLanjutVal === 'Diajukan'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : tindakLanjutVal === 'Disetujui'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : tindakLanjutVal === 'Tidak Disetujui'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                            title={isAdmin ? undefined : 'Hanya Administrator yang dapat mengubah status Tindak Lanjut'}
                          >
                            {tindakLanjutVal}
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => setActivePrintItem(s)}
                          className="px-2 py-1 rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                          title="Cetak Surat Jalan Mutasi"
                        >
                          <Printer className="w-3.5 h-3.5 text-blue-600" />
                          <span>Surat Jalan</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MUTASI MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-5 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-blue-600" />
                <span>Form Entri Distribusi / Mutasi Barang</span>
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
              {formError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              
              {/* Asset Selector */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">Pilih Barang yang Dimutasi *</label>
                <select
                  value={formIdBarang}
                  onChange={e => setFormIdBarang(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-white font-medium text-slate-800 focus:ring-1 focus:ring-blue-500"
                >
                  {inventaris.map(i => {
                    const r = ruangList.find(ru => ru.id === i.idRuang);
                    return (
                      <option key={i.idBarang} value={i.idBarang}>
                        [{i.idBarang}] {i.namaBarang} (Saat ini di: {r?.namaRuang || i.idRuang})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Origin and Destination Preview */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase">Ruangan Asal (Otomatis)</label>
                  <div className="font-semibold text-slate-900 mt-1">
                    {ruangList.find(r => r.id === formIdRuangAsal)?.namaRuang || formIdRuangAsal}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-blue-700 uppercase">Pilih Ruang Tujuan *</label>
                  <select
                    value={formIdRuangTujuan}
                    onChange={e => setFormIdRuangTujuan(e.target.value)}
                    className="w-full mt-1 px-2 py-1 rounded-md border border-blue-300 bg-white font-medium text-blue-900 focus:ring-1 focus:ring-blue-500"
                  >
                    {ruangList
                      .filter(r => r.id !== formIdRuangAsal)
                      .map(r => (
                        <option key={r.id} value={r.id}>[{r.id}] {r.namaRuang}</option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Tanggal & Kondisi */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Tanggal Mutasi</label>
                  <input
                    type="date"
                    required
                    value={formTanggal}
                    onChange={e => setFormTanggal(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Kondisi Fisik Saat Mutasi</label>
                  <select
                    value={formKondisi}
                    onChange={e => setFormKondisi(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-white focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Baik">Baik & Lengkap</option>
                    <option value="Rusak Ringan">Rusak Ringan (Perlu Kalibrasi)</option>
                  </select>
                </div>
              </div>

              {/* Penyerah & Penerima */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Nama Petugas Penyerah (Asal)</label>
                  <input
                    type="text"
                    required
                    value={formPenyerah}
                    onChange={e => setFormPenyerah(e.target.value)}
                    placeholder="Nama perawat / petugas..."
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Nama Petugas Penerima (Tujuan)</label>
                  <input
                    type="text"
                    required
                    value={formPenerima}
                    onChange={e => setFormPenerima(e.target.value)}
                    placeholder="Nama perawat penerima..."
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Alasan */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">Alasan Distribusi / Mutasi</label>
                <textarea
                  rows={2}
                  required
                  value={formAlasan}
                  onChange={e => setFormAlasan(e.target.value)}
                  placeholder="Kebutuhan pasien darurat / rotasi berkala unit..."
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Tindak Lanjut */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">Tindak Lanjut Mutasi *</label>
                {isAdmin ? (
                  <>
                    <select
                      value={formTindakLanjut}
                      onChange={e => setFormTindakLanjut(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-white font-medium text-slate-800 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Diajukan">Diajukan (Pengajuan Mutasi)</option>
                      <option value="Disetujui">Disetujui (Disetujui Mutasi)</option>
                      <option value="Tidak Disetujui">Tidak Disetujui (Ditolak / Dibatalkan)</option>
                      <option value="Dimutasikan">Dimutasikan (Langsung Pindah Lokasi)</option>
                    </select>
                    <p className="text-[11px] text-slate-500 mt-1">
                      *Pilihan <b>Dimutasikan</b> akan secara otomatis memperbarui lokasi ruangan aset di master Data Inventaris Ruangan.
                    </p>
                  </>
                ) : (
                  <div className="p-2.5 rounded-md bg-amber-50/70 border border-amber-200 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded font-bold text-amber-800 bg-amber-100 border border-amber-300">
                        Diajukan
                      </span>
                      <span className="text-amber-900 font-medium">
                        (Otomatis terisi Diajukan)
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-700 mt-1">
                      *Selain user Admin, pengajuan mutasi barang antar ruangan akan otomatis berstatus <b>Diajukan</b> untuk diverifikasi dan disetujui oleh Administrator / IPSRS.
                    </p>
                  </div>
                )}
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
                  {isAdmin ? 'Simpan & Proses Mutasi' : 'Kirim Pengajuan Mutasi'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* PRINT SURAT JALAN MUTASI MODAL */}
      {activePrintItem && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-5 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Surat Jalan Mutasi Barang Resmi</h3>
              <button
                type="button"
                onClick={() => setActivePrintItem(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Document Box */}
            <div id="printable-surat-jalan" className="p-6 border border-slate-300 rounded-lg bg-white text-slate-900 space-y-4">
              
              {/* Kop Surat & Judul Dokumen Resmi Terstandarisasi */}
              <DocumentHeader
                settings={settings}
                title="SURAT JALAN & BERITA ACARA MUTASI INVENTARIS"
                documentNumber={`Nomor: ${activePrintItem.idSirkulasi}/BA-MUTASI/${settings.systemShortName || 'RSMI'}/${new Date().getFullYear()}`}
                unitName="Instalasi Pemeliharaan Sarana Rumah Sakit (IPSRS) & Logistik"
              />

              {/* Statement */}
              <p className="text-xs text-slate-700 leading-relaxed">
                Pada hari ini <b>{formatDateIndo(activePrintItem.tanggal)}</b>, telah dilakukan serah terima perpindahan/distribusi barang inventaris rumah sakit sebagai berikut:
              </p>

              {/* Asset Specs Table */}
              <table className="w-full text-xs border border-slate-300 text-left">
                <tbody>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-slate-800 w-1/3">Nama Barang / Aset</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">{activePrintItem.namaBarang}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-2 px-3 font-semibold text-slate-800">ID Inventaris (QR)</td>
                    <td className="py-2 px-3 font-mono font-semibold text-blue-700">{activePrintItem.idBarang}</td>
                  </tr>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-slate-800">Ruangan Asal</td>
                    <td className="py-2 px-3 text-slate-800">{ruangList.find(r => r.id === activePrintItem.idRuangAsal)?.namaRuang || activePrintItem.idRuangAsal}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-2 px-3 font-semibold text-slate-800">Ruangan Tujuan</td>
                    <td className="py-2 px-3 font-semibold text-blue-700">{ruangList.find(r => r.id === activePrintItem.idRuangTujuan)?.namaRuang || activePrintItem.idRuangTujuan}</td>
                  </tr>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-slate-800">Kondisi Fisik</td>
                    <td className="py-2 px-3 text-slate-800">{activePrintItem.kondisiSaatMutasi}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-2 px-3 font-semibold text-slate-800">Alasan Perpindahan</td>
                    <td className="py-2 px-3 text-slate-700">{activePrintItem.alasan}</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-slate-800">Tindak Lanjut</td>
                    <td className="py-2 px-3 font-bold text-slate-900">
                      <span className="px-2 py-0.5 rounded text-xs bg-slate-200 border border-slate-300">
                        {activePrintItem.tindakLanjut || 'Dimutasikan'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Signatures with QR Code TTE */}
              <div className="pt-4 border-t border-slate-200">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
                  <QrSignature
                    role="Yang Menyerahkan (Ruang Asal)"
                    name={activePrintItem.penanggungJawab || 'Petugas Ruang Asal'}
                    docName="Surat Jalan Mutasi Inventaris"
                    docNumber={`${activePrintItem.idSirkulasi}/BA-MUTASI`}
                    hospitalName={settings.appName}
                    date={formatDateIndo(activePrintItem.tanggal)}
                  />

                  <QrSignature
                    role="Yang Menerima (Ruang Tujuan)"
                    name={activePrintItem.penerima || 'Petugas Ruang Tujuan'}
                    docName="Surat Jalan Mutasi Inventaris"
                    docNumber={`${activePrintItem.idSirkulasi}/BA-MUTASI`}
                    hospitalName={settings.appName}
                    date={formatDateIndo(activePrintItem.tanggal)}
                  />

                  <div className="col-span-2 sm:col-span-1">
                    <QrSignature
                      role="Mengetahui, Ka. Instalasi IPSRS"
                      name="Ir. H. Rahardian, MT"
                      nip="19820315 200804 1 002"
                      docName="Surat Jalan Mutasi Inventaris"
                      docNumber={`${activePrintItem.idSirkulasi}/BA-MUTASI`}
                      hospitalName={settings.appName}
                      date={formatDateIndo(activePrintItem.tanggal)}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 text-center text-[10px] text-slate-400 border-t border-slate-100">
                Dokumen ini sah dan diterbitkan secara digital oleh Sistem Informasi Inventaris ({settings.systemShortName || 'SIMBARS'}) {settings.appName || 'RS Medika Insani'}
              </div>

            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActivePrintItem(null)}
                className="px-3.5 py-1.5 rounded-md border border-slate-200 text-slate-600 font-medium text-xs hover:bg-slate-50 cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => printDiv('printable-surat-jalan', `Surat Jalan Mutasi - ${activePrintItem.idSirkulasi}`)}
                className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Surat Jalan</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
