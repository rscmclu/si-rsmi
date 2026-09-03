import React, { useState, useEffect } from 'react';
import { 
  JenisInventaris, 
  KategoriInventaris, 
  MerkInventaris, 
  RuangInventaris, 
  SupplierInventaris,
  ActionPermission,
  MasterSubTab,
  MasterInventarisViewProps
} from '../types/inventory';
import { dataStorage } from '../services/dataStorage';
import { exportToCsv, exportToJson, printDiv } from '../utils/formatters';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Download, 
  Printer, 
  Tag, 
  Bookmark, 
  Building, 
  DoorOpen, 
  Truck, 
  Check, 
  X, 
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';

export const MasterInventarisView: React.FC<MasterInventarisViewProps> = ({
  initialSubTab = 'jenis',
  actionAccess,
}) => {
  const [subTab, setSubTab] = useState<MasterSubTab>(initialSubTab);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setSubTab(initialSubTab);
    setSearchTerm('');
  }, [initialSubTab]);

  // Data states
  const [jenisList, setJenisList] = useState<JenisInventaris[]>(dataStorage.getJenis());
  const [kategoriList, setKategoriList] = useState<KategoriInventaris[]>(dataStorage.getKategori());
  const [merkList, setMerkList] = useState<MerkInventaris[]>(dataStorage.getMerk());
  const [ruangList, setRuangList] = useState<RuangInventaris[]>(dataStorage.getRuang());
  const [supplierList, setSupplierList] = useState<SupplierInventaris[]>(dataStorage.getSupplier());

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<any>(null);

  // Form fields
  // Jenis form
  const [formJenisId, setFormJenisId] = useState('');
  const [formJenisNama, setFormJenisNama] = useState('');
  const [formJenisDeskripsi, setFormJenisDeskripsi] = useState('');

  // Kategori form
  const [formKategoriId, setFormKategoriId] = useState('');
  const [formKategoriNama, setFormKategoriNama] = useState('');
  const [formKategoriKelompok, setFormKategoriKelompok] = useState<KategoriInventaris['kelompok']>('Medis');

  // Merk form
  const [formMerkId, setFormMerkId] = useState('');
  const [formMerkNama, setFormMerkNama] = useState('');
  const [formMerkNegara, setFormMerkNegara] = useState('');
  const [formMerkKeterangan, setFormMerkKeterangan] = useState('');

  // Ruang form
  const [formRuangId, setFormRuangId] = useState('');
  const [formRuangNama, setFormRuangNama] = useState('');
  const [formRuangGedung, setFormRuangGedung] = useState('');
  const [formRuangPJ, setFormRuangPJ] = useState('');
  const [formRuangKontak, setFormRuangKontak] = useState('');

  // Supplier form
  const [formSupplierId, setFormSupplierId] = useState('');
  const [formSupplierNama, setFormSupplierNama] = useState('');
  const [formSupplierAlamat, setFormSupplierAlamat] = useState('');
  const [formSupplierTelepon, setFormSupplierTelepon] = useState('');
  const [formSupplierEmail, setFormSupplierEmail] = useState('');
  const [formSupplierPIC, setFormSupplierPIC] = useState('');

  const openCreateModal = () => {
    setModalMode('create');
    setEditingItem(null);

    if (subTab === 'jenis') {
      setFormJenisId(dataStorage.getNextJenisId());
      setFormJenisNama('');
      setFormJenisDeskripsi('');
    } else if (subTab === 'kategori') {
      setFormKategoriId(dataStorage.getNextKategoriId());
      setFormKategoriNama('');
      setFormKategoriKelompok('Medis');
    } else if (subTab === 'merk') {
      const nextData = dataStorage.getNextMerkData();
      setFormMerkId(nextData.id);
      setFormMerkNama('');
      setFormMerkNegara('Indonesia');
      setFormMerkKeterangan('');
    } else if (subTab === 'ruang') {
      setFormRuangId(dataStorage.getNextRuangId());
      setFormRuangNama('');
      setFormRuangGedung('Gedung Utama Lantai 1');
      setFormRuangPJ('');
      setFormRuangKontak('');
    } else if (subTab === 'supplier') {
      setFormSupplierId(dataStorage.getNextSupplierId());
      setFormSupplierNama('');
      setFormSupplierAlamat('');
      setFormSupplierTelepon('');
      setFormSupplierEmail('');
      setFormSupplierPIC('');
    }

    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setModalMode('edit');
    setEditingItem(item);

    if (subTab === 'jenis') {
      setFormJenisId(item.id);
      setFormJenisNama(item.namaJenis);
      setFormJenisDeskripsi(item.deskripsi || '');
    } else if (subTab === 'kategori') {
      setFormKategoriId(item.id);
      setFormKategoriNama(item.namaKategori);
      setFormKategoriKelompok(item.kelompok || 'Medis');
    } else if (subTab === 'merk') {
      setFormMerkId(item.id);
      setFormMerkNama(item.namaMerk);
      setFormMerkNegara(item.negaraAsal || '');
      setFormMerkKeterangan(item.keterangan || '');
    } else if (subTab === 'ruang') {
      setFormRuangId(item.id);
      setFormRuangNama(item.namaRuang);
      setFormRuangGedung(item.gedungLantai || '');
      setFormRuangPJ(item.penanggungJawab || '');
      setFormRuangKontak(item.kontakPJ || '');
    } else if (subTab === 'supplier') {
      setFormSupplierId(item.id);
      setFormSupplierNama(item.nama);
      setFormSupplierAlamat(item.alamat || '');
      setFormSupplierTelepon(item.telepon || '');
      setFormSupplierEmail(item.email || '');
      setFormSupplierPIC(item.pic || '');
    }

    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (subTab === 'jenis') {
      let updated: JenisInventaris[];
      if (modalMode === 'create') {
        const newItem: JenisInventaris = {
          id: formJenisId.trim().toUpperCase(),
          namaJenis: formJenisNama.trim(),
          deskripsi: formJenisDeskripsi.trim(),
          createdAt: new Date().toISOString().split('T')[0],
        };
        updated = [...jenisList, newItem];
      } else {
        updated = jenisList.map(j => j.id === editingItem.id ? { ...j, namaJenis: formJenisNama.trim(), deskripsi: formJenisDeskripsi.trim() } : j);
      }
      setJenisList(updated);
      dataStorage.saveJenis(updated);
    } else if (subTab === 'kategori') {
      let updated: KategoriInventaris[];
      if (modalMode === 'create') {
        const newItem: KategoriInventaris = {
          id: formKategoriId.trim().toUpperCase(),
          namaKategori: formKategoriNama.trim(),
          kelompok: formKategoriKelompok,
          createdAt: new Date().toISOString().split('T')[0],
        };
        updated = [...kategoriList, newItem];
      } else {
        updated = kategoriList.map(k => k.id === editingItem.id ? { ...k, namaKategori: formKategoriNama.trim(), kelompok: formKategoriKelompok } : k);
      }
      setKategoriList(updated);
      dataStorage.saveKategori(updated);
    } else if (subTab === 'merk') {
      let updated: MerkInventaris[];
      if (modalMode === 'create') {
        const nextData = dataStorage.getNextMerkData();
        const newItem: MerkInventaris = {
          id: formMerkId.trim(),
          nomorUrut: nextData.nomorUrut,
          namaMerk: formMerkNama.trim(),
          negaraAsal: formMerkNegara.trim(),
          keterangan: formMerkKeterangan.trim(),
          createdAt: new Date().toISOString().split('T')[0],
        };
        updated = [...merkList, newItem];
      } else {
        updated = merkList.map(m => m.id === editingItem.id ? { ...m, namaMerk: formMerkNama.trim(), negaraAsal: formMerkNegara.trim(), keterangan: formMerkKeterangan.trim() } : m);
      }
      setMerkList(updated);
      dataStorage.saveMerk(updated);
    } else if (subTab === 'ruang') {
      let updated: RuangInventaris[];
      if (modalMode === 'create') {
        const newItem: RuangInventaris = {
          id: formRuangId.trim().toUpperCase(),
          namaRuang: formRuangNama.trim(),
          gedungLantai: formRuangGedung.trim(),
          penanggungJawab: formRuangPJ.trim(),
          kontakPJ: formRuangKontak.trim(),
          createdAt: new Date().toISOString().split('T')[0],
        };
        updated = [...ruangList, newItem];
      } else {
        updated = ruangList.map(r => r.id === editingItem.id ? { ...r, namaRuang: formRuangNama.trim(), gedungLantai: formRuangGedung.trim(), penanggungJawab: formRuangPJ.trim(), kontakPJ: formRuangKontak.trim() } : r);
      }
      setRuangList(updated);
      dataStorage.saveRuang(updated);
    } else if (subTab === 'supplier') {
      let updated: SupplierInventaris[];
      if (modalMode === 'create') {
        const newItem: SupplierInventaris = {
          id: formSupplierId.trim(),
          nama: formSupplierNama.trim(),
          alamat: formSupplierAlamat.trim(),
          telepon: formSupplierTelepon.trim(),
          email: formSupplierEmail.trim(),
          pic: formSupplierPIC.trim(),
          createdAt: new Date().toISOString().split('T')[0],
        };
        updated = [...supplierList, newItem];
      } else {
        updated = supplierList.map(s => s.id === editingItem.id ? { ...s, nama: formSupplierNama.trim(), alamat: formSupplierAlamat.trim(), telepon: formSupplierTelepon.trim(), email: formSupplierEmail.trim(), pic: formSupplierPIC.trim() } : s);
      }
      setSupplierList(updated);
      dataStorage.saveSupplier(updated);
    }

    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteConfirmItem) return;

    if (subTab === 'jenis') {
      const updated = jenisList.filter(i => i.id !== deleteConfirmItem.id);
      setJenisList(updated);
      dataStorage.saveJenis(updated);
    } else if (subTab === 'kategori') {
      const updated = kategoriList.filter(i => i.id !== deleteConfirmItem.id);
      setKategoriList(updated);
      dataStorage.saveKategori(updated);
    } else if (subTab === 'merk') {
      const updated = merkList.filter(i => i.id !== deleteConfirmItem.id);
      setMerkList(updated);
      dataStorage.saveMerk(updated);
    } else if (subTab === 'ruang') {
      const updated = ruangList.filter(i => i.id !== deleteConfirmItem.id);
      setRuangList(updated);
      dataStorage.saveRuang(updated);
    } else if (subTab === 'supplier') {
      const updated = supplierList.filter(i => i.id !== deleteConfirmItem.id);
      setSupplierList(updated);
      dataStorage.saveSupplier(updated);
    }

    setDeleteConfirmItem(null);
  };

  // Export handlers
  const handleExportCsv = () => {
    if (subTab === 'jenis') {
      exportToCsv('Master_Jenis_RS_Medika_Insani', ['ID Jenis', 'Nama Jenis', 'Deskripsi', 'Tanggal Input'], jenisList.map(j => [j.id, j.namaJenis, j.deskripsi, j.createdAt]));
    } else if (subTab === 'kategori') {
      exportToCsv('Master_Kategori_RS_Medika_Insani', ['ID Kategori', 'Nama Kategori', 'Kelompok', 'Tanggal Input'], kategoriList.map(k => [k.id, k.namaKategori, k.kelompok, k.createdAt]));
    } else if (subTab === 'merk') {
      exportToCsv('Master_Merk_RS_Medika_Insani', ['ID Merk', 'No Urut', 'Nama Merk', 'Negara Asal', 'Keterangan'], merkList.map(m => [m.id, m.nomorUrut, m.namaMerk, m.negaraAsal, m.keterangan]));
    } else if (subTab === 'ruang') {
      exportToCsv('Master_Ruang_RS_Medika_Insani', ['ID Ruang', 'Nama Ruang', 'Gedung & Lantai', 'Penanggung Jawab', 'Kontak'], ruangList.map(r => [r.id, r.namaRuang, r.gedungLantai, r.penanggungJawab, r.kontakPJ]));
    } else if (subTab === 'supplier') {
      exportToCsv('Master_Supplier_RS_Medika_Insani', ['ID Supplier', 'Nama Supplier', 'Alamat', 'Telepon', 'Email', 'PIC'], supplierList.map(s => [s.id, s.nama, s.alamat, s.telepon, s.email, s.pic]));
    }
  };

  const getSubTabInfo = () => {
    switch (subTab) {
      case 'jenis':
        return {
          title: 'Master Jenis Inventaris',
          subtitle: 'Kelola master kode ID, penamaan jenis barang, dan deskripsi peruntukan aset RS Medika Insani.',
          addLabel: 'Tambah Jenis',
          icon: <Tag className="w-5 h-5 text-blue-600" />
        };
      case 'kategori':
        return {
          title: 'Master Kategori Inventaris',
          subtitle: 'Kelola master klasifikasi kelompok barang (Medis / Non-Medis) dan nama kategori aset.',
          addLabel: 'Tambah Kategori',
          icon: <Bookmark className="w-5 h-5 text-blue-600" />
        };
      case 'merk':
        return {
          title: 'Master Merk Inventaris',
          subtitle: 'Kelola master merk/brand inventaris dengan nomor urut kode dan negara asal produsen.',
          addLabel: 'Tambah Merk',
          icon: <Building className="w-5 h-5 text-blue-600" />
        };
      case 'ruang':
        return {
          title: 'Master Ruang Inventaris',
          subtitle: 'Kelola master ruangan rumah sakit, penempatan lantai/gedung, serta data penanggung jawab (PJ).',
          addLabel: 'Tambah Ruang',
          icon: <DoorOpen className="w-5 h-5 text-blue-600" />
        };
      case 'supplier':
        return {
          title: 'Master Supplier Inventaris',
          subtitle: 'Kelola data rekanan vendor, distributor penyedia alat, alamat, telepon, dan PIC resmi.',
          addLabel: 'Tambah Supplier',
          icon: <Truck className="w-5 h-5 text-blue-600" />
        };
    }
  };

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
                onClick={() => printDiv('print-master-table', `Master ${subTab.toUpperCase()} RS Medika Insani`)}
                className="px-3 py-1.5 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                title="Cetak Data"
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

        {/* Search bar */}
        <div className="relative max-w-md pt-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-[calc(50%+2px)] -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={`Cari di data ${subTab}...`}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Main Table Container */}
      <div id="print-master-table" className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        
        {/* Printable Hospital Header for Print View */}
        <div className="hidden print:block p-6 border-b border-slate-300 text-center space-y-1">
          <h2 className="text-xl font-bold text-slate-900">RUMAH SAKIT MEDIKA INSANI</h2>
          <p className="text-xs text-slate-600">Instalasi Pemeliharaan Sarana Rumah Sakit (IPSRS) & Logistik</p>
          <p className="text-sm font-semibold uppercase text-blue-700 pt-2">Laporan Master {subTab}</p>
        </div>

        {/* DESKTOP TABLE VIEW (Visible on screens >= 768px) */}
        <div className="hidden md:block overflow-x-auto">
          {/* 1. JENIS TABLE */}
          {subTab === 'jenis' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Kode ID Jenis</th>
                  <th className="py-2.5 px-3">Nama Jenis Inventaris</th>
                  <th className="py-2.5 px-3">Deskripsi / Peruntukan</th>
                  <th className="py-2.5 px-3">Tanggal Buat</th>
                  <th className="py-2.5 px-3 text-right print:hidden">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {jenisList
                  .filter(j => {
                    const q = (searchTerm || '').trim().toLowerCase();
                    return q === '' || (j.id || '').toLowerCase().includes(q) || (j.namaJenis || '').toLowerCase().includes(q);
                  })
                  .map(j => (
                    <tr key={j.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-semibold text-blue-700 bg-blue-50/40">{j.id}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{j.namaJenis}</td>
                      <td className="py-2.5 px-3 text-slate-600">{j.deskripsi || '-'}</td>
                      <td className="py-2.5 px-3 text-slate-500">{j.createdAt}</td>
                      <td className="py-2.5 px-3 text-right print:hidden">
                        <div className="flex items-center justify-end gap-1">
                          {actionAccess.canEdit && (
                            <button
                              type="button"
                              onClick={() => openEditModal(j)}
                              className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {actionAccess.canDelete && (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmItem(j)}
                              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {/* 2. KATEGORI TABLE */}
          {subTab === 'kategori' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Kode ID Kategori</th>
                  <th className="py-2.5 px-3">Nama Kategori Inventaris</th>
                  <th className="py-2.5 px-3">Kelompok Aset</th>
                  <th className="py-2.5 px-3">Tanggal Buat</th>
                  <th className="py-2.5 px-3 text-right print:hidden">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {kategoriList
                  .filter(k => {
                    const q = (searchTerm || '').trim().toLowerCase();
                    return q === '' || (k.id || '').toLowerCase().includes(q) || (k.namaKategori || '').toLowerCase().includes(q);
                  })
                  .map(k => (
                    <tr key={k.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-semibold text-blue-700 bg-blue-50/40">{k.id}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{k.namaKategori}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {k.kelompok}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">{k.createdAt}</td>
                      <td className="py-2.5 px-3 text-right print:hidden">
                        <div className="flex items-center justify-end gap-1">
                          {actionAccess.canEdit && (
                            <button
                              type="button"
                              onClick={() => openEditModal(k)}
                              className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {actionAccess.canDelete && (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmItem(k)}
                              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {/* 3. MERK TABLE */}
          {subTab === 'merk' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">ID Merk</th>
                  <th className="py-2.5 px-3">No Urut</th>
                  <th className="py-2.5 px-3">Nama Merk / Brand</th>
                  <th className="py-2.5 px-3">Negara Asal</th>
                  <th className="py-2.5 px-3">Keterangan / Produk Khas</th>
                  <th className="py-2.5 px-3 text-right print:hidden">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {merkList
                  .filter(m => {
                    const q = (searchTerm || '').trim().toLowerCase();
                    return q === '' || (m.id || '').toLowerCase().includes(q) || (m.namaMerk || '').toLowerCase().includes(q);
                  })
                  .map(m => (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-semibold text-blue-700">{m.id}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">#{m.nomorUrut}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{m.namaMerk}</td>
                      <td className="py-2.5 px-3 text-slate-600">{m.negaraAsal || '-'}</td>
                      <td className="py-2.5 px-3 text-slate-600">{m.keterangan || '-'}</td>
                      <td className="py-2.5 px-3 text-right print:hidden">
                        <div className="flex items-center justify-end gap-1">
                          {actionAccess.canEdit && (
                            <button
                              type="button"
                              onClick={() => openEditModal(m)}
                              className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {actionAccess.canDelete && (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmItem(m)}
                              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {/* 4. RUANG TABLE */}
          {subTab === 'ruang' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Kode ID Ruang</th>
                  <th className="py-2.5 px-3">Nama Ruangan / Instalasi</th>
                  <th className="py-2.5 px-3">Gedung & Lantai</th>
                  <th className="py-2.5 px-3">Penanggung Jawab (PJ)</th>
                  <th className="py-2.5 px-3">Kontak PJ</th>
                  <th className="py-2.5 px-3 text-right print:hidden">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {ruangList
                  .filter(r => {
                    const q = (searchTerm || '').trim().toLowerCase();
                    return q === '' || (r.id || '').toLowerCase().includes(q) || (r.namaRuang || '').toLowerCase().includes(q);
                  })
                  .map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-semibold text-blue-700 bg-blue-50/40">{r.id}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{r.namaRuang}</td>
                      <td className="py-2.5 px-3 text-slate-600">{r.gedungLantai}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{r.penanggungJawab || '-'}</td>
                      <td className="py-2.5 px-3 text-slate-500">{r.kontakPJ || '-'}</td>
                      <td className="py-2.5 px-3 text-right print:hidden">
                        <div className="flex items-center justify-end gap-1">
                          {actionAccess.canEdit && (
                            <button
                              type="button"
                              onClick={() => openEditModal(r)}
                              className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {actionAccess.canDelete && (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmItem(r)}
                              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {/* 5. SUPPLIER TABLE */}
          {subTab === 'supplier' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">ID Supplier</th>
                  <th className="py-2.5 px-3">Nama Perusahaan Supplier</th>
                  <th className="py-2.5 px-3">Alamat Kantor</th>
                  <th className="py-2.5 px-3">Kontak</th>
                  <th className="py-2.5 px-3">PIC</th>
                  <th className="py-2.5 px-3 text-right print:hidden">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {supplierList
                  .filter(s => {
                    const q = (searchTerm || '').trim().toLowerCase();
                    return q === '' || (s.id || '').toLowerCase().includes(q) || (s.nama || '').toLowerCase().includes(q);
                  })
                  .map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-semibold text-blue-700 bg-blue-50/40">{s.id}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{s.nama}</td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">{s.alamat}</td>
                      <td className="py-2.5 px-3 text-slate-600">
                        <div>📞 {s.telepon}</div>
                        <div className="text-slate-400 text-[11px]">✉️ {s.email}</div>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{s.pic || '-'}</td>
                      <td className="py-2.5 px-3 text-right print:hidden">
                        <div className="flex items-center justify-end gap-1">
                          {actionAccess.canEdit && (
                            <button
                              type="button"
                              onClick={() => openEditModal(s)}
                              className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {actionAccess.canDelete && (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmItem(s)}
                              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>

        {/* MOBILE CARD VIEW (Optimized for screens < 768px) */}
        <div className="block md:hidden p-3 bg-slate-50/50 print:hidden">
          {/* 1. JENIS MOBILE CARDS */}
          {subTab === 'jenis' && (
            <div className="space-y-3">
              {jenisList
                .filter(j => {
                  const q = (searchTerm || '').trim().toLowerCase();
                  return q === '' || (j.id || '').toLowerCase().includes(q) || (j.namaJenis || '').toLowerCase().includes(q);
                })
                .map(j => (
                  <div key={j.id} className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {j.id}
                      </span>
                      <span className="text-[10px] text-slate-400">{j.createdAt}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{j.namaJenis}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{j.deskripsi || 'Tidak ada deskripsi'}</p>
                    </div>
                    <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                      {actionAccess.canEdit && (
                        <button
                          type="button"
                          onClick={() => openEditModal(j)}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1 min-h-[38px]"
                        >
                          <Edit className="w-3.5 h-3.5 text-blue-600" />
                          <span>Edit</span>
                        </button>
                      )}
                      {actionAccess.canDelete && (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmItem(j)}
                          className="p-1.5 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center justify-center gap-1 min-h-[38px]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* 2. KATEGORI MOBILE CARDS */}
          {subTab === 'kategori' && (
            <div className="space-y-3">
              {kategoriList
                .filter(k => {
                  const q = (searchTerm || '').trim().toLowerCase();
                  return q === '' || (k.id || '').toLowerCase().includes(q) || (k.namaKategori || '').toLowerCase().includes(q);
                })
                .map(k => (
                  <div key={k.id} className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {k.id}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {k.kelompok}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{k.namaKategori}</h4>
                      <span className="text-[10px] text-slate-400">Dibuat: {k.createdAt}</span>
                    </div>
                    <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                      {actionAccess.canEdit && (
                        <button
                          type="button"
                          onClick={() => openEditModal(k)}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1 min-h-[38px]"
                        >
                          <Edit className="w-3.5 h-3.5 text-blue-600" />
                          <span>Edit</span>
                        </button>
                      )}
                      {actionAccess.canDelete && (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmItem(k)}
                          className="p-1.5 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center justify-center gap-1 min-h-[38px]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* 3. MERK MOBILE CARDS */}
          {subTab === 'merk' && (
            <div className="space-y-3">
              {merkList
                .filter(m => {
                  const q = (searchTerm || '').trim().toLowerCase();
                  return q === '' || (m.id || '').toLowerCase().includes(q) || (m.namaMerk || '').toLowerCase().includes(q);
                })
                .map(m => (
                  <div key={m.id} className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {m.id}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">#{m.nomorUrut}</span>
                      </div>
                      <span className="text-xs font-medium text-slate-600">{m.negaraAsal || '-'}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{m.namaMerk}</h4>
                      {m.keterangan && <p className="text-xs text-slate-500 mt-0.5">{m.keterangan}</p>}
                    </div>
                    <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                      {actionAccess.canEdit && (
                        <button
                          type="button"
                          onClick={() => openEditModal(m)}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1 min-h-[38px]"
                        >
                          <Edit className="w-3.5 h-3.5 text-blue-600" />
                          <span>Edit</span>
                        </button>
                      )}
                      {actionAccess.canDelete && (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmItem(m)}
                          className="p-1.5 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center justify-center gap-1 min-h-[38px]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* 4. RUANG MOBILE CARDS */}
          {subTab === 'ruang' && (
            <div className="space-y-3">
              {ruangList
                .filter(r => {
                  const q = (searchTerm || '').trim().toLowerCase();
                  return q === '' || (r.id || '').toLowerCase().includes(q) || (r.namaRuang || '').toLowerCase().includes(q);
                })
                .map(r => (
                  <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {r.id}
                      </span>
                      <span className="text-xs text-slate-600 font-medium">{r.gedungLantai}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{r.namaRuang}</h4>
                      <div className="text-xs text-slate-600 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                        <span>PJ: <strong className="text-slate-800">{r.penanggungJawab || '-'}</strong></span>
                        {r.kontakPJ && <span>Telp: {r.kontakPJ}</span>}
                      </div>
                    </div>
                    <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                      {actionAccess.canEdit && (
                        <button
                          type="button"
                          onClick={() => openEditModal(r)}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1 min-h-[38px]"
                        >
                          <Edit className="w-3.5 h-3.5 text-blue-600" />
                          <span>Edit</span>
                        </button>
                      )}
                      {actionAccess.canDelete && (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmItem(r)}
                          className="p-1.5 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center justify-center gap-1 min-h-[38px]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* 5. SUPPLIER MOBILE CARDS */}
          {subTab === 'supplier' && (
            <div className="space-y-3">
              {supplierList
                .filter(s => {
                  const q = (searchTerm || '').trim().toLowerCase();
                  return q === '' || (s.id || '').toLowerCase().includes(q) || (s.nama || '').toLowerCase().includes(q);
                })
                .map(s => (
                  <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {s.id}
                      </span>
                      <span className="text-xs font-medium text-slate-700">PIC: {s.pic || '-'}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{s.nama}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{s.alamat}</p>
                      <div className="text-xs text-slate-600 mt-1.5 flex flex-wrap gap-2">
                        <span>📞 {s.telepon}</span>
                        {s.email && <span>✉️ {s.email}</span>}
                      </div>
                    </div>
                    <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                      {actionAccess.canEdit && (
                        <button
                          type="button"
                          onClick={() => openEditModal(s)}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1 min-h-[38px]"
                        >
                          <Edit className="w-3.5 h-3.5 text-blue-600" />
                          <span>Edit</span>
                        </button>
                      )}
                      {actionAccess.canDelete && (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmItem(s)}
                          className="p-1.5 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center justify-center gap-1 min-h-[38px]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-5 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                {modalMode === 'create' ? `Tambah Master ${subTab.toUpperCase()}` : `Edit Master ${subTab.toUpperCase()}`}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="py-3.5 space-y-3 text-xs">
              
              {/* Form Jenis */}
              {subTab === 'jenis' && (
                <>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Kode ID Jenis (Otomatis 3 Karakter)
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={4}
                      value={formJenisId}
                      onChange={e => setFormJenisId(e.target.value.toUpperCase())}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 font-mono font-semibold bg-slate-50 uppercase focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">Contoh: J01, J02, J03</p>
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Nama Jenis Inventaris</label>
                    <input
                      type="text"
                      required
                      value={formJenisNama}
                      onChange={e => setFormJenisNama(e.target.value)}
                      placeholder="e.g. Alat Medis Elektromedik"
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Deskripsi / Peruntukan</label>
                    <textarea
                      rows={3}
                      value={formJenisDeskripsi}
                      onChange={e => setFormJenisDeskripsi(e.target.value)}
                      placeholder="Keterangan jenis barang..."
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {/* Form Kategori */}
              {subTab === 'kategori' && (
                <>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Kode ID Kategori (Otomatis 3 Karakter)
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={4}
                      value={formKategoriId}
                      onChange={e => setFormKategoriId(e.target.value.toUpperCase())}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 font-mono font-semibold bg-slate-50 uppercase focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">Contoh: K01, K02, K03</p>
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Nama Kategori Inventaris</label>
                    <input
                      type="text"
                      required
                      value={formKategoriNama}
                      onChange={e => setFormKategoriNama(e.target.value)}
                      placeholder="e.g. Kegawatdaruratan & ICU"
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Kelompok Aset</label>
                    <select
                      value={formKategoriKelompok}
                      onChange={e => setFormKategoriKelompok(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    >
                      <option value="Medis">Medis</option>
                      <option value="Elektromedik">Elektromedik</option>
                      <option value="Non-Medis">Non-Medis</option>
                      <option value="IT & Komunikasi">IT & Komunikasi</option>
                      <option value="Sarana Prasarana">Sarana Prasarana</option>
                      <option value="Kendaraan">Kendaraan</option>
                    </select>
                  </div>
                </>
              )}

              {/* Form Merk */}
              {subTab === 'merk' && (
                <>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      ID Merk (Nomor Urut Otomatis)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={formMerkId}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 font-mono font-semibold bg-slate-100 text-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Nama Merk / Brand</label>
                    <input
                      type="text"
                      required
                      value={formMerkNama}
                      onChange={e => setFormMerkNama(e.target.value)}
                      placeholder="e.g. Mindray, Philips, GE Healthcare"
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Negara Asal</label>
                    <input
                      type="text"
                      value={formMerkNegara}
                      onChange={e => setFormMerkNegara(e.target.value)}
                      placeholder="e.g. Japan, Germany, USA, China"
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Keterangan / Produk Khas</label>
                    <input
                      type="text"
                      value={formMerkKeterangan}
                      onChange={e => setFormMerkKeterangan(e.target.value)}
                      placeholder="e.g. Patient Monitor, USG, Defibrillator"
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {/* Form Ruang */}
              {subTab === 'ruang' && (
                <>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Kode ID Ruang (Otomatis 3 Karakter)
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={4}
                      value={formRuangId}
                      onChange={e => setFormRuangId(e.target.value.toUpperCase())}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 font-mono font-semibold bg-slate-50 uppercase focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">Contoh: R01, R02, R03</p>
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Nama Ruangan / Instalasi</label>
                    <input
                      type="text"
                      required
                      value={formRuangNama}
                      onChange={e => setFormRuangNama(e.target.value)}
                      placeholder="e.g. Instalasi Gawat Darurat (IGD)"
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Lokasi Gedung & Lantai</label>
                    <input
                      type="text"
                      value={formRuangGedung}
                      onChange={e => setFormRuangGedung(e.target.value)}
                      placeholder="e.g. Gedung Utama Lantai 1"
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Penanggung Jawab (PJ)</label>
                      <input
                        type="text"
                        value={formRuangPJ}
                        onChange={e => setFormRuangPJ(e.target.value)}
                        placeholder="Nama dokter/perawat..."
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Kontak Telepon PJ</label>
                      <input
                        type="text"
                        value={formRuangKontak}
                        onChange={e => setFormRuangKontak(e.target.value)}
                        placeholder="0812..."
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Form Supplier */}
              {subTab === 'supplier' && (
                <>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">ID Supplier</label>
                    <input
                      type="text"
                      readOnly
                      value={formSupplierId}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 font-mono font-semibold bg-slate-100 text-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Nama Perusahaan Supplier</label>
                    <input
                      type="text"
                      required
                      value={formSupplierNama}
                      onChange={e => setFormSupplierNama(e.target.value)}
                      placeholder="e.g. PT Medika Sejahtera Utama"
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Alamat Lengkap</label>
                    <textarea
                      rows={2}
                      required
                      value={formSupplierAlamat}
                      onChange={e => setFormSupplierAlamat(e.target.value)}
                      placeholder="Alamat kantor..."
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Telepon</label>
                      <input
                        type="text"
                        required
                        value={formSupplierTelepon}
                        onChange={e => setFormSupplierTelepon(e.target.value)}
                        placeholder="(021) 7289012"
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={formSupplierEmail}
                        onChange={e => setFormSupplierEmail(e.target.value)}
                        placeholder="sales@supplier.com"
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Contact Person (PIC)</label>
                    <input
                      type="text"
                      value={formSupplierPIC}
                      onChange={e => setFormSupplierPIC(e.target.value)}
                      placeholder="Nama sales / marketing PIC..."
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
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

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl border border-slate-200 text-center space-y-3.5">
            <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-sm">Konfirmasi Hapus Data</h3>
              <p className="text-xs text-slate-500">
                Apakah Anda yakin ingin menghapus <b>{deleteConfirmItem.namaJenis || deleteConfirmItem.namaKategori || deleteConfirmItem.namaMerk || deleteConfirmItem.namaRuang || deleteConfirmItem.nama}</b> ({deleteConfirmItem.id})? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                className="px-3.5 py-1.5 rounded-md border border-slate-200 text-slate-600 font-medium text-xs hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-3.5 py-1.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs cursor-pointer shadow-xs"
              >
                Ya, Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
