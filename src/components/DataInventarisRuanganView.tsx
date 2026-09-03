import React, { useState, useEffect } from 'react';
import { 
  InventarisRuangan, 
  RuangInventaris, 
  JenisInventaris, 
  KategoriInventaris, 
  MerkInventaris, 
  SupplierInventaris,
  ActionPermission,
  UserAccount,
  KondisiBarang,
  StatusBarang,
  AppSettings,
  AssetPhotoRecord
} from '../types/inventory';
import { dataStorage } from '../services/dataStorage';
import { AppLogo } from './AppLogo';
import { DocumentHeader } from './DocumentHeader';
import { QrSignature } from './QrSignature';
import { AssetDetailModal } from './AssetDetailModal';
import { AssetCameraModal } from './AssetCameraModal';
import { PhotoLightboxModal } from './PhotoLightboxModal';
import { formatRupiah, formatDateIndo, generateQrDataUrl, formatAssetQrText, exportToCsv, exportToExcel, exportToJson, printDiv } from '../utils/formatters';

import { useLazyList } from '../hooks/useLazyList';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Download, 
  Printer, 
  QrCode, 
  Filter, 
  Check, 
  X, 
  AlertCircle, 
  DoorOpen, 
  Eye, 
  ExternalLink, 
  ShieldAlert, 
  ShieldCheck, 
  Building2, 
  Calendar, 
  DollarSign, 
  Tag, 
  Lock, 
  Info,
  FileSpreadsheet,
  FileText,
  Zap,
  ChevronDown,
  Loader2,
  CheckCircle2,
  Camera,
  Image as ImageIcon,
  Maximize2
} from 'lucide-react';

interface DataInventarisRuanganViewProps {
  actionAccess: ActionPermission;
  currentUser?: UserAccount | null;
  onInspectAsset?: (asset: InventarisRuangan) => void;
  userRuangId?: string; // If user is restricted to a room
  appSettings?: AppSettings;
  initialSearch?: string;
  initialRuangId?: string;
}

export const DataInventarisRuanganView: React.FC<DataInventarisRuanganViewProps> = ({
  actionAccess,
  currentUser,
  onInspectAsset,
  userRuangId,
  appSettings: propAppSettings,
  initialSearch = '',
  initialRuangId = 'ALL',
}) => {
  const settings = propAppSettings || dataStorage.getAppSettings();
  const [inventaris, setInventaris] = useState<InventarisRuangan[]>(dataStorage.getInventarisRuangan());
  const [ruangList] = useState<RuangInventaris[]>(dataStorage.getRuang());
  const [jenisList] = useState<JenisInventaris[]>(dataStorage.getJenis());
  const [kategoriList] = useState<KategoriInventaris[]>(dataStorage.getKategori());
  const [merkList] = useState<MerkInventaris[]>(dataStorage.getMerk());
  const [supplierList] = useState<SupplierInventaris[]>(dataStorage.getSupplier());

  // Filters
  const [selectedRuangId, setSelectedRuangId] = useState<string>(userRuangId || initialRuangId || 'ALL');
  const [selectedJenisId, setSelectedJenisId] = useState<string>('ALL');
  const [selectedKondisi, setSelectedKondisi] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState(initialSearch);

  useEffect(() => {
    if (initialSearch) setSearchTerm(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    if (initialRuangId && !userRuangId) setSelectedRuangId(initialRuangId);
  }, [initialRuangId, userRuangId]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<InventarisRuangan | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<InventarisRuangan | null>(null);

  // Asset Detail & Audit Trail Modal
  const [selectedDetailAsset, setSelectedDetailAsset] = useState<InventarisRuangan | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // QR Modal
  const [activeQrAsset, setActiveQrAsset] = useState<InventarisRuangan | null>(null);
  const [activeQrUrl, setActiveQrUrl] = useState<string>('');

  // Camera & Photo Modals State
  const [isFormCameraOpen, setIsFormCameraOpen] = useState(false);
  const [cameraTargetAsset, setCameraTargetAsset] = useState<InventarisRuangan | null>(null);
  const [isDirectCameraOpen, setIsDirectCameraOpen] = useState(false);
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

  // Form Fields
  const [formIdJenis, setFormIdJenis] = useState(jenisList[0]?.id || 'J01');
  const [formIdKategori, setFormIdKategori] = useState(kategoriList[0]?.id || 'K01');
  const [formIdRuang, setFormIdRuang] = useState(userRuangId || ruangList[0]?.id || 'R01');
  const [formIdMerk, setFormIdMerk] = useState(merkList[0]?.id || 'MRK-001');
  const [formIdSupplier, setFormIdSupplier] = useState(supplierList[0]?.id || 'SUP-001');
  const [formNamaBarang, setFormNamaBarang] = useState('');
  const [formSpesifikasi, setFormSpesifikasi] = useState('');
  const [formNomorSeri, setFormNomorSeri] = useState('');
  const [formTahun, setFormTahun] = useState(new Date().getFullYear());
  const [formHarga, setFormHarga] = useState<number>(0);
  const [formKondisi, setFormKondisi] = useState<KondisiBarang>('Baik');
  const [formStatus, setFormStatus] = useState<StatusBarang>('Tersedia');
  const [formSumberDana, setFormSumberDana] = useState<'Dana Internal RS' | 'Dana PT. / Yayasan' | 'Hibah' | string>('Dana Internal RS');
  const [formCatatan, setFormCatatan] = useState('');
  const [formFotoUrl, setFormFotoUrl] = useState<string | null>(null);
  const [formFotoCaption, setFormFotoCaption] = useState<string>('');

  // Auto-calculated Preview ID Barang: ${idJenis}-${idKategori}-${idRuang}-${noUrut}
  const [previewIdBarang, setPreviewIdBarang] = useState('');

  useEffect(() => {
    if (modalMode === 'create') {
      const generated = dataStorage.generateIdBarang(formIdJenis, formIdKategori, formIdRuang);
      setPreviewIdBarang(generated.idBarang);
    }
  }, [formIdJenis, formIdKategori, formIdRuang, modalMode]);

  // Open Create Modal
  const openCreateModal = () => {
    setModalMode('create');
    setEditingItem(null);
    const initialJenis = jenisList[0]?.id || 'J01';
    const initialKat = kategoriList[0]?.id || 'K01';
    const initialRng = userRuangId || ruangList[0]?.id || 'R01';

    setFormIdJenis(initialJenis);
    setFormIdKategori(initialKat);
    setFormIdRuang(initialRng);
    setFormIdMerk(merkList[0]?.id || 'MRK-001');
    setFormIdSupplier(supplierList[0]?.id || 'SUP-001');
    setFormNamaBarang('');
    setFormSpesifikasi('');
    setFormNomorSeri('');
    setFormTahun(new Date().getFullYear());
    setFormHarga(0);
    setFormKondisi('Baik');
    setFormStatus('Tersedia');
    setFormSumberDana('Dana Internal RS');
    setFormCatatan('');
    setFormFotoUrl(null);
    setFormFotoCaption('');

    const generated = dataStorage.generateIdBarang(initialJenis, initialKat, initialRng);
    setPreviewIdBarang(generated.idBarang);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (item: InventarisRuangan) => {
    setModalMode('edit');
    setEditingItem(item);
    setPreviewIdBarang(item.idBarang);
    setFormIdJenis(item.idJenis);
    setFormIdKategori(item.idKategori);
    setFormIdRuang(item.idRuang);
    setFormIdMerk(item.idMerk);
    setFormIdSupplier(item.idSupplier);
    setFormNamaBarang(item.namaBarang);
    setFormSpesifikasi(item.spesifikasi || '');
    setFormNomorSeri(item.nomorSeri || '');
    setFormTahun(item.tahunPerolehan || new Date().getFullYear());
    setFormHarga(item.hargaPerolehan || 0);
    setFormKondisi(item.kondisi);
    setFormStatus(item.status);
    setFormSumberDana(item.sumberDana);
    setFormCatatan(item.catatan || '');
    setFormFotoUrl(item.fotoUrl || null);
    setFormFotoCaption('');
    setIsModalOpen(true);
  };

  const handleDirectCameraCapture = (
    dataUrl: string,
    meta?: { caption?: string; tipeFoto?: string; kondisi?: any }
  ) => {
    if (!cameraTargetAsset) return;

    dataStorage.updateAssetPhoto(cameraTargetAsset.idBarang, dataUrl, {
      caption: meta?.caption,
      tipeFoto: meta?.tipeFoto || 'Kondisi Fisik',
      kondisi: meta?.kondisi || cameraTargetAsset.kondisi,
    });

    setInventaris(dataStorage.getInventarisRuangan());
    setIsDirectCameraOpen(false);
    setCameraTargetAsset(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const currentUser = dataStorage.getCurrentUser();
    const actorName = currentUser?.namaLengkap || currentUser?.username || 'Petugas RS';
    const actorRole = currentUser?.role || 'Admin / Operator';

    let updated: InventarisRuangan[];
    if (modalMode === 'create') {
      const generated = dataStorage.generateIdBarang(formIdJenis, formIdKategori, formIdRuang);
      const targetRoom = ruangList.find(r => r.id === formIdRuang);
      
      const initialPhotos: AssetPhotoRecord[] = formFotoUrl ? [
        {
          id: `FOTO-${Date.now()}`,
          url: formFotoUrl,
          caption: formFotoCaption || 'Foto Registrasi Aset',
          tipeFoto: 'Kondisi Fisik',
          kondisiSaatFoto: formKondisi,
          timestamp: new Date().toISOString(),
          petugas: actorName,
        }
      ] : [];

      const newItem: InventarisRuangan = {
        idBarang: generated.idBarang,
        noUrut: generated.noUrut,
        namaBarang: formNamaBarang.trim(),
        idJenis: formIdJenis,
        idKategori: formIdKategori,
        idMerk: formIdMerk,
        idRuang: formIdRuang,
        idSupplier: formIdSupplier,
        spesifikasi: formSpesifikasi.trim(),
        nomorSeri: formNomorSeri.trim(),
        tahunPerolehan: Number(formTahun),
        hargaPerolehan: Number(formHarga),
        kondisi: formKondisi,
        status: formStatus,
        sumberDana: formSumberDana,
        tanggalInput: new Date().toISOString().split('T')[0],
        catatan: formCatatan.trim(),
        fotoUrl: formFotoUrl || undefined,
        fotoList: initialPhotos,
      };
      updated = [newItem, ...inventaris];

      // Auto record audit log for new registration
      dataStorage.addAuditLog({
        idBarang: newItem.idBarang,
        timestamp: new Date().toISOString(),
        tipeAksi: 'REGISTRASI',
        judul: `Registrasi Aset Baru (${newItem.namaBarang})`,
        deskripsi: `Penambahan aset baru ke sistem inventaris ruangan. Penempatan awal di ${targetRoom?.namaRuang || formIdRuang}. Harga perolehan ${formatRupiah(newItem.hargaPerolehan)}, sumber dana: ${newItem.sumberDana}.`,
        user: actorName,
        roleUser: actorRole,
        ruangTujuanId: formIdRuang,
        ruangTujuanNama: targetRoom?.namaRuang,
        kondisiBaru: newItem.kondisi,
        statusBaru: newItem.status,
        biaya: newItem.hargaPerolehan,
        catatan: newItem.catatan,
        fotoUrl: formFotoUrl || undefined,
      });
    } else {
      if (!editingItem) return;
      const targetRoom = ruangList.find(r => r.id === formIdRuang);
      const prevRoom = ruangList.find(r => r.id === editingItem.idRuang);

      updated = inventaris.map(item => {
        if (item.idBarang === editingItem.idBarang) {
          let nextFotoList = item.fotoList || [];
          if (formFotoUrl && formFotoUrl !== item.fotoUrl) {
            const newRec: AssetPhotoRecord = {
              id: `FOTO-${Date.now()}`,
              url: formFotoUrl,
              caption: formFotoCaption || 'Pembaruan Foto Aset',
              tipeFoto: 'Kondisi Fisik',
              kondisiSaatFoto: formKondisi,
              timestamp: new Date().toISOString(),
              petugas: actorName,
            };
            nextFotoList = [newRec, ...nextFotoList];
          }

          return {
            ...item,
            namaBarang: formNamaBarang.trim(),
            idJenis: formIdJenis,
            idKategori: formIdKategori,
            idMerk: formIdMerk,
            idRuang: formIdRuang,
            idSupplier: formIdSupplier,
            spesifikasi: formSpesifikasi.trim(),
            nomorSeri: formNomorSeri.trim(),
            tahunPerolehan: Number(formTahun),
            hargaPerolehan: Number(formHarga),
            kondisi: formKondisi,
            status: formStatus,
            sumberDana: formSumberDana,
            catatan: formCatatan.trim(),
            fotoUrl: formFotoUrl || item.fotoUrl,
            fotoList: nextFotoList,
          };
        }
        return item;
      });

      // Auto record audit log for edits
      if (editingItem.kondisi !== formKondisi) {
        dataStorage.addAuditLog({
          idBarang: editingItem.idBarang,
          timestamp: new Date().toISOString(),
          tipeAksi: 'KONDISI_CHANGE',
          judul: `Perubahan Kondisi Fisik menjadi ${formKondisi}`,
          deskripsi: `Status kondisi barang diubah dari "${editingItem.kondisi}" menjadi "${formKondisi}". Lokasi: ${targetRoom?.namaRuang || formIdRuang}.`,
          user: actorName,
          roleUser: actorRole,
          ruangAsalId: editingItem.idRuang,
          ruangAsalNama: prevRoom?.namaRuang,
          kondisiLama: editingItem.kondisi,
          kondisiBaru: formKondisi,
          catatan: formCatatan.trim() || undefined,
        });
      } else if (editingItem.status !== formStatus) {
        dataStorage.addAuditLog({
          idBarang: editingItem.idBarang,
          timestamp: new Date().toISOString(),
          tipeAksi: 'STATUS_CHANGE',
          judul: `Perubahan Status Operasional menjadi ${formStatus}`,
          deskripsi: `Status ketersediaan barang diubah dari "${editingItem.status}" menjadi "${formStatus}".`,
          user: actorName,
          roleUser: actorRole,
          ruangAsalId: editingItem.idRuang,
          ruangAsalNama: prevRoom?.namaRuang,
          statusLama: editingItem.status,
          statusBaru: formStatus,
        });
      } else if (editingItem.idRuang !== formIdRuang) {
        dataStorage.addAuditLog({
          idBarang: editingItem.idBarang,
          timestamp: new Date().toISOString(),
          tipeAksi: 'MUTASI_RUANGAN',
          judul: `Perpindahan Ruangan ke ${targetRoom?.namaRuang || formIdRuang}`,
          deskripsi: `Pembaruan lokasi fisik penempatan barang dari ${prevRoom?.namaRuang || editingItem.idRuang} ke ${targetRoom?.namaRuang || formIdRuang}.`,
          user: actorName,
          roleUser: actorRole,
          ruangAsalId: editingItem.idRuang,
          ruangTujuanId: formIdRuang,
          ruangAsalNama: prevRoom?.namaRuang,
          ruangTujuanNama: targetRoom?.namaRuang,
        });
      } else {
        dataStorage.addAuditLog({
          idBarang: editingItem.idBarang,
          timestamp: new Date().toISOString(),
          tipeAksi: 'EDIT_DATA',
          judul: `Pembaruan Data & Spesifikasi Aset`,
          deskripsi: `Pembaruan data teknis barang oleh ${actorName} (${actorRole}).`,
          user: actorName,
          roleUser: actorRole,
          ruangAsalId: formIdRuang,
          ruangAsalNama: targetRoom?.namaRuang,
        });
      }
    }


    setInventaris(updated);
    dataStorage.saveInventarisRuangan(updated);
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteConfirmItem) return;
    const updated = inventaris.filter(i => i.idBarang !== deleteConfirmItem.idBarang);
    setInventaris(updated);
    dataStorage.saveInventarisRuangan(updated);
    setDeleteConfirmItem(null);
  };

  // Open QR Code Modal
  const handleShowQr = async (item: InventarisRuangan) => {
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

  // Filtered Items
  const filteredList = inventaris.filter(item => {
    const matchRuang = selectedRuangId === 'ALL' || item.idRuang === selectedRuangId;
    const matchJenis = selectedJenisId === 'ALL' || item.idJenis === selectedJenisId;
    const matchKondisi = selectedKondisi === 'ALL' || item.kondisi === selectedKondisi;
    const q = (searchTerm || '').trim().toLowerCase();
    const matchSearch =
      q === '' ||
      (item.idBarang || '').toLowerCase().includes(q) ||
      (item.namaBarang || '').toLowerCase().includes(q) ||
      (item.nomorSeri || '').toLowerCase().includes(q) ||
      (item.spesifikasi || '').toLowerCase().includes(q);

    return matchRuang && matchJenis && matchKondisi && matchSearch;
  });

  // Lazy Loading for high-volume room inventory dataset
  const {
    displayedItems: displayedRuangItems,
    hasMore: hasMoreRuangItems,
    isLoadingMore: isLoadingMoreRuang,
    loadMore: loadMoreRuang,
    loadAll: loadAllRuang,
    setSentinel: setSentinelRuang
  } = useLazyList<InventarisRuangan>(filteredList, {
    initialBatch: 30,
    batchSize: 30,
    resetTriggers: [selectedRuangId, selectedJenisId, selectedKondisi, searchTerm]
  });

  const handleExportCsv = () => {
    const headers = [
      'No', 'ID Barang (QR Code)', 'No Urut', 'Nama Barang', 'Jenis', 'Kategori', 'Merk', 'Ruang', 'Supplier',
      'Spesifikasi', 'Nomor Seri', 'Tahun', 'Harga (Rp)', 'Kondisi', 'Status', 'Sumber Dana', 'Tgl Registrasi'
    ];
    const rows = filteredList.map((i, idx) => [
      idx + 1,
      i.idBarang, i.noUrut, i.namaBarang,
      jenisList.find(j => j.id === i.idJenis)?.namaJenis || i.idJenis,
      kategoriList.find(k => k.id === i.idKategori)?.namaKategori || i.idKategori,
      merkList.find(m => m.id === i.idMerk)?.namaMerk || i.idMerk || '-',
      ruangList.find(r => r.id === i.idRuang)?.namaRuang || i.idRuang,
      supplierList.find(s => s.id === i.idSupplier)?.nama || i.idSupplier || '-',
      i.spesifikasi || '-', i.nomorSeri || '-', i.tahunPerolehan || '-', i.hargaPerolehan || 0,
      i.kondisi || 'Baik', i.status || 'Aktif Digunakan', i.sumberDana || 'Kas RS', i.tanggalInput || '-'
    ]);
    exportToCsv(`Daftar_Inventaris_Ruangan_${selectedRuangId}_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  const handleExportExcel = () => {
    const headers = [
      'No', 'ID Barang (QR Code)', 'No Urut', 'Nama Barang', 'Jenis', 'Kategori', 'Merk', 'Ruang', 'Supplier',
      'Spesifikasi', 'Nomor Seri', 'Tahun', 'Harga (Rp)', 'Kondisi', 'Status', 'Sumber Dana', 'Tgl Registrasi'
    ];
    const rows = filteredList.map((i, idx) => [
      idx + 1,
      i.idBarang, i.noUrut, i.namaBarang,
      jenisList.find(j => j.id === i.idJenis)?.namaJenis || i.idJenis,
      kategoriList.find(k => k.id === i.idKategori)?.namaKategori || i.idKategori,
      merkList.find(m => m.id === i.idMerk)?.namaMerk || i.idMerk || '-',
      ruangList.find(r => r.id === i.idRuang)?.namaRuang || i.idRuang,
      supplierList.find(s => s.id === i.idSupplier)?.nama || i.idSupplier || '-',
      i.spesifikasi || '-', i.nomorSeri || '-', i.tahunPerolehan || '-', i.hargaPerolehan || 0,
      i.kondisi || 'Baik', i.status || 'Aktif Digunakan', i.sumberDana || 'Kas RS', i.tanggalInput || '-'
    ]);

    const totalVal = filteredList.reduce((acc, curr) => acc + (curr.hargaPerolehan || 0), 0);

    exportToExcel({
      filename: `Daftar_Inventaris_Ruangan_${selectedRuangId}_${new Date().toISOString().split('T')[0]}`,
      title: `DAFTAR INVENTARIS RUANGAN (DIR) - ${currentRuangName.toUpperCase()}`,
      hospitalName: settings?.appName || 'RUMAH SAKIT MEDIKA INSANI',
      unitName: `Ruangan: ${currentRuangName} (ID: ${selectedRuangId})`,
      metaInfo: [
        { label: 'Nama Ruangan', value: currentRuangName },
        { label: 'Kode Ruangan', value: selectedRuangId },
        { label: 'Jumlah Item Barang', value: `${filteredList.length} Item` },
        { label: 'Total Estimasi Nilai Perolehan', value: formatRupiah(totalVal) }
      ],
      headers,
      rows,
      summaryRows: [
        {
          label: `TOTAL NILAI ASET RUANGAN (${filteredList.length} ITEM):`,
          value: formatRupiah(totalVal),
          colSpan: headers.length - 1
        }
      ]
    });
  };

  const currentRuangName = ruangList.find(r => r.id === selectedRuangId)?.namaRuang || 'Seluruh Ruangan';

  return (
    <div className="space-y-6">
      
      {/* Header & Action Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <DoorOpen className="w-5 h-5 text-blue-600" />
              <span>Data Inventaris Ruangan (DIR) Ber-QR Code</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              ID Barang dibuat otomatis: <span className="font-mono text-blue-700 font-semibold">Jenis-Kategori-Ruang-NoUrut</span> (e.g. <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">J01-K01-R01-0001</span>) untuk stiker identitas QR.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {actionAccess.canExport && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="px-3 py-1.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  title="Export DIR ke Microsoft Excel"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Export Excel</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="px-3 py-1.5 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  title="Export DIR ke CSV standar"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export CSV</span>
                </button>
              </div>
            )}

            {actionAccess.canPrint && (
              <button
                type="button"
                onClick={() => printDiv('print-dir-table', `Daftar Inventaris Ruangan - ${currentRuangName}`)}
                className="px-3 py-1.5 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cetak DIR</span>
              </button>
            )}

            {actionAccess.canCreate && (
              <button
                type="button"
                onClick={openCreateModal}
                className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Inventaris Ruangan</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          {/* Filter Ruangan */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Filter Ruang:</label>
            <select
              value={selectedRuangId}
              onChange={e => setSelectedRuangId(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
            >
              <option value="ALL">Semua Ruangan RS</option>
              {ruangList.map(r => (
                <option key={r.id} value={r.id}>
                  [{r.id}] {r.namaRuang}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Jenis */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Filter Jenis:</label>
            <select
              value={selectedJenisId}
              onChange={e => setSelectedJenisId(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
            >
              <option value="ALL">Semua Jenis Aset</option>
              {jenisList.map(j => (
                <option key={j.id} value={j.id}>
                  [{j.id}] {j.namaJenis}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Kondisi */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Filter Kondisi:</label>
            <select
              value={selectedKondisi}
              onChange={e => setSelectedKondisi(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
            >
              <option value="ALL">Semua Kondisi</option>
              <option value="Baik">Baik (Siap Pakai)</option>
              <option value="Rusak Ringan">Rusak Ringan</option>
              <option value="Rusak Berat">Rusak Berat</option>
              <option value="Dalam Perbaikan">Dalam Perbaikan</option>
              <option value="Dimusnahkan">Dimusnahkan</option>
            </select>
          </div>

          {/* Search Input */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Pencarian Cepat:</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="ID, Nama, No Seri..."
                className="w-full pl-8 pr-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Table View */}
      <div id="print-dir-table" className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        
        {/* Printable Official DIR Header Terstandarisasi */}
        <div className="hidden print:block p-6 print-avoid-break">
          <DocumentHeader
            settings={settings}
            title={`DAFTAR INVENTARIS RUANGAN (DIR) - ${currentRuangName}`}
            documentNumber={`Nomor: DIR/${selectedRuangId !== 'ALL' ? selectedRuangId : 'ALL'}/${settings.systemShortName || 'RSMI'}/${new Date().getFullYear()}`}
            unitName={`Unit Pelayanan: ${currentRuangName}`}
            extraMeta={
              <div className="flex justify-between items-center text-[11px] text-slate-600 font-medium px-2 pt-1">
                <span>Ruangan: <strong>{currentRuangName}</strong></span>
                <span>Total Aset: <strong>{filteredList.length} Item</strong></span>
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
                <th className="py-2.5 px-3">Nama Barang & Spesifikasi</th>
                <th className="py-2.5 px-3">Ruangan</th>
                <th className="py-2.5 px-3">Merk & SN</th>
                <th className="py-2.5 px-3">Tahun & Nilai</th>
                <th className="py-2.5 px-3">Kondisi</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right print:hidden">Aksi</th>
              </tr>
            </thead>
            
            {/* Screen Tbody with Lazy Loading */}
            <tbody className="divide-y divide-slate-100 text-slate-700 print:hidden">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                    Tidak ada data inventaris yang cocok dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                <>
                  {displayedRuangItems.map(item => {
                    const ruang = ruangList.find(r => r.id === item.idRuang);
                    const merk = merkList.find(m => m.id === item.idMerk);
                    const jenis = jenisList.find(j => j.id === item.idJenis);

                    return (
                      <tr key={item.idBarang} className="hover:bg-slate-50/70 transition-colors">
                        {/* Foto & QR Buttons */}
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
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setCameraTargetAsset(item);
                                  setIsDirectCameraOpen(true);
                                }}
                                className="w-8 h-8 rounded border border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 text-slate-400 hover:text-emerald-700 flex items-center justify-center transition-all cursor-pointer shrink-0"
                                title="Ambil Foto Aset via Kamera"
                              >
                                <Camera className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleShowQr(item)}
                              className="p-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/60 transition-colors cursor-pointer shrink-0"
                              title="Lihat QR Code & Cetak Label Stiker"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        {/* ID Barang */}
                        <td className="py-2.5 px-3">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDetailAsset(item);
                              setIsDetailModalOpen(true);
                            }}
                            className="font-mono font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 hover:text-blue-900 px-1.5 py-0.5 rounded border border-blue-200/50 block w-max text-[11px] text-left transition-colors cursor-pointer"
                            title="Klik untuk melihat Detail & Riwayat Log (Audit Trail)"
                          >
                            {item.idBarang}
                          </button>
                          <span className="text-[10px] text-slate-400 font-mono">No: {item.noUrut}</span>
                        </td>

                        {/* Nama & Spek */}
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

                        {/* Ruangan */}
                        <td className="py-2.5 px-3">
                          <span className="font-medium text-slate-800">{ruang?.namaRuang || item.idRuang}</span>
                          <div className="text-[10px] text-slate-400">{ruang?.gedungLantai}</div>
                        </td>

                        {/* Merk & SN */}
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-slate-700">{merk?.namaMerk || item.idMerk}</div>
                          <div className="text-[10px] font-mono text-slate-400">SN: {item.nomorSeri || '-'}</div>
                        </td>

                        {/* Tahun & Harga */}
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-slate-700">{formatRupiah(item.hargaPerolehan)}</div>
                          <div className="text-[10px] text-slate-400">Th: {item.tahunPerolehan} ({item.sumberDana})</div>
                        </td>

                        {/* Kondisi */}
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                            item.kondisi === 'Baik' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            item.kondisi === 'Rusak Ringan' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            item.kondisi === 'Rusak Berat' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            item.kondisi === 'Dalam Perbaikan' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {item.kondisi}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-3">
                          <span className="text-[11px] font-medium text-slate-600">
                            {item.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-3 text-right print:hidden">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDetailAsset(item);
                                setIsDetailModalOpen(true);
                              }}
                              className="p-1.5 rounded text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Lihat Detail & Riwayat Log (Audit Trail)"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setCameraTargetAsset(item);
                                setIsDirectCameraOpen(true);
                              }}
                              className="p-1.5 rounded text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors cursor-pointer"
                              title="Ambil / Update Foto Kondisi via Kamera"
                            >
                              <Camera className="w-3.5 h-3.5" />
                            </button>

                            {actionAccess.canEdit ? (
                              <button
                                type="button"
                                onClick={() => openEditModal(item)}
                                className="p-1.5 rounded text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Edit Data Barang"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span 
                                className="p-1.5 rounded text-slate-300 cursor-not-allowed opacity-50 inline-flex items-center"
                                title="Aksi Edit Dibatasi: Anda tidak memiliki izin mengedit data inventaris ini."
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </span>
                            )}

                            {actionAccess.canDelete ? (
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmItem(item)}
                                className="p-1.5 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Hapus Data Barang"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span 
                                className="p-1.5 rounded text-slate-300 cursor-not-allowed opacity-50 inline-flex items-center"
                                title="Aksi Hapus Dibatasi: Role Petugas Ruangan / Perawat tidak diizinkan menghapus aset fisik secara permanen sesuai SOP RS. Ajukan penghapusan buku aset melalui menu Permintaan Pemusnahan Aset jika barang afkir/rusak berat."
                              >
                                <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {hasMoreRuangItems && (
                    <tr ref={setSentinelRuang} className="border-0">
                      <td colSpan={9} className="py-3 text-center bg-slate-50/70 text-slate-500 text-xs">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                          <span>Memuat batch data inventaris ruangan berikutnya...</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>

            {/* Print Tbody (Complete dataset without truncation) */}
            <tbody className="divide-y divide-slate-200 text-slate-700 hidden print:table-row-group">
              {filteredList.map(item => {
                const ruang = ruangList.find(r => r.id === item.idRuang);
                const merk = merkList.find(m => m.id === item.idMerk);

                return (
                  <tr key={`print-ruang-${item.idBarang}`}>
                    <td className="py-1 px-2 font-mono text-[10px]">{item.idBarang}</td>
                    <td className="py-1 px-2 font-mono text-[10px]">{item.idBarang} (No: {item.noUrut})</td>
                    <td className="py-1 px-2">
                      <div className="font-semibold text-[11px]">{item.namaBarang}</div>
                      <div className="text-[9px] text-slate-500">{item.spesifikasi || '-'}</div>
                    </td>
                    <td className="py-1 px-2 text-[10px]">{ruang?.namaRuang || item.idRuang}</td>
                    <td className="py-1 px-2 text-[10px]">{merk?.namaMerk || item.idMerk} (SN: {item.nomorSeri || '-'})</td>
                    <td className="py-1 px-2 text-[10px]">{formatRupiah(item.hargaPerolehan)} (Th {item.tahunPerolehan})</td>
                    <td className="py-1 px-2 text-[10px]">{item.kondisi}</td>
                    <td className="py-1 px-2 text-[10px]">{item.status}</td>
                    <td className="py-1 px-2 text-right text-[10px] print:hidden">-</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARD VIEW (Optimized for screens < 768px) */}
        <div className="block md:hidden p-3 bg-slate-50/50 print:hidden">
          {filteredList.length === 0 ? (
            <div className="py-8 text-center bg-white rounded-lg border border-slate-200 p-4 text-slate-400 text-xs">
              Tidak ada data inventaris yang cocok dengan kriteria filter.
            </div>
          ) : (
            <div className="space-y-3">
              {displayedRuangItems.map(item => {
                const ruang = ruangList.find(r => r.id === item.idRuang);
                const merk = merkList.find(m => m.id === item.idMerk);
                const jenis = jenisList.find(j => j.id === item.idJenis);

                return (
                  <div 
                    key={item.idBarang} 
                    className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs space-y-3 transition-all hover:border-slate-300"
                  >
                    {/* Card Top: ID Badge, Condition & Status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
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
                            className="w-10 h-10 rounded-lg border border-slate-200 overflow-hidden bg-slate-100 shrink-0 cursor-pointer"
                            title="Perbesar Foto"
                          >
                            <img src={item.fotoUrl} alt={item.namaBarang} className="w-full h-full object-cover" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setCameraTargetAsset(item);
                              setIsDirectCameraOpen(true);
                            }}
                            className="w-10 h-10 rounded-lg border border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 text-slate-400 hover:text-emerald-700 flex items-center justify-center shrink-0 cursor-pointer"
                            title="Foto Kamera"
                          >
                            <Camera className="w-4 h-4" />
                          </button>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              {item.idBarang}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">#{item.noUrut}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.kondisi === 'Baik' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          item.kondisi === 'Rusak Ringan' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          item.kondisi === 'Rusak Berat' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          item.kondisi === 'Dalam Perbaikan' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {item.kondisi}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-medium">
                          {item.status}
                        </span>
                      </div>
                    </div>

                    {/* Card Body: Name & Specs */}
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

                    {/* Card Details Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                      <div>
                        <span className="text-[10px] font-medium text-slate-400 block">Ruangan & Lokasi</span>
                        <span className="font-semibold text-slate-800 text-xs block truncate">{ruang?.namaRuang || item.idRuang}</span>
                        <span className="text-[10px] text-slate-500 block truncate">{ruang?.gedungLantai || '-'}</span>
                      </div>

                      <div>
                        <span className="text-[10px] font-medium text-slate-400 block">Merk & Serial No</span>
                        <span className="font-semibold text-slate-800 text-xs block truncate">{merk?.namaMerk || item.idMerk}</span>
                        <span className="text-[10px] font-mono text-slate-500 block truncate">SN: {item.nomorSeri || '-'}</span>
                      </div>

                      <div className="pt-1.5 border-t border-slate-200/60">
                        <span className="text-[10px] font-medium text-slate-400 block">Nilai Perolehan</span>
                        <span className="font-bold text-slate-900 text-xs block">{formatRupiah(item.hargaPerolehan)}</span>
                      </div>

                      <div className="pt-1.5 border-t border-slate-200/60">
                        <span className="text-[10px] font-medium text-slate-400 block">Pengadaan & Dana</span>
                        <span className="text-slate-700 text-[11px] font-medium block">Th {item.tahunPerolehan} ({item.sumberDana})</span>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="pt-1 flex items-center justify-between gap-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDetailAsset(item);
                          setIsDetailModalOpen(true);
                        }}
                        className="py-2 px-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[40px]"
                        title="Lihat Detail & Riwayat Log (Audit Trail)"
                      >
                        <Eye className="w-4 h-4 text-blue-600" />
                        <span>Detail & Log</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleShowQr(item)}
                        className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/70 font-semibold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer min-h-[40px]"
                        title="Lihat QR Code & Cetak Label"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>QR</span>
                      </button>

                      {actionAccess.canEdit && (
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[40px]"
                          title="Edit Data Barang"
                        >
                          <Edit className="w-4 h-4 text-blue-600" />
                          <span>Edit</span>
                        </button>
                      )}

                      {actionAccess.canDelete && (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmItem(item)}
                          className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/70 font-semibold text-xs flex items-center justify-center transition-colors cursor-pointer min-h-[40px] min-w-[40px]"
                          title="Hapus Data Barang"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {hasMoreRuangItems && (
                <div ref={setSentinelRuang} className="py-3 text-center bg-white rounded-xl border border-slate-200 p-3 shadow-2xs">
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    <span>Memuat kartu data aset ruangan berikutnya...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Lazy Loading Interactive Control & Progress Bar */}
        {filteredList.length > 0 && (
          <div className="px-4 py-3 bg-slate-50/90 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-semibold">
                <Zap className="w-3 h-3 text-blue-600" />
                Lazy Loading Aktif
              </span>
              <span className="text-slate-600 font-medium">
                Menampilkan <b>{displayedRuangItems.length}</b> dari <b>{filteredList.length}</b> aset
              </span>
            </div>

            {hasMoreRuangItems ? (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => loadMoreRuang(30)}
                  disabled={isLoadingMoreRuang}
                  className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
                >
                  {isLoadingMoreRuang ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                  <span>Muat +30 Baris</span>
                </button>
                <button
                  type="button"
                  onClick={loadAllRuang}
                  className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/70 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Tampilkan Semua ({filteredList.length})
                </button>
              </div>
            ) : (
              <span className="text-emerald-700 font-medium text-[11px] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Seluruh data ({filteredList.length} aset) telah dimuat
              </span>
            )}
          </div>
        )}

        {/* Footer Summary */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>Total Nilai Hasil Filter:</span>
          <span className="font-bold text-blue-700 text-sm">
            {formatRupiah(filteredList.reduce((acc, curr) => acc + (curr.hargaPerolehan || 0), 0))}
          </span>
        </div>

        {/* Printable Signatures with TTE QR Codes */}
        <div className="hidden print:grid grid-cols-2 gap-8 p-6 text-center text-xs border-t-2 border-slate-300 print-avoid-break">
          <QrSignature
            role="Penanggung Jawab Ruangan"
            name={ruangList.find(r => r.id === selectedRuangId)?.penanggungJawab || 'Kepala Ruangan / Unit'}
            docName="Daftar Inventaris Ruangan (DIR)"
            docNumber={`DIR-${selectedRuangId !== 'ALL' ? selectedRuangId : 'ALL'}`}
            hospitalName={settings.appName}
            locationDate={formatDateIndo(new Date().toISOString())}
          />

          <QrSignature
            role="Kepala Instalasi IPSRS"
            name="Ir. H. Rahardian, MT"
            nip="19820315 200804 1 002"
            docName="Daftar Inventaris Ruangan (DIR)"
            docNumber={`DIR-${selectedRuangId !== 'ALL' ? selectedRuangId : 'ALL'}`}
            hospitalName={settings.appName}
            locationDate={formatDateIndo(new Date().toISOString())}
          />
        </div>
      </div>

      {/* CREATE / EDIT INVENTARIS MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <DoorOpen className="w-4 h-4 text-blue-600" />
                <span>{modalMode === 'create' ? 'Tambah Inventaris Ruangan Baru' : 'Edit Data Inventaris Ruangan'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="py-4 space-y-3.5 text-xs">
              
              {/* Formula ID Preview Banner */}
              <div className="p-3 bg-blue-50/70 rounded-lg border border-blue-200/70 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-blue-700 tracking-wider">
                    Formula ID Barang (Jenis - Kategori - Ruang - No Urut):
                  </span>
                  <div className="text-sm font-bold font-mono text-blue-900 mt-0.5">
                    {previewIdBarang}
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-white border border-blue-200 text-blue-800 font-medium shadow-2xs">
                  Auto Generated
                </span>
              </div>

              {/* Grid 1: Relational Selections (Jenis, Kategori, Ruang) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">ID Jenis Inventaris *</label>
                  <select
                    value={formIdJenis}
                    onChange={e => setFormIdJenis(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-white font-medium text-slate-800 focus:ring-1 focus:ring-blue-500"
                  >
                    {jenisList.map(j => (
                      <option key={j.id} value={j.id}>[{j.id}] {j.namaJenis}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">ID Kategori *</label>
                  <select
                    value={formIdKategori}
                    onChange={e => setFormIdKategori(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-white font-medium text-slate-800 focus:ring-1 focus:ring-blue-500"
                  >
                    {kategoriList.map(k => (
                      <option key={k.id} value={k.id}>[{k.id}] {k.namaKategori}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">ID Ruang Penempatan *</label>
                  <select
                    value={formIdRuang}
                    onChange={e => setFormIdRuang(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-white font-medium text-slate-800 focus:ring-1 focus:ring-blue-500"
                  >
                    {ruangList.map(r => (
                      <option key={r.id} value={r.id}>[{r.id}] {r.namaRuang}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Nama Barang */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">Nama Barang / Aset Medis *</label>
                <input
                  type="text"
                  required
                  value={formNamaBarang}
                  onChange={e => setFormNamaBarang(e.target.value)}
                  placeholder="e.g. Defibrillator Biphasic Efficia DFM100"
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500 text-xs"
                />
              </div>

              {/* Grid 2: Merk, Supplier, Nomor Seri */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Merk / Brand</label>
                  <select
                    value={formIdMerk}
                    onChange={e => setFormIdMerk(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-white focus:ring-1 focus:ring-blue-500"
                  >
                    {merkList.map(m => (
                      <option key={m.id} value={m.id}>{m.namaMerk}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Supplier Penyedia</label>
                  <select
                    value={formIdSupplier}
                    onChange={e => setFormIdSupplier(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-white focus:ring-1 focus:ring-blue-500"
                  >
                    {supplierList.map(s => (
                      <option key={s.id} value={s.id}>{s.nama}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Nomor Seri Pabrik (SN)</label>
                  <input
                    type="text"
                    value={formNomorSeri}
                    onChange={e => setFormNomorSeri(e.target.value)}
                    placeholder="SN-12345678"
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 font-mono focus:ring-1 focus:ring-blue-500 text-xs"
                  />
                </div>
              </div>

              {/* Spesifikasi */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">Spesifikasi Teknis Lengkap</label>
                <textarea
                  rows={2}
                  value={formSpesifikasi}
                  onChange={e => setFormSpesifikasi(e.target.value)}
                  placeholder="Kapasitas, voltase, probe, aksesori pendukung..."
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500 text-xs"
                />
              </div>

              {/* Grid 3: Tahun, Harga, Sumber Dana */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Tahun Perolehan</label>
                  <input
                    type="number"
                    min={2000}
                    max={2035}
                    value={formTahun}
                    onChange={e => setFormTahun(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Harga Perolehan (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    value={formHarga}
                    onChange={e => setFormHarga(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Sumber Dana</label>
                  <select
                    value={formSumberDana}
                    onChange={e => setFormSumberDana(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-white focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Dana Internal RS">Dana Internal RS</option>
                    <option value="Dana PT. / Yayasan">Dana PT. / Yayasan</option>
                    <option value="Hibah">Hibah / Bantuan</option>
                  </select>
                </div>
              </div>

              {/* Grid 4: Kondisi & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Kondisi Fisik & Fungsi</label>
                  <select
                    value={formKondisi}
                    onChange={e => setFormKondisi(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-white font-medium focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Baik">Baik (Siap Pakai)</option>
                    <option value="Rusak Ringan">Rusak Ringan (Bisa Operasional Terbatas)</option>
                    <option value="Rusak Berat">Rusak Berat (Tidak Berfungsi)</option>
                    <option value="Dalam Perbaikan">Dalam Perbaikan (IPSRS/Vendor)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Status Ketersediaan</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-white font-medium focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Tersedia">Tersedia di Ruangan</option>
                    <option value="Dipinjam">Dipinjam Unit Lain</option>
                    <option value="Perbaikan">Di Bengkel IPSRS</option>
                    <option value="Diajukan Pemusnahan">Diajukan Pemusnahan</option>
                  </select>
                </div>
              </div>

              {/* Catatan */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">Catatan Tambahan / Riwayat Kalibrasi</label>
                <input
                  type="text"
                  value={formCatatan}
                  onChange={e => setFormCatatan(e.target.value)}
                  placeholder="e.g. Kalibrasi berlaku s/d Nov 2025..."
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-500 text-xs"
                />
              </div>

              {/* Foto Aset (Kamera Langsung & Upload) */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-600" />
                    <span>Dokumentasi Foto Fisik Aset</span>
                  </label>
                  <span className="text-[11px] text-slate-500">Opsional</span>
                </div>

                <div className="flex items-start gap-3">
                  {formFotoUrl ? (
                    <div className="relative group w-24 h-24 rounded-lg overflow-hidden border border-slate-300 bg-white shrink-0">
                      <img src={formFotoUrl} alt="Preview Aset" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setLightboxPhoto({
                            url: formFotoUrl,
                            caption: formNamaBarang || 'Foto Aset Baru',
                            kondisi: formKondisi,
                          })}
                          className="p-1 rounded bg-white/80 hover:bg-white text-slate-900 cursor-pointer"
                          title="Perbesar Foto"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormFotoUrl(null)}
                          className="p-1 rounded bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                          title="Hapus Foto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400 shrink-0">
                      <ImageIcon className="w-6 h-6 text-slate-300 mb-1" />
                      <span className="text-[10px]">Belum Ada</span>
                    </div>
                  )}

                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setIsFormCameraOpen(true)}
                        className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{formFotoUrl ? 'Ambil Ulang Foto' : 'Ambil Foto via Kamera'}</span>
                      </button>

                      <label className="px-3 py-1.5 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-medium text-xs flex items-center gap-1.5 cursor-pointer transition-colors">
                        <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                        <span>Upload File</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = () => {
                                setFormFotoUrl(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>

                    <input
                      type="text"
                      value={formFotoCaption}
                      onChange={e => setFormFotoCaption(e.target.value)}
                      placeholder="Keterangan foto (e.g. Tampak Depan, Label SN, Layar Operasional)..."
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-white text-xs focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
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
                  className="px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium cursor-pointer shadow-xs"
                >
                  Simpan Data
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* QR CODE & PRINT STICKER MODAL */}
      {activeQrAsset && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
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

            {/* Printable Sticker Label Preview Container */}
            <div id="printable-asset-label" className="p-3.5 rounded-lg border border-slate-300 bg-slate-50/70 text-slate-900 space-y-2.5">
              {/* Header Sticker RS */}
              <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AppLogo settings={settings} size="sm" />
                  <div>
                    <div className="font-bold text-xs tracking-tight text-slate-900">{settings.appName || 'RS MEDIKA INSANI'}</div>
                    <div className="text-[8px] text-slate-500 font-medium uppercase tracking-wider">LABEL INVENTARIS RESMI</div>
                  </div>
                </div>
                <div className="text-right font-mono text-[9px] font-semibold text-blue-800">
                  {activeQrAsset.tahunPerolehan} • {activeQrAsset.sumberDana}
                </div>
              </div>

              {/* QR Image & Details side by side */}
              <div className="flex items-center gap-3">
                {activeQrUrl ? (
                  <img
                    src={activeQrUrl}
                    alt="QR Code"
                    className="w-20 h-20 border border-slate-200 rounded p-1 bg-white shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 bg-slate-200 rounded animate-pulse" />
                )}

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

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-1">
              <a
                href={activeQrUrl}
                download={`QR_${activeQrAsset.idBarang}.png`}
                className="px-3 py-1.5 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh PNG</span>
              </a>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => printDiv('printable-asset-label', `Label Stiker QR - ${activeQrAsset.idBarang}`)}
                  className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Stiker</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl border border-slate-200 text-center space-y-3.5">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-sm">Hapus Inventaris Ruangan?</h3>
              <p className="text-xs text-slate-500">
                Aset <b>{deleteConfirmItem.namaBarang}</b> ({deleteConfirmItem.idBarang}) akan dihapus permanen.
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
                className="px-3.5 py-1.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs cursor-pointer"
              >
                Ya, Hapus
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

      {/* ASSET CAMERA MODAL (Registration & Edit Form) */}
      <AssetCameraModal
        isOpen={isFormCameraOpen}
        onClose={() => setIsFormCameraOpen(false)}
        onCapture={(dataUrl, meta) => {
          setFormFotoUrl(dataUrl);
          if (meta?.caption) setFormFotoCaption(meta.caption);
        }}
        assetId={modalMode === 'edit' ? editingItem?.idBarang : previewIdBarang}
        assetName={formNamaBarang || 'Aset Baru'}
        currentKondisi={formKondisi}
      />

      {/* ASSET CAMERA MODAL (Direct from Table Row) */}
      {cameraTargetAsset && (
        <AssetCameraModal
          isOpen={isDirectCameraOpen}
          onClose={() => {
            setIsDirectCameraOpen(false);
            setCameraTargetAsset(null);
          }}
          onCapture={handleDirectCameraCapture}
          assetId={cameraTargetAsset.idBarang}
          assetName={cameraTargetAsset.namaBarang}
          currentKondisi={cameraTargetAsset.kondisi}
        />
      )}

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

    </div>
  );
};

