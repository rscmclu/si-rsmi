export interface JenisInventaris {
  id: string; // 3 characters e.g. J01, J02, J03
  namaJenis: string;
  deskripsi: string;
  createdAt: string;
}

export interface KategoriInventaris {
  id: string; // 3 characters e.g. K01, K02, K03
  namaKategori: string;
  kelompok: 'Medis' | 'Non-Medis' | 'Elektromedik' | 'IT & Komunikasi' | 'Sarana Prasarana' | 'Kendaraan';
  createdAt: string;
}

export interface MerkInventaris {
  id: string; // Sequential ID e.g. MRK-001, MRK-002
  nomorUrut: number;
  namaMerk: string;
  negaraAsal: string;
  keterangan: string;
  createdAt: string;
}

export interface RuangInventaris {
  id: string; // 3 characters e.g. R01, R02, R03
  namaRuang: string;
  gedungLantai: string;
  penanggungJawab: string;
  kontakPJ: string;
  createdAt: string;
}

export interface SupplierInventaris {
  id: string; // e.g. SUP-001
  nama: string;
  alamat: string;
  telepon: string;
  email: string;
  pic: string;
  createdAt: string;
}

export type KondisiBarang = 'Baik' | 'Rusak Ringan' | 'Rusak Berat' | 'Dalam Perbaikan' | 'Dimusnahkan';
export type StatusBarang = 'Tersedia' | 'Dipinjam' | 'Perbaikan' | 'Diajukan Pemusnahan' | 'Dimusnahkan';

export interface AssetPhotoRecord {
  id: string; // e.g. "FOTO-1712000000000"
  url: string; // Base64 data URL or external URL
  caption?: string;
  kondisiSaatFoto?: KondisiBarang | string;
  tipeFoto?: 'Kondisi Fisik' | 'Registrasi Awal' | 'Kerusakan' | 'Perbaikan' | 'Uji Fungsi' | 'Stiker/SN' | string;
  timestamp: string;
  petugas?: string;
}

export interface InventarisRuangan {
  idBarang: string; // Automatic combined format: ${idJenis}-${idKategori}-${idRuang}-${noUrut}
  noUrut: string; // 4-digit consecutive e.g. 0001
  namaBarang: string;
  idJenis: string;
  idKategori: string;
  idMerk: string;
  idRuang: string;
  idSupplier: string;
  spesifikasi: string;
  nomorSeri: string;
  tahunPerolehan: number;
  hargaPerolehan: number;
  kondisi: KondisiBarang;
  status: StatusBarang;
  sumberDana: 'Dana Internal RS' | 'Dana PT. / Yayasan' | 'Hibah' | string;
  tanggalInput: string;
  catatan?: string;
  idPenerimaanAsal?: string;
  fotoUrl?: string; // Foto utama aset (base64 / url)
  fotoList?: AssetPhotoRecord[]; // Galeri foto riwayat & kondisi aset
}

export interface SirkulasiInventaris {
  idSirkulasi: string; // e.g. SRK-001
  noSuratJalan?: string;
  tanggal: string;
  idBarang: string;
  namaBarang: string;
  ruangAsalId?: string;
  ruangTujuanId?: string;
  idRuangAsal?: string;
  idRuangTujuan?: string;
  jumlah?: number;
  penanggungJawab: string;
  penerima: string;
  alasan: string;
  tindakLanjut?: 'Diajukan' | 'Disetujui' | 'Tidak Disetujui' | 'Dimutasikan' | string;
  status: 'Draft' | 'Dalam Pengiriman' | 'Selesai' | 'Dibatalkan' | string;
  createdAt?: string;
  kondisiSaatMutasi?: string;
  keterangan?: string;
}

export interface PermintaanPerbaikan {
  idPermintaan: string; // e.g. PP-001
  tanggal: string;
  jam?: string; // e.g. "08:30" (otomatis terisi saat input permintaan)
  idRuang: string;
  idBarang: string;
  namaBarang: string;
  deskripsiKerusakan: string;
  prioritas: 'Rendah' | 'Sedang' | 'Tinggi' | 'Darurat' | string;
  pelapor: string;
  status: 'Menunggu Review' | 'Disetujui' | 'Sedang Dikerjakan' | 'Selesai' | 'Ditolak / Afkir' | 'Menunggu' | string;
  tindakLanjut?: 'Sudah Dikerjakan' | 'Belum Dikerjakan' | string;
  catatanAdmin?: string;
  createdAt?: string;
}

export interface PerbaikanInventaris {
  idPerbaikan: string; // e.g. PBK-001
  idPermintaan?: string;
  noBeritaAcara?: string;
  tanggalMulai: string;
  jamMulai?: string; // e.g. "08:30" (otomatis saat pertama input perbaikan / sinkron dari permintaan)
  tanggalRespon?: string; // e.g. "2026-09-02" (terisi otomatis saat status "Sudah Direspon")
  jamRespon?: string; // e.g. "08:45" (terisi otomatis saat status "Sudah Direspon")
  lamaRespon?: string; // e.g. "15 Menit" (jarak waktu tgl/jam permintaan ke tgl/jam respon)
  tanggalSelesai?: string;
  jamSelesai?: string; // e.g. "14:20" (otomatis saat status Selesai atau Afkir)
  idBarang: string;
  namaBarang: string;
  idRuang: string;
  jenisPelaksana?: 'IPSRS Internal' | 'Teknisi Vendor / Pihak Ketiga' | string;
  teknisi: string;
  namaVendor?: string;
  tindakan: string;
  sukuCadang: string;
  biayaEstimasi?: number;
  biayaRealisasi?: number;
  biaya?: number;
  status?: 'Dalam Pengerjaan' | 'Menunggu Suku Cadang' | 'Selesai Baik' | 'Rekomendasi Pemusnahan' | 'Sudah Direspon' | string;
  statusPerbaikan?: 'Selesai' | 'Sudah Direspon' | 'Dalam Pengerjaan' | 'Tidak Bisa Diperbaiki' | 'Afkir' | 'Rekomendasi Pemusnahan' | string;
  tindakLanjut?: 'Sudah Dikerjakan' | 'Belum Dikerjakan' | string;
  jenisPerbaikan?: string;
  rekomendasi?: string;
  catatanTeknisi?: string;
  createdAt?: string;
}

export interface JadwalPemeliharaan {
  idJadwal: string; // e.g. PM-001
  idBarang: string;
  namaBarang: string;
  idRuang: string;
  frekuensi: 'Mingguan' | 'Bulanan' | 'Triwulan' | 'Semester' | 'Tahunan' | string;
  tanggalTerakhir?: string;
  tanggalBerikutnya: string;
  petugas: string;
  status: 'Terjadwal' | 'Selesai Dilakukan' | 'Terlewat' | string;
  tindakLanjut?: 'Sudah Dikerjakan' | 'Belum Dikerjakan' | string;
  jenisPemeliharaan?: string;
  checklist?: { item: string; checked: boolean }[];
  catatanPemeliharaan?: string;
  keterangan?: string;
  createdAt?: string;
}

export interface LaporanMutuIPSRS {
  idLaporan: string; // e.g. MTU-001
  idPermintaan?: string; // ID Tiket Aduan Kerusakan (e.g. PP-001)
  unitPelapor: string; // Ruangan / Poli / Unit pengirim laporan (ID Ruang / Nama Ruangan)
  namaBarang: string;
  idBarang?: string;
  deskripsiMasalah?: string;
  tglJamLapor: string; // Timestamp saat laporan disubmit (YYYY-MM-DD HH:mm:ss atau ISO)
  tglJamRespon?: string; // Timestamp saat teknisi merespon/memulai aksi
  durasiRespon?: number; // Selisih menit (tglJamRespon - tglJamLapor)
  statusRespon: 'Tepat Waktu' | 'Terlambat' | 'Menunggu Respon' | string; // <= 15 Menit: Tepat Waktu, > 15 Menit: Terlambat
  alasanKeterlambatan?: string; // Alasan jika > 15 menit
  teknisiRespon?: string; // Petugas / Teknisi yang menerima
  tindakLanjut?: 'Sudah Dikerjakan' | 'Belum Dikerjakan' | string;
  catatan?: string;
  createdAt?: string;
}

export interface PengajuanPengadaan {
  idPengajuan: string; // e.g. AJU-001
  nomorPengajuan?: string;
  tanggal?: string;
  tanggalPengajuan?: string;
  idRuangPemohon?: string;
  idRuang?: string;
  namaBarang: string;
  idJenis?: string;
  idKategori?: string;
  idMerk?: string;
  jumlah: number;
  satuan?: string;
  spesifikasi?: string;
  estimasiHargaSatuan?: number;
  estimasiHarga?: number;
  totalEstimasi?: number;
  alasanKebutuhan?: string;
  alasanPengajuan?: string;
  prioritas?: 'Rendah' | 'Biasa' | 'Mendesak' | string;
  statusApproval?: 'Menunggu Persetujuan' | 'Disetujui Direksi' | 'Ditolak' | 'Dalam Proses Pengadaan' | string;
  statusPersetujuan?: string;
  tindakLanjut?: 'Sudah Dikerjakan' | 'Belum Dikerjakan' | string;
  pemohon: string;
  catatanPersetujuan?: string;
  createdAt?: string;
}

export interface PengadaanInventaris {
  idPengadaan: string; // e.g. PGD-001
  idPengajuan?: string;
  noPO: string;
  tanggalPO?: string;
  tanggalPengadaan?: string;
  idSupplier?: string;
  namaBarang: string;
  idJenis?: string;
  idKategori?: string;
  idRuangTujuan?: string;
  jumlah: number;
  hargaSatuan: number;
  totalNilai?: number;
  totalHarga?: number;
  sumberDana?: string;
  statusPengadaan: 'Pemesanan (PO)' | 'Proses Pengiriman' | 'Tiba di RS' | 'Selesai' | 'Dalam Proses PO' | string;
  keterangan?: string;
  catatan?: string;
  createdAt?: string;
}

export interface PenerimaanInventaris {
  idPenerimaan: string; // e.g. TRM-001
  idPengadaan: string;
  noBAST?: string;
  tanggalTerima?: string;
  tanggalPenerimaan?: string;
  idSupplier?: string;
  namaBarang: string;
  idJenis?: string;
  idKategori?: string;
  idRuangTujuan?: string;
  jumlahDiterima: number;
  kondisiFisik?: 'Sesuai & Berfungsi Baik' | 'Cacat / Tidak Sesuai' | string;
  kondisiSaatDiterima?: string;
  pemeriksa?: string;
  petugasPenerima?: string;
  statusEksekusi?: 'Belum Dimasukkan ke Ruangan' | 'Sudah Masuk Inventaris Ruangan' | string;
  statusMasukInventaris?: boolean;
  idBarangGeneratedList?: string[];
  catatan?: string;
  createdAt?: string;
}

export interface PermintaanPemusnahan {
  idPemusnahan?: string; // e.g. PMS-001
  idPermintaan?: string;
  noUsulan?: string;
  tanggalPengajuan?: string;
  tanggalPermintaan?: string;
  idBarang: string;
  namaBarang: string;
  idRuang: string;
  kondisiSaatIni?: 'Rusak Berat' | 'Afkir & Usang' | 'Melebihi Usia Teknis' | 'Biaya Perbaikan > Nilai Aset' | string;
  alasanPemusnahan?: string;
  alasan?: string;
  pengusul?: string;
  pemohon?: string;
  statusPersetujuan: 'Menunggu Review Komite' | 'Disetujui Komite Pemusnahan' | 'Ditolak' | 'Disetujui' | string;
  catatanKomite?: string;
  createdAt?: string;
}

export interface PelaksanaanPemusnahan {
  idPelaksanaan: string; // e.g. LAKS-001
  idPemusnahan?: string;
  idPermintaan?: string;
  idBarang: string;
  namaBarang: string;
  idRuangAsal?: string;
  idRuang?: string;
  tanggalEksekusi?: string;
  tanggalPelaksanaan?: string;
  metode?: 'Incinerator RS (Bakar)' | 'Limbah B3 Medis Berizin' | 'Peleburan / Scrap Daur Ulang' | 'Lelang Terbuka' | 'Penghancuran Manual' | 'Hibah Sosial' | string;
  metodePemusnahan?: string;
  lokasi?: string;
  lokasiPemusnahan?: string;
  penanggungJawab?: string;
  petugasPelaksana?: string;
  saksi?: string;
  saksi1?: string;
  saksi2?: string;
  noBeritaAcara?: string;
  keterangan?: string;
  statusInventarisUpdated?: boolean;
  status?: 'Selesai Dieksekusi' | string;
  createdAt?: string;
}

export interface MenuAccessPermission {
  dashboard: boolean;
  masterJenis: boolean;
  masterKategori: boolean;
  masterMerk: boolean;
  masterRuang: boolean;
  masterSupplier: boolean;
  dataRuangan: boolean;
  dataSemuaRS: boolean;
  sirkulasi: boolean;
  permintaanPerbaikan: boolean;
  perbaikan: boolean;
  pemeliharaan: boolean;
  laporanMutu: boolean;
  pengajuan: boolean;
  pengadaan: boolean;
  penerimaan: boolean;
  permintaanPemusnahan: boolean;
  pelaksanaanPemusnahan: boolean;
  laporanPemusnahan: boolean;
  settingUser: boolean;
  settingHakAkses: boolean;
  settingAplikasi: boolean;
  gasSync: boolean;
  petunjuk: boolean;
}

export interface AppSettings {
  appName: string;
  appSubtitle: string;
  systemShortName: string;
  appVersion: string;
  logoType: 'initials' | 'image' | 'preset';
  logoInitials: string;
  logoImageUrl: string;
  logoBgColor: string;
  logoTextColor: string;
  logoPresetIcon: string;
  hospitalAddress?: string;
  hospitalPhone?: string;
  hospitalEmail?: string;
}

export interface ActionPermission {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canPrint: boolean;
  canExport: boolean;
}

export interface RolePermissionConfig {
  menuAccess: MenuAccessPermission;
  actionAccess: ActionPermission;
}

export type RolePermissionsMatrix = Record<string, RolePermissionConfig>;

export type RoleType = 
  | 'Super Admin'
  | 'Kepala Instalasi Sarpras / IPSRS'
  | 'Petugas Ruangan / Perawat'
  | 'Teknisi Elektromedik / Umum'
  | 'Tim Pengadaan Logistik'
  | 'Komite Pemusnahan Aset';

export interface UserAccount {
  id: string;
  username: string;
  password: string; // in local storage / demo mode
  namaLengkap: string;
  nip: string;
  role: RoleType;
  ruangId?: string; // If restricted to specific room
  unitKerja: string;
  kontak: string;
  isActive: boolean;
  menuAccess: MenuAccessPermission;
  actionAccess: ActionPermission;
  lastLogin?: string;
  avatarColor?: string;
}

export type UserRole = 'admin' | 'inputer' | 'viewer';

export interface User {
  id: string;
  username: string;
  nama: string;
  email: string;
  role: UserRole;
  password?: string;
  jabatan?: string;
  avatar?: string;
  createdAt?: string;
}

export type PengajuanInventaris = PengajuanPengadaan;

export interface GasSyncConfig {
  webAppUrl: string;
  spreadsheetId: string;
  apiKeySecret: string;
  autoSyncEnabled: boolean;
  autoSyncOnChange: boolean;
  autoSyncIntervalMinutes: number;
  lastSyncTime?: string;
  lastSyncStatus?: 'success' | 'error' | 'idle' | 'syncing';
  lastSyncMessage?: string;
  lastSyncType?: 'push' | 'pull' | 'auto';
}

export type AuditLogActionType = 
  | 'REGISTRASI'
  | 'MUTASI_RUANGAN'
  | 'PERBAIKAN'
  | 'PERMINTAAN_PERBAIKAN'
  | 'PEMELIHARAAN'
  | 'STATUS_CHANGE'
  | 'KONDISI_CHANGE'
  | 'EDIT_DATA'
  | 'PEMUSNAHAN'
  | 'CATATAN_MANUAL';

export interface AssetAuditLog {
  idLog: string; // e.g. LOG-001
  idBarang: string;
  timestamp: string; // ISO string e.g. "2025-02-15T09:00:00"
  tipeAksi: AuditLogActionType;
  judul: string;
  deskripsi: string;
  user: string;
  roleUser?: string;
  ruangAsalId?: string;
  ruangTujuanId?: string;
  ruangAsalNama?: string;
  ruangTujuanNama?: string;
  statusLama?: string;
  statusBaru?: string;
  kondisiLama?: string;
  kondisiBaru?: string;
  referensiId?: string; // ID Sirkulasi / PBK / PP / PMS dsb
  dokumenRef?: string; // No BAST / No Surat Jalan / No Berita Acara
  biaya?: number;
  catatan?: string;
  fotoUrl?: string;
}

export type MasterSubTab = 'jenis' | 'kategori' | 'merk' | 'ruang' | 'supplier';

export interface MasterInventarisViewProps {
  initialSubTab?: MasterSubTab;
  actionAccess: ActionPermission;
}

