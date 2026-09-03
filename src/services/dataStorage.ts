import {
  JenisInventaris,
  KategoriInventaris,
  MerkInventaris,
  RuangInventaris,
  SupplierInventaris,
  InventarisRuangan,
  SirkulasiInventaris,
  PermintaanPerbaikan,
  PerbaikanInventaris,
  JadwalPemeliharaan,
  LaporanMutuIPSRS,
  PengajuanPengadaan,
  PengadaanInventaris,
  PenerimaanInventaris,
  PermintaanPemusnahan,
  PelaksanaanPemusnahan,
  UserAccount,
  GasSyncConfig,
  GitHubSyncConfig,
  RolePermissionsMatrix,
  AppSettings,
  AssetAuditLog,
} from '../types/inventory';


import {
  initialJenis,
  initialKategori,
  initialMerk,
  initialRuang,
  initialSupplier,
  initialInventarisRuangan,
  initialSirkulasi,
  initialPermintaanPerbaikan,
  initialPerbaikan,
  initialJadwalPemeliharaan,
  initialLaporanMutu,
  initialPengajuanPengadaan,
  initialPengadaan,
  initialPenerimaan,
  initialPermintaanPemusnahan,
  initialPelaksanaanPemusnahan,
  initialUsers,
  initialRoleMatrix,
  initialAppSettings,
  initialAssetAuditLogs,
  fullMenuAccess,
  fullActionAccess,
} from '../data/initialData';

const STORAGE_KEYS = {
  JENIS: 'simbars_jenis',
  KATEGORI: 'simbars_kategori',
  MERK: 'simbars_merk',
  RUANG: 'simbars_ruang',
  SUPPLIER: 'simbars_supplier',
  INVENTARIS_RUANGAN: 'simbars_inventaris_ruangan',
  ASSET_AUDIT_LOGS: 'simbars_asset_audit_logs',
  SIRKULASI: 'simbars_sirkulasi',
  PERMINTAAN_PERBAIKAN: 'simbars_permintaan_perbaikan',
  PERBAIKAN: 'simbars_perbaikan',
  JADWAL_PEMELIHARAAN: 'simbars_jadwal_pemeliharaan',
  LAPORAN_MUTU: 'simbars_laporan_mutu',
  PENGAJUAN: 'simbars_pengajuan',
  PENGADAAN: 'simbars_pengadaan',
  PENERIMAAN: 'simbars_penerimaan',
  PERMINTAAN_PEMUSNAHAN: 'simbars_permintaan_pemusnahan',
  PELAKSANAAN_PEMUSNAHAN: 'simbars_pelaksanaan_pemusnahan',
  USERS: 'simbars_users',
  CURRENT_USER: 'simbars_current_user',
  ROLE_MATRIX: 'simbars_role_matrix',
  GAS_CONFIG: 'simbars_gas_config',
  GITHUB_CONFIG: 'simbars_github_config',
  APP_SETTINGS: 'simbars_app_settings',
};


function getStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    const parsed = JSON.parse(item);
    if (Array.isArray(defaultValue)) {
      return (Array.isArray(parsed) ? parsed : defaultValue) as T;
    }
    return (parsed !== null && parsed !== undefined ? parsed : defaultValue) as T;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return defaultValue;
  }
}

function setStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    // Trigger real-time synchronization event if non-configuration data changes
    if (
      typeof window !== 'undefined' &&
      key !== STORAGE_KEYS.CURRENT_USER &&
      key !== STORAGE_KEYS.GAS_CONFIG &&
      key !== STORAGE_KEYS.GITHUB_CONFIG
    ) {
      window.dispatchEvent(
        new CustomEvent('simbars:data-changed', {
          detail: { key, timestamp: Date.now() },
        })
      );
    }
  } catch (error) {
    console.error(`Error writing ${key} to localStorage:`, error);
  }
}

export const dataStorage = {
  // Master Jenis (Format: 3 characters like J01, J02, J03)
  getJenis: (): JenisInventaris[] => getStorage(STORAGE_KEYS.JENIS, initialJenis),
  saveJenis: (data: JenisInventaris[]) => setStorage(STORAGE_KEYS.JENIS, data),
  getNextJenisId: (): string => {
    const list = dataStorage.getJenis();
    if (list.length === 0) return 'J01';
    const numbers = list.map(item => {
      const match = item.id.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    });
    const nextNum = Math.max(...numbers, 0) + 1;
    return `J${nextNum.toString().padStart(2, '0')}`;
  },

  // Master Kategori (Format: 3 characters like K01, K02, K03)
  getKategori: (): KategoriInventaris[] => getStorage(STORAGE_KEYS.KATEGORI, initialKategori),
  saveKategori: (data: KategoriInventaris[]) => setStorage(STORAGE_KEYS.KATEGORI, data),
  getNextKategoriId: (): string => {
    const list = dataStorage.getKategori();
    if (list.length === 0) return 'K01';
    const numbers = list.map(item => {
      const match = item.id.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    });
    const nextNum = Math.max(...numbers, 0) + 1;
    return `K${nextNum.toString().padStart(2, '0')}`;
  },

  // Master Merk (Format: Sequential number like MRK-001, MRK-002)
  getMerk: (): MerkInventaris[] => getStorage(STORAGE_KEYS.MERK, initialMerk),
  saveMerk: (data: MerkInventaris[]) => setStorage(STORAGE_KEYS.MERK, data),
  getNextMerkData: (): { id: string; nomorUrut: number } => {
    const list = dataStorage.getMerk();
    const nextUrut = list.length > 0 ? Math.max(...list.map(m => m.nomorUrut || 0)) + 1 : 1;
    return {
      id: `MRK-${nextUrut.toString().padStart(3, '0')}`,
      nomorUrut: nextUrut,
    };
  },

  // Master Ruang (Format: 3 characters like R01, R02, R03)
  getRuang: (): RuangInventaris[] => getStorage(STORAGE_KEYS.RUANG, initialRuang),
  saveRuang: (data: RuangInventaris[]) => setStorage(STORAGE_KEYS.RUANG, data),
  getNextRuangId: (): string => {
    const list = dataStorage.getRuang();
    if (list.length === 0) return 'R01';
    const numbers = list.map(item => {
      const match = item.id.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    });
    const nextNum = Math.max(...numbers, 0) + 1;
    return `R${nextNum.toString().padStart(2, '0')}`;
  },

  // Master Supplier
  getSupplier: (): SupplierInventaris[] => getStorage(STORAGE_KEYS.SUPPLIER, initialSupplier),
  saveSupplier: (data: SupplierInventaris[]) => setStorage(STORAGE_KEYS.SUPPLIER, data),
  getNextSupplierId: (): string => {
    const list = dataStorage.getSupplier();
    const numbers = list.map(item => {
      const match = item.id.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    });
    const nextNum = Math.max(...numbers, 0) + 1;
    return `SUP-${nextNum.toString().padStart(3, '0')}`;
  },

  // Data Inventaris Ruangan (Generated ID: ${idJenis}-${idKategori}-${idRuang}-${noUrut})
  getInventarisRuangan: (): InventarisRuangan[] => {
    const list = getStorage(STORAGE_KEYS.INVENTARIS_RUANGAN, initialInventarisRuangan);
    return list.map(item => {
      if (item.sumberDana === 'BLUD' || item.sumberDana === 'APBD' || item.sumberDana === 'DAK') {
        return { ...item, sumberDana: 'Dana Internal RS' };
      }
      if (item.sumberDana === 'Yayasan') {
        return { ...item, sumberDana: 'Dana PT. / Yayasan' };
      }
      return item;
    });
  },
  saveInventarisRuangan: (data: InventarisRuangan[]) => setStorage(STORAGE_KEYS.INVENTARIS_RUANGAN, data),
  getAssetById: (idBarang: string): InventarisRuangan | undefined => {
    return dataStorage.getInventarisRuangan().find(i => i.idBarang === idBarang);
  },
  updateAssetPhoto: (
    idBarang: string,
    photoDataUrl: string,
    meta?: { caption?: string; tipeFoto?: string; kondisi?: string; petugas?: string }
  ): InventarisRuangan | null => {
    const list = dataStorage.getInventarisRuangan();
    const currentUser = dataStorage.getCurrentUser();
    const actor = meta?.petugas || currentUser?.namaLengkap || currentUser?.username || 'Petugas RS';
    let updatedAsset: InventarisRuangan | null = null;

    const updatedList = list.map(item => {
      if (item.idBarang === idBarang) {
        const newPhotoRecord = {
          id: `FOTO-${Date.now()}`,
          url: photoDataUrl,
          caption: meta?.caption,
          kondisiSaatFoto: meta?.kondisi || item.kondisi,
          tipeFoto: meta?.tipeFoto || 'Kondisi Fisik',
          timestamp: new Date().toISOString(),
          petugas: actor,
        };

        const existingList = item.fotoList || [];
        const isKondisiChanged = meta?.kondisi && meta.kondisi !== item.kondisi;

        updatedAsset = {
          ...item,
          fotoUrl: photoDataUrl,
          fotoList: [newPhotoRecord, ...existingList],
          kondisi: (meta?.kondisi as any) || item.kondisi,
        };

        // Record audit trail log
        dataStorage.addAuditLog({
          idBarang,
          timestamp: new Date().toISOString(),
          tipeAksi: isKondisiChanged ? 'KONDISI_CHANGE' : 'CATATAN_MANUAL',
          judul: isKondisiChanged
            ? `Dokumentasi Foto & Update Kondisi: ${meta?.kondisi}`
            : `Dokumentasi Foto Aset (${meta?.tipeFoto || 'Kondisi Fisik'})`,
          deskripsi: `Pengambilan foto dokumentasi aset dengan kamera. ${meta?.caption ? `Keterangan: "${meta.caption}". ` : ''}Kondisi: ${meta?.kondisi || item.kondisi}.`,
          user: actor,
          roleUser: currentUser?.role || 'Petugas RS',
          kondisiLama: isKondisiChanged ? item.kondisi : undefined,
          kondisiBaru: meta?.kondisi || item.kondisi,
          fotoUrl: photoDataUrl,
          catatan: meta?.caption,
        });

        return updatedAsset;
      }
      return item;
    });

    if (updatedAsset) {
      dataStorage.saveInventarisRuangan(updatedList);
    }
    return updatedAsset;
  },
  generateIdBarang: (idJenis: string, idKategori: string, idRuang: string): { idBarang: string; noUrut: string } => {
    const list = dataStorage.getInventarisRuangan();
    const numbers = list.map(item => {
      const parsed = parseInt(item.noUrut, 10);
      return isNaN(parsed) ? 0 : parsed;
    });
    const nextUrutNum = Math.max(...numbers, 0) + 1;
    const noUrutStr = nextUrutNum.toString().padStart(4, '0');
    const idBarang = `${idJenis}-${idKategori}-${idRuang}-${noUrutStr}`;
    return { idBarang, noUrut: noUrutStr };
  },

  // Riwayat Log & Audit Trail Aset
  getAuditLogs: (): AssetAuditLog[] => getStorage(STORAGE_KEYS.ASSET_AUDIT_LOGS, initialAssetAuditLogs),
  saveAuditLogs: (data: AssetAuditLog[]) => setStorage(STORAGE_KEYS.ASSET_AUDIT_LOGS, data),
  addAuditLog: (entry: Omit<AssetAuditLog, 'idLog'> & { idLog?: string }): AssetAuditLog => {
    const existing = dataStorage.getAuditLogs();
    const nextNum = existing.length + 1;
    const idLog = entry.idLog || `LOG-${nextNum.toString().padStart(3, '0')}`;
    const newLog: AssetAuditLog = {
      idLog,
      timestamp: entry.timestamp || new Date().toISOString(),
      ...entry,
    };
    dataStorage.saveAuditLogs([newLog, ...existing]);
    return newLog;
  },
  getAuditLogsByAssetId: (idBarang: string): AssetAuditLog[] => {
    if (!idBarang) return [];
    const directLogs = dataStorage.getAuditLogs().filter(l => l.idBarang === idBarang);
    const ruangList = dataStorage.getRuang();

    // 1. Dynamic synthesis from Sirkulasi / Mutasi Ruangan
    const sirkulasiList = dataStorage.getSirkulasi().filter(s => s.idBarang === idBarang);
    const sirkulasiLogs: AssetAuditLog[] = sirkulasiList.map(s => {
      const asalId = s.idRuangAsal || s.ruangAsalId;
      const tujuanId = s.idRuangTujuan || s.ruangTujuanId;
      const asalRuang = ruangList.find(r => r.id === asalId);
      const tujuRuang = ruangList.find(r => r.id === tujuanId);
      return {
        idLog: `AUTO-SRK-${s.idSirkulasi}`,
        idBarang: s.idBarang,
        timestamp: s.createdAt || (s.tanggal ? `${s.tanggal}T09:00:00` : new Date().toISOString()),
        tipeAksi: 'MUTASI_RUANGAN',
        judul: `Perpindahan Ruangan ke ${tujuRuang?.namaRuang || tujuanId || 'Ruangan Baru'}`,
        deskripsi: `Mutasi barang dari ${asalRuang?.namaRuang || asalId || 'Ruang Asal'} ke ${tujuRuang?.namaRuang || tujuanId || 'Ruang Tujuan'}. Alasan: ${s.alasan || '-'}. Status: ${s.status} (${s.tindakLanjut || '-'}).`,
        user: s.penanggungJawab || 'Petugas Mutasi',
        roleUser: 'Petugas Ruangan / Admin',
        ruangAsalId: asalId,
        ruangTujuanId: tujuanId,
        ruangAsalNama: asalRuang?.namaRuang,
        ruangTujuanNama: tujuRuang?.namaRuang,
        referensiId: s.idSirkulasi,
        dokumenRef: s.noSuratJalan,
        catatan: s.keterangan || (s.penerima ? `Penerima: ${s.penerima}` : undefined),
      };
    });

    // 2. Dynamic synthesis from Permintaan Perbaikan
    const permintaanList = dataStorage.getPermintaanPerbaikan().filter(p => p.idBarang === idBarang);
    const permintaanLogs: AssetAuditLog[] = permintaanList.map(p => {
      const r = ruangList.find(rng => rng.id === p.idRuang);
      return {
        idLog: `AUTO-PP-${p.idPermintaan}`,
        idBarang: p.idBarang,
        timestamp: p.createdAt || (p.tanggal ? `${p.tanggal}T${p.jam || '08:00'}:00` : new Date().toISOString()),
        tipeAksi: 'PERMINTAAN_PERBAIKAN',
        judul: `Laporan Keluhan / Permintaan Perbaikan (${p.idPermintaan})`,
        deskripsi: `Laporan kerusakan: ${p.deskripsiKerusakan}. Prioritas: ${p.prioritas}. Status Tiket: ${p.status}.`,
        user: p.pelapor || 'Pelapor Ruangan',
        roleUser: 'Petugas Ruangan / Perawat',
        ruangAsalId: p.idRuang,
        ruangAsalNama: r?.namaRuang,
        referensiId: p.idPermintaan,
        catatan: p.catatanAdmin,
      };
    });

    // 3. Dynamic synthesis from Tindakan Perbaikan IPSRS
    const perbaikanList = dataStorage.getPerbaikan().filter(pb => pb.idBarang === idBarang);
    const perbaikanLogs: AssetAuditLog[] = perbaikanList.map(pb => {
      const r = ruangList.find(rng => rng.id === pb.idRuang);
      return {
        idLog: `AUTO-PBK-${pb.idPerbaikan}`,
        idBarang: pb.idBarang,
        timestamp: pb.createdAt || (pb.tanggalMulai ? `${pb.tanggalMulai}T${pb.jamMulai || '09:00'}:00` : new Date().toISOString()),
        tipeAksi: 'PERBAIKAN',
        judul: `Tindakan Perbaikan IPSRS (${pb.idPerbaikan})`,
        deskripsi: `Tindakan: ${pb.tindakan}. Suku cadang: ${pb.sukuCadang || 'Tanpa suku cadang'}. Pelaksana: ${pb.jenisPelaksana || 'IPSRS'}. Status: ${pb.status || pb.statusPerbaikan || 'Selesai'}.`,
        user: pb.teknisi || 'Teknisi IPSRS',
        roleUser: 'Teknisi Elektromedik / Umum',
        ruangAsalId: pb.idRuang,
        ruangAsalNama: r?.namaRuang,
        referensiId: pb.idPerbaikan,
        dokumenRef: pb.noBeritaAcara,
        biaya: pb.biayaRealisasi || pb.biayaEstimasi || pb.biaya || 0,
        catatan: pb.catatanTeknisi || pb.rekomendasi,
      };
    });

    // 4. Dynamic synthesis from Jadwal Pemeliharaan
    const jadwalList = dataStorage.getJadwalPemeliharaan().filter(j => j.idBarang === idBarang);
    const jadwalLogs: AssetAuditLog[] = jadwalList.map(j => {
      const r = ruangList.find(rng => rng.id === j.idRuang);
      return {
        idLog: `AUTO-PM-${j.idJadwal}`,
        idBarang: j.idBarang,
        timestamp: j.createdAt || (j.tanggalTerakhir ? `${j.tanggalTerakhir}T10:00:00` : new Date().toISOString()),
        tipeAksi: 'PEMELIHARAAN',
        judul: `Pemeliharaan Rutin Preventif (${j.frekuensi})`,
        deskripsi: `Jadwal pemeliharaan berkala ${j.frekuensi}. Status: ${j.status}. Tanggal berikutnya: ${j.tanggalBerikutnya}. Catatan: ${j.catatanPemeliharaan || j.keterangan || '-'}`,
        user: j.petugas || 'Petugas IPSRS',
        roleUser: 'Teknisi Elektromedik / Umum',
        ruangAsalId: j.idRuang,
        ruangAsalNama: r?.namaRuang,
        referensiId: j.idJadwal,
        catatan: j.keterangan,
      };
    });

    // 5. Dynamic synthesis from Pemusnahan
    const permintaanPms = dataStorage.getPermintaanPemusnahan().filter(pm => pm.idBarang === idBarang);
    const pmsLogs: AssetAuditLog[] = permintaanPms.map(pm => {
      const r = ruangList.find(rng => rng.id === pm.idRuang);
      return {
        idLog: `AUTO-PMS-${pm.idPemusnahan || pm.idPermintaan}`,
        idBarang: pm.idBarang,
        timestamp: pm.createdAt || (pm.tanggalPermintaan ? `${pm.tanggalPermintaan}T11:00:00` : new Date().toISOString()),
        tipeAksi: 'PEMUSNAHAN',
        judul: `Usulan Permintaan Pemusnahan Aset`,
        deskripsi: `Pengusulan penghapusan buku aset. Alasan: ${pm.alasan || pm.alasanPemusnahan || '-'}. Status Komite: ${pm.statusPersetujuan}.`,
        user: pm.pemohon || pm.pengusul || 'Pengusul Ruangan',
        roleUser: 'Petugas Ruangan / Komite',
        ruangAsalId: pm.idRuang,
        ruangAsalNama: r?.namaRuang,
        referensiId: pm.idPemusnahan || pm.idPermintaan,
        dokumenRef: pm.noUsulan,
        catatan: pm.catatanKomite,
      };
    });

    const laksPms = dataStorage.getPelaksanaanPemusnahan().filter(l => l.idBarang === idBarang);
    const laksLogs: AssetAuditLog[] = laksPms.map(l => {
      return {
        idLog: `AUTO-LAKS-${l.idPelaksanaan}`,
        idBarang: l.idBarang,
        timestamp: l.createdAt || (l.tanggalPelaksanaan ? `${l.tanggalPelaksanaan}T14:00:00` : new Date().toISOString()),
        tipeAksi: 'PEMUSNAHAN',
        judul: `Eksekusi Pelaksanaan Pemusnahan Aset (${l.metodePemusnahan || l.metode})`,
        deskripsi: `Pemusnahan fisik dieksekusi di ${l.lokasiPemusnahan || l.lokasi || 'TPS B3 RS'}. Saksi: ${l.saksi || '-'}. Berita Acara: ${l.noBeritaAcara || '-'}.`,
        user: l.petugasPelaksana || 'Petugas Pelaksana Pemusnahan',
        roleUser: 'Komite Pemusnahan & IPSRS',
        ruangAsalId: l.idRuang || l.idRuangAsal,
        referensiId: l.idPelaksanaan,
        dokumenRef: l.noBeritaAcara,
        catatan: l.keterangan,
      };
    });

    // 6. Deduplicate & Combine
    const all = [...directLogs];
    const seenRefs = new Set(all.map(l => l.referensiId).filter(Boolean));

    [...sirkulasiLogs, ...perbaikanLogs, ...permintaanLogs, ...jadwalLogs, ...pmsLogs, ...laksLogs].forEach(dyn => {
      if (dyn.referensiId && seenRefs.has(dyn.referensiId)) {
        return;
      }
      all.push(dyn);
      if (dyn.referensiId) seenRefs.add(dyn.referensiId);
    });

    // Sort newest first
    return all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },


  // Sirkulasi Inventaris
  getSirkulasi: (): SirkulasiInventaris[] => {
    const list = getStorage(STORAGE_KEYS.SIRKULASI, initialSirkulasi);
    return list.map(item => ({
      ...item,
      tindakLanjut: item.tindakLanjut || (item.status === 'Selesai' ? 'Dimutasikan' : 'Diajukan'),
    }));
  },
  saveSirkulasi: (data: SirkulasiInventaris[]) => setStorage(STORAGE_KEYS.SIRKULASI, data),
  getNextSirkulasiId: (): string => {
    const list = dataStorage.getSirkulasi();
    const nextNum = list.length + 1;
    return `SRK-${nextNum.toString().padStart(3, '0')}`;
  },

  // Kegiatan: Permintaan Perbaikan
  getPermintaanPerbaikan: (): PermintaanPerbaikan[] => {
    const list = getStorage(STORAGE_KEYS.PERMINTAAN_PERBAIKAN, initialPermintaanPerbaikan);
    return list.map(item => ({
      ...item,
      tindakLanjut: item.tindakLanjut || (item.status === 'Selesai' ? 'Sudah Dikerjakan' : 'Belum Dikerjakan'),
    }));
  },
  savePermintaanPerbaikan: (data: PermintaanPerbaikan[]) => setStorage(STORAGE_KEYS.PERMINTAAN_PERBAIKAN, data),
  getNextPermintaanPerbaikanId: (): string => {
    const list = dataStorage.getPermintaanPerbaikan();
    const numbers = list.map(item => {
      const match = item.idPermintaan.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    });
    const nextNum = Math.max(...numbers, 0) + 1;
    return `PP-${nextNum.toString().padStart(3, '0')}`;
  },

  // Kegiatan: Perbaikan Inventaris
  getPerbaikan: (): PerbaikanInventaris[] => {
    const list = getStorage(STORAGE_KEYS.PERBAIKAN, initialPerbaikan);
    return list.map(item => ({
      ...item,
      tindakLanjut: item.tindakLanjut || (item.statusPerbaikan === 'Selesai' || item.status === 'Selesai Baik' ? 'Sudah Dikerjakan' : 'Belum Dikerjakan'),
    }));
  },
  savePerbaikan: (data: PerbaikanInventaris[]) => setStorage(STORAGE_KEYS.PERBAIKAN, data),
  getNextPerbaikanId: (): string => {
    const list = dataStorage.getPerbaikan();
    const numbers = list.map(item => {
      const match = item.idPerbaikan.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    });
    const nextNum = Math.max(...numbers, 0) + 1;
    return `PBK-${nextNum.toString().padStart(3, '0')}`;
  },

  // Kegiatan: Jadwal Pemeliharaan
  getJadwalPemeliharaan: (): JadwalPemeliharaan[] => {
    const list = getStorage(STORAGE_KEYS.JADWAL_PEMELIHARAAN, initialJadwalPemeliharaan);
    return list.map(item => ({
      ...item,
      tindakLanjut: item.tindakLanjut || (item.status === 'Selesai Dilakukan' ? 'Sudah Dikerjakan' : 'Belum Dikerjakan'),
    }));
  },
  saveJadwalPemeliharaan: (data: JadwalPemeliharaan[]) => setStorage(STORAGE_KEYS.JADWAL_PEMELIHARAAN, data),
  getNextJadwalId: (): string => {
    const list = dataStorage.getJadwalPemeliharaan();
    const nextNum = list.length + 1;
    return `PM-${nextNum.toString().padStart(3, '0')}`;
  },

  // Kegiatan: Laporan Mutu IPSRS (Waktu Tanggap Respon <= 15 Menit)
  getLaporanMutu: (): LaporanMutuIPSRS[] => {
    const list = getStorage(STORAGE_KEYS.LAPORAN_MUTU, initialLaporanMutu);
    return list.map(item => ({
      ...item,
      tindakLanjut: item.tindakLanjut || (item.statusRespon === 'Tepat Waktu' || item.statusRespon === 'Terlambat' ? 'Sudah Dikerjakan' : 'Belum Dikerjakan'),
    }));
  },
  saveLaporanMutu: (data: LaporanMutuIPSRS[]) => setStorage(STORAGE_KEYS.LAPORAN_MUTU, data),
  getNextLaporanMutuId: (): string => {
    const list = dataStorage.getLaporanMutu();
    const numbers = list.map(item => {
      const match = item.idLaporan.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    });
    const nextNum = Math.max(...numbers, 0) + 1;
    return `MTU-${nextNum.toString().padStart(3, '0')}`;
  },

  // Pengadaan: Pengajuan
  getPengajuan: (): PengajuanPengadaan[] => {
    const list = getStorage(STORAGE_KEYS.PENGAJUAN, initialPengajuanPengadaan);
    return list.map(item => ({
      ...item,
      tindakLanjut: item.tindakLanjut || (item.statusPersetujuan === 'Selesai Pengadaan' || item.statusApproval === 'Disetujui Direksi' ? 'Sudah Dikerjakan' : 'Belum Dikerjakan'),
    }));
  },
  savePengajuan: (data: PengajuanPengadaan[]) => setStorage(STORAGE_KEYS.PENGAJUAN, data),
  getNextPengajuanId: (): string => {
    const list = dataStorage.getPengajuan();
    const nextNum = list.length + 1;
    return `AJU-${nextNum.toString().padStart(3, '0')}`;
  },

  // Pengadaan: Pengadaan (PO)
  getPengadaan: (): PengadaanInventaris[] => {
    const list = getStorage(STORAGE_KEYS.PENGADAAN, initialPengadaan);
    return list.map(item => {
      if (item.sumberDana === 'BLUD' || item.sumberDana === 'APBD' || item.sumberDana === 'DAK') {
        return { ...item, sumberDana: 'Dana Internal RS' };
      }
      if (item.sumberDana === 'Yayasan') {
        return { ...item, sumberDana: 'Dana PT. / Yayasan' };
      }
      return item;
    });
  },
  savePengadaan: (data: PengadaanInventaris[]) => setStorage(STORAGE_KEYS.PENGADAAN, data),
  getNextPengadaanId: (): string => {
    const list = dataStorage.getPengadaan();
    const nextNum = list.length + 1;
    return `PGD-${nextNum.toString().padStart(3, '0')}`;
  },

  // Pengadaan: Penerimaan
  getPenerimaan: (): PenerimaanInventaris[] => getStorage(STORAGE_KEYS.PENERIMAAN, initialPenerimaan),
  savePenerimaan: (data: PenerimaanInventaris[]) => setStorage(STORAGE_KEYS.PENERIMAAN, data),
  getNextPenerimaanId: (): string => {
    const list = dataStorage.getPenerimaan();
    const nextNum = list.length + 1;
    return `TRM-${nextNum.toString().padStart(3, '0')}`;
  },

  // Pemusnahan: Permintaan Pemusnahan
  getPermintaanPemusnahan: (): PermintaanPemusnahan[] => {
    const list = getStorage(STORAGE_KEYS.PERMINTAAN_PEMUSNAHAN, initialPermintaanPemusnahan);
    return list.map((item, idx) => ({
      ...item,
      idPermintaan: item.idPermintaan || item.idPemusnahan || `PMS-${String(idx + 1).padStart(3, '0')}`,
      idPemusnahan: item.idPemusnahan || item.idPermintaan || `PMS-${String(idx + 1).padStart(3, '0')}`,
      tanggalPermintaan: item.tanggalPermintaan || item.tanggalPengajuan || item.createdAt || new Date().toISOString().split('T')[0],
      alasan: item.alasan || item.alasanPemusnahan || '',
      pemohon: item.pemohon || item.pengusul || 'Petugas Ruangan',
      statusPersetujuan: item.statusPersetujuan || 'Disetujui',
    }));
  },
  savePermintaanPemusnahan: (data: PermintaanPemusnahan[]) => setStorage(STORAGE_KEYS.PERMINTAAN_PEMUSNAHAN, data),
  getNextPemusnahanId: (): string => {
    const list = dataStorage.getPermintaanPemusnahan();
    const nextNum = list.length + 1;
    return `PMS-${nextNum.toString().padStart(3, '0')}`;
  },

  // Pemusnahan: Pelaksanaan Pemusnahan
  getPelaksanaanPemusnahan: (): PelaksanaanPemusnahan[] => {
    const list = getStorage(STORAGE_KEYS.PELAKSANAAN_PEMUSNAHAN, initialPelaksanaanPemusnahan);
    return list.map((item, idx) => ({
      ...item,
      idPelaksanaan: item.idPelaksanaan || `LAKS-${String(idx + 1).padStart(3, '0')}`,
      idRuang: item.idRuang || item.idRuangAsal || 'R01',
      idRuangAsal: item.idRuangAsal || item.idRuang || 'R01',
      tanggalPelaksanaan: item.tanggalPelaksanaan || item.tanggalEksekusi || item.createdAt || new Date().toISOString().split('T')[0],
      metodePemusnahan: item.metodePemusnahan || item.metode || 'Dihancurkan Fisik',
      metode: item.metode || item.metodePemusnahan || 'Dihancurkan Fisik',
      petugasPelaksana: item.petugasPelaksana || item.penanggungJawab || 'Petugas IPSRS',
      saksi: item.saksi || `${item.saksi1 || ''} ${item.saksi2 ? `& ${item.saksi2}` : ''}`.trim() || 'Saksi SPI',
      lokasiPemusnahan: item.lokasiPemusnahan || item.lokasi || 'TPS B3 RS',
      statusInventarisUpdated: typeof item.statusInventarisUpdated === 'boolean' ? item.statusInventarisUpdated : false,
    }));
  },
  savePelaksanaanPemusnahan: (data: PelaksanaanPemusnahan[]) => setStorage(STORAGE_KEYS.PELAKSANAAN_PEMUSNAHAN, data),
  getNextPelaksanaanId: (): string => {
    const list = dataStorage.getPelaksanaanPemusnahan();
    const nextNum = list.length + 1;
    return `LAKS-${nextNum.toString().padStart(3, '0')}`;
  },

  // Users & Auth
  getUsers: (): UserAccount[] => {
    const list = getStorage<UserAccount[]>(STORAGE_KEYS.USERS, initialUsers);
    return list.map(u => ({
      ...u,
      menuAccess: { ...fullMenuAccess, ...(u.menuAccess || {}) },
      actionAccess: {
        ...(u.actionAccess || {}),
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canPrint: true,
        canExport: true,
      },
    }));
  },
  saveUsers: (data: UserAccount[]) => setStorage(STORAGE_KEYS.USERS, data),
  getCurrentUser: (): UserAccount | null => {
    const user = getStorage<UserAccount | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (!user) return null;
    return {
      ...user,
      menuAccess: { ...fullMenuAccess, ...(user.menuAccess || {}) },
      actionAccess: {
        ...(user.actionAccess || {}),
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canPrint: true,
        canExport: true,
      },
    };
  },
  saveCurrentUser: (user: UserAccount | null) => setStorage(STORAGE_KEYS.CURRENT_USER, user),

  // Role Permissions Matrix (Akses Menu & Aksi per Role)
  getRolePermissionsMatrix: (): RolePermissionsMatrix => {
    const matrix = getStorage<RolePermissionsMatrix>(STORAGE_KEYS.ROLE_MATRIX, initialRoleMatrix);
    const updatedMatrix = { ...initialRoleMatrix, ...matrix };
    // Ensure all roles have full edit and viewing access
    Object.keys(updatedMatrix).forEach(role => {
      updatedMatrix[role] = {
        menuAccess: { ...fullMenuAccess, ...(updatedMatrix[role]?.menuAccess || {}) },
        actionAccess: {
          ...(updatedMatrix[role]?.actionAccess || {}),
          canCreate: true,
          canEdit: true,
          canDelete: true,
          canPrint: true,
          canExport: true,
        },
      };
    });
    return updatedMatrix;
  },
  saveRolePermissionsMatrix: (matrix: RolePermissionsMatrix) => {
    setStorage(STORAGE_KEYS.ROLE_MATRIX, matrix);

    // Sync updated permissions to all registered user accounts based on role
    const users = dataStorage.getUsers();
    const updatedUsers = users.map(u => {
      const config = matrix[u.role] || (
        u.role === 'Super Admin' ? matrix['Admin (Superuser)'] || initialRoleMatrix['Super Admin'] :
        matrix['Inputer (Operator)'] || initialRoleMatrix['Petugas Ruangan / Perawat']
      );
      if (config) {
        return {
          ...u,
          menuAccess: { ...config.menuAccess },
          actionAccess: { ...config.actionAccess },
        };
      }
      return u;
    });
    dataStorage.saveUsers(updatedUsers);

    // If current logged-in user role is modified, sync currentUser as well
    const curr = dataStorage.getCurrentUser();
    if (curr) {
      const currentConfig = matrix[curr.role] || (
        curr.role === 'Super Admin' ? matrix['Admin (Superuser)'] || initialRoleMatrix['Super Admin'] :
        matrix['Inputer (Operator)'] || initialRoleMatrix['Petugas Ruangan / Perawat']
      );
      if (currentConfig) {
        const updatedCurr = {
          ...curr,
          menuAccess: { ...currentConfig.menuAccess },
          actionAccess: { ...currentConfig.actionAccess },
        };
        dataStorage.saveCurrentUser(updatedCurr);
      }
    }
  },
  resetRolePermissionsMatrix: () => {
    setStorage(STORAGE_KEYS.ROLE_MATRIX, initialRoleMatrix);
    dataStorage.saveRolePermissionsMatrix(initialRoleMatrix);
  },

  // App Settings (App Name, Subtitle, Logo, Branding)
  getAppSettings: (): AppSettings => {
    const saved = getStorage<Partial<AppSettings>>(STORAGE_KEYS.APP_SETTINGS, initialAppSettings);
    return { ...initialAppSettings, ...saved };
  },
  saveAppSettings: (settings: AppSettings): void => {
    setStorage(STORAGE_KEYS.APP_SETTINGS, settings);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app_settings_changed', { detail: settings }));
    }
  },
  resetAppSettings: (): AppSettings => {
    setStorage(STORAGE_KEYS.APP_SETTINGS, initialAppSettings);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app_settings_changed', { detail: initialAppSettings }));
    }
    return initialAppSettings;
  },

  // Google Apps Script Configuration
  getGasConfig: (): GasSyncConfig =>
    getStorage(STORAGE_KEYS.GAS_CONFIG, {
      webAppUrl: '',
      spreadsheetId: '',
      apiKeySecret: 'RSMI-SIMBARS-SECURE-KEY-2025',
      autoSyncEnabled: true,
      autoSyncOnChange: true,
      autoSyncIntervalMinutes: 5,
      lastSyncStatus: 'idle',
    }),
  saveGasConfig: (config: GasSyncConfig) => setStorage(STORAGE_KEYS.GAS_CONFIG, config),
  getGasUrl: (): string => dataStorage.getGasConfig().webAppUrl,
  saveGasUrl: (url: string) => {
    const curr = dataStorage.getGasConfig();
    dataStorage.saveGasConfig({ ...curr, webAppUrl: url });
  },

  // GitHub Auto-Sync Configuration & Real-Time Sync
  getGitHubConfig: (): GitHubSyncConfig =>
    getStorage(STORAGE_KEYS.GITHUB_CONFIG, {
      owner: 'rscmclu',
      repo: 'si-rsmi',
      branch: 'main',
      filePath: 'data/simbars-database.json',
      personalAccessToken: '',
      autoSyncEnabled: true,
      autoSyncOnChange: true,
      autoSyncIntervalMinutes: 5,
      autoPullOnStartup: false,
      lastSyncStatus: 'idle',
      syncLogs: [],
    }),
  saveGitHubConfig: (config: GitHubSyncConfig) => setStorage(STORAGE_KEYS.GITHUB_CONFIG, config),

  // Import data fetched from Google Sheets API
  importFromGoogleSheetsData: (payload: any): { count: number; message: string } => {
    if (!payload || typeof payload !== 'object') {
      return { count: 0, message: 'Format data Google Sheets tidak valid.' };
    }

    let totalImported = 0;

    // 1. Master Jenis
    if (Array.isArray(payload.jenis) && payload.jenis.length > 0) {
      const parsed: JenisInventaris[] = payload.jenis.map((r: any) => ({
        id: r['ID Jenis (3 Karakter)'] || r.id || '',
        namaJenis: r['Nama Jenis Inventaris'] || r.namaJenis || '',
        deskripsi: r['Deskripsi'] || r.deskripsi || '',
        createdAt: r['Tanggal Dibuat'] || r.createdAt || '',
      })).filter((j: JenisInventaris) => j.id && j.namaJenis);
      if (parsed.length > 0) {
        dataStorage.saveJenis(parsed);
        totalImported += parsed.length;
      }
    }

    // 2. Master Kategori
    if (Array.isArray(payload.kategori) && payload.kategori.length > 0) {
      const parsed: KategoriInventaris[] = payload.kategori.map((r: any) => ({
        id: r['ID Kategori (3 Karakter)'] || r.id || '',
        namaKategori: r['Nama Kategori'] || r.namaKategori || '',
        kelompok: r['Kelompok'] || r.kelompok || 'Alat Medis & Keperawatan',
        createdAt: r['Tanggal Dibuat'] || r.createdAt || '',
      })).filter((k: KategoriInventaris) => k.id && k.namaKategori);
      if (parsed.length > 0) {
        dataStorage.saveKategori(parsed);
        totalImported += parsed.length;
      }
    }

    // 3. Master Merk
    if (Array.isArray(payload.merk) && payload.merk.length > 0) {
      const parsed: MerkInventaris[] = payload.merk.map((r: any) => ({
        id: r['ID Merk'] || r.id || '',
        nomorUrut: Number(r['Nomor Urut'] || r.nomorUrut || 1),
        namaMerk: r['Nama Merk'] || r.namaMerk || '',
        negaraAsal: r['Negara Asal'] || r.negaraAsal || '',
        keterangan: r['Keterangan'] || r.keterangan || '',
        createdAt: r['Tanggal Dibuat'] || r.createdAt || '',
      })).filter((m: MerkInventaris) => m.id && m.namaMerk);
      if (parsed.length > 0) {
        dataStorage.saveMerk(parsed);
        totalImported += parsed.length;
      }
    }

    // 4. Master Ruang
    if (Array.isArray(payload.ruang) && payload.ruang.length > 0) {
      const parsed: RuangInventaris[] = payload.ruang.map((r: any) => ({
        id: r['ID Ruang (3 Karakter)'] || r.id || '',
        namaRuang: r['Nama Ruang'] || r.namaRuang || '',
        gedungLantai: r['Gedung & Lantai'] || r.gedungLantai || '',
        penanggungJawab: r['Penanggung Jawab'] || r.penanggungJawab || '',
        kontakPJ: r['Kontak PJ'] || r.kontakPJ || '',
        createdAt: r['Tanggal Dibuat'] || r.createdAt || '',
      })).filter((ru: RuangInventaris) => ru.id && ru.namaRuang);
      if (parsed.length > 0) {
        dataStorage.saveRuang(parsed);
        totalImported += parsed.length;
      }
    }

    // 5. Master Supplier
    if (Array.isArray(payload.supplier) && payload.supplier.length > 0) {
      const parsed: SupplierInventaris[] = payload.supplier.map((r: any) => ({
        id: r['ID Supplier'] || r.id || '',
        nama: r['Nama Supplier'] || r.nama || '',
        alamat: r['Alamat'] || r.alamat || '',
        telepon: r['Telepon'] || r.telepon || '',
        email: r['Email'] || r.email || '',
        pic: r['PIC Kontak'] || r.pic || '',
        createdAt: r['Tanggal Dibuat'] || r.createdAt || '',
      })).filter((s: SupplierInventaris) => s.id && s.nama);
      if (parsed.length > 0) {
        dataStorage.saveSupplier(parsed);
        totalImported += parsed.length;
      }
    }

    // 6. Data Inventaris Ruangan (DIR)
    if (Array.isArray(payload.inventarisRuangan) && payload.inventarisRuangan.length > 0) {
      const parsed: InventarisRuangan[] = payload.inventarisRuangan.map((r: any) => ({
        idBarang: r['ID Barang (Jenis-Kat-Ruang-Urut)'] || r.idBarang || '',
        noUrut: String(r['No Urut'] || r.noUrut || '0001'),
        namaBarang: r['Nama Barang / Aset'] || r.namaBarang || '',
        idJenis: r['ID Jenis'] || r.idJenis || '',
        idKategori: r['ID Kategori'] || r.idKategori || '',
        idMerk: r['ID Merk'] || r.idMerk || '',
        idRuang: r['ID Ruang'] || r.idRuang || '',
        idSupplier: r['ID Supplier'] || r.idSupplier || '',
        spesifikasi: r['Spesifikasi Teknis'] || r.spesifikasi || '',
        nomorSeri: r['Nomor Seri Pabrik'] || r.nomorSeri || '',
        tahunPerolehan: Number(r['Tahun Perolehan'] || r.tahunPerolehan || 2024),
        hargaPerolehan: Number(r['Harga Perolehan (Rp)'] || r.hargaPerolehan || 0),
        kondisi: r['Kondisi'] || r.kondisi || 'Baik',
        status: r['Status Ketersediaan'] || r.status || 'Tersedia di Ruangan',
        sumberDana: r['Sumber Dana'] || r.sumberDana || 'Dana Internal RS',
        tanggalInput: r['Tanggal Registrasi'] || r.tanggalInput || '',
        catatan: r['Catatan Khusus'] || r.catatan || '',
        fotoUrl: r['Foto Aset URL / Bukti'] || r.fotoUrl || '',
      })).filter((inv: InventarisRuangan) => inv.idBarang && inv.namaBarang);
      if (parsed.length > 0) {
        dataStorage.saveInventarisRuangan(parsed);
        totalImported += parsed.length;
      }
    }

    // 7. Sirkulasi / Mutasi
    if (Array.isArray(payload.sirkulasi) && payload.sirkulasi.length > 0) {
      const parsed: SirkulasiInventaris[] = payload.sirkulasi.map((r: any) => ({
        idSirkulasi: r['ID Sirkulasi'] || r.idSirkulasi || '',
        noSuratJalan: r['No Surat Jalan'] || r.noSuratJalan || '',
        tanggal: r['Tanggal'] || r.tanggal || '',
        idBarang: r['ID Barang'] || r.idBarang || '',
        namaBarang: r['Nama Barang'] || r.namaBarang || '',
        ruangAsalId: r['Ruang Asal'] || r.ruangAsalId || r.idRuangAsal || '',
        ruangTujuanId: r['Ruang Tujuan'] || r.ruangTujuanId || r.idRuangTujuan || '',
        jumlah: Number(r['Jumlah'] || r.jumlah || 1),
        penanggungJawab: r['Penanggung Jawab'] || r.penanggungJawab || '',
        penerima: r['Penerima'] || r.penerima || '',
        alasan: r['Alasan Mutasi'] || r.alasan || '',
        tindakLanjut: r['Tindak Lanjut'] || r.tindakLanjut || 'Dimutasikan',
        status: r['Status'] || r.status || 'Disetujui',
      })).filter((s: SirkulasiInventaris) => s.idSirkulasi && s.idBarang);
      if (parsed.length > 0) {
        dataStorage.saveSirkulasi(parsed);
        totalImported += parsed.length;
      }
    }

    // 8. Audit Logs
    if (Array.isArray(payload.auditLogs) && payload.auditLogs.length > 0) {
      const parsed: AssetAuditLog[] = payload.auditLogs.map((r: any) => ({
        idLog: r['ID Log'] || r.idLog || '',
        idBarang: r['ID Barang'] || r.idBarang || '',
        timestamp: r['Tanggal & Waktu'] || r.timestamp || new Date().toISOString(),
        tipeAksi: r['Tipe Aksi'] || r.tipeAksi || 'EDIT',
        judul: r['Judul Perubahan'] || r.judul || 'Pembaruan Data',
        deskripsi: r['Deskripsi Lengkap'] || r.deskripsi || '',
        user: r['Petugas / User'] || r.user || 'Sistem',
        roleUser: r['Role User'] || r.roleUser || '',
        ruangAsalId: r['Ruang Asal'] || r.ruangAsalId || '',
        ruangTujuanId: r['Ruang Tujuan'] || r.ruangTujuanId || '',
        statusLama: r['Status Lama'] || r.statusLama || '',
        statusBaru: r['Status Baru'] || r.statusBaru || '',
        kondisiLama: r['Kondisi Lama'] || r.kondisiLama || '',
        kondisiBaru: r['Kondisi Baru'] || r.kondisiBaru || '',
        dokumenRef: r['Dokumen Ref'] || r.dokumenRef || '',
        catatan: r['Catatan'] || r.catatan || '',
      })).filter((a: AssetAuditLog) => a.idLog && a.idBarang);
      if (parsed.length > 0) {
        dataStorage.saveAuditLogs(parsed);
        totalImported += parsed.length;
      }
    }

    // 9. Permintaan Perbaikan
    if (Array.isArray(payload.permintaanPerbaikan) && payload.permintaanPerbaikan.length > 0) {
      const parsed: PermintaanPerbaikan[] = payload.permintaanPerbaikan.map((r: any) => ({
        idPermintaan: r['ID Permintaan'] || r.idPermintaan || '',
        tanggal: r['Tanggal'] || r.tanggal || '',
        idRuang: r['ID Ruang'] || r.idRuang || '',
        idBarang: r['ID Barang'] || r.idBarang || '',
        namaBarang: r['Nama Barang'] || r.namaBarang || '',
        deskripsiKerusakan: r['Deskripsi Kerusakan'] || r.deskripsiKerusakan || '',
        prioritas: r['Prioritas'] || r.prioritas || 'Sedang',
        pelapor: r['Pelapor'] || r.pelapor || '',
        status: r['Status Progress'] || r.status || 'Menunggu Analisis',
        catatanAdmin: r['Catatan Admin'] || r.catatanAdmin || '',
      })).filter((p: PermintaanPerbaikan) => p.idPermintaan && p.namaBarang);
      if (parsed.length > 0) {
        dataStorage.savePermintaanPerbaikan(parsed);
        totalImported += parsed.length;
      }
    }

    // 10. Perbaikan IPSRS
    if (Array.isArray(payload.perbaikan) && payload.perbaikan.length > 0) {
      const parsed: PerbaikanInventaris[] = payload.perbaikan.map((r: any) => ({
        idPerbaikan: r['ID Perbaikan'] || r.idPerbaikan || '',
        idPermintaan: r['ID Permintaan Ref'] || r.idPermintaan || '',
        noBeritaAcara: r['No Berita Acara'] || r.noBeritaAcara || '',
        tanggalMulai: r['Tanggal Mulai'] || r.tanggalMulai || '',
        tanggalSelesai: r['Tanggal Selesai'] || r.tanggalSelesai || '',
        idBarang: r['ID Barang'] || r.idBarang || '',
        namaBarang: r['Nama Barang'] || r.namaBarang || '',
        idRuang: r['ID Ruang'] || r.idRuang || '',
        jenisPelaksana: r['Pelaksana'] || r.jenisPelaksana || 'Internal IPSRS',
        teknisi: r['Teknisi'] || r.teknisi || '',
        tindakan: r['Tindakan Perbaikan'] || r.tindakan || '',
        sukuCadang: r['Suku Cadang'] || r.sukuCadang || '',
        biayaEstimasi: Number(r['Biaya Estimasi'] || r.biayaEstimasi || 0),
        biayaRealisasi: Number(r['Biaya Realisasi'] || r.biayaRealisasi || 0),
        status: r['Status Akhir'] || r.status || 'Dalam Pengerjaan',
        catatanTeknisi: r['Catatan Teknisi'] || r.catatanTeknisi || '',
      })).filter((p: PerbaikanInventaris) => p.idPerbaikan && p.namaBarang);
      if (parsed.length > 0) {
        dataStorage.savePerbaikan(parsed);
        totalImported += parsed.length;
      }
    }

    // 11. Jadwal Pemeliharaan (Preventive Maintenance)
    if (Array.isArray(payload.jadwalPemeliharaan) && payload.jadwalPemeliharaan.length > 0) {
      const parsed: JadwalPemeliharaan[] = payload.jadwalPemeliharaan.map((r: any) => ({
        idJadwal: r['ID Jadwal'] || r.idJadwal || '',
        idBarang: r['ID Barang'] || r.idBarang || '',
        namaBarang: r['Nama Barang'] || r.namaBarang || '',
        idRuang: r['ID Ruang'] || r.idRuang || '',
        frekuensi: r['Frekuensi'] || r.frekuensi || '3 Bulanan',
        tanggalTerakhir: r['Tanggal Terakhir'] || r.tanggalTerakhir || '',
        tanggalBerikutnya: r['Tanggal Berikutnya'] || r.tanggalBerikutnya || '',
        petugas: r['Petugas IPSRS'] || r.petugas || '',
        status: r['Status'] || r.status || 'Terjadwal',
        catatanPemeliharaan: r['Catatan Pemeliharaan'] || r.catatanPemeliharaan || '',
      })).filter((j: JadwalPemeliharaan) => j.idJadwal && j.namaBarang);
      if (parsed.length > 0) {
        dataStorage.saveJadwalPemeliharaan(parsed);
        totalImported += parsed.length;
      }
    }

    // 12. Laporan Mutu IPSRS (Respon Cepat <= 15 Menit)
    if (Array.isArray(payload.laporanMutu) && payload.laporanMutu.length > 0) {
      const parsed: LaporanMutuIPSRS[] = payload.laporanMutu.map((r: any) => ({
        idLaporan: r['ID Laporan Mutu'] || r.idLaporan || '',
        idPermintaan: r['ID Tiket Ref'] || r.idPermintaan || '',
        unitPelapor: r['Unit Pelapor'] || r.unitPelapor || '',
        namaBarang: r['Nama Barang / Alat'] || r.namaBarang || '',
        idBarang: r['ID Barang'] || r.idBarang || '',
        deskripsiMasalah: r['Deskripsi Masalah'] || r.deskripsiMasalah || '',
        tglJamLapor: r['Tanggal & Jam Lapor'] || r.tglJamLapor || '',
        tglJamRespon: r['Tanggal & Jam Respon'] || r.tglJamRespon || '',
        durasiRespon: Number(r['Durasi Respon (Menit)'] || r.durasiRespon || 0),
        statusRespon: r['Status Capaian Respon (<=15 Mnt)'] || r.statusRespon || 'Tepat Waktu',
        alasanKeterlambatan: r['Alasan Keterlambatan'] || r.alasanKeterlambatan || '',
        teknisiRespon: r['Teknisi Respon IPSRS'] || r.teknisiRespon || '',
        tindakLanjut: r['Tindak Lanjut'] || r.tindakLanjut || 'Sudah Dikerjakan',
        catatan: r['Catatan'] || r.catatan || '',
        createdAt: r['Tanggal Dibuat'] || r.createdAt || '',
      })).filter((m: LaporanMutuIPSRS) => m.idLaporan && m.namaBarang);
      if (parsed.length > 0) {
        dataStorage.saveLaporanMutu(parsed);
        totalImported += parsed.length;
      }
    }

    // 13. Pengadaan: Pengajuan
    if (Array.isArray(payload.pengajuan) && payload.pengajuan.length > 0) {
      const parsed: PengajuanPengadaan[] = payload.pengajuan.map((r: any) => ({
        idPengajuan: r['ID Pengajuan'] || r.idPengajuan || '',
        nomorPengajuan: r['No Pengajuan'] || r.nomorPengajuan || '',
        tanggal: r['Tanggal'] || r.tanggal || '',
        idRuangPemohon: r['ID Ruang Pemohon'] || r.idRuangPemohon || '',
        namaBarang: r['Nama Barang'] || r.namaBarang || '',
        idJenis: r['ID Jenis'] || r.idJenis || '',
        idKategori: r['ID Kategori'] || r.idKategori || '',
        jumlah: Number(r['Jumlah'] || r.jumlah || 1),
        satuan: r['Satuan'] || r.satuan || 'Unit',
        estimasiHargaSatuan: Number(r['Estimasi Satuan'] || r.estimasiHargaSatuan || 0),
        totalEstimasi: Number(r['Total Estimasi'] || r.totalEstimasi || 0),
        alasanKebutuhan: r['Alasan Kebutuhan'] || r.alasanKebutuhan || '',
        prioritas: r['Prioritas'] || r.prioritas || 'Sedang',
        statusApproval: r['Status Approval'] || r.statusApproval || 'Draft',
        pemohon: r['Pemohon'] || r.pemohon || '',
      })).filter((a: PengajuanPengadaan) => a.idPengajuan && a.namaBarang);
      if (parsed.length > 0) {
        dataStorage.savePengajuan(parsed);
        totalImported += parsed.length;
      }
    }

    // 14. Pengadaan: PO
    if (Array.isArray(payload.pengadaan) && payload.pengadaan.length > 0) {
      const parsed: PengadaanInventaris[] = payload.pengadaan.map((r: any) => ({
        idPengadaan: r['ID Pengadaan'] || r.idPengadaan || '',
        idPengajuan: r['ID Pengajuan Ref'] || r.idPengajuan || '',
        noPO: r['No PO'] || r.noPO || '',
        tanggalPO: r['Tanggal PO'] || r.tanggalPO || '',
        idSupplier: r['ID Supplier'] || r.idSupplier || '',
        namaBarang: r['Nama Barang'] || r.namaBarang || '',
        idJenis: r['ID Jenis'] || r.idJenis || '',
        idKategori: r['ID Kategori'] || r.idKategori || '',
        idRuangTujuan: r['ID Ruang Tujuan'] || r.idRuangTujuan || '',
        jumlah: Number(r['Jumlah'] || r.jumlah || 1),
        hargaSatuan: Number(r['Harga Satuan'] || r.hargaSatuan || 0),
        totalNilai: Number(r['Total Nilai'] || r.totalNilai || 0),
        statusPengadaan: r['Status Pengadaan'] || r.statusPengadaan || 'Dipesan ke Vendor',
        keterangan: r['Keterangan'] || r.keterangan || '',
      })).filter((p: PengadaanInventaris) => p.idPengadaan && p.namaBarang);
      if (parsed.length > 0) {
        dataStorage.savePengadaan(parsed);
        totalImported += parsed.length;
      }
    }

    // 15. Pengadaan: Penerimaan BAST
    if (Array.isArray(payload.penerimaan) && payload.penerimaan.length > 0) {
      const parsed: PenerimaanInventaris[] = payload.penerimaan.map((r: any) => ({
        idPenerimaan: r['ID Penerimaan'] || r.idPenerimaan || '',
        idPengadaan: r['ID Pengadaan Ref'] || r.idPengadaan || '',
        noBAST: r['No BAST'] || r.noBAST || '',
        tanggalTerima: r['Tanggal Terima'] || r.tanggalTerima || '',
        idSupplier: r['ID Supplier'] || r.idSupplier || '',
        namaBarang: r['Nama Barang'] || r.namaBarang || '',
        idJenis: r['ID Jenis'] || r.idJenis || '',
        idKategori: r['ID Kategori'] || r.idKategori || '',
        idRuangTujuan: r['ID Ruang Tujuan'] || r.idRuangTujuan || '',
        jumlahDiterima: Number(r['Jumlah Diterima'] || r.jumlahDiterima || 1),
        kondisiFisik: r['Kondisi Fisik'] || r.kondisiFisik || 'Baik & Lengkap',
        pemeriksa: r['Pemeriksa'] || r.pemeriksa || '',
        statusEksekusi: r['Status Eksekusi Ruangan'] || r.statusEksekusi || 'Siap Registrasi Ruangan',
        catatan: r['Catatan'] || r.catatan || '',
      })).filter((p: PenerimaanInventaris) => p.idPenerimaan && p.namaBarang);
      if (parsed.length > 0) {
        dataStorage.savePenerimaan(parsed);
        totalImported += parsed.length;
      }
    }

    // 16. Pemusnahan: Permintaan
    if (Array.isArray(payload.permintaanPemusnahan) && payload.permintaanPemusnahan.length > 0) {
      const parsed: PermintaanPemusnahan[] = payload.permintaanPemusnahan.map((r: any) => ({
        idPemusnahan: r['ID Usulan'] || r.idPemusnahan || '',
        noUsulan: r['No Usulan'] || r.noUsulan || '',
        tanggalPengajuan: r['Tanggal Pengajuan'] || r.tanggalPengajuan || '',
        idBarang: r['ID Barang'] || r.idBarang || '',
        namaBarang: r['Nama Barang'] || r.namaBarang || '',
        idRuang: r['ID Ruang'] || r.idRuang || '',
        kondisiSaatIni: r['Kondisi Saat Ini'] || r.kondisiSaatIni || 'Rusak Berat',
        alasanPemusnahan: r['Alasan Pemusnahan'] || r.alasanPemusnahan || '',
        pengusul: r['Pengusul'] || r.pengusul || '',
        statusPersetujuan: r['Status Persetujuan Komite'] || r.statusPersetujuan || 'Menunggu Persetujuan Direksi',
        catatanKomite: r['Catatan Komite'] || r.catatanKomite || '',
      })).filter((p: PermintaanPemusnahan) => p.idPemusnahan && p.namaBarang);
      if (parsed.length > 0) {
        dataStorage.savePermintaanPemusnahan(parsed);
        totalImported += parsed.length;
      }
    }

    // 17. Pemusnahan: Pelaksanaan
    if (Array.isArray(payload.pelaksanaanPemusnahan) && payload.pelaksanaanPemusnahan.length > 0) {
      const parsed: PelaksanaanPemusnahan[] = payload.pelaksanaanPemusnahan.map((r: any) => ({
        idPelaksanaan: r['ID Pelaksanaan'] || r.idPelaksanaan || '',
        idPemusnahan: r['ID Usulan Ref'] || r.idPemusnahan || '',
        idBarang: r['ID Barang'] || r.idBarang || '',
        namaBarang: r['Nama Barang'] || r.namaBarang || '',
        idRuangAsal: r['Ruang Asal'] || r.idRuangAsal || '',
        tanggalEksekusi: r['Tanggal Eksekusi'] || r.tanggalEksekusi || '',
        metode: r['Metode Pemusnahan'] || r.metode || 'Dihancurkan Fisik',
        lokasi: r['Lokasi Eksekusi'] || r.lokasi || 'TPS Medika Insani',
        penanggungJawab: r['Penanggung Jawab'] || r.penanggungJawab || '',
        saksi1: r['Saksi 1'] || r.saksi1 || '',
        saksi2: r['Saksi 2'] || r.saksi2 || '',
        noBeritaAcara: r['No Berita Acara (BAP)'] || r.noBeritaAcara || '',
        keterangan: r['Keterangan'] || r.keterangan || '',
        status: r['Status'] || r.status || 'Selesai Dimusnahkan',
      })).filter((p: PelaksanaanPemusnahan) => p.idPelaksanaan && p.namaBarang);
      if (parsed.length > 0) {
        dataStorage.savePelaksanaanPemusnahan(parsed);
        totalImported += parsed.length;
      }
    }

    // 18. Users Auth
    if (Array.isArray(payload.users) && payload.users.length > 0) {
      const existingUsers = dataStorage.getUsers();
      const parsed: UserAccount[] = payload.users.map((r: any) => {
        const id = r['ID User'] || r.id || '';
        const username = r['Username'] || r.username || '';
        const existing = existingUsers.find(u => u.id === id || u.username === username);
        return {
          id: id || `USR-${Math.floor(Math.random() * 1000)}`,
          username: username || 'user',
          password: existing?.password || '123456',
          namaLengkap: r['Nama Lengkap'] || r.namaLengkap || 'Petugas',
          nip: r['NIP'] || r.nip || '-',
          role: r['Role / Jabatan'] || r.role || 'Petugas Ruangan / Perawat',
          ruangId: r['Ruang Restriksi'] || r.ruangId || undefined,
          unitKerja: r['Unit Kerja'] || r.unitKerja || 'Rumah Sakit Medika Insani',
          kontak: r['Kontak'] || r.kontak || '',
          isActive: r['Status Aktif'] !== false && r['Status Aktif'] !== 'false' && r['Status Aktif'] !== 'Nonaktif',
          lastLogin: r['Terakhir Login'] || r.lastLogin || '',
        };
      }).filter((u: UserAccount) => u.username && u.namaLengkap);
      if (parsed.length > 0) {
        dataStorage.saveUsers(parsed);
        totalImported += parsed.length;
      }
    }

    // 19. App Settings
    if (Array.isArray(payload.appSettings) && payload.appSettings.length > 0) {
      const currentSettings = dataStorage.getAppSettings();
      const updatedSettings = { ...currentSettings };
      payload.appSettings.forEach((row: any) => {
        const key = row['Pengaturan Key'] || row.key;
        const val = row['Nilai / Value'] || row.value;
        if (key && val !== undefined) {
          (updatedSettings as any)[key] = val;
        }
      });
      dataStorage.saveAppSettings(updatedSettings);
    }

    return {
      count: totalImported,
      message: `Berhasil mengimpor ${totalImported} data dari Google Spreadsheet!`,
    };
  },

  // Aliases for convenience
  getNextPermintaanId: (): string => dataStorage.getNextPermintaanPerbaikanId(),
  getNextJadwalPmId: (): string => dataStorage.getNextJadwalId(),
  getNextPemusnahanPermintaanId: (): string => dataStorage.getNextPemusnahanId(),
  getNextPemusnahanPelaksanaanId: (): string => dataStorage.getNextPelaksanaanId(),
  resetToDefault: () => dataStorage.resetAllData(),

  // Reset all to demo defaults
  resetAllData: () => {
    localStorage.clear();
    setStorage(STORAGE_KEYS.JENIS, initialJenis);
    setStorage(STORAGE_KEYS.KATEGORI, initialKategori);
    setStorage(STORAGE_KEYS.MERK, initialMerk);
    setStorage(STORAGE_KEYS.RUANG, initialRuang);
    setStorage(STORAGE_KEYS.SUPPLIER, initialSupplier);
    setStorage(STORAGE_KEYS.INVENTARIS_RUANGAN, initialInventarisRuangan);
    setStorage(STORAGE_KEYS.ASSET_AUDIT_LOGS, initialAssetAuditLogs);
    setStorage(STORAGE_KEYS.SIRKULASI, initialSirkulasi);
    setStorage(STORAGE_KEYS.PERMINTAAN_PERBAIKAN, initialPermintaanPerbaikan);
    setStorage(STORAGE_KEYS.PERBAIKAN, initialPerbaikan);
    setStorage(STORAGE_KEYS.JADWAL_PEMELIHARAAN, initialJadwalPemeliharaan);
    setStorage(STORAGE_KEYS.PENGAJUAN, initialPengajuanPengadaan);
    setStorage(STORAGE_KEYS.PENGADAAN, initialPengadaan);
    setStorage(STORAGE_KEYS.PENERIMAAN, initialPenerimaan);
    setStorage(STORAGE_KEYS.PERMINTAAN_PEMUSNAHAN, initialPermintaanPemusnahan);
    setStorage(STORAGE_KEYS.PELAKSANAAN_PEMUSNAHAN, initialPelaksanaanPemusnahan);
    setStorage(STORAGE_KEYS.USERS, initialUsers);
    setStorage(STORAGE_KEYS.CURRENT_USER, initialUsers[0]);
    setStorage(STORAGE_KEYS.ROLE_MATRIX, initialRoleMatrix);
    setStorage(STORAGE_KEYS.APP_SETTINGS, initialAppSettings);
  },

  // Export full snapshot with complete schema, metadata, and stats
  exportFullDatabaseJson: (includeUserPasswords = true) => {
    const appSettings = dataStorage.getAppSettings();
    const inventaris = dataStorage.getInventarisRuangan();
    const totalValuation = inventaris.reduce((acc, curr) => acc + (curr.hargaPerolehan || 0), 0);
    const users = dataStorage.getUsers();

    return {
      _metadata: {
        system: appSettings.systemShortName || 'SIMBARS',
        version: appSettings.appVersion || '2.5.0',
        hospital: appSettings.appName || 'Rumah Sakit Medika Insani',
        exportDate: new Date().toISOString(),
        exportTimestamp: Date.now(),
        exportedBy: dataStorage.getCurrentUser()?.namaLengkap || 'Administrator',
        appSubtitle: appSettings.appSubtitle || 'Sistem Informasi Manajemen Inventaris & Aset Rumah Sakit',
        stats: {
          totalInventaris: inventaris.length,
          totalValuation,
          totalMasterJenis: dataStorage.getJenis().length,
          totalMasterKategori: dataStorage.getKategori().length,
          totalMasterMerk: dataStorage.getMerk().length,
          totalMasterRuang: dataStorage.getRuang().length,
          totalMasterSupplier: dataStorage.getSupplier().length,
          totalUsers: users.length,
          totalAuditLogs: dataStorage.getAuditLogs().length,
          totalSirkulasi: dataStorage.getSirkulasi().length,
          totalPermintaanPerbaikan: dataStorage.getPermintaanPerbaikan().length,
          totalPerbaikan: dataStorage.getPerbaikan().length,
          totalJadwalPemeliharaan: dataStorage.getJadwalPemeliharaan().length,
          totalLaporanMutu: dataStorage.getLaporanMutu().length,
          totalPengajuan: dataStorage.getPengajuan().length,
          totalPengadaan: dataStorage.getPengadaan().length,
          totalPenerimaan: dataStorage.getPenerimaan().length,
          totalPermintaanPemusnahan: dataStorage.getPermintaanPemusnahan().length,
          totalPelaksanaanPemusnahan: dataStorage.getPelaksanaanPemusnahan().length,
        },
      },
      appSettings: appSettings,
      gasConfig: dataStorage.getGasConfig(),
      master: {
        jenis: dataStorage.getJenis(),
        kategori: dataStorage.getKategori(),
        merk: dataStorage.getMerk(),
        ruang: dataStorage.getRuang(),
        supplier: dataStorage.getSupplier(),
      },
      dataInventaris: {
        ruangan: inventaris,
        sirkulasi: dataStorage.getSirkulasi(),
        auditLogs: dataStorage.getAuditLogs(),
      },
      kegiatan: {
        permintaanPerbaikan: dataStorage.getPermintaanPerbaikan(),
        perbaikan: dataStorage.getPerbaikan(),
        jadwalPemeliharaan: dataStorage.getJadwalPemeliharaan(),
        laporanMutu: dataStorage.getLaporanMutu(),
      },
      pengadaan: {
        pengajuan: dataStorage.getPengajuan(),
        pengadaan: dataStorage.getPengadaan(),
        penerimaan: dataStorage.getPenerimaan(),
      },
      pemusnahan: {
        permintaan: dataStorage.getPermintaanPemusnahan(),
        pelaksanaan: dataStorage.getPelaksanaanPemusnahan(),
      },
      roleMatrix: dataStorage.getRolePermissionsMatrix(),
      users: includeUserPasswords ? users : users.map(u => ({ ...u, password: '***' })),
    };
  },

  // Import full JSON database backup with validation and detailed summary
  importFullDatabaseJson: (jsonPayload: any): {
    success: boolean;
    message: string;
    summary?: {
      hospitalName?: string;
      backupDate?: string;
      totalRecords: number;
      masterCount: number;
      inventarisCount: number;
      sirkulasiCount: number;
      kegiatanCount: number;
      pengadaanCount: number;
      pemusnahanCount: number;
      userCount: number;
      auditLogCount: number;
      appSettingsRestored: boolean;
    };
    error?: string;
  } => {
    if (!jsonPayload || typeof jsonPayload !== 'object') {
      return { success: false, message: 'Format berkas JSON tidak valid atau berkas kosong.', error: 'INVALID_PAYLOAD' };
    }

    try {
      let masterCount = 0;
      let inventarisCount = 0;
      let sirkulasiCount = 0;
      let kegiatanCount = 0;
      let pengadaanCount = 0;
      let pemusnahanCount = 0;
      let userCount = 0;
      let auditLogCount = 0;
      let appSettingsRestored = false;

      // Extract containers (supports both structured and flat formats)
      const master = jsonPayload.master || jsonPayload.database?.master || {};
      const dataInv = jsonPayload.dataInventaris || jsonPayload.inventaris || jsonPayload.database?.dataInventaris || {};
      const kegiatan = jsonPayload.kegiatan || jsonPayload.database?.kegiatan || {};
      const pengadaan = jsonPayload.pengadaan || jsonPayload.database?.pengadaan || {};
      const pemusnahan = jsonPayload.pemusnahan || jsonPayload.database?.pemusnahan || {};

      // 1. Master Jenis
      const jenisData = master.jenis || jsonPayload.jenis;
      if (Array.isArray(jenisData) && jenisData.length > 0) {
        dataStorage.saveJenis(jenisData);
        masterCount += jenisData.length;
      }

      // 2. Master Kategori
      const kategoriData = master.kategori || jsonPayload.kategori;
      if (Array.isArray(kategoriData) && kategoriData.length > 0) {
        dataStorage.saveKategori(kategoriData);
        masterCount += kategoriData.length;
      }

      // 3. Master Merk
      const merkData = master.merk || jsonPayload.merk;
      if (Array.isArray(merkData) && merkData.length > 0) {
        dataStorage.saveMerk(merkData);
        masterCount += merkData.length;
      }

      // 4. Master Ruang
      const ruangData = master.ruang || jsonPayload.ruang;
      if (Array.isArray(ruangData) && ruangData.length > 0) {
        dataStorage.saveRuang(ruangData);
        masterCount += ruangData.length;
      }

      // 5. Master Supplier
      const supplierData = master.supplier || jsonPayload.supplier;
      if (Array.isArray(supplierData) && supplierData.length > 0) {
        dataStorage.saveSupplier(supplierData);
        masterCount += supplierData.length;
      }

      // 6. Inventaris Ruangan (DIR)
      const invRuanganData = dataInv.ruangan || jsonPayload.inventarisRuangan || jsonPayload.inventaris;
      if (Array.isArray(invRuanganData) && invRuanganData.length > 0) {
        dataStorage.saveInventarisRuangan(invRuanganData);
        inventarisCount += invRuanganData.length;
      }

      // 7. Sirkulasi / Mutasi
      const sirkulasiData = dataInv.sirkulasi || jsonPayload.sirkulasi;
      if (Array.isArray(sirkulasiData)) {
        dataStorage.saveSirkulasi(sirkulasiData);
        sirkulasiCount += sirkulasiData.length;
      }

      // 8. Audit Logs
      const auditData = dataInv.auditLogs || jsonPayload.auditLogs || jsonPayload.assetAuditLogs;
      if (Array.isArray(auditData)) {
        dataStorage.saveAuditLogs(auditData);
        auditLogCount += auditData.length;
      }

      // 9. Kegiatan: Permintaan Perbaikan
      const ppData = kegiatan.permintaanPerbaikan || jsonPayload.permintaanPerbaikan;
      if (Array.isArray(ppData)) {
        dataStorage.savePermintaanPerbaikan(ppData);
        kegiatanCount += ppData.length;
      }

      // 10. Kegiatan: Perbaikan IPSRS
      const pbkData = kegiatan.perbaikan || jsonPayload.perbaikan;
      if (Array.isArray(pbkData)) {
        dataStorage.savePerbaikan(pbkData);
        kegiatanCount += pbkData.length;
      }

      // 11. Kegiatan: Jadwal Pemeliharaan (PM)
      const pmData = kegiatan.jadwalPemeliharaan || jsonPayload.jadwalPemeliharaan;
      if (Array.isArray(pmData)) {
        dataStorage.saveJadwalPemeliharaan(pmData);
        kegiatanCount += pmData.length;
      }

      // 12. Kegiatan: Laporan Mutu IPSRS
      const mutuData = kegiatan.laporanMutu || jsonPayload.laporanMutu;
      if (Array.isArray(mutuData)) {
        dataStorage.saveLaporanMutu(mutuData);
        kegiatanCount += mutuData.length;
      }

      // 13. Pengadaan: Pengajuan
      const ajuData = pengadaan.pengajuan || jsonPayload.pengajuan;
      if (Array.isArray(ajuData)) {
        dataStorage.savePengajuan(ajuData);
        pengadaanCount += ajuData.length;
      }

      // 14. Pengadaan: PO Pengadaan
      const pgdData = pengadaan.pengadaan || jsonPayload.pengadaan;
      if (Array.isArray(pgdData)) {
        dataStorage.savePengadaan(pgdData);
        pengadaanCount += pgdData.length;
      }

      // 15. Pengadaan: Penerimaan BAST
      const trmData = pengadaan.penerimaan || jsonPayload.penerimaan;
      if (Array.isArray(trmData)) {
        dataStorage.savePenerimaan(trmData);
        pengadaanCount += trmData.length;
      }

      // 16. Pemusnahan: Permintaan
      const pmsData = pemusnahan.permintaan || jsonPayload.permintaanPemusnahan;
      if (Array.isArray(pmsData)) {
        dataStorage.savePermintaanPemusnahan(pmsData);
        pemusnahanCount += pmsData.length;
      }

      // 17. Pemusnahan: Pelaksanaan
      const laksData = pemusnahan.pelaksanaan || jsonPayload.pelaksanaanPemusnahan;
      if (Array.isArray(laksData)) {
        dataStorage.savePelaksanaanPemusnahan(laksData);
        pemusnahanCount += laksData.length;
      }

      // 18. Role Matrix
      const matrixData = jsonPayload.roleMatrix || jsonPayload.rolePermissionsMatrix;
      if (matrixData && typeof matrixData === 'object') {
        dataStorage.saveRolePermissionsMatrix(matrixData);
      }

      // 19. Users
      const usersData = jsonPayload.users;
      if (Array.isArray(usersData) && usersData.length > 0) {
        // preserve password if masked
        const existingUsers = dataStorage.getUsers();
        const mergedUsers = usersData.map((u: any) => {
          if (u.password === '***') {
            const found = existingUsers.find(ex => ex.id === u.id || ex.username === u.username);
            return { ...u, password: found?.password || '123456' };
          }
          return u;
        });
        dataStorage.saveUsers(mergedUsers);
        userCount = mergedUsers.length;
      }

      // 20. App Settings
      if (jsonPayload.appSettings && typeof jsonPayload.appSettings === 'object') {
        dataStorage.saveAppSettings(jsonPayload.appSettings);
        appSettingsRestored = true;
      }

      // 21. Gas Config (if present)
      if (jsonPayload.gasConfig && typeof jsonPayload.gasConfig === 'object') {
        dataStorage.saveGasConfig(jsonPayload.gasConfig);
      }

      const totalRecords = masterCount + inventarisCount + sirkulasiCount + kegiatanCount + pengadaanCount + pemusnahanCount + userCount + auditLogCount;

      // Broadcast changes
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('simbars:data-changed', { detail: { type: 'full-restore', timestamp: Date.now() } }));
      }

      const backupDate = jsonPayload._metadata?.exportDate || jsonPayload.exportedAt;
      const hospitalName = jsonPayload._metadata?.hospital || jsonPayload.hospital || jsonPayload.appSettings?.appName;

      return {
        success: true,
        message: `Database berhasil dipulihkan! Total ${totalRecords} data rekaman telah dimuat ke sistem.`,
        summary: {
          hospitalName,
          backupDate,
          totalRecords,
          masterCount,
          inventarisCount,
          sirkulasiCount,
          kegiatanCount,
          pengadaanCount,
          pemusnahanCount,
          userCount,
          auditLogCount,
          appSettingsRestored,
        },
      };
    } catch (err: any) {
      console.error('Error restoring database:', err);
      return {
        success: false,
        message: 'Gagal memulihkan database dari berkas JSON: ' + (err.message || String(err)),
        error: err.message,
      };
    }
  },

  // Get quick database health and size statistics
  getDatabaseStats: () => {
    const inventaris = dataStorage.getInventarisRuangan();
    const jenis = dataStorage.getJenis();
    const kategori = dataStorage.getKategori();
    const merk = dataStorage.getMerk();
    const ruang = dataStorage.getRuang();
    const supplier = dataStorage.getSupplier();
    const sirkulasi = dataStorage.getSirkulasi();
    const pp = dataStorage.getPermintaanPerbaikan();
    const pbk = dataStorage.getPerbaikan();
    const pm = dataStorage.getJadwalPemeliharaan();
    const mutu = dataStorage.getLaporanMutu();
    const aju = dataStorage.getPengajuan();
    const pgd = dataStorage.getPengadaan();
    const trm = dataStorage.getPenerimaan();
    const pms = dataStorage.getPermintaanPemusnahan();
    const laks = dataStorage.getPelaksanaanPemusnahan();
    const users = dataStorage.getUsers();
    const auditLogs = dataStorage.getAuditLogs();
    const appSettings = dataStorage.getAppSettings();

    const totalValuation = inventaris.reduce((acc, curr) => acc + (curr.hargaPerolehan || 0), 0);
    const totalAssetsWithPhoto = inventaris.filter(i => Boolean(i.fotoUrl)).length;

    // Approximate storage size
    let totalBytes = 0;
    try {
      for (const key in localStorage) {
        if (key.startsWith('simbars_')) {
          totalBytes += (localStorage.getItem(key) || '').length * 2;
        }
      }
    } catch {
      totalBytes = 0;
    }

    const sizeKb = (totalBytes / 1024).toFixed(1);
    const sizeMb = (totalBytes / (1024 * 1024)).toFixed(2);

    return {
      totalInventaris: inventaris.length,
      totalAssetsWithPhoto,
      totalValuation,
      totalMasterRecords: jenis.length + kategori.length + merk.length + ruang.length + supplier.length,
      totalJenis: jenis.length,
      totalKategori: kategori.length,
      totalMerk: merk.length,
      totalRuang: ruang.length,
      totalSupplier: supplier.length,
      totalSirkulasi: sirkulasi.length,
      totalKegiatan: pp.length + pbk.length + pm.length + mutu.length,
      totalPengadaan: aju.length + pgd.length + trm.length,
      totalPemusnahan: pms.length + laks.length,
      totalUsers: users.length,
      totalAuditLogs: auditLogs.length,
      totalAllRecords: inventaris.length + jenis.length + kategori.length + merk.length + ruang.length + supplier.length + sirkulasi.length + pp.length + pbk.length + pm.length + mutu.length + aju.length + pgd.length + trm.length + pms.length + laks.length + users.length + auditLogs.length,
      approxStorageSizeKb: sizeKb,
      approxStorageSizeMb: sizeMb,
      hospitalName: appSettings.appName || 'RS Medika Insani',
      systemName: appSettings.systemShortName || 'SIMBARS',
    };
  },
};

